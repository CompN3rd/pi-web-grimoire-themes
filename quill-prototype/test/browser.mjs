import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = new URL('../', import.meta.url);
const server = createServer(async (req, res) => {
  try {
    const path = new URL(`.${req.url}`, root);
    if (!path.href.startsWith(root.href)) throw Error('outside root');
    const body = await readFile(fileURLToPath(path));
    res.setHeader('Content-Type', path.pathname.endsWith('.js') ? 'text/javascript' : 'text/html');
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}/preview.html`);
  const start = page.getByRole('button', { name: 'Start / Replay' });
  await start.click();
  await page.waitForTimeout(2200);
  const measure = () => page.locator('grimoire-quill-prototype').evaluate(el => {
    const r = el.shadowRoot;
    const text = r.querySelector('.text');
    const range = document.createRange();
    range.selectNodeContents(text.lastChild);
    const rects = range.getClientRects();
    const tip = rects[rects.length - 1];
    const origin = r.querySelector('.page').getBoundingClientRect();
    const quill = r.querySelector('.quill');
    return { count: text.textContent.length, x: parseFloat(quill.style.left), y: parseFloat(quill.style.top), expectedX: tip.right - origin.left, expectedY: tip.bottom - origin.top - 4, fresh: !!r.querySelector('.fresh'), hidden: quill.hidden };
  });
  let state = await measure();
  assert(state.count > 30 && state.fresh && !state.hidden);
  assert(Math.abs(state.x - state.expectedX) < 1 && Math.abs(state.y - state.expectedY) < 1);
  assert(state.y > 100, 'writing has wrapped');
  await page.setViewportSize({ width: 750, height: 900 });
  await page.waitForTimeout(100);
  state = await measure();
  assert(Math.abs(state.x - state.expectedX) < 1 && Math.abs(state.y - state.expectedY) < 1);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = (await measure()).count;
  await page.waitForTimeout(250);
  assert.equal((await measure()).count, paused);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.waitForTimeout(100);
  assert((await measure()).count > paused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('grimoire-quill-prototype').status.textContent.startsWith('Complete. Reduced motion')).catch(async error => {
    console.error(await page.locator('grimoire-quill-prototype').evaluate(el => ({ running: el.running, reducedMotion: el.motion.matches, status: el.status.textContent, count: el.index })), errors);
    throw error;
  });
  const sample = await page.evaluate(async () => (await import('./browser/plugin.js')).SAMPLE);
  assert.equal(await page.locator('.text').textContent(), sample);
  assert.equal(await page.locator('.quill').evaluate(el => getComputedStyle(el).display), 'none');
  await start.click();
  assert.equal(await page.locator('.text').textContent(), sample);
  const selection = await page.locator('.text').evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    return selection.toString();
  });
  assert.equal(selection, sample);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await start.click();
  await page.waitForTimeout(100);
  // A missed/delayed media change event must still stop playback at the next tick.
  await page.locator('grimoire-quill-prototype').evaluate(el => el.motion.removeEventListener('change', el.onMotion));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('grimoire-quill-prototype').status.textContent.startsWith('Complete. Reduced motion'));
  assert.equal(await page.locator('.text').textContent(), sample);
  await page.locator('grimoire-quill-prototype').evaluate(el => el.motion.addEventListener('change', el.onMotion));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await start.click();
  await page.waitForFunction(() => document.querySelector('grimoire-quill-prototype').index > 1);
  await page.evaluate(() => window.previewLifetime.abort());
  const aborted = (await measure()).count;
  await page.waitForTimeout(150);
  assert.equal((await measure()).count, aborted);
  await start.click();
  assert.equal((await measure()).count, aborted);
  await page.reload();
  await start.click();
  await page.waitForFunction(() => document.querySelector('grimoire-quill-prototype').status.textContent.startsWith('Simulated passage complete'), null, { timeout: 25000 });
  assert.equal(await page.locator('.text').textContent(), sample);
  assert(await page.getByRole('button', { name: 'Pause', exact: true }).isDisabled());
  await start.click();
  await page.waitForTimeout(100);
  assert((await measure()).count < 20, 'replay resets the passage');
  const detached = await page.locator('grimoire-quill-prototype').evaluate(el => {
    window.detached = el; el.remove(); return el.text.textContent;
  });
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => window.detached.text.textContent), detached);
  assert.deepEqual(errors, []);
  console.log('PASS: stream, wrap/reflow geometry, pause/resume, reduced motion, selection, abort and disconnect');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

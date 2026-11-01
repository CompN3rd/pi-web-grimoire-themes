// Optional fixture check: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node test/browser.mjs
// Add --capture to refresh only the three handwritten PNG specimens.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const server = spawn('python3', ['-m', 'http.server', '4174', '--bind', '127.0.0.1'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; ; i++) {
    try { await fetch('http://127.0.0.1:4174/previews/'); break; }
    catch (error) { if (i === 30) throw error; await new Promise(r => setTimeout(r, 100)); }
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (!r.ok() && r.status() !== 304) errors.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => assert.equal(new URL(r.url()).hostname, '127.0.0.1'));
  for (const [id, font] of [['hedgewitch', 'Caveat'], ['scribe', 'Charm'], ['forgotten', 'Marck Script']]) {
    await page.goto(`http://127.0.0.1:4174/previews/#${id}`);
    await page.waitForFunction(() => [...document.querySelectorAll('chat-view')].every(e => e.shadowRoot.querySelector('[data-paper]')?.sheet));
    await page.evaluate(async font => { await document.fonts.load(`22px "${font}"`); await document.fonts.ready; }, font);
    const result = await page.evaluate(font => {
      const chat = document.querySelector('chat-view').shadowRoot;
      const style = selector => getComputedStyle(chat.querySelector(selector));
      return {
        loaded: document.fonts.check(`22px "${font}"`), prose: style('.chat-message-body').fontFamily,
        code: style('pre').fontFamily, paper: style('.chat-message').backgroundImage,
        canvas: getComputedStyle(document.body).backgroundImage,
        codeBackground: style('pre').backgroundImage,
        controlBackground: getComputedStyle(document.querySelector('prompt-editor').shadowRoot.querySelector('textarea')).backgroundImage,
        control: getComputedStyle(document.querySelector('prompt-editor').shadowRoot.querySelector('button')).fontFamily,
        animation: getComputedStyle(document.querySelector('session-list').shadowRoot.querySelector('[data-busy]')).animationName
      };
    }, font);
    assert.ok(result.loaded); assert.ok(result.prose.includes(font));
    assert.match(result.code, /monospace/); assert.match(result.control, /system-ui/);
    assert.match(result.paper, /textures/); assert.match(result.canvas, /textures/);
    assert.equal(result.codeBackground, 'none'); assert.equal(result.controlBackground, 'none');
    assert.equal(result.animation, 'none');
    if (process.argv.includes('--capture')) await page.screenshot({ path: `previews/${id}.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await page.locator('chat-view .chat-message').first().evaluate(e => getComputedStyle(e).backgroundImage), 'none');
    assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).backgroundImage), 'none');
    await page.emulateMedia({ forcedColors: 'none' });
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.selectOption('#theme', 'candlelit');
    assert.equal(await page.locator('chat-view').evaluate(e => e.shadowRoot.querySelector('[data-paper]')), null);
    assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).backgroundImage), 'none');
    console.log(`${id}: local font, paper/canvas, solid code/controls, reduced motion, mobile, forced colours, removal passed`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close(); server.kill();
}

// Optional fixture check: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node test/browser.mjs
// Add --capture to refresh all six PNG specimens.
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
  for (const id of ['candlelit', 'astral', 'verdant', 'hedgewitch', 'scribe', 'forgotten']) {
    await page.goto(`http://127.0.0.1:4174/previews/#${id}`);
    await page.evaluate(async () => { await document.fonts.ready; });
    for (const host of ['app-mobile-main-tabs', 'workspace-panel']) {
      const selected = page.locator(`${host} button[aria-pressed="true"]`);
      const shape = await selected.evaluate(e => {
        const style = getComputedStyle(e), backing = getComputedStyle(e, '::before');
        return { clip: style.clipPath, backing: backing.clipPath, fill: backing.backgroundColor,
          color: style.color, width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height,
          cue: style.textDecorationLine, animation: style.animationName };
      });
      assert.equal(shape.clip, 'none'); assert.match(shape.backing, /polygon/);
      assert.ok(shape.width >= 44 && shape.height >= 44);
      assert.equal(shape.cue, 'underline'); assert.equal(shape.animation, 'none');
      await selected.hover();
      assert.equal(await selected.evaluate(e => getComputedStyle(e, '::before').backgroundColor), shape.fill);
      await page.keyboard.press('Tab');
      await selected.focus();
      assert.equal(await selected.evaluate(e => getComputedStyle(e).outlineStyle), 'solid');
      await page.locator(`${host} button`).filter({ hasText: /^Terminal$/ }).click();
      assert.equal(await page.locator(`${host} button`).filter({ hasText: /^Terminal$/ }).getAttribute('aria-pressed'), 'true');
    }
    assert.equal(await page.locator('app-mobile-main-tabs [data-navigation-trigger]').evaluate(e => getComputedStyle(e, '::before').content), 'none');
    assert.equal(await page.locator('pi-web-content-renderer button').first().evaluate(e => getComputedStyle(e, '::before').content), 'none');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.locator('app-mobile-main-tabs .ui-tabs').evaluate(e => e.scrollWidth > e.clientWidth && getComputedStyle(e).overflowX === 'auto'));
    await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await page.locator('app-mobile-main-tabs [aria-pressed="true"]').evaluate(e => getComputedStyle(e).textDecorationLine), 'underline');
    assert.equal(await page.locator('app-mobile-main-tabs [aria-pressed="true"]').evaluate(e => getComputedStyle(e).borderTopStyle), 'solid');
    assert.equal(await page.locator('workspace-panel button:disabled').count(), 1);
    await page.emulateMedia({ forcedColors: 'none' });
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.evaluate(() => { document.documentElement.dir = 'ltr'; });
    await page.locator('app-mobile-main-tabs button').filter({ hasText: /^Chat/ }).click();
    await page.locator('workspace-panel button').filter({ hasText: /^Files$/ }).click();
    await page.locator('#theme').focus();
    if (process.argv.includes('--capture')) await page.screenshot({ path: `previews/${id}.png`, fullPage: true });
    console.log(`${id}: both bookmark strips, selection/hover, focus, target size, scrolling, RTL, forced colours and exclusions passed`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close(); server.kill();
}

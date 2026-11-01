// Optional: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node test/motion-browser.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const server = spawn('python3', ['-m', 'http.server', '4175', '--bind', '127.0.0.1'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; ; i++) {
    try { await fetch('http://127.0.0.1:4175/previews/'); break; }
    catch (error) { if (i === 30) throw error; await new Promise(r => setTimeout(r, 100)); }
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (!r.ok() && r.status() !== 304) errors.push(`${r.status()} ${r.url()}`); });
  const busy = page.locator('session-list [data-busy]');
  const ribbon = page.locator('app-mobile-main-tabs [aria-pressed="true"]');
  const message = page.locator('chat-view .chat-message').first();
  const stroke = page.locator('chat-view .chat-message-content').first();
  const send = page.locator('prompt-editor [data-default="true"]');
  const menu = page.locator('grimoire-menu [popover]');
  const style = (locator, key, pseudo = null) => locator.evaluate((e, { key, pseudo }) => getComputedStyle(e, pseudo)[key], { key, pseudo });
  const seek = (locator, name, time) => locator.evaluate((e, { name, time }) => {
    const animation = e.getAnimations({ subtree: true }).find(a => a.animationName === name);
    if (!animation) throw new Error(`Missing ${name}`);
    animation.pause(); animation.currentTime = time;
  }, { name, time });
  for (const id of ['candlelit', 'astral', 'verdant', 'hedgewitch', 'scribe', 'forgotten']) {
    for (const mode of ['quiet', 'spellbound']) {
      const suffix = mode === 'quiet' ? '' : '-spellbound';
      const duration = mode === 'quiet' ? 1600 : 2200;
      await page.goto(`http://127.0.0.1:4175/previews/#${id}${suffix}`);
      await page.waitForFunction(expected => getComputedStyle(document.documentElement).getPropertyValue('--grimoire-kindling-time').trim() === expected, `${duration}ms`);
      assert.equal(await style(busy, 'animationName'), 'grimoire-kindling');
      assert.equal(await style(busy, 'animationIterationCount'), '2');
      const bounds = await busy.boundingBox();
      await seek(busy, 'grimoire-kindling', 0);
      const startShadow = await style(busy, 'boxShadow');
      await seek(busy, 'grimoire-kindling', duration / 2);
      assert.notEqual(await style(busy, 'boxShadow'), startShadow);
      assert.deepEqual(await busy.boundingBox(), bounds);
      await seek(busy, 'grimoire-kindling', duration * 2 + 1);
      assert.match(await style(busy, 'boxShadow'), /3px 0px 0px 0px inset$/);
      assert.equal(await style(ribbon, 'animationName', '::before'), 'grimoire-ribbon-light');
      // Font loading may outlast a quiet sweep; explicitly reselect for sampling.
      await ribbon.evaluate(e => {
        e.classList.remove('selected'); e.setAttribute('aria-pressed', 'false');
        void e.offsetWidth;
        e.classList.add('selected'); e.setAttribute('aria-pressed', 'true');
      });
      const ribbonBounds = await ribbon.boundingBox();
      await seek(ribbon, 'grimoire-ribbon-light', 250);
      assert.deepEqual(await ribbon.boundingBox(), ribbonBounds);
      assert.equal(await style(ribbon, 'transform'), 'none');
      await message.hover();
      assert.equal(await style(stroke, 'animationName', '::before'), 'grimoire-ink');
      await seek(stroke, 'grimoire-ink', mode === 'quiet' ? 250 : 550);
      assert.notEqual(await style(stroke, 'transform', '::before'), 'matrix(0, 0, 0, 1, 0, 0)');
      assert.equal(await style(message, 'transform'), 'none');
      assert.equal(await style(page.locator('chat-view .chat-message-body').first(), 'opacity'), '1');
      await send.hover();
      assert.equal(await style(send, 'animationName', '::after'), 'grimoire-seal');
      assert.equal(await style(page.locator('prompt-editor button:disabled'), 'animationName', '::after'), 'none');
      await page.mouse.move(0, 0);
      await page.keyboard.press('Tab');
      await send.focus();
      assert.equal(await style(send, 'animationName', '::after'), 'grimoire-seal');
      // A focusable descendant models message links/actions without changing the host.
      await stroke.evaluate(e => { e.tabIndex = -1; e.focus(); });
      assert.equal(await style(stroke, 'animationName', '::before'), 'grimoire-ink');
      await stroke.evaluate(e => { e.blur(); e.removeAttribute('tabindex'); });
      await page.locator('grimoire-menu button[popovertarget]').first().click();
      assert.equal(await style(menu, 'animationName'), 'grimoire-menu-ink');
      // Both preferences must interrupt running effects, not merely prevent their start.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const [locator, pseudo] of [[busy, null], [ribbon, '::before'], [stroke, '::before'], [send, '::after'], [menu, null]]) {
        assert.equal(await style(locator, 'animationName', pseudo), 'none');
      }
      assert.match(await page.locator('#motion-status').textContent(), /Reduced motion is enabled/);
      await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
      for (const [locator, pseudo] of [[busy, null], [ribbon, '::before'], [stroke, '::before'], [send, '::after'], [menu, null]]) {
        assert.equal(await style(locator, 'animationName', pseudo), 'none');
      }
      await page.emulateMedia({ forcedColors: 'none' });
      await page.keyboard.press('Escape');
      assert.equal(await menu.evaluate(e => e.matches(':popover-open')), false);
      await page.selectOption('#motion', mode === 'quiet' ? 'spellbound' : 'quiet');
      await page.waitForFunction(expected => getComputedStyle(document.documentElement).getPropertyValue('--grimoire-kindling-time').trim() === expected, mode === 'quiet' ? '2200ms' : '1600ms');
      assert.equal(await style(busy, 'animationDuration'), mode === 'quiet' ? '2.2s' : '1.6s');
      await page.click('#rekindle');
      assert.equal(await style(busy, 'animationName'), 'grimoire-kindling');
      console.log(`${id}/${mode}: finite effects, sampled visuals, stable layout, preference interruption, switching, popover dismissal passed`);
    }
  }
  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  await touch.goto('http://127.0.0.1:4175/previews/#scribe-spellbound');
  assert.equal(await touch.evaluate(() => matchMedia('(hover: hover)').matches), false);
  await touch.locator('chat-view .chat-message').first().tap();
  assert.equal(await touch.locator('chat-view .chat-message-content').first().evaluate(e => getComputedStyle(e, '::before').animationName), 'none');
  assert.ok(await touch.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log('Touch: no sticky-hover ink animation and no horizontal page overflow');
  assert.deepEqual(errors, []);
} finally {
  await browser?.close(); server.kill();
}

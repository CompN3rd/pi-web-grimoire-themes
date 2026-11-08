import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, serve } from './browser-support.mjs';
import { bundleHost, host, hostVersion } from './host-support.mjs';

const entry = await readFile(new URL('./host-fixture.js', import.meta.url), 'utf8');
const bundle = await bundleHost(entry, {
  platform: 'browser', loader: { '.css': 'text' },
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.BASE_URL': '"/nested/"' },
  plugins: [{ name: 'host-components', setup(build) {
    build.onResolve({ filter: /^host\// }, ({ path }) => ({ path: resolve(host, 'src/client/src', `${path.slice(5)}.ts`) }));
  } }],
});
const server = await serve(undefined, new Map([
  ['host.html', '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Grimoire host check</title><script type="module" src="host.js"></script>'],
  ['host.js', bundle.outputFiles[0].text],
]));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => { errors.push(String(error)); console.error(error); });
  page.on('response', response => { if (!response.ok()) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => {
    if (!request.url().startsWith(server.url)) errors.push(`Non-application-relative request: ${request.url()}`);
  });
  await page.goto(`${server.url}host.html`);
  await page.waitForFunction(() => !!window.fixture);
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  for (const theme of manifest.piWeb.plugins[0].themes) {
    await page.evaluate(theme => window.fixture.theme(theme), theme);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const direction of ['ltr', 'rtl']) {
        await page.evaluate(dir => { document.documentElement.dir = dir; }, direction);
        if (width === 390) assert.equal(await page.locator('workspace-panel header').isVisible(), false);
        for (const host of width === 390 ? ['app-mobile-main-tabs'] : ['app-mobile-main-tabs', 'workspace-panel']) {
          const component = page.locator(host);
          const target = component.getByRole('button', { name: 'Terminal', exact: true });
          await target.click();
          assert.equal(await target.getAttribute('aria-pressed'), 'true');
          await page.keyboard.press('Tab');
          await target.focus();
          const state = await target.evaluate(el => {
            const style = getComputedStyle(el);
            return { outline: style.outlineStyle, cue: style.textDecorationLine, clip: style.clipPath,
              backing: getComputedStyle(el, '::before').clipPath, width: el.clientWidth, height: el.clientHeight };
          });
          assert.equal(state.outline, 'solid');
          assert.equal(state.cue, 'underline');
          assert.equal(state.clip, 'none');
          assert.match(state.backing, /polygon/);
          assert.ok(state.width >= 44 && state.height >= 44);
          const navigation = component.locator('[data-navigation-trigger]');
          assert.equal(await navigation.evaluate(el => getComputedStyle(el, '::before').content), 'none');
          await navigation.click();
          assert.equal(await page.locator('main').getAttribute('data-navigation'), 'open');
          await page.locator('main').evaluate(el => { delete el.dataset.navigation; });
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme.id}/${width}/${direction}: page overflow`);
      }
    }
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await page.locator('workspace-panel').evaluate(el => getComputedStyle(el).backgroundImage), 'none');
    assert.equal(await page.locator('app-mobile-main-tabs [aria-pressed="true"]').evaluate(el => getComputedStyle(el).textDecorationLine), 'underline');
    await page.emulateMedia({ forcedColors: 'none' });
    if (theme.stylesheets.some(sheet => sheet.path === 'paper.css')) {
      assert.match(await page.locator('workspace-panel').evaluate(el => getComputedStyle(el).backgroundImage), /textures/);
    }
    console.log(`${theme.id}: real PI WEB ${hostVersion} shell, desktop/mobile, RTL, selection, focus, navigation, forced colours passed`);
  }
  await page.evaluate(() => window.fixture.clear());
  assert.equal(await page.locator('workspace-panel').evaluate(el => getComputedStyle(el).backgroundImage), 'none');
  assert.equal(await page.locator('app-mobile-main-tabs [aria-pressed="true"]').evaluate(el => getComputedStyle(el, '::before').content), 'none');
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await server.close();
}

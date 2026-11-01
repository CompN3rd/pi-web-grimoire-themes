import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
const plugin = manifest.piWeb.plugins[0];
const css = async path => readFile(new URL(`../assets/${path}`, import.meta.url), 'utf8');
const properties = text => Object.fromEntries([...text.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
function luminance(hex) {
  const values = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}
function contrast(a, b) {
  const [low, high] = [luminance(a), luminance(b)].sort((a, b) => a - b);
  return (high + .05) / (low + .05);
}

test('declarative-only package with six distinct, locally contained themes', async () => {
  assert.equal(plugin.id, 'grimoire');
  assert.equal(plugin.browserRoot, 'assets');
  assert.equal(plugin.module, undefined);
  assert.equal(plugin.serverModule, undefined);
  assert.equal(plugin.themes.length, 6);
  assert.equal(new Set(plugin.themes.map(t => t.id)).size, 6);
  for (const theme of plugin.themes) {
    assert.match(theme.id, /^[a-z][a-z0-9.-]*$/);
    assert.ok(['light', 'dark'].includes(theme.colorScheme));
    assert.equal(new Set(theme.stylesheets.map(s => s.id)).size, theme.stylesheets.length);
    for (const sheet of theme.stylesheets) {
      assert.match(sheet.path, /^[a-z-]+\.css$/);
      assert.ok((await stat(new URL(`../assets/${sheet.path}`, import.meta.url))).size < 2 * 1024 * 1024);
      const text = await css(sheet.path);
      assert.doesNotMatch(text, /@import|https?:/i);
      for (const [, path] of text.matchAll(/url\("([^"\n]+)"\)/g)) {
        assert.match(path, /^\.\/(fonts|textures)\/[^/]+\.(ttf|svg)$/);
        assert.ok((await stat(new URL(`../assets/${path}`, import.meta.url))).size > 0);
      }
    }
  }
});

for (const theme of plugin.themes) {
  test(`${theme.name}: complete palette and readable semantic text`, async () => {
    const p = properties(await css(theme.stylesheets[0].path));
    for (const token of ['font', 'mono', 'bg', 'surface', 'text', 'accent', 'danger', 'success', 'warning', 'terminal-bg', 'terminal-text', 'chat-user-bg', 'chat-conversation-bg', 'thinking', 'tool']) assert.ok(p[`--pi-${token}`], token);
    assert.match(p['--pi-mono'], /monospace/);
    for (const fg of ['text', 'text-secondary', 'muted', 'accent', 'danger', 'warning', 'success', 'thinking', 'tool', 'syntax-comment', 'syntax-keyword', 'syntax-string', 'syntax-number', 'syntax-title']) {
      for (const bg of ['bg', 'surface']) {
        const ratio = contrast(p[`--pi-${fg}`], p[`--pi-${bg}`]);
        assert.ok(ratio >= 4.5, `${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
      }
    }
    assert.ok(contrast(p['--pi-text'], p['--pi-selection-bg']) >= 4.5);
  });
}

test('handwritten editions bundle distinct fonts, licensed textures, and code safeguards', async () => {
  const hands = new Set();
  const papers = new Set();
  for (const id of ['hedgewitch', 'scribe', 'forgotten']) {
    const theme = plugin.themes.find(t => t.id === id);
    assert.equal(theme.stylesheets.at(-1).path, 'paper.css');
    const text = await css(`${id}.css`);
    const p = properties(text);
    hands.add(p['--grimoire-hand']); papers.add(p['--grimoire-paper']);
    assert.match(text, /@font-face/); assert.match(text, /font-display: swap/);
    assert.match(p['--pi-font'], /system-ui/);
  }
  assert.equal(hands.size, 3); assert.equal(papers.size, 3);
  for (const family of ['caveat', 'charm', 'marckscript']) {
    assert.match(await css(`fonts/${family}-OFL.txt`), /SIL OPEN FONT LICENSE Version 1.1/);
  }
  for (const texture of ['cream', 'parchment', 'foxing']) {
    const svg = await css(`textures/${texture}.svg`);
    assert.match(svg, /Original procedural/);
    assert.doesNotMatch(svg, /<script|<image|href=/);
  }
  const paper = await css('paper.css');
  assert.match(paper, /font-family: var\(--pi-mono\)/);
  assert.match(paper, /forced-colors: active/);
  assert.doesNotMatch(paper, /!important|animation:|transform:/);
});

test('decorations preserve native state and limit motion', async () => {
  const text = await css('manuscript.css');
  assert.match(text, /prefers-reduced-motion: no-preference/);
  assert.match(text, /forced-colors: active/);
  assert.doesNotMatch(text, /infinite|!important|display:\s*none|visibility:\s*hidden|outline:\s*none/);
  assert.doesNotMatch(text, /content:\s*"[^"\n]+"/);
  assert.match(text, /pointer-events: none/);
  assert.match(text, /:not\(:disabled\)/);
});

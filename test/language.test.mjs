import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import plugin, { locale } from '../assets/language/pi-web-plugin.js';
import catalogs from '../assets/language/catalogs.js';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));

test('language pack is optional and independent from CSS themes', () => {
  const entry = manifest.piWeb.plugins.find(p => p.id === 'grimoire-language');
  assert.equal(entry.defaultEnabled, false);
  assert.equal(entry.browserRoot, 'assets/language');
  assert.equal(entry.module, 'pi-web-plugin.js');
  assert.equal(entry.serverModule, undefined);
  assert.equal(manifest.piWeb.plugins[0].module, undefined);
  assert.equal(new Intl.Locale(locale).baseName, locale);
  assert.notEqual(locale, 'en');
});

test('registers each partial catalog through host localization', async () => {
  const registrations = [];
  assert.deepEqual(plugin.activate({ localization: {
    registerCatalog: contribution => registrations.push(contribution),
  } }), { contributions: {} });
  assert.equal(registrations.length, Object.keys(catalogs).length);
  assert.equal(new Set(registrations.map(r => r.id)).size, registrations.length);
  for (const registration of registrations) {
    assert.equal(registration.locale, locale);
    assert.deepEqual(await registration.load(), catalogs[registration.namespace]);
  }
});

test('older hosts receive an actionable error, without affecting theme entry', () => {
  assert.throws(() => plugin.activate({}), /localization support.*CSS themes/);
});

test('copy preserves technical values and explicit failure and stop semantics', () => {
  const argumentsByKey = {
    'core.promptEditor.thinking': ['level'],
    'core.promptEditor.remove': ['name'],
    'core.promptEditor.submitFailed': ['error'],
    'core.runtimeActivity.thinking': ['value'],
    ...Object.fromEntries(['Minimal', 'Low', 'Medium', 'High', 'Xhigh'].map(level =>
      [`core.pickers.reasoning${level}`, ['tokens']])),
  };
  for (const [namespace, catalog] of Object.entries(catalogs)) {
    for (const [key, text] of Object.entries(catalog)) {
      // Permanent deletion and confirmation dialogs remain host-owned.
      assert.doesNotMatch(key, /delete|confirm/i);
      assert.doesNotMatch(text, /<[^>]+>|duration/i);
      assert.deepEqual([...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]), argumentsByKey[`${namespace}.${key}`] ?? []);
    }
  }
  assert.match(catalogs['core.promptEditor'].stop, /stop current work/);
  assert.match(catalogs['core.promptEditor'].stopTitle, /stop current work and clear the queue/);
  assert.match(catalogs['core.runtimeActivity'].stopFailed, /failed to stop/);
  assert.match(catalogs['core.promptEditor'].submitFailed, /not sent: \{error\}/);
  assert.match(catalogs['core.chatChrome'].clearQueueTitle, /without stopping/);
  for (const key of ['compactionCancelled', 'automaticCompactionCancelled']) {
    assert.match(catalogs['core.sessionNotifications'][key], /cancelled/);
  }
  assert.equal(catalogs['core.promptEditor'].send, 'Cast incantation');
  assert.equal(catalogs['core.promptEditor'].thinking, 'Spell power: {level}');
  assert.equal(catalogs['core.chatChrome'].compacting, 'Bottling memories…');
  assert.equal(catalogs['core.chatTranscript'].thinking, 'Consulting the aether');
});

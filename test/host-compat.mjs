import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { bundleHost, host, hostVersion } from './host-support.mjs';
import catalogs from '../assets/language/catalogs.js';

const sources = {
  'core.promptEditor': 'components/promptEditor.messages.ts',
  'core.pickers': 'components/picker.messages.ts',
  'core.chatTranscript': 'components/chatTranscript.messages.ts',
  'core.chatChrome': 'components/chatChrome.messages.ts',
  'core.conversationLayout': 'components/conversationLayout.messages.ts',
  'core.runtimeActivity': 'components/runtimeActivity.messages.ts',
  'core.sessionNotifications': 'components/sessionNotifications.messages.ts',
  'core.actions': 'plugins/core/actions.messages.ts',
};
const entry = `
  export { validateCatalog } from './src/client/src/localization/catalog.ts';
  export { parseThemeMetadata } from './src/server/themeMetadata.ts';
  ${Object.values(sources).map((path, i) => `import source${i} from './src/client/src/${path}';`).join('\n')}
  export const sources = [${Object.keys(sources).map((_, i) => `source${i}`).join(',')}];
`;
const result = await bundleHost(entry, {
  plugins: [{ name: 'source-only-messages', setup(build) {
    // Message source modules need only message(), not browser registration effects.
    build.onResolve({ filter: /localization\/service$/ }, () => ({ path: resolve(host, 'src/shared/localization.ts') }));
  } }],
});
const contract = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const errors = Object.entries(sources).flatMap(([namespace], i) =>
  contract.validateCatalog(contract.sources[i], catalogs[namespace]).map(error => `${namespace}.${error}`));
assert.deepEqual(errors, []);
// Prove the check rejects both stale keys and changed ICU arguments.
assert.ok(contract.validateCatalog(contract.sources[0], { removedMessage: 'stale' }).length);
assert.ok(contract.validateCatalog(contract.sources[0], { thinking: 'Spell power: {wrong}' }).length);
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
const metadata = contract.parseThemeMetadata(manifest.piWeb.plugins[0], 'package.json');
assert.equal(metadata.themes.length, 12);
assert.ok(metadata.themes.every(theme => theme.loadingScreen));
console.log(`PI WEB ${hostVersion}: all ${Object.values(catalogs).reduce((n, c) => n + Object.keys(c).length, 0)} translations pass host ICU validation; 12 themes pass host metadata parsing`);

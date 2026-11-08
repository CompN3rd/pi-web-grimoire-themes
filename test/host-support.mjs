import { build } from 'esbuild';
import { resolve, delimiter } from 'node:path';
import { readFile } from 'node:fs/promises';

if (!process.env.PI_WEB_SOURCE) throw Error('Set PI_WEB_SOURCE to a PI WEB source checkout; see docs/compatibility.md');
export const host = resolve(process.env.PI_WEB_SOURCE);
export const hostVersion = JSON.parse(await readFile(resolve(host, 'package.json'), 'utf8')).version;

// Private source imports are confined to upgrade checks, never shipped plugin code.
export async function bundleHost(contents, options = {}) {
  return build({
    stdin: { contents, resolveDir: host, sourcefile: 'grimoire-compat.ts', loader: 'ts' },
    nodePaths: process.env.PI_WEB_NODE_MODULES?.split(delimiter) ?? [],
    bundle: true, write: false, format: 'esm', platform: 'node',
    tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } },
    ...options,
  });
}

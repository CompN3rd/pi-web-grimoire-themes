# Compatibility checks

The package uses declarative themes and public browser API v5 localization. Each theme supplies loading-screen colours matching its palette. PI WEB controls the loader and uses the gateway default, not a browser-local theme choice; development branding and forced colours remain host-owned.

## Run checks

Node.js 20+ is required. Install the pinned development tools and Chromium:

```sh
npm ci
npx playwright install chromium
npm test
```

For upgrade checks, point at the PI WEB source version being assessed. Its dependencies must be installed, or supplied separately through `PI_WEB_NODE_MODULES` (a platform-delimited list of dependency directories):

```sh
export PI_WEB_SOURCE=/path/to/pi-web
# Only needed when dependencies are not in that checkout's node_modules:
# export PI_WEB_NODE_MODULES=/path/to/installed/pi-web/node_modules
npm run test:compat
npm run test:browser
```

`test:compat` bundles the selected host's actual catalog validator, message definitions, and theme metadata parser. It validates every translated key and ICU argument/tag signature, checks rejection of stale keys and changed arguments, and parses all twelve theme declarations. There are no copied host catalogs to go stale silently. Source paths are version-sensitive test adapters, not imports in shipped plugin code; an incompatible host refactor should fail the check explicitly.

`test:browser` runs:

- `test/browser.mjs`: gallery specimens, fonts, paper/code safeguards, theme removal, focus, RTL, overflow, and forced colours;
- `test/motion-browser.mjs`: all twelve motion editions, finite animations, preference interruption, stable layout, popover dismissal, and touch hover;
- `test/host-browser.mjs`: actual PI WEB `AppMobileMainTabs` and `WorkspacePanel`, host stylesheet loading/adoption, all twelve themes, desktop/mobile layout, RTL, keyboard focus, tab/navigation actions, forced colours, and theme removal;
- `quill-prototype/test/browser.mjs`: simulated writing, reflow, pause/resume, selection, reduced motion, abort, and disconnect.

The shell test serves assets under a nested application prefix and rejects off-prefix requests. It retains the host's mobile layout: workspace headers are hidden there, and main navigation supplies the visible tabs. Gallery and motion checks also use a nested prefix. Servers bind only to loopback on temporary ports and close afterward. No live daemon, package installation, model call, or service restart is involved.

Run individual files with `node` for focused feedback. `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs` can override the local browser tooling. `node test/browser.mjs --capture` intentionally refreshes the six preview images; ordinary checks do not.

## Scope and remaining limits

The upgrade target is PI WEB **1.202611.1** (`98316bd8`). Supported conversation/navigation/composer hooks remain the preferred boundary. Ribbon and canvas rules additionally target experimental shell selectors; keep the real-component check when upgrading.

These isolated checks do not certify an installed full application, third-party panels, the live localization picker, federated machines, startup HTML delivery, or all browser engines. Loading-screen metadata is checked by the host parser; the initial loader is still host-owned. A live deployment smoke test remains separate and requires permission to install/activate the package.

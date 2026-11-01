# Grimoire themes for Pi Web

Six wizardly volumes for agentic work: three quiet manuscript palettes and three more expressive, handwritten paper editions. Ink, aged pages, illuminated margins, and a small seal on the composer's default action. Visual themes only—your prompts, shortcuts, and tools work exactly as before.

| Volume | Appearance | Character | Theme ID |
| --- | --- | --- | --- |
| **Candlelit Folio** | Light | Ivory parchment, oxblood ink, brass rules | `grimoire:candlelit` |
| **Astral Grimoire** | Dark | Midnight vellum, lilac ink, silver edges | `grimoire:astral` |
| **Verdant Codex** | Dark | Forest binding, sage lettering, botanical gold | `grimoire:verdant` |
| **Hedgewitch’s Journal** | Light | Casual Caveat handwriting, mottled cream paper, moss ink | `grimoire:hedgewitch` |
| **Scribe’s Spellbook** | Light | Calligraphic Charm handwriting, aged golden parchment | `grimoire:scribe` |
| **Forgotten Folio** | Light | Slanted Marck Script, faded paper, foxing and worn edges | `grimoire:forgotten` |

These are independent volumes, not an automatic light/dark pair. Auto mode will leave each selected volume unchanged.

## Preview before installing

Static gallery captures (illustrative specimens, not live-app screenshots):

![Candlelit Folio specimen](previews/candlelit.png)

[Astral Grimoire preview](previews/astral.png) · [Verdant Codex preview](previews/verdant.png)

### Handwritten paper editions

![Hedgewitch’s Journal specimen](previews/hedgewitch.png)

[Scribe’s Spellbook preview](previews/scribe.png) · [Forgotten Folio preview](previews/forgotten.png)

Handwriting applies to conversation prose, not controls or code. Each edition bundles its own font and original static paper texture locally.

From this repository, run:

```sh
npm run preview
```

Open **http://127.0.0.1:4173/previews/** and choose a volume. Direct selections: [Candlelit](previews/index.html#candlelit), [Astral](previews/index.html#astral), [Verdant](previews/index.html#verdant), [Hedgewitch](previews/index.html#hedgewitch), [Scribe](previews/index.html#scribe), [Forgotten](previews/index.html#forgotten). Serve these files over HTTP; Git hosting may display HTML source rather than render it. If the repository is on a remote machine, forward port 4173 to your browser's machine. Stop the preview with Ctrl+C.

The gallery uses the actual theme CSS in shadow roots with illustrative component specimens. It is **not a screenshot of the live application** or a substitute for testing in your Pi Web version. It needs Python 3 for the included server; any static HTTP server also works. No external fonts, image services, or CDN requests are used.

## Install locally

Requires a Pi Web version supporting **declarative CSS-first themes** and the conversation/navigation/composer styling hooks. Authored against the documentation and bundled palettes shipped with `@jmfederico/pi-web` **1.202610.9**. Older runtime-only theme hosts are unsupported; styling outside the host's supported contract remains version-sensitive.

1. In Pi Web's **Settings → Pi packages**, on the **gateway machine**, install this local package source:
   ```text
   /data/projects/pi-web-grimoire-themes
   ```
   If you copied the repository elsewhere, use its actual absolute path on that machine. In Docker this must be a path accessible inside the container, preferably on a persistent mount.
2. Check **Settings → PI WEB plugins** and enable **grimoire** if disabled.
3. Reload the browser page.
4. In **Settings → General → Theme**, select any of the six volumes listed above. The handwritten editions use the same installation—no separate font installation is needed.

Alternative developer installation: symlink this repository into the gateway's plugin directory (`$PI_WEB_DATA_DIR/plugins`, or `~/.pi-web/plugins` if unset), then reload the browser. For example, on that machine:

```sh
mkdir -p "${PI_WEB_DATA_DIR:-$HOME/.pi-web}/plugins"
ln -s /data/projects/pi-web-grimoire-themes "${PI_WEB_DATA_DIR:-$HOME/.pi-web}/plugins/grimoire"
```

Choose one installation method. Don't overwrite an existing `grimoire` link without checking its target. Theme assets are served from `assets/` only; previews and tests are not browser-public plugin assets.

**No session-daemon restart, server module, or browser JavaScript plugin is needed.** This repository has not been installed into the live instance. It does not replace or modify Pendant. Themes installed only on a remote fleet machine are ignored by the gateway. An enforced gateway theme policy may lock the theme picker.

To uninstall, first select a built-in theme, then remove the package in Settings (or remove only the developer symlink you created) and reload the browser. CSS-only changes likewise need a browser reload.

## Design and accessibility

- The original three retain their system-serif UI. The paper editions use bundled OFL handwriting fonts at 21–22px for conversation prose and a system sans-serif for controls, navigation and metadata. Code remains monospaced, and terminal geometry is unchanged. Unsupported glyphs fall back to local fonts; the handwriting fonts do not cover every writing system.
- Static local SVG textures provide mottling, fibres and foxing across the overall app canvas as well as message surfaces. The canvas texture is softened beneath a 55% base-colour wash; messages retain stronger paper detail and worn edges. Code blocks, inputs, and controls keep solid backgrounds. Shell host selectors (`pi-web-app`, `workspace-panel`) are version-sensitive and should be rechecked on host upgrades; opaque plugin-owned panels can cover the canvas. Inset shading wears the page edges without clipping text or changing hit targets. Forced colours removes the paper effects. Font loading uses `swap`, so prose remains visible while loading.
- User messages have a double leading rule; assistant messages a single rule. Current rows and selected choices retain structural cues, not colour alone.
- Busy sessions receive two quiet 2.4-second illuminations. Hovering the default composer action turns its small diamond seal once. Neither effect changes layout or interaction.
- Motion is opt-in through `prefers-reduced-motion: no-preference`; reduced-motion users get static decoration. Forced-colour mode keeps borders and a current-row outline.
- Native focus, disabled/hidden states, labels, popover positioning, and Stop remain owned by Pi Web. No text replacement, click interception, or spellcasting behavior is added.

## Checks and development

```sh
npm test                 # Node.js 20+; no dependencies
npm pack --dry-run       # inspect the local package contents; does not publish
```

Tests check metadata, local assets, restrained motion rules, and WCAG 4.5:1 contrast for primary/secondary/muted and semantic text against the two main opaque surfaces. They are not a blanket accessibility certification: blended surfaces, third-party plugins, focus, responsive layout, and actual host adoption also need browser checks.

`assets/{candlelit,astral,verdant,hedgewitch,scribe,forgotten}.css` define complete palettes; `assets/manuscript.css` adds shared decorations using documented hooks. The three paper editions additionally load `assets/paper.css`, `assets/fonts/`, and `assets/textures/`.

Optional browser fixture check (requires a separately available Playwright installation and Chromium):

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node test/browser.mjs
# Add --capture to regenerate the three handwritten PNG previews.
```

This launches a temporary loopback-only static server on port 4174 and closes it afterward. It checks local font loading, message/canvas paper, solid code/control backgrounds and fonts, mobile overflow, reduced motion, forced colours, and paper removal on theme switching. `previews/` is a standalone specimen gallery, not application code. No build step or runtime dependencies.

CSS, gallery, and original procedural textures are MIT licensed. Bundled fonts retain their SIL OFL 1.1 licenses and copyright notices; see [asset attribution](assets/ATTRIBUTION.md). Local delivery only; no remote repository or published package is implied.

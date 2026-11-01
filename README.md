# Grimoire themes for Pi Web

Three quiet volumes for agentic work: ink, illuminated margins, and a small seal on the composer's default action. Visual themes only—your prompts, shortcuts, and tools work exactly as before.

| Volume | Appearance | Character | Theme ID |
| --- | --- | --- | --- |
| **Candlelit Folio** | Light | Ivory parchment, oxblood ink, brass rules | `grimoire:candlelit` |
| **Astral Grimoire** | Dark | Midnight vellum, lilac ink, silver edges | `grimoire:astral` |
| **Verdant Codex** | Dark | Forest binding, sage lettering, botanical gold | `grimoire:verdant` |

These are independent volumes, not an automatic light/dark pair. Auto mode will leave each selected volume unchanged.

## Preview before installing

Static gallery captures (illustrative specimens, not live-app screenshots):

![Candlelit Folio specimen](previews/candlelit.png)

[Astral Grimoire preview](previews/astral.png) · [Verdant Codex preview](previews/verdant.png)

From this repository, run:

```sh
npm run preview
```

Open **http://127.0.0.1:4173/previews/** and choose a volume. Direct selections: [Candlelit](previews/index.html#candlelit), [Astral](previews/index.html#astral), [Verdant](previews/index.html#verdant). Serve these files over HTTP; Git hosting may display HTML source rather than render it. If the repository is on a remote machine, forward port 4173 to your browser's machine. Stop the preview with Ctrl+C.

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
4. In **Settings → General → Theme**, select **Candlelit Folio**, **Astral Grimoire**, or **Verdant Codex**.

Alternative developer installation: symlink this repository into the gateway's plugin directory (`$PI_WEB_DATA_DIR/plugins`, or `~/.pi-web/plugins` if unset), then reload the browser. For example, on that machine:

```sh
mkdir -p "${PI_WEB_DATA_DIR:-$HOME/.pi-web}/plugins"
ln -s /data/projects/pi-web-grimoire-themes "${PI_WEB_DATA_DIR:-$HOME/.pi-web}/plugins/grimoire"
```

Choose one installation method. Don't overwrite an existing `grimoire` link without checking its target. Theme assets are served from `assets/` only; previews and tests are not browser-public plugin assets.

**No session-daemon restart, server module, or browser JavaScript plugin is needed.** This repository has not been installed into the live instance. It does not replace or modify Pendant. Themes installed only on a remote fleet machine are ignored by the gateway. An enforced gateway theme policy may lock the theme picker.

To uninstall, first select a built-in theme, then remove the package in Settings (or remove only the developer symlink you created) and reload the browser. CSS-only changes likewise need a browser reload.

## Design and accessibility

- Serif manuscript UI with a separate monospace stack for code. All fonts are local system fallbacks; appearance varies by platform.
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

`assets/{candlelit,astral,verdant}.css` define complete palettes; `assets/manuscript.css` adds shared decorations using documented hooks. `previews/` is a standalone specimen gallery, not application code. No build step or runtime dependencies.

MIT licensed. Local delivery only; no remote repository or published package is implied.

# Quill prototype — simulated writing

A separately installable, browser-only PI WEB API v5 plugin. It adds **Quill (simulated)** to the application tool tabs; no workspace or conversation is required. It has no server entry, dependencies, build step, model calls, or external assets. It does not alter the Grimoire theme package.

## Try locally without installation

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://localhost:8765/quill-prototype/preview.html` (forward this port if the repository is in a container). This isolated harness uses the same component, not a real PI WEB host. Stop the server with Ctrl-C.

Click **Start / Replay**, **Pause**, and **Resume**. Resize the window while writing to see the nib follow ordinary line wrapping. Select the passage and copy it normally. There is no automatic scrolling. Reopening a disconnected panel requires replay. With OS/browser reduced motion enabled, Start shows the full passage immediately, without quill motion or fresh-ink animation. Changing to reduced motion during playback also reveals the full passage.

## Optional installation (requires separate approval)

Not installed or activated as part of delivery. On PI WEB 1.202610.9 / browser API v5 or a compatible newer host, use **Settings → Pi packages** to add this local package directory, not the repository root:

`/data/projects/pi-web-grimoire-themes/quill-prototype`

Alternatively, for local development, create a new symlink under `$PI_WEB_DATA_DIR/plugins` (or `~/.pi-web/plugins` if unset), pointing to that directory. Use a distinct name such as `quill-prototype`; do not replace the existing `grimoire` link.

Then enable **Quill prototype (simulated)** in **Settings → PI WEB plugins**, reload the browser, and open **Quill (simulated)**. No service restart is needed. Browser plugins are trusted page code; install only after reviewing it.

To remove, disable it in PI WEB plugins and remove its package through Pi packages, or remove only its development symlink if that was how it was installed. Reload the browser. Leave the existing Grimoire installation untouched. There is no saved data to clean up.

## Limits

This is a fixed, plain-text simulation in plugin-owned UI, **not actual assistant output**. It neither reads nor decorates the chat transcript. Public browser APIs do not currently supply the live text lifecycle and rendered writing-tip geometry needed for that integration; see `../QUILL-INTEGRATION.md`. No private DOM scraping, socket interception, or host changes are used. Rich Markdown, code blocks, and live-chat integration are outside this prototype.

The quill uses actual browser Range rectangles at the latest displayed character. ResizeObserver keeps it aligned when the panel reflows. Ink briefly dries from blue-black to dark brown. The decoration is hidden from accessibility APIs and cannot intercept pointer interaction. Only playback status—not every streamed character—is announced.

## Checks

`node quill-prototype/test/browser.mjs` runs Chromium checks using Playwright. Set `PLAYWRIGHT_MODULE` to an absolute module path if Playwright is not at the local shared path used by this repository. The test starts and stops its own loopback-only HTTP server. These are isolated component/entry-contract checks, not proof of live-instance installation.

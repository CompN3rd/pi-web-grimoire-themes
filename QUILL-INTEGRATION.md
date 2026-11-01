# Streaming quill: plugin integration findings

Live-chat status: **blocked by missing public host capability**, not implemented or installed.

A separately authorized simulated demonstration now lives in [`quill-prototype/`](quill-prototype/README.md). It does not resolve the live-chat limitation below and has not been installed into the live instance. The remainder records the prior live-chat investigation; its host proposal is not authorized implementation scope.

Requested effect: an animated quill follows newly streamed assistant text, with a short fresh-ink treatment. Text must remain immediately readable/selectable; no artificial typing delay or replay of saved messages. The authorized scope is a browser plugin using supported APIs, not host changes.

## Installed contract checked

PI WEB `1.202610.9`, browser API v5:

- `dist/plugin-api.d.ts`, `PluginContributionsV5`: stylesheets, panels, labels, actions, content/file renderers, syntax highlighting, themes and file icons. No chat decoration contribution or streaming-text subscription.
- `PluginSelectionService`: basic machine/project/workspace/session selection only; explicitly excludes transcript and status data.
- `DisplayedMessageActionContribution`: a user-invoked action can receive the displayed text of a streaming message. Availability callbacks are synchronous and side-effect-free. They are not a token subscription, and expose no rendered text nodes, ranges, or writing-tip coordinates.
- `StylesheetIntegrationCapabilityV1`: registers plugin-owned roots and observes stylesheet adoption. It does not provide the host's roots or observe transcript DOM mutations.
- Content renderers operate on eligible complete content/code fences, not the ordinary live assistant prose stream. They cannot decorate the built-in message renderer's current writing position.
- The supported conversation styling contract exposes message/body/header containers and a decorative pseudo-element. It has neither a streaming-state hook nor a last-rendered-text anchor.

Sources: installed `docs/plugins.md` sections “Follow selection while a tab is closed”, “Message actions”, “Content previews in chat and Files”, and “CSS files and shadow roots”; installed `dist/plugin-api.d.ts`; local `docs/theme-styling-contract.md`.

## Why the existing APIs are insufficient

Two distinct capabilities are needed: authoritative live-stream lifecycle (not simply “session busy”), and an anchor at the current **rendered** text tip. Markdown reflow, line wrapping, nested renderer roots, scrolling and font loading make token offsets alone insufficient. CSS cannot infer these reliably, and a floating quill driven by a timer would only simulate writing rather than follow the stream.

Private DOM traversal, MutationObservers on host internals, socket interception, and side effects in action-availability checks would bypass the requested supported-API boundary. They were not implemented. No host files, installed plugin declarations, live configuration or services were changed by this investigation.

## Smallest enabling host addition (proposal only)

A public, lifecycle-managed **stream decoration** capability could provide:

1. A host-owned, noninteractive decoration mount for the visible live assistant prose, scoped to the selected conversation.
2. Stream start/update/idle/end and detach notifications, distinguishing live output from restored history, thinking and tool content.
3. The current visible writing-tip rectangle in mount-local coordinates, plus visibility and reflow/scroll updates. For fresh-ink effects, bounded newly rendered range geometry or a host-owned transient styling hook—not permission to rewrite transcript text.
4. An abort signal and disposal path for session switches, theme changes, plugin disablement, stream termination and component unmounting.

Then the browser plugin can draw a locally bundled decorative quill, track the anchor once per animation frame, make short nib strokes only while new text arrives, and lift/hide on pauses or off-screen output. It must not pull scroll position, intercept input, change copied text, or animate history. Reduced motion and forced colours should suppress the quill and ink animation. Theme opt-in should keep the effect limited to the intended Grimoire editions.

Implementing that host capability requires separate authorization. A standalone gallery prototype would be possible today, but would not satisfy the requested live-chat integration and should not be presented as one.

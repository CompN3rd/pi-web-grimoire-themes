# Enchantment studies

Six palettes, two motion editions each. **Quiet** is the default under the existing theme names and IDs. **Spellbound** is an explicit alternative in the Pi Web theme picker (`grimoire:<volume>-spellbound`). It changes motion parameters only, not palette, typography, layout, or interactions. No additional plugin JavaScript runs in Pi Web.

## Motion vocabulary

| Effect and trigger | Quiet | Spellbound | What stays still |
| --- | --- | --- | --- |
| Kindling — session becomes busy | Two 1.6s cycles, soft 12px inset glow | Two 2.2s cycles, stronger 26px glow | Row, label, status and click target |
| Ribbon catches light — panel selected | One 650ms sweep | One 1.2s brighter sweep | Button, text, badge, focus ring |
| Ink inscription — hover/focus within a message | One 500ms, 28px stroke | One 1.1s, 72px stroke | The entire message and all code |
| Seal casting — hover or keyboard-focus default composer action | One 650ms quarter-turn | One 1s full turn | Send/Queue/Steer label and button |
| Menu binding — a native menu opens | One 280ms border-colour settling | One 600ms border-colour settling | Popup position, contents and focus |

The ribbon sweep stays in the bottom 8px of its decorative backing, below labels; it does not reduce text contrast. Ink strokes occupy the small top margin of message content and fade away. Only decorative ink and the 6px seal transform. Nothing rotates or moves a reading surface. Busy kindling ends at the normal structural edge, even if the agent continues working; this is decoration, not a replacement activity indicator.

The same vocabulary takes its ink colours from each volume: oxblood/brass, lilac/silver, sage/gold, moss/cream, sepia/gold, and faded slate. Stronger motion is optional rather than silently imposed on existing selections.

## Try the range

1. Run `npm run preview`, open `http://127.0.0.1:4173/previews/`.
2. Choose a volume and **Enchantment → Quiet / Spellbound**. Deep links include `#astral-spellbound` or `#scribe-spellbound`.
3. Select another ribbon to replay its sweep. Hover a message for the ink stroke, then hover or keyboard-focus Send for the seal.
4. Click **Rekindle busy session** to replay the bounded activity glow. This affects only fixture markup; it never dispatches real agent work.
5. Open the menu specimen and dismiss it with Escape. The native popover owns visibility and dismissal.
6. Switch reduced-motion preference while effects are running. The gallery explains when motion is suppressed; it does not override your preference.

Static PNG specimens show the design but cannot demonstrate timing. The interactive gallery uses the delivered CSS. It is not live-host integration evidence.

## Boundaries that matter

- All theme-owned motion is gated by both `prefers-reduced-motion: no-preference` and `forced-colors: none`. Switching either preference interrupts it immediately. Static roles, selection, focus, and borders remain.
- No ambient loops. Longest individual sequence is **4.4 seconds**. Hover effects require genuine hover capability, avoiding sticky touch hover. Keyboard focus gets equivalent seal/ink effects where focus exists.
- CSS sees mounted state, not application lifecycle events. Already-selected tabs and busy rows can animate on initial mount, theme change or remount. This does **not** indicate a new message, successful command or fresh agent action. Changing animation parameters mid-flight may retime the current effect rather than restart it.
- Message ink responds to hover/focus only; streaming tokens and loading older messages do not continually restart a text reveal. A pointer remaining over one message plays the stroke once until it leaves/re-enters.
- Focus outlines appear immediately; there is no delayed focus transition. Disabled actions never animate their seals or ribbon sheen. Native hidden/disabled states and popup dismissal remain host-owned.
- Effects use small shadows, background-position, border colour, and decorative transforms/opacity. No canvas, particle system, image animation, timers or permanent `will-change` allocations. The small paint-based effects are finite, but browser fixture tests are not a performance benchmark on every device.
- Tabs use documented shared classes in version-sensitive shell hosts. Message, composer, navigation-row and menu selectors follow the supported contracts. Test after Pi Web upgrades.

## Deliberately not implemented

**Typewriter output** would hide readable text, interfere with streaming and imply behavior the theme cannot observe. **Page flips, floating panels and parallax** would move reading surfaces or hit targets. **Perpetual candlelight, sparks and drifting paper** would keep consuming attention while the user reads. **Success explosions** would imply semantic events not exposed by these CSS hooks. These are poor tradeoffs even in Spellbound.

## Verification

`npm test` validates the twelve declarations, palette equivalence between editions, local assets, motion gates and duration bounds. Optional Chromium checks:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node test/browser.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node test/motion-browser.mjs
```

The motion check exercises all twelve selections with motion enabled, samples live animation timelines, verifies stable hitbox geometry, checks immediate reduced-motion/forced-colour interruption, switches editions, dismisses native popovers, and checks touch behaviour. The two scripts use temporary loopback servers on dynamically assigned ports, stopped on exit. See [Compatibility checks](docs/compatibility.md) for tool setup and real-host shell checks. No live installation or restart is performed.

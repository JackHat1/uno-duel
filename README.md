# UNO Duel v6.3

A mobile-first realtime 1-vs-1 UNO-style web game built with React, Vite and Firebase Realtime Database. The frontend is static and can be deployed to GitHub Pages.

## Run

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## v6 UI refactor

The v6 presentation layer was rebuilt around one clean design system instead of accumulated version overrides. Gameplay animations are driven by a synchronized `game.lastEvent` object in Firebase, so both clients receive the same action event.

Cinematic events include normal card play, draw, Wild color change, Draw Two, Wild Draw Four, Skip, Reverse, UNO, Catch UNO and round transitions. Wild Draw Four also communicates the newly selected color inside the penalty animation.

The app continues to use `window.visualViewport` plus iOS safe-area insets so Safari browser chrome, Dynamic Island/notch areas and the home indicator do not push gameplay outside the visible viewport.

## Player profile

Anonymous Firebase Authentication provides the player UID. Profile name, avatar and accent can be edited in-app and synced to Firebase under `profiles/{uid}`.

## Quick chat

Preset reactions are synchronized through the active room and appear as temporary in-game chat bubbles.

## GitHub Pages

`vite.config.js` automatically uses the GitHub repository name as the Pages base path when running inside GitHub Actions.

## Before a public release

Do not treat the current development Realtime Database rules as production anti-cheat/security. Before making the repository public, harden room write validation so each authenticated player can only perform legal writes for their own role, or move authoritative game actions to trusted server-side logic if stronger anti-cheat protection is required.

## v6.1 — iPhone gesture + Safari animation fix

- Quick Chat is now a compact floating tray instead of a large full-width sheet.
- Player hand uses a curved fan with card rotation and arc spacing.
- Playable cards support swipe-up-to-play with a visible armed state; tap-to-play remains available.
- Wild/Wild +4 swipe opens the color selector instead of committing before a color is chosen.
- Game moment overlays are rendered inside the exact VisualViewport-sized board for iOS Safari reliability.
- Each realtime game event remounts its animation by event id so repeated events restart correctly.
- Penalty animation transforms no longer use CSS angle multiplication inside `calc()`, improving Safari compatibility.
- Reduce Motion no longer makes game feedback invisible; it uses a static/fade presentation instead.

## v6.3 — Table scale + iOS Wild picker

- Draw and discard piles use full-size table cards on normal iPhones.
- Compact/short modes preserve readable card size and only scale down when the visible Safari viewport genuinely requires it.
- Wild color selection is rendered through a React portal attached to `document.body`.
- The color picker tracks `window.visualViewport` size and offsets, so Safari address/tool bars cannot push it below the visible screen.
- Short iPhone viewports use a compact centered color sheet with internal scrolling as a final safety net.

## Public repository note

Firebase Web configuration is intentionally client-visible in a static web application. Access control must come from Firebase Authentication, Realtime Database Security Rules and (for a public deployment) App Check / stronger server-side validation where appropriate.


## v6.4 — Compact chat + real center piles

- Quick Chat trigger is now a small icon-only circular control with a much smaller popover.
- Draw/discard use a strict portrait card ratio instead of inheriting square-ish container geometry.
- Discard shows up to two actual previous discarded cards behind the current top card for a natural played-card stack.
- Draw pile includes subtle layered card backs.

## v7.0 — full game-feel pass

- Reworked the table into a physical arena with player seats, felt depth, color markers and a stronger active-turn hierarchy.
- Opponent cards now sit in a compact fan instead of a flat browser-like strip.
- Added a short non-blocking `YOUR MOVE` banner when control passes to the local player.
- Added card lift/drop feedback, richer draw/play sounds, dedicated +2/+4 impacts, Wild sweep, turn chime, UNO sting and win/lose fanfares.
- Ambient music remains optional and is generated in-browser; no external copyrighted audio assets are bundled.
- Browsers that expose the Vibration API receive subtle tactile feedback for key actions.
- Home and lobby screens now behave more like a title/versus flow and include menu sound feedback.
- UNO button, player dock, quick-chat control and winner modal were restyled to feel like physical game controls instead of web UI widgets.


## v8 — unified game identity

- Home, lobby, player profile, loading states and the game table now share one card-game visual language.
- Removed developer-facing / template-like status badges from the player-facing home screen.
- Player profile is presented as a Player Card instead of a settings form.
- Lobby is a compact head-to-head table with two seats and a central VS medallion.
- In-game HUD uses fewer glass panels and a stronger physical table / rail hierarchy.
- Existing realtime gameplay, iOS VisualViewport handling, gesture cards, synchronized effects and Web Audio game sounds are preserved.


## v8.2 — iPhone fit + classic animations

- Rebuilt the portrait in-game layout as explicit opponent / table / hand viewport zones.
- Removed the Safari double-offset behavior that could push the board below the visible screen.
- Hand card sizing now follows the actual visible viewport height so it cannot force the table off-screen.
- Restored the classic synchronized UNO Duel action moments (play, draw, Wild color, +2/+4, Skip, Reverse, UNO, round start) through the iOS-safe portal/Web Animations layer.

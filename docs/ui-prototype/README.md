# UI Prototype Reference

This folder tracks the Claude-designed UI prototype as reference material for the Orchestra Manager visual migration.

## Source

The prototype was copied from the local untracked folder:

```text
/Users/lucarobadey/Desktop/Projects/Coding/Orchestra Manager/ New UI/
```

It now lives in:

```text
docs/ui-prototype/claude-new-ui/
```

The leading-space source folder should not become a long-term project path.

## Authority

The prototype is visual reference only. The live app remains the authority for game behavior:

- `src/App.tsx` owns the playable season state machine.
- `src/types/` owns domain shapes.
- `src/sim/` owns forecasting, scoring, resolution, season, and roster behavior.
- `src/components/` renders the current playable loop.

Do not port formulas from the prototype. Do not replace live simulation behavior with `mock-data.jsx`.

## Prototype-Only Runtime Assumptions

The files under `claude-new-ui/` were built as a standalone browser prototype. These assumptions should not be copied directly into the production app:

- CDN-loaded React, ReactDOM, and Babel.
- Browser JSX transpilation.
- `window.MOCK`.
- `window.__navigate`.
- `window.omelette`.
- Design-canvas persistence through `.design-canvas.state.json`.
- Global selectors and utility classes that may collide with the live app.

Future screen ports should translate the design into typed Vite/React modules and consume live presentation adapters instead of prototype globals.

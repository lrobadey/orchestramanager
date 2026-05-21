# UI Prototype Reference

This folder preserves visual-reference prototypes for Orchestra Manager. These files are reference material only; they are not the live app architecture and they are not simulation authority.

The live application and simulation remain the source of truth:

- `src/types/` owns domain nouns.
- `src/data/` owns seed data.
- `src/sim/` owns behavior, formulas, and state transitions.
- `src/components/` and `src/App.tsx` own the playable React UI.

The preserved prototype under `claude-new-ui/` may be useful for visual direction, layout density, and interaction inspiration. Do not port its implementation patterns directly into the live app.

In particular, do not directly copy:

- Browser globals.
- CDN-loaded dependencies.
- In-browser Babel transforms.
- Prototype mock data as live seed data.
- Design-canvas persistence or `.design-canvas.state.json` behavior.

When adapting anything from this reference, rebuild it through the live app's existing React, TypeScript, data, and simulation boundaries.

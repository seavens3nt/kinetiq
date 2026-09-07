# Kinetiq

**Move ideas, not keyframes.**

Kinetiq is a browser-based motion-design studio concept for creating pitch videos, product launches, app showcases, commercials, and kinetic typography using reusable motion presets instead of traditional keyframe-heavy editing workflows.

## Current MVP foundation

The repo currently contains a first motion playground with:

- Next.js App Router + TypeScript
- Tailwind CSS
- Zustand editor state
- Zod project schema
- Motion-powered text animations
- Versioned motion preset registry
- Versioned background preset registry
- Editable headline content
- Replayable text animation previews
- 9:16 editor canvas
- Architecture ready for React Bits adapters
- Remotion dependencies installed for the next preview/export phase

## Why the preset layer matters

Saved projects store Kinetiq-owned preset IDs such as `split-rise` rather than React Bits component props. This keeps project files stable even if the underlying implementation changes later.

Example:

```json
{
  "type": "text",
  "content": "MAKE IDEAS MOVE.",
  "motionPresetId": "split-rise"
}
```

The renderer can map `split-rise` to a React Bits Split Text adapter, a custom Motion implementation, or a Remotion-safe renderer without changing the saved project.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Core folders

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── editor/
│       ├── animated-text.tsx
│       └── motion-playground.tsx
├── lib/
│   ├── presets.ts
│   └── project-schema.ts
└── store/
    └── editor-store.ts
```

## Next milestones

1. Integrate the exact React Bits Split Text implementation behind the `split-rise` adapter.
2. Add hover-to-preview preset cards.
3. Add editable text style controls.
4. Add UI component presets such as notification, statistic, progress, and phone mockups.
5. Add multiple scenes and scene reordering.
6. Add sound uploads and animation-linked SFX.
7. Connect Remotion Player to the shared project JSON renderer.
8. Add authentication and cloud autosave only after the playground UX feels good.

## Product rule

The default Kinetiq workflow should stay simpler than a traditional video editor:

**Choose → Customize → Move → Export**

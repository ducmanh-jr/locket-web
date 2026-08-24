# LocketWeb Workspace Agent Instructions

Always inspect `PROJECT_MEMORY.md` at the start of any conversation in this repository.

## Key Rules & Architectural Decisions:
1. **Feed Transitions**:
   - Card spacing: `100vh` between center points of stacked cards.
   - Continuous sharp display (`opacity: 1`, `scale: 1`), no blur filters on card wrapper.
   - Touch drag velocity: 1:1 real-time finger lockstep with 0ms transition duration during drag.
   - Transition spring: `stiffness: 190`, `damping: 26`, `mass: 0.9`.
   - `dragYOffset` must always reset to `0` on touch end to avoid offset bugs.

2. **Modals & Z-Index Layering**:
   - Floating controls (`LocketHeader`, `LocketDock`) are `z-40`.
   - Options modals (`showOptionsModal`) must use `createPortal(..., document.body)` at `z-[999]` to cover all underlying UI elements.

3. **Admin Privileges**:
   - Keep full Admin logic without displaying ugly crown icons on UI.

4. **UI Aesthetics**:
   - Always maintain high-end Dark Rose glassmorphic styling (`#D9266E`, `#10091D`, `bg-black/40 backdrop-blur-xl border border-white/10`).

# Room Remix

A little space. A lot of possibility.

An interactive 3D furniture planner with warm wood, soft mint upholstery, and an original procedural furniture collection. Everything in the room is built from geometry: no downloaded models, remote textures, HDR environments, or asset services.

**Live:** https://gracebilliris.github.io/room-remix/

## Run locally

Requires Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5193/. Run `npm test` for layout tests, `npm run build` for a type-checked production build, and `npm run preview` to serve that build on port 5193. Stop the development server before starting preview.

## Make yourself at home

- Start with **Sunday living** or **Slow mornings**, or arrange your own room.
- Add sofas, beds, coffee tables, curved lounge chairs, desks, bookshelves, floor lamps, and plants from the collection.
- Click a piece to select it; drag it over the floor to move it. Positions snap to a **0.25 m grid**. Red footprints indicate a collision or room boundary; an invalid drop returns to the previous valid spot.
- Drag empty space to orbit, right-drag to pan, and scroll to zoom. On touch screens, drag empty space with one finger to orbit; use two fingers to pan or pinch to zoom.
- Switch between **3D view** and **Top view**, toggle the grid, or reset the camera.
- Use the **In this room** list to select pieces without interacting with the canvas. Arrow buttons and X/Z fields provide precise, touch-friendly movement. Coordinates are measured from the room center; negative Z is toward the back wall.
- With a piece selected, **arrow keys** move it by 0.25 m, **R** rotates it by 90°, **Delete / Backspace** removes it, and **Escape** clears selection. Shortcuts do not interfere with typing in fields.
- Edit room width and depth between **3–10 m** in 0.25 m increments, then apply. If furniture would fall outside the resized room, the change is refused; no pieces are silently removed.
- Changes autosave locally. **Save room** saves immediately. **Export JSON** creates a portable backup; **Import** validates dimensions, versions, grid alignment, known furniture, unique IDs, limits, bounds, and collisions before asking to replace your room.
- Presets and reset ask for confirmation before replacing furniture. Export a copy first to keep another design.

## Browser requirements and storage

The 3D view requires a current browser with **WebGL 2 and hardware acceleration**. A readable fallback appears if the renderer cannot initialize; the collection, room list, position controls, and JSON tools remain available. No account or network service is required after the application has loaded.

Layouts are stored only under **`room-remix-layout-v1`** in this browser's local storage. Nothing clears storage for other applications sharing the GitHub Pages origin. Private browsing, disabled storage, quota limits, clearing site data, or switching devices may prevent persistence. Save a JSON export for a durable copy. Storage failures are surfaced rather than reported as a successful save.

Each furniture piece uses an axis-aligned rectangular floor footprint after 90° rotation. Touching edges are allowed; overlapping footprints are not. Items cannot be stacked, walls remain fixed, and decorative room details are not editable furniture. The planner supports up to 100 pieces.

## Validation

`npm test` runs focused Vitest cases for rotation footprints, boundaries, collision rejection, grid snapping, insertion/removal, non-destructive room resizing, both presets, import sanitization, and save/reload failures.

An optional Playwright browser check exercises actual WebGL rendering and raycast dragging, invalid drops, add/move/rotate/remove, save/reload, room sizing, presets, confirmation, JSON export/import, keyboard controls, responsive mobile layout, and runtime errors:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test/index.mjs \
  node scripts/browser-check.mjs
```

Point `ROOM_REMIX_URL` at a preview or deployed URL to test it. Playwright and its Chromium browser must already be installed in the supplied tooling location; they are not application dependencies. Browser profiles, screenshots, downloads, and reports are kept in the ignored `artifacts/` directory, separate from source.

## Deployment

Vite uses a relative base (`./`) for GitHub Pages project paths. Push to `main` to run `.github/workflows/deploy.yml`: Node 22, `npm ci`, model tests, type-checked build, and GitHub Pages artifact deployment. In repository settings, choose **GitHub Actions** as the Pages source. The workflow needs `contents: read`, `pages: write`, and `id-token: write`.

Built with React, TypeScript, Vite, Three.js, React Three Fiber, Drei, and Lucide.

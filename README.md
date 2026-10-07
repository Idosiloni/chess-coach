# Chess Coach

Free chess game review that teaches. Static site: no backend, no build step, no cost.
Stockfish 19 (WASM) runs in the browser; games and progress stay in the user's browser (localStorage).

Live: https://chessido.netlify.app

## Features
- Load recent chess.com games by username (12/25/50/100, filter by time class) or paste a PGN
- Parallel Stockfish workers, background batch analysis, saved analysis so reviews open instantly
- Per-game: accuracy, estimated strength, 3 key lessons with "find the better move" drills, teaching boxes, full game viewer
- Dashboard: estimated strength, accuracy trend, habits, phase/colour breakdown
- "What to work on": recurring mistake types with how-to steps and free Lichess practice links
- Games list with key moments, best game of the day, opening report
- "Copy AI coach prompt" buttons (free: paste into any chat) instead of paid API calls

## Run locally
    python3 -m http.server 8765   # open http://localhost:8765  (must be served, not file://)

## Deploy
Drag this folder onto https://app.netlify.com/drop (or any static host).

## Layout
- `index.html`  all app code (UI, analysis, lesson engine, progress tracker)
- `engine/`     stockfish.js 19 lite single-thread WASM build (GPLv3, see Copying.txt)
- `lib/`        chess.js 0.10.3
- `pieces/`     cburnett piece set (via Lichess)

## Ideas for next
- Practice mode from saved blunder positions
- Split index.html into modules
- Analyze from a chess.com game link
- Installable (PWA) / offline

## Credits
Stockfish (GPLv3), stockfish.js by nmrugg, chess.js (BSD), cburnett pieces (GPLv2+).

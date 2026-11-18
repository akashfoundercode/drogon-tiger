# Dragon vs Tiger – Cinematic Casino Game (React + Vite + Tailwind)

A fully playable, real-time Dragon vs Tiger frontend. Virtual currency only – no real money.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

Landscape-first: a fixed 1600×900 (16:9) canvas is scaled to fit any viewport.

## Round lifecycle (state machine – `src/game/reducer.js` + `GameContext.jsx`)

| Phase     | What happens |
|-----------|--------------|
| `IDLE`    | Dragon/Tiger idle animations, cards face down, "next round" info (2.5 s) |
| `BETTING` | 15 s countdown, panels enabled, simulated players bet continuously |
| `CLOSED`  | "BETS CLOSED" lock animation, panels frozen, cards charge up |
| `REVEAL`  | Dragon card flips, then Tiger card flips |
| `RESULT`  | Winner banner, glow + sparks, payouts, history updated, chips fly to your avatar |
| → `IDLE`  | Piles cleared, next round |

Payouts: Dragon/Tiger win 1:1 · Tie bet wins 8:1 · on a Tie, Dragon/Tiger stakes return 50%.
Ace is low, King is high.

## Coin animation

Every bet creates its own `FlyingChip` (`components/FlyingChips.jsx`): it starts at the selected chip
(or a player avatar for simulated bets), follows a curved arc with spin + scale, and lands in a
dedicated slot of the panel's pile (`game/pile.js`). Piles live below the text area so coins never cover
labels. Rapid clicks / Repeat / ×2 stagger multiple chips.

## Artwork

Dragon, tiger, avatars, chips and cards are generated vector art (SVG/CSS) so the project has no binary
assets. To use your own artwork, set `ART.dragon` / `ART.tiger` in `src/game/constants.js` to image paths
placed in `public/`.

## Structure

```
src/
  game/        constants, reducer, bots, cards, pile geometry, sound, GameContext
  components/  Scene, Header, Creatures, PlayingCard, StatusBanner, BetPanel, PlayerSidebar,
               ResultHistory, BottomBar, FlyingChips, PhaseOverlay, Modals, Chip, Avatar
  hooks/       useScale
```
# drogon-tiger

# 🁢 Domino Score

A mobile app to keep score for **dominoes** games: two teams of two players each, scoring round by round until a team reaches the target score (100 / 150 / custom). Built with **Expo + React Native + TypeScript**.

## Features

- **Two teams, two players each** — name the teams and players when setting up a match.
- **Round-by-round scoring** — after each round, pick the winning team and enter the points earned. Totals accumulate automatically.
- **Selectable target score** — 100, 150, 200, or any custom value. First team to reach it wins.
- **Live scoreboard** — each team's running total, **points needed to win**, and who's leading.
- **Edit & delete rounds** — tap any round to fix a mistake; the winner is recalculated instantly.
- **Match history** — every match is saved on the device (survives app restarts). Long-press to delete.
- **Rematch / new teams** — when a match ends, replay with the same teams or start fresh.
- **3 switchable themes**
  - **Modern** — sleek dark UI with gradients.
  - **Cuban Classic** — warm vintage domino-table look.
  - **Grande** — extra-large text & buttons for older players.
- **Bilingual** — English / Spanish toggle in Settings.

All data is stored **locally on the phone** (AsyncStorage) — no account, no internet needed.

## Running the app

You need [Node.js](https://nodejs.org) (already installed) and the **Expo Go** app on your phone
(from the App Store / Google Play).

```bash
npm install        # first time only
npm start          # starts the Expo dev server + QR code
```

Then **scan the QR code** with Expo Go (Android) or the Camera app (iOS). The app loads on your phone — no Mac required for development.

Other options:

```bash
npm run android    # open in an Android emulator
npm run ios        # open in an iOS simulator (requires macOS)
```

## Project structure

```
App.tsx                     App entry: providers + router
src/
  types.ts                  Match/Team/Round model + scoring helpers
  state/GameContext.tsx     Match store (reducer) + local persistence
  theme/                    Theme palettes + ThemeContext (3 styles)
  i18n/                     English/Spanish strings + I18nContext
  nav/NavContext.tsx        Lightweight screen stack navigator
  storage/storage.ts        AsyncStorage JSON wrapper
  components/               Button, Card, Field, Header, RoundEditor, DominoTile
  screens/                  Home, NewMatch, Game, History, Settings
```

## Concepts

- **Match** = two teams + a target score + a list of rounds.
- **Round** = which team won + how many points they earned.
- A team **wins** the moment its total reaches the target score.

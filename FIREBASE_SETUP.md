# Firebase setup — live game following

The app works fully offline without this. Complete these steps to enable the
**Share Game** (host) and **Watch a Game** (spectator) live features.

It's free — the Firebase "Spark" (no-cost) plan is far more than enough.

## 1. Create a Firebase project

1. Go to **https://console.firebase.google.com** and sign in with a Google account.
2. Click **Add project** → name it e.g. `domino-score` → Continue.
3. Google Analytics is optional — you can turn it **off** → **Create project**.

## 2. Register a Web app and copy the config

1. On the project overview, click the **Web** icon **`</>`** ("Add app").
2. Nickname it `Domino Score` → **Register app** (skip Hosting).
3. You'll see a `firebaseConfig = { ... }` block. Copy those values into
   [`src/firebase/config.ts`](src/firebase/config.ts):

   ```ts
   export const firebaseConfig = {
     apiKey: 'AIza...',
     authDomain: 'domino-score.firebaseapp.com',
     projectId: 'domino-score',
     storageBucket: 'domino-score.appspot.com',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abc123',
   };
   ```

## 3. Enable Anonymous sign-in

1. Left menu → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Anonymous** → toggle **Enable** → **Save**.

(No logins for users — this just gives each phone an identity behind the scenes.)

## 4. Create the Firestore database

1. Left menu → **Build → Firestore Database** → **Create database**.
2. Choose a location near you → **Next**.
3. Start in **production mode** → **Create**.

## 5. Set the security rules

In Firestore → **Rules** tab, replace everything with the following, then **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{code} {
      // Any signed-in device (spectator) can read a game.
      allow read: if request.auth != null;

      // The creator becomes host AND first controller.
      allow create: if request.auth != null
                    && request.resource.data.hostId == request.auth.uid
                    && request.resource.data.controllerId == request.auth.uid;

      allow update: if request.auth != null && (
        // The current controller may change anything
        // (update the score, or hand control to someone else).
        resource.data.controllerId == request.auth.uid
        ||
        // Anyone signed in may submit a take-over request, but only by
        // touching pendingRequest (+ updatedAt), and only for themselves.
        (
          request.resource.data.diff(resource.data)
            .affectedKeys().hasOnly(['pendingRequest', 'updatedAt'])
          && request.resource.data.pendingRequest.uid == request.auth.uid
        )
      );

      allow delete: if false;
    }
  }
}
```

## 6. Reload the app

After pasting the config, restart Expo so it picks up the change:

```bash
npx expo start --tunnel -c
```

## How it works

- **Host:** open a match → tap the **📡** icon (top-right) → **Share Game** →
  you get a 4-letter **code** (and a system Share button to send it).
  Every score change syncs live. A red **● LIVE** badge shows it's broadcasting.
- **Spectator:** Home → **Watch a Game** → type the code → watch the scoreboard
  update in real time (read-only).
- **Passing control:** a spectator can tap **Request to score**. The current
  scorer gets an **Approve / Deny** prompt. On approve, control passes to the
  spectator (who jumps into the scoring screen) and the previous scorer's view
  becomes read-only. Only one person can edit at a time.

## Notes

- Game documents are tiny and live under the `games` collection, keyed by code.
- Codes use an unambiguous alphabet (no `O/0/I/1`) so they're easy to read aloud.
- This uses the Firebase **JS SDK**, which runs in **Expo Go** — no native build
  needed for the live feature to work during development.

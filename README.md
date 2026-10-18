# Kinetik

**Your daily workout, with music that moves with you.**

Kinetik is a phone-first workout app. It builds today's workout from your weekly program and the equipment you have, then plays a continuous DJ mix (or your own songs) whose tempo and energy follow every set, rest and interval.

## Features

- **Today's workout**: picks the day's focus from your weekly program (upper body, legs, back, HIIT, walk, Pilates, stretch and more) and generates the exercises, sets and rest. Shuffle for a new version, or customize it.
- **Equipment-aware**: Full gym, Kettlebell + bench (home), Dumbbells + bodyweight, or Bodyweight only.
- **Stations**: Warm-Up, Spin Class, HIIT Intervals, Treadmill Run, La Dolce Vita (evening stroll), Strength, Cool-Down, Pilates and Stretching.
- **Workout builder**: create and save your own workouts from warm-ups, sets, work blocks, sprints, rests, intervals and cool-downs.
- **Live music**:
  - *Generated mixes*: house, techno, drum & bass, hip-hop, deep house, chill and café-style grooves, synthesized in the browser with builds and drops into hard efforts.
  - *My songs*: add music files you own. Kinetik detects each song's BPM, speeds it up or slows it down to the workout's tempo, and crossfades between songs.
- **Training tools**: a Done button that starts your rest the moment you finish a set, 3-2-1 countdown beeps, voice cues, a weight-and-reps log with "last time" numbers and progression suggestions, a streak and a workout calendar.
- **Phone layout**: Today / Workouts / Play / Me tabs, a mini player, and a full-screen Gym mode.

All data (songs, workouts, logs) stays in the browser on your device. Nothing is uploaded.

## Project files

| File | What it is |
|---|---|
| `index.html` | The whole app: markup, styles and code in one file |
| `manifest.webmanifest` | Makes it installable on Android with its own name and icon |
| `sw.js` | Service worker that lets the app open offline |
| `icons/` | App icons |

## Run it locally

Any static file server works. For example, with Python installed:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Publish with GitHub Pages (free)

1. Push this project to a GitHub repository.
2. In the repo, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose the `main` branch and the `/ (root)` folder, then **Save**.
4. After a minute or two, the app is live at `https://<your-username>.github.io/<repo-name>/`.

## Install on Android

1. Open the GitHub Pages link in **Chrome** on your phone.
2. Tap **⋮ → Install app** (or **Add to Home screen**).
3. Kinetik appears on your home screen and opens full-screen like a regular app.

## Publishing updates

1. Edit the files and push to `main`. GitHub Pages republishes automatically.
2. In `sw.js`, bump `VERSION` (for example `kinetik-v1` → `kinetik-v2`) so installed phones fetch the new files.
3. On the phone, close and reopen Kinetik. Your saved songs, workouts and logs are kept.

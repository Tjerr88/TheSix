# The Six 3.5.2

Standalone GitHub Pages / PWA edition, updated from the original TheSix-main repository to the web application used by The Six Android 3.5.2. All application code and images are included. No build step, account, backend or external dependency is required.

## Publish / update

1. Export a backup from the existing installation before updating.
2. Copy **all files inside this directory** to the repository root, replacing the existing files. Keep the existing repository and Pages URL to retain browser-local progress.
3. Keep GitHub Pages configured for the branch and root folder containing `index.html`.
4. Once the deployment finishes, open the site online. The service worker installs the 3.5.2 offline cache; reload once after installation to display the new version. Do not clear site data unless you have exported a backup.
5. Open the site in the browser and choose Install / Add to Home screen if desired.

Do not upload only index.html: all JavaScript, CSS and badge images are required. The app works at either a domain root or a repository subdirectory. The relative manifest and service-worker URLs preserve the GitHub Pages path.

## Included in 3.5.2

- Independent Big Six set progression with a shared next-weight gate; optional break-in.
- Separate swing and snatch work/rest settings and automatic interval timers.
- Optional Day 7 accessory circuit with per-exercise targets.
- Twelve milestone badges, profile-dependent requirements, separate attempts and recorded results.
- SFG II Skill Practice, default off and unlocked after the personal SFG I badge: one technical set before the focus lift, independent rotation, workbell minus 8 kg, available-bell/pair selection and lower weights.
- A separate SFG II skill and press performance check, never awarded by completing practice sessions.
- Press milestone availability after a controlled normal press set at goal weight minus 4 kg or heavier. The successful milestone itself still requires the goal weight.
- English interface, lessons, local persistence, undo and JSON backup/import.

Older training data is read using the existing storage key. When importing an old pre-standard-program backup, the app asks for a new standard-program starting point while retaining supported history. Already-earned milestones and attempt snapshots remain stored.

## Web and Android differences

This is the web/PWA repository, not an Android build project. Android-specific notification reminders, native monotonic test-clock integration and native system-bar insets require the APK. They cannot be supplied by copying a static website to GitHub Pages. Web timers should be used with the app visible; browser suspension can interrupt audible cues. Data in a browser and in the Android app is separate; use Export / Import to transfer a backup.

Milestones are personal, self-reported achievements, not StrongFirst certification. Profile-specific requirements shown in the app govern the goals; some original badge images display example weights.

## Files

`index.html` is the entry point. `standard-*`, `day7`, `compact-ui`, `milestones-*`, `skill-practice` and `sfg2-ui` implement the current app. Legacy `tp-engine.js` remains for compatibility with older backups; Triple Progression is not an active training mode. `sw.js` caches the offline shell. All images, including the twelve badges, are local.

No signing keys, personal backups, Android build files or credentials are included.

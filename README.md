# The Six 3.7

Standalone GitHub Pages / PWA edition, updated from the original TheSix-main repository to the web application used by The Six Android 3.7. All application code and images are included. No build step, account, backend or external dependency is required.

## Publish / update

1. Export a backup from the existing installation before updating.
2. Copy **all files inside this directory** to the repository root, replacing the existing files. Keep the existing repository and Pages URL to retain browser-local progress.
3. Keep GitHub Pages configured for the branch and root folder containing `index.html`.
4. Once the deployment finishes, open the site online. The service worker installs the 3.7 offline cache; reload once after installation to display the new version. Do not clear site data unless you have exported a backup.
5. Open the site in the browser and choose Install / Add to Home screen if desired.

Do not upload only index.html: all JavaScript, CSS and badge images are required. The app works at either a domain root or a repository subdirectory. The relative manifest and service-worker URLs preserve the GitHub Pages path.

## Included in 3.7

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

## Focus reps and one-step escape in 3.7

The five base exercises keep their checkboxes. Each focus set has compact minus/plus controls and a Full set shortcut. Single-arm lifts record left and right separately; double clean and double squat record reps performed with both bells together. Values run from zero to the existing prescribed target. Full set fills the target on both sides where applicable. Only controlled reps should be logged.

Save session explicitly records the result, after the five base exercises have been checked. All prescribed focus reps must be complete to pass the step. Any missing focus reps repeat the step. Editing reps does not save a session. Partial reps persist through restart, Undo and JSON backup/import. Previously checked sets in an unfinished session become full sets; unchecked sets start at zero. Old history is retained, but actual partial reps are not invented for it.

Stagnation compares the same focus lift, programme revision, step, weights, sets and sides. The first recorded performance starts at attempt 1. A new best starts at 1 again. Equal or lower results add one; recovering to the old best does not reset the count. Thus 1, 2, 3, 2 reps produces counts 1, 1, 1, 2. A new best must equal or exceed the previous best in every set and side, and improve at least one. More reps on one side do not compensate for fewer on the other.

At attempt 5, including the most recent improvement, the app offers an English Yes/No choice only if exactly one lift is behind and the other five are ready. Only results with actual rep data contribute. Skipped sessions, easy practice, Day 7 and milestones do not add attempts. A new step, changed programme or weights starts a new comparison.

Yes lets the other five build one configured weight increment higher. The lagging lift keeps its prescription until ready to join that build. No one can advance beyond the higher goal until all six are ready. A second escape cannot run during the split. No dismisses that stagnation-period popup; the choice remains in Settings → Training. A new best starts a new period. The choice, split and catch-up state survive restart and backup/import; Undo can reverse acceptance. Base sets follow each lift's own base. SFG II practice retains the shared base-minus-8 rule until reunion.

The prominent programme-start button and lesson → mobility warm-up → training order are retained. Day 7, skill practice, milestone criteria and work/rest timers are unchanged. Timer completion never awards reps.

For a small update from 3.6.1, replace all files in the update ZIP at the existing repository root. The PNG images are byte-identical and do not need re-uploading. Keep the existing APK installation / Pages URL to preserve local data.

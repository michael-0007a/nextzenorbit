# Autofill Extension: Run and Test

This extension only assists with form filling. It never submits forms.

## Prerequisites
- Node.js 18+ and npm
- Chrome or Chromium-based browser
- The Nextzen Orbit app running (default: http://localhost:3000)
- A signed-in session in the app so cookies are available to the extension

## Build the extension
1. Open a terminal in `extensions/nextzen-orbit-autofill`.
2. Install dependencies:
   - `npm install`
3. Build once:
   - `npm run build`

For watch mode during development:
- `npm run dev`

This creates the `build/` output used by the manifest.

## Load the extension in Chrome
1. Go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select:
   - `extensions/nextzen-orbit-autofill`
4. Pin the extension from the toolbar.

## Configure
1. Open the extension popup.
2. Set **App URL** to your app origin (default: `http://localhost:3000`).
3. Keep **Autofill enabled** checked.

## Test flow
1. Sign in to the Nextzen Orbit app in the same browser.
2. Open a supported job portal application page:
   - Workday, Greenhouse, Lever, or LinkedIn
3. The in-page assist panel should appear.
4. Click **Fill** and review the fields.

Notes:
- Resume uploads are never automated. File inputs are tagged for manual upload.
- The popup **Refresh status** button re-scans fields on the page.

## Troubleshooting
- **No panel / Unsupported portal**: confirm the host is in the manifest and reload the page.
- **0 fields detected**: wait for dynamic forms to load, then click **Refresh**.
- **Unable to load profile**: ensure the app is running and you are signed in. You can verify `/api/autofill/profile` in the browser.
- **Debug background worker**: in `chrome://extensions`, click the service worker link under the extension to open its console.

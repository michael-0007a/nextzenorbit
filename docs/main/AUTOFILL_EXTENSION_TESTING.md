# Autofill extension: run and test

Last reviewed from code: 2026-10-16. Package: `extensions/nextzen-orbit-autofill` (Chrome Manifest V3, version 0.1.0).

The extension only **assists** with filling forms. It never uploads files and never submits.

## Prerequisites

- Node.js 20+ and npm.
- Chrome or another Chromium-based browser.
- A running Nextzen Orbit app: local `http://localhost:3000`, or the deployed app.
- A signed-in, approved and paid account in that app, in the same browser. The extension uses its session cookie (`credentials: "include"`). The proxy gate also applies to `/api/autofill/*`, so an unapproved or unpaid account gets 403 or 402.

## Build

```bash
cd extensions/nextzen-orbit-autofill
npm install
npm run build     # esbuild via scripts/build.mjs → build/
npm run dev       # same, in watch mode
```

## Load in Chrome

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select `extensions/nextzen-orbit-autofill` (the folder with `manifest.json`).
3. Pin the extension.

## Configure

1. Open the popup.
2. Set the **App URL**. The default on main is `http://localhost:3000`; on beta it's `https://app.nextzenorbit.com`. Change it to the app you're testing against.
3. Keep **Autofill enabled** checked.

## Supported portals

| Portal | Hosts |
| --- | --- |
| Workday | `*.myworkdayjobs.com` |
| Greenhouse | `*.greenhouse.io` |
| Lever | `*.lever.co` |
| LinkedIn | `*.linkedin.com` |
| Microsoft Careers | `careers.microsoft.com`, `apply.careers.microsoft.com` |

Detectors live in `src/content/detectors/` (one per portal, plus `base.ts`).

## Test flow

1. Sign in to the app in the same browser.
2. Open an application form on a supported portal.
3. The in-page assist panel appears and shows the detected fields.
4. Click **Fill**. Review every field and correct anything wrong.
5. Upload the resume yourself (file inputs are flagged, never filled), then submit yourself.
6. Optional: confirm a telemetry call to `/api/autofill/telemetry` in the service-worker console. On main the server drops the row; beta stores it.

## What gets filled

Full name, email, phone, LinkedIn, GitHub, portfolio, education (institution, degree, field, dates, GPA, location) and experience (company, position, location, dates, current flag, bullets). These come from `GET /api/autofill/profile`, using the schema in `src/shared/profile.ts`.

## Troubleshooting

- **No panel / "Unsupported portal":** the host isn't in the manifest's `matches`. Reload the page after installing or updating.
- **0 fields detected:** the form renders late. Wait, then use **Refresh status** in the popup.
- **"Unable to load profile":**
  - check the App URL;
  - open `<App URL>/api/autofill/profile` in a tab: 401 means you're not signed in, and 403/402 means the account isn't approved or paid;
  - on beta with the domain split on, the session lives on the app host, so sign in at `app.` and not the marketing domain.
- **Debugging:** in `chrome://extensions`, click the extension's **service worker** link for background logs. Use the page DevTools console for content-script logs.

## Packaging

The extension isn't published to the Chrome Web Store yet. To share it, zip the folder after `npm run build` (without `node_modules`) for loading unpacked, or publish it through the Web Store developer dashboard.

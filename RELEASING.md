# Releasing Smart Sender

End-to-end checklist for cutting a production release of the desktop app and
backend. Skim this every time; the auto-updater + license signing will
silently break if a single env var is missing.

## One-time setup

### 1. Generate the license keypair

```bash
node scratch/gen_keys.js
```

Save both PEMs in your password manager. The keypair is the trust root for
every license token in the system; rotating it requires bumping every
existing desktop install simultaneously.

### 2. Provision Supabase

Run the migration:

```bash
psql "$SUPABASE_DB_URL" -f backend/supabase/migrations/0001_license_devices.sql
```

(Or paste it into Supabase SQL Editor.) Verify in the dashboard that
`licenses` and `license_devices` both show **RLS enabled, no policies** —
that's correct, since only the service-role client touches them.

### 3. Bootstrap the first admin

On a fresh DB only:

```bash
cd backend
node scripts/setup-admin.js admin@yourdomain.com "$(openssl rand -base64 32)"
```

The script refuses to run on a non-empty DB without `--force`. After this,
**rotate `SUPABASE_SERVICE_ROLE_KEY`** in the Supabase dashboard.

## Backend deploy (Vercel)

Required env vars:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project settings (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings (rotate after every admin bootstrap) |
| `SS_LICENSE_PRIVATE_KEY` | from `scratch/gen_keys.js`. Use literal `\n` for newlines. |
| `SS_LICENSE_PUBLIC_KEY` | from `scratch/gen_keys.js`. Same key as below. |

```bash
cd backend
vercel --prod
```

## Desktop release

### Required build env

| Variable | Notes |
|---|---|
| `SS_LICENSE_PUBLIC_KEY` | **Must match the backend's private key.** PEM, literal `\n` newlines OK. |
| `SS_API_URL` | Default `https://smartsender.vercel.app`. Override only for staging. |
| `SS_RELEASE` | `1` — the `npm run release` script sets this for you. |
| `NODE_ENV` | `production` — also set by the release script. |

`vite.config.ts` will refuse to build a release bundle without
`SS_LICENSE_PUBLIC_KEY`, and the packaged binary refuses to launch if it
detects the dev placeholder key. Both guards are intentional.

### Code signing (Windows)

| Variable | Notes |
|---|---|
| `CSC_LINK` | path or URL to your `.pfx` certificate |
| `CSC_KEY_PASSWORD` | password for the `.pfx` |

If neither is set, electron-builder produces an unsigned `.exe` and Windows
SmartScreen will warn every user.

### Code signing + notarization (macOS)

| Variable | Notes |
|---|---|
| `CSC_LINK` | path or URL to your Developer ID Application `.p12` |
| `CSC_KEY_PASSWORD` | password for the `.p12` |
| `APPLE_ID` | Apple ID with notarization access |
| `APPLE_APP_SPECIFIC_PASSWORD` | app-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | 10-char Team ID from your Apple Developer account |

The `mac.notarize: true` field in `package.json` will fail loudly if any of
these are missing.

### Build + publish

```bash
cd desktop-app
SS_LICENSE_PUBLIC_KEY="$(< ../keys/license.pub.pem)" \
  CSC_LINK=... CSC_KEY_PASSWORD=... \
  npm run release
```

Artifacts land in `desktop-app/release/`. Upload the contents to whatever
host backs the `publish.url` in `package.json` (currently
`https://updates.smartsender.app/`). The auto-updater expects, at minimum,
`latest.yml` and the matching installer next to it.

## Sanity checks before announcing the release

1. Install the new build on a clean machine.
2. Activate with a known-good license key. Confirm:
   - Settings shows the HWID and Pro plan.
   - Admin dashboard shows the new device under that license.
3. Revoke the device from admin → wait up to 60 minutes (or click "Sync
   License" in the desktop) → confirm the desktop flips back to Trial.
4. Send a single test message. Confirm Dashboard counter increments and the
   campaign row shows status Completed (or Failed with a real error, if it
   failed).
5. Confirm `/api/license/verify` returns 429 after a brute-force loop —
   `for i in $(seq 1 20); do curl -X POST .../api/license/verify -d '...'; done`
   should start returning `{ "message": "rate_limited" }` partway through.

If any of those misbehave, do **not** push the release to `updates.smartsender.app`.

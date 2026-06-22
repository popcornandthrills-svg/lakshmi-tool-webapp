# Lakshmi Tool Permanent Deployment Plan

## Goal

Run Lakshmi Tool from a public URL so it no longer depends on `localhost`.

## Recommended host

Use a Next.js-capable host such as Vercel for the web app layer.

## Steps

1. Push this project to a Git repository.
2. Import the repository into the host.
3. Set the build command to `npm run build`.
4. Let the platform detect Next.js automatically, or use the included `vercel.json`.
5. Configure a real domain or use the platform-provided production URL.
6. Move persistence to hosted storage if you want data to survive machine restarts and deploys.

## Important storage note

This project currently keeps product data and uploaded files on the local filesystem.
For a truly permanent deployment, those files should live on hosted storage instead of a PC disk.

## Desktop app plan

After the hosted URL is live:

1. Build the Windows wrapper with Electron.
2. Point the wrapper to the permanent URL using `LAKSHMI_APP_URL`.
3. Package the wrapper into an `.exe`.

## Result

The installed `.exe` will open the hosted app, not `localhost`.

## Current repository files added for deployment

- `vercel.json`
- `electron-main.cjs`
- `DEPLOYMENT.md`

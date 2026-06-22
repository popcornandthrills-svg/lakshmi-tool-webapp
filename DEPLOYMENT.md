# Lakshmi Tool Deployment Notes

This project is a Next.js app with local file-backed storage and image assets.

## Current production-ready state

- Standalone Next.js output is enabled in `next.config.mjs`.
- Product data is stored in `data/products.json`.
- Uploaded and generated images are served from `public/uploads/` and `public/assets/`.

## How to deploy

Use one of these paths:

1. **VPS or Windows server**
   - Run `npm install`
   - Run `npm run build`
   - Run `npm run start`
   - Keep the Node process alive with a service manager such as PM2 or NSSM

2. **Desktop wrapper**
   - Package the standalone build into an `.exe` using Electron or Tauri
   - Point the wrapper to the deployed server or the local standalone server

3. **Tunnel-based sharing**
   - Start the app locally
   - Attach ngrok or Cloudflare Tunnel for a temporary public URL

## Important note

This app is not yet a fully cloud-native deployment because it still relies on local filesystem storage.
If you want a permanent public link, the storage layer should be moved to hosted storage or a persistent server.

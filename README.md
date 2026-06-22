# Lakshmi Tool Web

Browser-first version of the product worksheet.

## Run locally

```bash
npm install
npm run dev
```

## Share a feedback link with Cloudflare Tunnel

If `cloudflared` is installed on your machine, run:

```bash
start-cloudflare.bat
```

That starts the app locally and opens a public `trycloudflare.com` URL for testing.

## Cloudflare deployment notes

This app is not yet a direct Cloudflare Pages/Workers deploy because it uses:

- `node:fs` file access in API routes
- local SQLite storage under `.data/`
- filesystem-backed uploads under `public/uploads/`

To deploy on Cloudflare without changing the app architecture, use Cloudflare Tunnel for now.
To make it a true Cloudflare Pages/Workers deployment, we would need to move storage and uploads to Cloudflare-compatible services like D1 and R2.

## What this scaffold gives you

- Stable row-based worksheet editing
- Live calculations in the browser
- A clean path to API + database integration
- A better base for later cloud deployment

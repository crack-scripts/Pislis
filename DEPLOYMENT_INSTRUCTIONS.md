# Deployment Instructions

The site is a **static Next.js export** — there is no backend to deploy.

## Build

```bash
cd frontend
npm install
npm run build
```

The production site is generated in `frontend/out/`.

## Deploy to Vercel

1. Import the repository in Vercel.
2. Set **Root Directory** to `frontend` (framework auto-detected: Next.js).
3. No environment variables are required (defaults are built in).
   To use a different Cloudinary cloud, set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
4. Deploy. The build output is the static `out/` directory.

## Deploy Anywhere Else

Upload the contents of `frontend/out/` to any static host
(Netlify, GitHub Pages, Render static site, Cloudflare Pages, S3 + CloudFront, …).

## Notes

- **Videos**: lesson videos are hosted on Cloudinary, Cloudflare R2, and Vimeo —
  they load from their public URLs and are not affected by where the site is hosted.
- **Progress**: stored in each visitor's browser localStorage. Clearing site data
  in the browser resets progress on that device.
- **Troubleshooting video load failures**: check that
  `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` matches your Cloudinary cloud, and that the
  lesson MP4 exists under `darwin-education/lessons/` (see `CLOUDINARY_SETUP.md`).

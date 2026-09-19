# Pislis — Personal Course Website

A private, personal course website for the **Faceless Facebook Mastery** course.

No accounts, no login, no backend. Open the site and start learning — progress is
saved in your browser (localStorage).

## Tech Stack

- **Frontend**: Next.js 14 (App Router, TypeScript), Tailwind CSS, Lucide Icons, @vimeo/player
- **Output**: Static export (`output: 'export'`) — deployable to any static host (Vercel, Netlify, GitHub Pages, Render static, …)
- **Videos**: Vimeo (embedded), Cloudinary and Cloudflare R2 (direct MP4 URLs)
- **Files / BGM**: served locally from `frontend/public/`
- **Progress**: browser localStorage (no database)

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — the course home loads directly, no login.

### Production Build

```bash
cd frontend
npm run build   # outputs a fully static site to frontend/out
```

Deploy the contents of `frontend/out/` to any static host.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Course home — course card, overall progress, resume last lesson |
| `/courses/fb-automation-mastery/learn` | Course interface — lessons, files, BGM & SFX, webinar archive |
| `/courses/fb-automation-mastery/learn?lesson=<id>` | Open/resume a specific lesson |
| `/courses` | Redirects to `/` |
| `/courses/[slug]` | Redirects to the course learn page |
| `/privacy`, `/terms` | Legal pages |

## How Course Progress Works

Everything is stored locally in the browser (per device, no account):

| Data | localStorage key |
|------|------------------|
| Watch position per lesson (resume where you left off) | `ffm_watch_history` |
| Completed lessons (video watched to the end) | `ffm_completed_lessons` |
| Last opened lesson (shown on the course home) | `ffm_last_lesson` |

Legacy per-user keys from the old auth system (`ffm_watch_history_<userId>`) are
automatically merged into the single key on first load.

## Environment Variables

All are **optional** — working defaults are built into the code.
Copy `frontend/.env.example` to `frontend/.env.local` to override.

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dwcxvaswf` | Cloudinary cloud for lesson video URLs |
| `NEXT_PUBLIC_R2_LESSONS_BASE_URL` | `https://pub-79bbe5625f3e4375a961f7bf776b47c8.r2.dev` | R2 public bucket for lesson videos |

## Course Content

The curriculum (lesson list, video sources, categories, resources, external
links) lives in `frontend/src/data/lessons.ts`. Lesson video routing
(Cloudinary vs R2) is defined in `frontend/src/data/video-sources.json`.

Supporting media:

- `frontend/public/thumbnails/` — lesson thumbnails
- `frontend/public/files/` — downloadable course files
- `frontend/public/bgm-and-sfx/` — BGM/SFX audio
- `frontend/public/data/files.json` — file list for the Files tab

Media management scripts (Cloudinary asset listing/b-roll generation) are in the
repository root: `fetch-lessons.js`, `list-all-assets.js`, `generate-brolls.js`,
`generate-homepage-videos.js`, `delete-brolls.js`.

See `CLOUDINARY_SETUP.md` and `R2_CORS_SETUP.md` for media hosting setup.

## License

MIT License

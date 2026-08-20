# Kontri Portfolio

A cinematic photography portfolio foundation built with:

- React
- Vite
- Tailwind CSS
- Framer Motion
- Supabase (optional CMS backend)
- GitHub
- Cloudflare Pages

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build for production

```bash
npm run build
npm run preview
```

## Supabase CMS

The public site works without Supabase using demo photography data.

To enable the CMS:

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Add your Supabase URL and anon key.
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Create a Storage bucket called `photos`.
6. The admin page is available at `/admin`.

The current CMS foundation supports:
- Uploading individual images
- Client-side web optimization before upload
- Title, location and description
- Published/hidden state
- Deleting photos
- Serving optimized display images

For production, protect `/admin` with Supabase Auth before publishing the CMS publicly.

## Cloudflare Pages

Connect the GitHub repository to Cloudflare Pages.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Add these environment variables in Cloudflare Pages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Next milestones

1. Refine the visual identity and typography.
2. Replace demo imagery with the real photography library.
3. Add Supabase Auth for the private admin area.
4. Add collections/stories without making the gallery feel like a generic photo grid.
5. Add SEO/Open Graph metadata and a custom domain.

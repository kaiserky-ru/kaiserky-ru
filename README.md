# Supabase Imageboard Starter

A small, serverless 4chan-style imageboard starter intended for GitHub Pages + Supabase.

## Features

- Boards such as `/b/`, `/g/`, `/art/`
- Anonymous threads and replies
- Image uploads to Supabase Storage
- Public thread/reply browsing
- Thread bumping via a database trigger
- Client-side poster IDs stored in `localStorage`
- Basic filename/type/size validation
- Responsive dark imageboard UI
- Supabase Row Level Security
- No service-role key in the frontend

## 1. Create the Supabase project

Create a project at Supabase and open **SQL Editor**.

Run `supabase/schema.sql` in its entirety.

The SQL creates:

- `boards`
- `threads`
- `posts`
- indexes
- RLS policies
- an `images` storage bucket
- storage policies
- a trigger that bumps a thread whenever a reply is inserted

The starter intentionally has no user accounts. Anyone who can reach the site can post, so add CAPTCHA/authentication/moderation before using this publicly at scale.

## 2. Configure the frontend

Copy:

    js/config.example.js

to:

    js/config.js

Then put your Supabase project URL and **anon/publishable** key in it.

Do NOT put the Supabase `service_role`/secret key here.

Example:

    window.IMAGEBOARD_CONFIG = {
      SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
      SUPABASE_ANON_KEY: "YOUR_PUBLIC_ANON_KEY"
    };

## 3. Run locally

Because browser modules and some APIs work more reliably over HTTP, use a small static server:

    python -m http.server 8080

Then open:

    http://localhost:8080/

## 4. Deploy to GitHub Pages

Push the contents of this directory to a GitHub repository.

In GitHub:

Settings -> Pages -> Deploy from a branch -> choose your branch and `/root`.

If you use a custom build workflow, the repository root should be the published directory.

## 5. Important production hardening

This starter deliberately keeps the architecture simple. Before operating a public board, consider:

- CAPTCHA or Turnstile
- authenticated moderator accounts
- rate limiting
- spam filtering
- image transcoding/resizing
- EXIF stripping
- content moderation
- report queue
- post/thread deletion
- bans
- IP handling on a trusted server/edge function rather than the browser
- backup/retention policy
- stricter board-specific file rules

Do not attempt to collect or expose IP addresses from client-side JavaScript. If you need anti-abuse controls, use a trusted server/edge function and an appropriate privacy policy.

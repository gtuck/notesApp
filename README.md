# Supabase Secure Message Board

This is a simple secure message board using GitHub Pages for static hosting and Supabase for backend services (database + authentication).

## Features
- Sign up / log in with email and password
- Post messages
- See all messages with the author's email
- Delete your own messages

## Setup
1. Create a Supabase project
2. Enable email/password auth
3. Create a `messages` table with `content`, `user_id`, `created_at`, and `id`
4. Add RLS policies to restrict insert/delete to owner and allow reading for all
5. Replace `SUPABASE_URL` and `SUPABASE_KEY` in `app.js`
6. Deploy via GitHub Pages

# Supabase Secure NotesApp

This is a simple secure notes app using GitHub Pages for static hosting and Supabase for backend services (database + authentication).

## Features
- Email/password authentication
- Post messages
- View, tag, and filter notes with author emails
- Edit, delete, tag, and color-code your own notes

## 🔧 Setup Guide

### 1. Create Your Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **New Project** and configure:
   - Name
   - Database password
   - Region
3. Wait for project to initialize

---

### 2. Enable Email/Password Auth

1. Go to **Authentication → Providers → Email**
2. Enable both **Email** and **Password Sign In**
3. Under **Authentication → Settings**, ensure "Confirm email" is enabled (default)

---

### 3. Create the `messages` Table

In the SQL Editor, run:

```sql
create table messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid not null
);
```

---

### 4. Create a Public View of Users

Supabase doesn’t allow direct foreign keys to `auth.users`, so we’ll make a view:

```sql
create or replace view public.users as
select id::uuid as id, email
from auth.users;
```

This view exposes only `id` and `email` for safe public reference.

---

### 5. Enable Row-Level Security (RLS)

In the SQL Editor, run:

```sql
-- Enable RLS
alter table messages enable row level security;

-- Allow inserting only own messages
create policy "Users can insert their own messages"
on messages for insert
with check (auth.uid() = user_id);

-- Allow users to delete only their own messages
create policy "Users can delete their own messages"
on messages for delete
using (auth.uid() = user_id);

-- Allow everyone to read messages
create policy "Everyone can read messages"
on messages for select
using (true);
```

---

### 6. Define the Relationship

1. Go to **Table Editor → messages**
2. Click **Relationships → New Relationship**
3. Fill out:
   - From table: `messages`
   - From column: `user_id`
   - To table: `users` (the view)
   - To column: `id`
4. Click **Save**

---

### 7. Add Your Supabase Keys

In `app.js`, replace these values with your actual Supabase credentials (from Project Settings → API):

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

---

### 8. Deploy to GitHub Pages

1. Create a GitHub repository
2. Push all files (`index.html`, `style.css`, `app.js`, `README.md`)
3. Go to **GitHub → Settings → Pages**
4. Choose:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**

Your live site will appear at:  
`https://yourusername.github.io/your-repo-name/`

---

### ✅ Done!

You're now running a fully deployed, authenticated, and user-specific message board powered by Supabase and GitHub Pages!
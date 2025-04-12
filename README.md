# Supabase Secure NotesApp

This is a secure notes app built using **Supabase** for authentication and database management, and **GitHub Pages** for free static hosting. It allows users to:

## ✨ Features

- 🔐 Email/password authentication via Supabase
- 📝 Add, edit, and delete your own notes
- 🏷️ Tag notes for organization (e.g., work, idea)
- 🎨 Color-code notes for visual categorization
- 🕒 Timestamp display for each note
- 🔍 Search notes by content or tag
- ✅ Clean UI that updates based on user login state

---

## 🚀 Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Fill in:
   - Project name
   - Strong database password
   - Region
4. Click **Create Project** and wait for it to initialize

---

### 2. Enable Authentication

1. Go to **Authentication → Providers → Email**
2. Enable both **Email** and **Password Sign In**
3. Optional: Go to **Authentication → Settings**, ensure **"Confirm email"** is enabled

---

### 3. Create the `messages` Table

Go to the **SQL Editor** and run:

```sql
create table messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  tag text,
  color text default '#ffffff',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid not null
);
```

---

### 4. Create a Public View of Users

Supabase restricts direct references to `auth.users`, so we’ll create a joinable view:

```sql
create or replace view public.users as
select id::uuid as id, email
from auth.users;
```

---

### 5. Enable Row-Level Security (RLS)

Still in the SQL Editor, run:

```sql
alter table messages enable row level security;

-- Allow users to insert their own messages
create policy "Users can insert their own messages"
on messages for insert
with check (auth.uid() = user_id);

-- Allow users to delete their own messages
create policy "Users can delete their own messages"
on messages for delete
using (auth.uid() = user_id);

-- Allow users to update their own messages
create policy "Users can update their own messages"
on messages for update
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
   - To table: `users` (the view you created)
   - To column: `id`
4. Click **Save**

---

### 7. Configure the Frontend (`app.js`)

In `app.js`, replace the following placeholders with your actual Supabase project info:

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

Find these values in Supabase under **Project Settings → API**.

---

### 8. Deploy on GitHub Pages

1. Create a GitHub repository (e.g., `secure-notesapp`)
2. Add all project files: `index.html`, `style.css`, `app.js`, and `README.md`
3. Push your code:

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/secure-notesapp.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

4. Go to **Repository → Settings → Pages**
5. Under **Source**, choose:
   - Branch: `main`
   - Folder: `/ (root)`
6. Click **Save**

Your app will be live shortly at:  
`https://yourusername.github.io/secure-notesapp/`

---

## 🧪 Live Demo Features Summary

- Login form hidden after login ✅
- Sign Out + email displayed after login ✅
- Notes show tags and timestamps ✅
- Notes are color-coded ✅
- Search filters by content and tag ✅
- Editable and deletable notes ✅

---

## 🧰 Future Ideas

- 📂 Drag-and-drop note rearrangement
- ☁️ Supabase Storage for file uploads
- 🌙 Dark mode toggle
- 🤝 Shared notes between users
- 📱 PWA support for offline notes

---

Enjoy your fully featured **Secure NotesApp**! 🥳

---
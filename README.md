# Supabase Secure NotesApp

**Version 1.1.0** – Updated April 17, 2025

A secure notes app built with **Supabase** for authentication and database management, and **GitHub Pages** for static hosting. Users can sign up, log in, create, edit, delete, and search notes, with optional tags and background colors for organization, and receive toast notifications for key actions.

## ✨ Features

- 🔐 Email/password authentication via Supabase  
- 📝 Create, edit, and delete notes  
- 🏷️ Add optional tags to notes (e.g., work, idea)  
- 🎨 Choose a background color for each note  
- 🕒 View timestamps for note creation  
- 🔍 Search and filter notes by content or tag  
- 🔔 Toast notifications for success and error feedback (configured in `style.css`) citeturn1file6  
- ✅ Conditional display of **Sign Up**, **Log In**, and **Sign Out** buttons based on authentication state (handled in `index.html`) citeturn0file0  
- ⚡ Responsive UI using Bulma CSS, BulmaJS, and FontAwesome citeturn0file0

---

## 🚀 Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)  
2. Click **New Project**  
3. Fill in:
   - Project name  
   - Strong database password  
   - Region  
4. Click **Create Project** and wait for initialization

---

### 2. Enable Authentication

1. Navigate to **Authentication → Providers → Email**  
2. Enable **Email** and **Password Sign In**  
3. (Optional) Under **Authentication → Settings**, ensure **Confirm email** is enabled

---

### 3. Create the `messages` Table

In the **SQL Editor**, run:

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

Supabase restricts direct references to `auth.users`. Create a joinable view:

```sql
create or replace view public.users as
select id::uuid as id, email
from auth.users;
```

---

### 5. Enable Row‑Level Security (RLS)

Still in the SQL Editor, run:

```sql
alter table messages enable row level security;

-- Insert policy
create policy "Users can insert their own messages"
  on messages for insert with check (auth.uid() = user_id);

-- Delete policy
create policy "Users can delete their own messages"
  on messages for delete using (auth.uid() = user_id);

-- Update policy
create policy "Users can update their own messages"
  on messages for update using (auth.uid() = user_id);

-- Select policy
create policy "Everyone can read messages"
  on messages for select using (true);
```

---

### 6. Define the Relationship

1. Go to **Table Editor → messages**  
2. Click **Relationships → New Relationship**  
3. Set:
   - From table: `messages`  
   - From column: `user_id`  
   - To table: `users` (the view you created)  
   - To column: `id`  
4. Click **Save**

---

### 7. Configure the Frontend (`app.js`)

In `app.js`, replace placeholders with your Supabase project info:

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

Find these under **Project Settings → API**.

---

### 8. Include Styles and Scripts

Ensure your `index.html` includes:

```html
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.0/css/bulma.min.css" />
<script defer src="https://use.fontawesome.com/releases/v5.15.4/js/all.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@vizuaalog/bulmajs@0/dist/bulma.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
```

This adds Bulma CSS for layout, BulmaJS for toast notifications, and FontAwesome icons citeturn0file0.

---

### 9. Deploy on GitHub Pages

1. Create a GitHub repository, e.g., `secure-notesapp`  
2. Add `index.html`, `style.css`, `app.js`, and `README.md`  
3. Push your code:

   ```bash
   git init
   git remote add origin https://github.com/YOUR_USERNAME/secure-notesapp.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

4. In **Settings → Pages**, set:
   - Branch: `main`  
   - Folder: `/ (root)`  
5. Click **Save**

Your app will go live shortly at:  
`https://yourusername.github.io/secure-notesapp/`

---

## 🧪 Live Demo Features

- ✅ **Authentication**: Sign Up, Log In, and Log Out flows  
- ✅ **Note Management**: Create, edit, delete notes with content, tags, and color  
- ✅ **Search**: Filter notes by text or tag  
- ✅ **Display**: Tags, formatted timestamps, and color‑coded backgrounds  
- ✅ **Feedback**: Toast notifications for create/update/delete and error messages  

---

## 🧰 Future Ideas

- 📂 Drag‑and‑drop note rearrangement  
- ☁️ Supabase Storage for file uploads  
- 🌙 Dark mode toggle  
- 🤝 Shared notes between users  
- 📱 PWA support for offline access  

Enjoy your fully featured **Secure NotesApp**! 🥳
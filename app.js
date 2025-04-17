const SUPABASE_URL = 'https://dbolbumwkmmhubctnmur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib2xidW13a21taHViY3RubXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIyNDUsImV4cCI6MjA2MDAzODI0NX0.9Q_BsQ2vmW2ZSAy6WUz7123ONvR8LkqUj1_JK0rMtrw';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// UI refs
const emailInput     = document.getElementById('auth-email');
const passwordInput  = document.getElementById('auth-password');
const signUpBtn      = document.getElementById('sign-up');
const logInBtn       = document.getElementById('log-in');
const signOutBtn     = document.getElementById('sign-out');
const authForm       = document.getElementById('auth-form');
const notesSection   = document.getElementById('notes-section');
const userEmailSpan  = document.getElementById('user-email');
const messageForm    = document.getElementById('message-form');
const messageInput   = document.getElementById('message-input');
const tagInput       = document.getElementById('note-tag');
const colorInput     = document.getElementById('note-color');
const searchInput    = document.getElementById('search-input');
const messageList    = document.getElementById('message-list');
const loadingDiv     = document.getElementById('loading');

const editModal      = document.getElementById('edit-modal');
const editInput      = document.getElementById('edit-input');
const editHelp       = document.getElementById('edit-help');
const editTagInput   = document.getElementById('edit-tag');
const editColorInput = document.getElementById('edit-color');
const editClose      = document.getElementById('edit-close');
const editSave       = document.getElementById('edit-save');
const editCancel     = document.getElementById('edit-cancel');

const toastContainer = document.getElementById('toast-container');

let currentUser   = null;
let editMessageId = null;

// ----- Helpers -----
function showToast(msg, type = 'is-primary is-light') {
  toastContainer.textContent = msg;
  toastContainer.className = `notification ${type}`;
  toastContainer.style.display = 'block';
  setTimeout(() => (toastContainer.style.display = 'none'), 3000);
}

function closeModal() {
  editModal.classList.remove('is-active');
}

// ----- Auth -----
signUpBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const pass  = passwordInput.value.trim();
  if (!email || !pass) return showToast('Enter email & password', 'is-danger is-light');

  try {
    const { error } = await client.auth.signUp({ email, password: pass });
    if (error) throw error;
    showToast('Account created! Check your inbox.', 'is-success is-light');
  } catch (err) {
    showToast(err.message, 'is-danger');
  }
});

logInBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const pass  = passwordInput.value.trim();
  if (!email || !pass) return showToast('Enter email & password', 'is-danger is-light');

  try {
    const { error } = await client.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  } catch (err) {
    showToast(err.message, 'is-danger is-light');
  }
});

signOutBtn.addEventListener('click', async () => {
  try {
    const { error } = await client.auth.signOut();
    // Supabase v2 will error if there's no active session — ignore that
    if (error && error.code !== 'session_not_found') {
      throw error;
    }
  } catch (err) {
    console.error('Sign‑out error (ignored if no session):', err);
    showToast(`Sign‑out failed: ${err.message}`, 'is-danger is-light');
  } finally {
    // Always reload, even if the session was already gone
    location.reload();
  }
});

client.auth.getSession().then(({ data: { session } }) => {
  currentUser = session?.user || null;
  setupUI();
});
client.auth.onAuthStateChange((_e, session) => {
  currentUser = session?.user || null;
  setupUI();
});

// ----- UI Setup -----
function setupUI() {
  if (currentUser) {
    authForm.style.display    = 'none';
    notesSection.style.display = 'block';
    userEmailSpan.textContent  = `Signed in as ${currentUser.email}`;
  } else {
    authForm.style.display    = 'block';
    notesSection.style.display = 'none';
  }
  loadMessages();
}

searchInput.addEventListener('input', () => {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(loadMessages, 300);
});

// ----- Load & Render -----
async function loadMessages() {
  loadingDiv.style.display = 'block';
  messageList.innerHTML    = '';

  try {
    const { data, error } = await client
      .from('messages')
      .select('id, content, tag, color, created_at, user_id, users(email)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const term = searchInput.value.toLowerCase();
    data.forEach(msg => {
      if (term && !(
        msg.content.toLowerCase().includes(term) ||
        (msg.tag || '').toLowerCase().includes(term)
      )) return;

      const card = document.createElement('div');
      card.className = 'box';
      card.style.backgroundColor = msg.color || '#ffffff';

      // content
      const p = document.createElement('p');
      p.textContent = msg.content;
      card.appendChild(p);

      // tag
      if (msg.tag) {
        const t = document.createElement('p');
        t.className = 'has-text-grey';
        t.textContent = `#${msg.tag}`;
        card.appendChild(t);
      }

      // meta
      const meta = document.createElement('p');
      meta.className = 'is-size-7 has-text-grey';
      meta.innerHTML = `<strong>${msg.users?.email || 'anon'}</strong> •
        ${new Date(msg.created_at).toLocaleString()}`;
      card.appendChild(meta);

      // actions
      if (currentUser && currentUser.id === msg.user_id) {
        const btns = document.createElement('div');
        btns.className = 'buttons is-right';

        const editBtn = document.createElement('button');
        editBtn.className = 'button is-small is-info';
        editBtn.textContent = '✏️';
        editBtn.onclick = () => {
          editInput.value      = msg.content;
          editHelp.textContent = `${msg.content.length}/500`;
          editTagInput.value   = msg.tag || '';
          editColorInput.value = msg.color || '#ffffff';
          editMessageId        = msg.id;
          editModal.classList.add('is-active');
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'button is-small is-danger';
        delBtn.textContent = '🗑️';
        delBtn.onclick = async () => {
          if (confirm('Delete this note?')) {
            await client.from('messages').delete().eq('id', msg.id);
            showToast('Note deleted', 'is-warning');
            loadMessages();
          }
        };

        btns.append(editBtn, delBtn);
        card.appendChild(btns);
      }

      messageList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    showToast('Could not load notes', 'is-danger');
  } finally {
    loadingDiv.style.display = 'none';
  }
}

// ----- New Note -----
messageForm.addEventListener('submit', async e => {
  e.preventDefault();
  const content = messageInput.value.trim();
  const tag     = tagInput.value.trim();
  const color   = colorInput.value;
  const btn     = messageForm.querySelector('button[type="submit"]');

  if (!content) return showToast('Note can’t be empty', 'is-danger is-light');
  if (content.length > 500) return showToast('Max 500 characters', 'is-danger is-light');
  if (tag.length > 50)        return showToast('Max 50 chars for tag', 'is-danger is-light');

  btn.classList.add('is-loading');
  try {
    const { error } = await client
      .from('messages')
      .insert([{ content, tag, color, user_id: currentUser.id }]);
    if (error) throw error;

    showToast('Note added', 'is-success is-light');
    messageInput.value = '';
    tagInput.value     = '';
    colorInput.value   = '#ffffff';
    loadMessages();
  } catch (err) {
    console.error(err);
    showToast('Send failed', 'is-danger is-light');
  } finally {
    btn.classList.remove('is-loading');
  }
});

// ----- Edit Modal -----
editInput.addEventListener('input', () => {
  editHelp.textContent = `${editInput.value.length}/500`;
});
editClose.onclick  = closeModal;
editCancel.onclick = closeModal;
editModal.querySelector('.modal-background').onclick = closeModal;

editSave.addEventListener('click', async () => {
  const newContent = editInput.value.trim();
  const newTag     = editTagInput.value.trim();
  const newColor   = editColorInput.value;

  if (!newContent) return showToast('Note can’t be empty', 'is-danger is-light');
  if (newContent.length > 500) return showToast('Max 500 characters', 'is-danger is-light');
  if (newTag.length > 50)        return showToast('Max 50 chars for tag', 'is-danger is-light');

  editSave.classList.add('is-loading');
  try {
    const { error } = await client
      .from('messages')
      .update({ content: newContent, tag: newTag, color: newColor })
      .eq('id', editMessageId);
    if (error) throw error;

    showToast('Note updated', 'is-success is-light');
    closeModal();
    loadMessages();
  } catch (err) {
    console.error(err);
    showToast('Update failed', 'is-danger is-light');
  } finally {
    editSave.classList.remove('is-loading');
  }
});
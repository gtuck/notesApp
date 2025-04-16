const SUPABASE_URL = 'https://dbolbumwkmmhubctnmur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib2xidW13a21taHViY3RubXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIyNDUsImV4cCI6MjA2MDAzODI0NX0.9Q_BsQ2vmW2ZSAy6WUz7123ONvR8LkqUj1_JK0rMtrw';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// UI References
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const signUpBtn = document.getElementById('sign-up');
const logInBtn = document.getElementById('log-in');
const signOutBtn = document.getElementById('sign-out');
const userEmailSpan = document.getElementById('user-email');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const tagInput = document.getElementById('note-tag');
const colorInput = document.getElementById('note-color');
const searchInput = document.getElementById('search-input');
const messageList = document.getElementById('message-list');
const loadingDiv = document.getElementById('loading');

let currentUser = null;

// Event Listeners
signUpBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert('Please enter email and password.');
  try {
    const { error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    alert('Account created! Check your inbox to confirm.');
  } catch (err) {
    alert('Sign-up error: ' + err.message);
  }
});

logInBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert('Please enter email and password.');
  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } catch (err) {
    alert('Login error: ' + err.message);
  }
});

signOutBtn.addEventListener('click', async () => {
  await client.auth.signOut();
  location.reload();
});

// Auth state
client.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user;
    setupUI();
  }
});

client.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  setupUI();
});

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadMessages, 300);
});

function setupUI() {
  const authForm = document.getElementById('auth-form');
  if (currentUser) {
    signOutBtn.style.display = 'inline';
    userEmailSpan.textContent = `Signed in as ${currentUser.email}`;
    messageForm.style.display = 'block';
    authForm.style.display = 'none';
    signUpBtn.style.display = 'none';
  } else {
    signOutBtn.style.display = 'none';
    userEmailSpan.textContent = '';
    messageForm.style.display = 'none';
    authForm.style.display = 'block';
  }
  loadMessages();
}

async function loadMessages() {
  loadingDiv.style.display = 'block';
  messageList.innerHTML = '';
  try {
    const { data, error } = await client
      .from('messages')
      .select('id, content, created_at, tag, color, user_id, users ( email )')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const searchTerm = searchInput.value.toLowerCase();
    data.forEach(msg => {
      if (searchTerm && !(msg.content.toLowerCase().includes(searchTerm) || (msg.tag || '').toLowerCase().includes(searchTerm))) return;

      const card = document.createElement('div');
      card.className = 'box';
      card.style.backgroundColor = msg.color || '#ffffff';

      const content = document.createElement('p');
      content.textContent = msg.content;
      card.appendChild(content);

      const tag = document.createElement('p');
      tag.className = 'has-text-grey';
      tag.textContent = msg.tag ? `#${msg.tag}` : '';
      card.appendChild(tag);

      const meta = document.createElement('p');
      meta.innerHTML = `<strong>${msg.users?.email || 'anonymous'}</strong> • ${new Date(msg.created_at).toLocaleString()}`;
      card.appendChild(meta);

      if (currentUser && currentUser.id === msg.user_id) {
        const editBtn = document.createElement('button');
        editBtn.className = 'button is-small is-info mr-2';
        editBtn.textContent = '✏️';
        editBtn.onclick = async () => {
          const newContent = prompt('Edit your note:', msg.content);
          if (newContent && newContent.trim()) {
            try {
              const { data, error } = await client
                .from('messages')
                .update({ content: newContent.trim() })
                .eq('id', msg.id)
                .select();
              if (error) throw error;
              if (data) loadMessages();
            } catch (err) {
              alert('Update failed: ' + err.message);
            }
          }
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'button is-small is-danger';
        delBtn.textContent = '🗑️';
        delBtn.onclick = () => {
          if (confirm('Delete this message?')) {
            client.from('messages').delete().eq('id', msg.id).then(loadMessages);
          }
        };

        card.appendChild(editBtn);
        card.appendChild(delBtn);
      }

      messageList.appendChild(card);
    });
  } catch (err) {
    alert('Load failed: ' + err.message);
  }
  loadingDiv.style.display = 'none';
}

messageForm.addEventListener('submit', async e => {
  e.preventDefault();
  const content = messageInput.value.trim();
  const tag = tagInput.value.trim();
  const color = colorInput.value;

  if (!currentUser || !content) return;

  try {
    const { error } = await client.from('messages').insert([{ content, tag, color, user_id: currentUser.id }]);
    if (error) throw error;
    messageInput.value = '';
    tagInput.value = '';
    colorInput.value = '#ffffff';
    loadMessages();
  } catch (err) {
    alert('Send failed: ' + err.message);
  }
});

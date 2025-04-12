const SUPABASE_URL = 'https://dbolbumwkmmhubctnmur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib2xidW13a21taHViY3RubXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIyNDUsImV4cCI6MjA2MDAzODI0NX0.9Q_BsQ2vmW2ZSAy6WUz7123ONvR8LkqUj1_JK0rMtrw';

// Replace these with your actual Supabase credentials
// const SUPABASE_URL = 'https://your-project.supabase.co';
// const SUPABASE_KEY = 'your-anon-key';

// Create the Supabase client instance (using a safe variable name)
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// UI elements
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messageList = document.getElementById('message-list');
const signOutBtn = document.getElementById('sign-out');
const userEmailSpan = document.getElementById('user-email');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const signUpBtn = document.getElementById('sign-up');
const logInBtn = document.getElementById('log-in');

let currentUser = null;

// Sign up with email + password
signUpBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const { error } = await client.auth.signUp({ email, password });
  if (error) alert('Sign-up error: ' + error.message);
  else alert('Account created! Check your inbox to confirm.');
});

// Log in with email + password
logInBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) alert('Login error: ' + error.message);
});

// Sign out
signOutBtn.addEventListener('click', async () => {
  await client.auth.signOut();
  location.reload();
});

// Load initial auth state
client.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user;
    setupUserUI();
  }
});

// Handle auth changes (login, logout, etc.)
client.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  setupUserUI();
});

// Update UI based on current user
function setupUserUI() {
  if (currentUser) {
    signOutBtn.style.display = 'inline';
    userEmailSpan.textContent = `Signed in as ${currentUser.email}`;
    messageForm.style.display = 'block';
  } else {
    signOutBtn.style.display = 'none';
    userEmailSpan.textContent = '';
    messageForm.style.display = 'none';
  }
  loadMessages();
}

// Load and display all messages
async function loadMessages() {
  const { data, error } = await client
    .from('messages')
    .select('id, content, created_at, user_id, users ( email )')
    .order('created_at', { ascending: false });

  messageList.innerHTML = '';

  data?.forEach(msg => {
    const li = document.createElement('li');
    const userEmail = msg.users?.email || 'anonymous';
    li.textContent = `[${userEmail}] ${msg.content}`;

    // Add delete button if the current user owns the message
    if (currentUser && currentUser.id === msg.user_id) {
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.style.marginLeft = '10px';
      delBtn.onclick = async () => {
        if (confirm('Delete this message?')) {
          const { error } = await client
            .from('messages')
            .delete()
            .eq('id', msg.id);
          if (error) {
            alert('Delete failed: ' + error.message);
          } else {
            loadMessages();
          }
        }
      };
      li.appendChild(delBtn);
    }

    messageList.appendChild(li);
  });
}

// Handle message submission
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!currentUser || !content) return;

  const { error } = await client
    .from('messages')
    .insert([{ content, user_id: currentUser.id }]);

  if (error) {
    alert('Send failed: ' + error.message);
  } else {
    messageInput.value = '';
    loadMessages();
  }
});

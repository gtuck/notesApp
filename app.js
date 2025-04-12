const SUPABASE_URL = 'https://dbolbumwkmmhubctnmur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib2xidW13a21taHViY3RubXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIyNDUsImV4cCI6MjA2MDAzODI0NX0.9Q_BsQ2vmW2ZSAy6WUz7123ONvR8LkqUj1_JK0rMtrw';

// Create a Supabase client instance using the project URL and anon key
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// UI references
const messageForm = document.getElementById('message-form');
const tagInput = document.getElementById('note-tag');
const colorInput = document.getElementById('note-color');
const searchInput = document.getElementById('search-input');
const messageInput = document.getElementById('message-input');
const messageList = document.getElementById('message-list');
const signOutBtn = document.getElementById('sign-out');
const userEmailSpan = document.getElementById('user-email');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const signUpBtn = document.getElementById('sign-up');
const logInBtn = document.getElementById('log-in');

// Store the currently logged-in user
let currentUser = null;

/**
 * Sign up button click event
 * Registers a new user with Supabase Auth using email and password
 */
signUpBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const { error } = await client.auth.signUp({ email, password });
  if (error) alert('Sign-up error: ' + error.message);
  else alert('Account created! Check your inbox to confirm.');
});

/**
 * Log in button click event
 * Authenticates user using Supabase Auth with email and password
 */
logInBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) alert('Login error: ' + error.message);
});

/**
 * Sign out button click event
 * Logs the user out and reloads the page
 */
signOutBtn.addEventListener('click', async () => {
  await client.auth.signOut();
  location.reload();
});

/**
 * Check if a user is already logged in when the app loads
 */
client.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user;
    setupUserUI(); searchInput.addEventListener('input', loadMessages);
  }
});

/**
 * Monitor authentication state changes (login, logout)
 */
client.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  setupUserUI(); searchInput.addEventListener('input', loadMessages);
});

/**
 * Setup the UI based on the login status
 * Shows or hides message form and logout button
 */
function setupUserUI() {
  const authForm = document.getElementById('auth-form');

  if (currentUser) {
    // User is signed in
    signOutBtn.style.display = 'inline';
    userEmailSpan.textContent = `Signed in as ${currentUser.email}`;
    messageForm.style.display = 'block';
    authForm.style.display = 'none'; // Hide login/signup form
  } else {
    // User is not signed in
    signOutBtn.style.display = 'none';
    userEmailSpan.textContent = '';
    messageForm.style.display = 'none';
    authForm.style.display = 'block'; // Show login/signup form
  }

  loadMessages();
}

}

/**
 * Load all messages from the Supabase 'messages' table
 * Displays the message content and the user's email
 * Adds a delete button if the message belongs to the logged-in user
 */
async function loadMessages() {
  const { data, error } = await client
    .from('messages')
    .select('id, content, created_at, tag, color, user_id, users ( email )')
    .order('created_at', { ascending: false });

  messageList.innerHTML = '';

  data?.forEach(msg => {
    const li = document.createElement('li');
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm && !(msg.content.toLowerCase().includes(searchTerm) || (msg.tag || '').toLowerCase().includes(searchTerm))) return;
    li.dataset.color = msg.color || "#ffffff";
    li.style.setProperty('--note-color', msg.color || "#ffffff");
    const userEmail = msg.users?.email || 'anonymous';
    const timestamp = new Date(msg.created_at).toLocaleString();
    li.innerHTML = `<strong>${userEmail}</strong>: ${msg.content} <em>[${msg.tag || ''}]</em><br><small>${timestamp}</small>`;

    // Add Edit and Delete buttons for the user's own messages
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
      // Create edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.style.marginLeft = '10px';
      editBtn.onclick = () => {
        const newContent = prompt('Edit your note:', msg.content);
        if (newContent && newContent.trim() !== '') {
          client.from('messages')
            .update({ content: newContent.trim() })
            .eq('id', msg.id)
            .then(() => loadMessages());
        }
      };
      li.appendChild(editBtn);
      li.appendChild(delBtn);
    }

    messageList.appendChild(li);
  });
}

/**
 * Handle message form submission
 * Sends a new message to the Supabase 'messages' table
 */
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!currentUser || !content) return;

  const { error } = await client
    .from('messages')
    .insert([{ content, tag: tagInput.value.trim(), color: colorInput.value, user_id: currentUser.id }]);

  if (error) {
    alert('Send failed: ' + error.message);
  } else {
    messageInput.value = ''; tagInput.value = ''; colorInput.value = '#ffffff';
    loadMessages();
  }
});

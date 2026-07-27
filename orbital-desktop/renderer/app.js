const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const errorEl = document.getElementById('error');
const briefingTextEl = document.getElementById('briefing-text');
const signoutBtn = document.getElementById('signout-btn');
const startupToggle = document.getElementById('startup-toggle');

let lastBriefingText = '';

function speak(text) {
  if (!text) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

async function showMainView() {
  loginView.classList.add('hidden');
  mainView.classList.remove('hidden');
  signoutBtn.classList.remove('hidden');

  startupToggle.checked = await window.orbital.getStartupSetting();

  const result = await window.orbital.getBriefing();
  if (result.success) {
    lastBriefingText = result.reply;
    briefingTextEl.textContent = result.reply;
    speak(result.reply);
  } else {
    briefingTextEl.textContent = `Couldn't load your briefing: ${result.error}`;
  }
}

function showLoginView() {
  mainView.classList.add('hidden');
  loginView.classList.remove('hidden');
  signoutBtn.classList.add('hidden');
}

document.getElementById('signin-btn').addEventListener('click', async () => {
  errorEl.textContent = '';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) {
    errorEl.textContent = 'Enter your email and password.';
    return;
  }
  const result = await window.orbital.signIn(email, password);
  if (result.success) {
    showMainView();
  } else {
    errorEl.textContent = result.error;
  }
});

document.getElementById('speak-again-btn').addEventListener('click', () => {
  speak(lastBriefingText);
});

signoutBtn.addEventListener('click', async () => {
  await window.orbital.signOut();
  showLoginView();
});

startupToggle.addEventListener('change', async (e) => {
  await window.orbital.setStartupSetting(e.target.checked);
});

(async function init() {
  const { loggedIn } = await window.orbital.restoreSession();
  if (loggedIn) {
    showMainView();
  } else {
    showLoginView();
  }
})();

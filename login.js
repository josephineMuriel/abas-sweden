(() => {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('authMessage');
  const button = document.getElementById('loginButton');
  const qs = new URLSearchParams(window.location.search);
  const next = ABASAuth.safeNext(qs.get('next'), 'members.html');

  function show(text, type = 'info') {
    message.hidden = false;
    message.className = `auth-message ${type}`;
    message.textContent = text;
  }

  if (!ABASAuth.configured()) {
    show('Supabase is not configured yet. Update supabase-config.js first.', 'error');
    button.disabled = true;
    return;
  }

  if (qs.get('verified') === '1') {
    show('Email confirmed. You can now sign in.', 'success');
  }

  (async () => {
    try {
      const state = await ABASAuth.getAuthState();
      if (state.session) {
        if (state.profile?.status === 'approved') window.location.replace(next);
        else window.location.replace('account-status.html');
      }
    } catch (_) {}
  })();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    show('Signing in…');
    try {
      await ABASAuth.signIn(
        document.getElementById('email').value.trim(),
        document.getElementById('password').value
      );
      const state = await ABASAuth.getAuthState();
      if (!state.profile) throw new Error('Your member profile could not be loaded.');
      if (state.profile.status === 'approved') {
        window.location.replace(next);
      } else {
        window.location.replace('account-status.html');
      }
    } catch (error) {
      show(error.message || 'Unable to sign in.', 'error');
      button.disabled = false;
    }
  });
})();

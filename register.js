(() => {
  const form = document.getElementById('registerForm');
  const message = document.getElementById('authMessage');
  const button = document.getElementById('registerButton');

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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (password !== confirm) {
      show('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 8) {
      show('Use a password with at least 8 characters.', 'error');
      return;
    }

    button.disabled = true;
    show('Creating your account…');
    try {
      const data = await ABASAuth.signUp({
        email: document.getElementById('email').value.trim(),
        password,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        city: document.getElementById('city').value.trim()
      });

      form.reset();
      if (data.session) {
        show('Registration received. Your account is waiting for ABAS approval.', 'success');
        setTimeout(() => window.location.replace('account-status.html'), 900);
      } else {
        show('Registration received. Check your email to confirm your address, then sign in. Your account will still require ABAS approval.', 'success');
      }
    } catch (error) {
      show(error.message || 'Unable to register.', 'error');
      button.disabled = false;
    }
  });
})();

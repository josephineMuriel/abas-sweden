(() => {
  const form = document.getElementById('profileForm');
  const message = document.getElementById('authMessage');
  const save = document.getElementById('saveButton');
  const meta = document.getElementById('memberMeta');

  function show(text, type = 'info') {
    message.hidden = false;
    message.className = `auth-message ${type}`;
    message.textContent = text;
  }

  function fill(profile) {
    document.getElementById('firstName').value = profile.first_name || '';
    document.getElementById('lastName').value = profile.last_name || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('city').value = profile.city || '';
    document.getElementById('email').value = profile.email || '';
    meta.innerHTML = `<span>Status: <strong>${profile.status}</strong></span><span>Role: <strong>${profile.role}</strong></span>`;
  }

  (async () => {
    try {
      const state = await ABASAuth.requireUser();
      if (!state) return;
      fill(state.profile);
    } catch (error) {
      show(error.message, 'error');
      save.disabled = true;
    }
  })();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    save.disabled = true;
    show('Saving…');
    try {
      const updated = await ABASAuth.updateMyProfile({
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        city: document.getElementById('city').value.trim()
      });
      if (updated) fill(updated);
      show('Profile updated.', 'success');
    } catch (error) {
      show(error.message || 'Unable to save your profile.', 'error');
    } finally {
      save.disabled = false;
    }
  });

  document.getElementById('logoutButton').addEventListener('click', () => ABASAuth.signOut());
})();

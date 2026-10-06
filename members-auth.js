(() => {
  const target = document.getElementById('pageContent');
  if (!target) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function signedOut() {
    target.innerHTML = `
      <p class="lead">Sign in to access ABAS member documents and your membership profile.</p>
      <div class="member-private-grid">
        <article class="private-card"><h3>Existing member</h3><p>Sign in with your ABAS member account.</p><a class="btn primary" href="login.html">Sign in →</a></article>
        <article class="private-card"><h3>New registration</h3><p>Create an account. Access is activated after ABAS approval.</p><a class="btn secondary" href="register.html">Register →</a></article>
      </div>`;
  }

  function pending(profile) {
    const status = esc(profile?.status || 'pending');
    target.innerHTML = `
      <div class="member-dashboard-header"><div><p class="section-kicker">Member account</p><h2>${esc(profile?.first_name || '')} ${esc(profile?.last_name || '')}</h2></div><span class="status-badge status-${status}">${status}</span></div>
      <p class="lead">Your account does not currently have access to private member documents.</p>
      <div class="hero-actions"><a class="btn secondary" href="profile.html">Edit my profile</a><a class="btn primary" href="account-status.html">View membership status</a></div>`;
  }

  function approved(profile) {
    const admin = profile.role === 'admin';
    target.innerHTML = `
      <div class="member-dashboard-header"><div><p class="section-kicker">Member area</p><h2>Welcome, ${esc(profile.first_name || 'member')}</h2><p class="member-summary">${esc(profile.email)}${profile.city ? ' • '+esc(profile.city) : ''}</p></div><span class="status-badge status-approved">${admin ? 'admin' : 'approved member'}</span></div>
      <div class="member-private-grid member-dashboard-grid">
        <article class="private-card"><h3>Governance</h3><p>Access ABAS governing information and member governance documents.</p><a class="btn primary" href="governance.html">Open governance →</a></article>
        <article class="private-card"><h3>Meeting protocols</h3><p>Access meeting protocols reserved for approved ABAS members.</p><a class="btn secondary" href="protocols.html">Open protocols →</a></article>
        <article class="private-card"><h3>My profile</h3><p>Update your contact and membership information.</p><a class="btn secondary" href="profile.html">Edit profile →</a></article>
        ${admin ? '<article class="private-card admin-card"><h3>Administration</h3><p>Review registrations and manage member status and roles.</p><a class="btn primary" href="admin.html">Open admin →</a></article>' : ''}
      </div>
      <div class="member-actions"><button class="btn secondary" id="memberLogout" type="button">Sign out</button></div>`;
    document.getElementById('memberLogout')?.addEventListener('click', () => ABASAuth.signOut());
  }

  (async () => {
    if (!ABASAuth.configured()) {
      target.innerHTML = '<div class="auth-message error">Supabase is not configured yet. Update supabase-config.js.</div>';
      return;
    }
    try {
      const state = await ABASAuth.getAuthState();
      if (!state.session) return signedOut();
      if (state.profile?.status !== 'approved') return pending(state.profile);
      approved(state.profile);
    } catch (error) {
      target.innerHTML = `<div class="auth-message error">${esc(error.message || 'Unable to load the member area.')}</div>`;
    }
  })();
})();

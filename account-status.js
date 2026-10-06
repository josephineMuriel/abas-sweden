(() => {
  const target = document.getElementById('statusContent');
  const copy = {
    pending: ['Pending approval', 'Your registration has been received. An ABAS administrator must approve your membership account before private member content becomes available.'],
    rejected: ['Registration not approved', 'Your account is not currently approved for member access. Please contact ABAS if you believe this needs review.'],
    suspended: ['Access suspended', 'Your member access is currently suspended. Please contact ABAS for more information.'],
    approved: ['Membership approved', 'Your account is approved. You can enter the member area now.']
  };

  (async () => {
    try {
      const state = await ABASAuth.requireUser();
      if (!state) return;
      const status = state.profile?.status || 'pending';
      const [title, text] = copy[status] || copy.pending;
      target.innerHTML = `<div class="status-panel"><span class="status-badge status-${status}">${status}</span><h2>${title}</h2><p>${text}</p>${status === 'approved' ? '<a class="btn primary" href="members.html">Open member area</a>' : ''}</div>`;
    } catch (error) {
      target.innerHTML = `<div class="auth-message error">${error.message}</div>`;
    }
  })();

  document.getElementById('logoutButton').addEventListener('click', () => ABASAuth.signOut());
})();

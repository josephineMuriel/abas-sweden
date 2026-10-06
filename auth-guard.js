(() => {
  (async () => {
    try {
      const requirement = document.body.dataset.authRequire || 'approved';
      const state = requirement === 'admin' ? await ABASAuth.requireAdmin() : await ABASAuth.requireApproved();
      if (!state) return;
      document.body.classList.remove('auth-checking');
    } catch (error) {
      document.body.innerHTML = `<main class="portal-page"><section class="portal-card"><h1>Unable to verify member access</h1><p>${String(error.message || error)}</p><a class="btn primary" href="login.html">Sign in</a></section></main>`;
    }
  })();
})();

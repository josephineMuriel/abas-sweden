(() => {
  const cfg = window.ABAS_SUPABASE_CONFIG || {};

  function configured() {
    return Boolean(
      cfg.url && cfg.anonKey &&
      !cfg.url.includes('YOUR-PROJECT') &&
      !cfg.anonKey.includes('YOUR-SUPABASE')
    );
  }

  function configError() {
    return new Error('Supabase is not configured yet. Add your Project URL and anon key in supabase-config.js.');
  }

  const client = configured() && window.supabase
    ? window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

  function getClient() {
    if (!client) throw configError();
    return client;
  }

  function safeNext(value, fallback = 'members.html') {
    if (!value) return fallback;
    try {
      const decoded = decodeURIComponent(value);
      if (/^[a-zA-Z0-9_-]+\.html(?:\?.*)?$/.test(decoded)) return decoded;
    } catch (_) {}
    return fallback;
  }

  async function getSession() {
    const { data, error } = await getClient().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getUser() {
    const { data, error } = await getClient().auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async function getProfile(userId) {
    const session = await getSession();
    if (!session) return null;
    const id = userId || session.user.id;
    const { data, error } = await getClient()
      .from('profiles')
      .select('id,email,first_name,last_name,phone,city,role,status,created_at,updated_at')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function getAuthState() {
    const session = await getSession();
    if (!session) return { session: null, user: null, profile: null };
    const profile = await getProfile(session.user.id);
    return { session, user: session.user, profile };
  }

  async function signUp({ email, password, firstName, lastName, phone, city }) {
    const emailRedirectTo = new URL('login.html?verified=1', window.location.href).href;
    const { data, error } = await getClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || '',
          city: city || ''
        }
      }
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
    window.location.href = 'login.html';
  }

  async function updateMyProfile({ firstName, lastName, phone, city }) {
    const { data, error } = await getClient().rpc('update_my_profile', {
      p_first_name: firstName,
      p_last_name: lastName,
      p_phone: phone || '',
      p_city: city || ''
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async function requestPasswordReset(email) {
    const redirectTo = new URL('reset-password.html', window.location.href).href;
    const { data, error } = await getClient().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return data;
  }

  async function updatePassword(password) {
    const { data, error } = await getClient().auth.updateUser({ password });
    if (error) throw error;
    return data;
  }

  async function requireUser() {
    const state = await getAuthState();
    if (!state.session) {
      const next = encodeURIComponent(window.location.pathname.split('/').pop() || 'members.html');
      window.location.replace(`login.html?next=${next}`);
      return null;
    }
    return state;
  }

  async function requireApproved() {
    const state = await requireUser();
    if (!state) return null;
    if (!state.profile || state.profile.status !== 'approved') {
      window.location.replace('account-status.html');
      return null;
    }
    return state;
  }

  async function requireAdmin() {
    const state = await requireApproved();
    if (!state) return null;
    if (state.profile.role !== 'admin') {
      window.location.replace('members.html');
      return null;
    }
    return state;
  }

  window.ABASAuth = {
    configured,
    getClient,
    safeNext,
    getSession,
    getUser,
    getProfile,
    getAuthState,
    signUp,
    signIn,
    signOut,
    updateMyProfile,
    requestPasswordReset,
    updatePassword,
    requireUser,
    requireApproved,
    requireAdmin
  };
})();

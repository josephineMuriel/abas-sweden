(() => {
  const rows = document.getElementById('memberRows');
  const message = document.getElementById('authMessage');
  const search = document.getElementById('memberSearch');
  let members = [];
  let me = null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function show(text, type = 'info') {
    message.hidden = false;
    message.className = `auth-message ${type}`;
    message.textContent = text;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const filtered = members.filter(m => [m.first_name,m.last_name,m.email,m.phone,m.city,m.status,m.role].join(' ').toLowerCase().includes(q));
    if (!filtered.length) {
      rows.innerHTML = '<tr><td colspan="6">No members found.</td></tr>';
      return;
    }

    rows.innerHTML = filtered.map(m => {
      const self = m.id === me;
      return `<tr data-id="${m.id}">
        <td>
          <input class="admin-first-name" value="${esc(m.first_name)}" aria-label="First name">
          <input class="admin-last-name" value="${esc(m.last_name)}" aria-label="Last name">
        </td>
        <td><strong>${esc(m.email)}</strong></td>
        <td>
          <input class="admin-phone" value="${esc(m.phone || '')}" aria-label="Phone" placeholder="Phone">
          <input class="admin-city" value="${esc(m.city || '')}" aria-label="City" placeholder="City">
        </td>
        <td><select class="admin-status" ${self?'disabled':''}><option value="pending" ${m.status==='pending'?'selected':''}>pending</option><option value="approved" ${m.status==='approved'?'selected':''}>approved</option><option value="suspended" ${m.status==='suspended'?'selected':''}>suspended</option><option value="rejected" ${m.status==='rejected'?'selected':''}>rejected</option></select></td>
        <td><select class="admin-role" ${self?'disabled':''}><option value="member" ${m.role==='member'?'selected':''}>member</option><option value="admin" ${m.role==='admin'?'selected':''}>admin</option></select></td>
        <td><button class="btn secondary admin-save" type="button">Save</button>${self?'<small>Your role/status are locked here</small>':''}</td>
      </tr>`;
    }).join('');

    rows.querySelectorAll('.admin-save').forEach(btn => btn.addEventListener('click', saveRow));
  }

  async function load() {
    rows.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
    try {
      const state = await ABASAuth.requireAdmin();
      if (!state) return;
      me = state.user.id;
      const { data, error } = await ABASAuth.getClient()
        .from('profiles')
        .select('id,email,first_name,last_name,phone,city,status,role,created_at')
        .order('created_at', { ascending:false });
      if (error) throw error;
      members = data || [];
      render();
    } catch (error) {
      show(error.message || 'Unable to load members.', 'error');
      rows.innerHTML = '<tr><td colspan="6">Unable to load.</td></tr>';
    }
  }

  async function saveRow(event) {
    const tr = event.currentTarget.closest('tr');
    const targetId = tr.dataset.id;
    event.currentTarget.disabled = true;
    try {
      const { error } = await ABASAuth.getClient().rpc('admin_update_member', {
        target_id: targetId,
        new_first_name: tr.querySelector('.admin-first-name').value.trim(),
        new_last_name: tr.querySelector('.admin-last-name').value.trim(),
        new_phone: tr.querySelector('.admin-phone').value.trim(),
        new_city: tr.querySelector('.admin-city').value.trim(),
        new_status: tr.querySelector('.admin-status').value,
        new_role: tr.querySelector('.admin-role').value
      });
      if (error) throw error;
      show('Member updated.', 'success');
      await load();
    } catch (error) {
      show(error.message || 'Unable to update member.', 'error');
      event.currentTarget.disabled = false;
    }
  }

  search.addEventListener('input', render);
  document.getElementById('refreshButton').addEventListener('click', load);
  document.getElementById('logoutButton').addEventListener('click', () => ABASAuth.signOut());
  load();
})();

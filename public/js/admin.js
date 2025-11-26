// Admin dashboard script: load users and barangay officials, add/delete officials

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"]+/g, function(match){
    switch(match){
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
    }
    return match;
  });
}

async function loadUsers() {
  const tbody = document.getElementById('userTable');
  tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/admin/users', { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
    if (!res.ok) throw new Error('Failed to fetch users');
    let users = await res.json();
    if (!Array.isArray(users)) users = [];
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.id ?? ''}</td>
        <td>${escapeHtml(u.fullname ?? u.name ?? '')}</td>
        <td>${escapeHtml(u.email ?? '')}</td>
        <td><button class="service-btn action danger" data-id="${u.id}" onclick="deleteUser(${u.id})">Delete</button></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">Error loading users</td></tr>`;
    console.error(err);
  }
}

async function deleteUser(id){
  if (!id) return;
  if (!confirm('Delete this user? This action cannot be undone.')) return;
  try {
    const token = localStorage.getItem('adminToken');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch('/admin/users/' + id, { method: 'DELETE', headers });
    if (!res.ok) {
      const err = await res.json().catch(()=>({message:'server error'}));
      throw new Error(err.message || 'Failed to delete');
    }
    await loadUsers();
    alert('User deleted');
  } catch (err) {
    console.error(err);
    alert('Error deleting user: ' + (err.message || err));
  }
}

async function loadOfficials() {
  const tbody = document.getElementById('officialsTable');
  tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/admin/officials', { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
    if (!res.ok) throw new Error('Failed to fetch officials');
    let list = await res.json();
    if (!Array.isArray(list)) list = [];
    tbody.innerHTML = list.map(o => `
      <tr>
        <td>${o.id ?? ''}</td>
        <td>${escapeHtml(o.name ?? '')}</td>
        <td>${escapeHtml(o.position ?? '')}</td>
        <td>${escapeHtml(o.contact_info ?? '')}</td>
        <td><button class="service-btn action danger" data-id="${o.id}" onclick="deleteOfficial(${o.id})">Delete</button></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Error loading officials</td></tr>`;
    console.error(err);
  }
}

async function addOfficial(ev) {
  ev && ev.preventDefault();
  const name = document.getElementById('offName').value.trim();
  const position = document.getElementById('offPosition').value.trim();
  const contact = document.getElementById('offContact').value.trim();
  if (!name || !position) {
    alert('Name and position are required');
    return;
  }
  try {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch('/admin/officials', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, position, contact_info: contact })
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({message:'server error'}));
      throw new Error(err.message || 'Failed to add official');
    }
    const data = await res.json();
    document.getElementById('officialForm').reset();
    await loadOfficials();
    if (window.opener && window.opener.refreshOfficials) window.opener.refreshOfficials();
    alert('Official added');
  } catch (err) {
    console.error(err);
    alert('Error adding official: ' + (err.message || err));
  }
}

async function deleteOfficial(id) {
  if (!confirm('Delete this official?')) return;
  try {
    const token = localStorage.getItem('adminToken');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch('/admin/officials/' + id, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Failed to delete');
    await loadOfficials();
    if (window.opener && window.opener.refreshOfficials) window.opener.refreshOfficials();
  } catch (err) {
    console.error(err);
    alert('Error deleting official');
  }
}

// wire events
document.addEventListener('DOMContentLoaded', ()=>{
  // Ensure only logged-in admins can access this page.
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    // not logged in as admin — redirect to admin login
    window.location.href = 'admin-login.html';
    return;
  }

  const form = document.getElementById('officialForm');
  form && form.addEventListener('submit', addOfficial);
  const addBtn = document.getElementById('addOfficialBtn');
  addBtn && addBtn.addEventListener('click', addOfficial);
  loadUsers();
  loadOfficials();
  // Admin logout button
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', function() {
      if (!confirm('Log out from admin dashboard?')) return;
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      localStorage.removeItem('fullname');
      localStorage.removeItem('email');
      localStorage.removeItem('created_at');
      localStorage.removeItem('adminToken');
      // redirect to main landing page
      window.location.href = 'index.html';
    });
  }
});

// expose for cross-window refresh
window.refreshOfficials = loadOfficials;

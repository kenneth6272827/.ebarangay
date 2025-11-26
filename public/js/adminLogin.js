// Client-side admin login handler
async function adminLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return alert('Please enter username and password');

  try {
	const res = await fetch('/admin/login', {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({ username, password })
	});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return alert(data.error || data.message || 'Login failed');
		// store admin token for protected admin actions
		if (data.token) {
			localStorage.setItem('adminToken', data.token);
		}
		// on success, go to admin dashboard
		window.location.href = 'admin-dashboard.html';
  } catch (err) {
	console.error('Admin login error', err);
	alert('Error logging in. Check console for details.');
  }

  return false;
}

// expose to global scope for inline form onsubmit
window.adminLogin = adminLogin;
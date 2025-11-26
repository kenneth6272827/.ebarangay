function signupUser() {
	const fullname = document.getElementById('fullname').value;
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;

	if (!email || !password) {
		alert('Please fill in all required fields');
		return;
	}

	fetch('/auth/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ fullname, email, password })
	})
		.then(async res => {
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const msg = data.message || data.error || 'Registration failed';
				alert(msg);
				return;
			}
			alert(data.message || 'Registration successful');
			window.location.href = 'index.html';
		})
		.catch(error => {
			console.error('Error:', error);
			alert('An error occurred during registration');
		});
}

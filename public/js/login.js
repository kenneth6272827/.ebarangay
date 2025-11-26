function loginUser() {
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

fetch("/auth/login", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email, password }),
})
.then(res => res.json())
.then(data => {
		if (data.user) {
			localStorage.setItem('uid', data.user.id);
			localStorage.setItem('fullname', data.user.fullname || '');
			localStorage.setItem('email', data.user.email || '');
			localStorage.setItem('created_at', data.user.created_at || '');
			window.location.href = 'main.html';
		} else {
			alert(data.error || 'Login failed');
		}
});
}
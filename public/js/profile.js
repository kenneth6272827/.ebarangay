const uid = localStorage.getItem("uid");


fetch("/auth/profile", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ id: uid })
})
.then(res => res.json())
.then(data => {
document.getElementById("pname").textContent = data.fullname;
document.getElementById("pemail").textContent = data.email;
});
// Authentication and Navigation Script for E-Barangay System

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const authContainer = document.getElementById('authContainer');
    const mainContainer = document.getElementById('mainContainer');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    const hamburger = document.getElementById('hamburger');
    const navLinksContainer = document.getElementById('navLinks');

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const uid = localStorage.getItem('uid');

    if (token && uid) {
        showMainApp();
        loadUserProfile();
    } else {
        showAuth();
    }

    // Authentication Functions
    function showAuth() {
        authContainer.style.display = 'flex';
        mainContainer.style.display = 'none';
    }

    function showMainApp() {
        authContainer.style.display = 'none';
        mainContainer.style.display = 'block';
    }

    // Form Switching
    showSignup.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Login Form Submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('uid', data.uid);
                showMainApp();
                loadUserProfile();
                showSection('home');
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });

    // Signup Form Submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname: name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please login.');
                signupForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    });

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
    }

    // Profile Dropdown
    profileBtn.addEventListener('click', function() {
        profileDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    // View Profile
    viewProfileBtn.addEventListener('click', function() {
        showSection('profile');
        profileDropdown.classList.add('hidden');
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector('[data-section="profile"]').classList.add('active');
    });

    // Logout
    dropdownLogoutBtn.addEventListener('click', function() {
        if (!confirm('Are you sure you want to log out?')) return;
        // Clear stored user data
        localStorage.removeItem('token');
        localStorage.removeItem('uid');
        localStorage.removeItem('fullname');
        localStorage.removeItem('email');
        localStorage.removeItem('created_at');
        // Show auth UI
        showAuth();
        profileDropdown.classList.add('hidden');
        // Redirect to landing/login page for clarity
        window.location.href = 'index.html';
    });

    // Load User Profile
    async function loadUserProfile() {
        try {
            const response = await fetch('/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: uid })
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('profileName').textContent = data.fullname;
                document.getElementById('profileEmail').textContent = data.email;
                document.getElementById('profileId').textContent = data.id;
                document.getElementById('profileRegistered').textContent = new Date(data.created_at).toLocaleDateString();

                // Update profile avatar
                const avatar = document.getElementById('profileAvatar');
                avatar.textContent = data.fullname.charAt(0).toUpperCase();
            }
        } catch (error) {
            console.error('Profile load error:', error);
        }
    }

    // Refresh Profile Button
    const refreshProfileBtn = document.getElementById('refreshProfile');
    if (refreshProfileBtn) {
        refreshProfileBtn.addEventListener('click', loadUserProfile);
    }

    // Mobile Navigation
    hamburger.addEventListener('click', function() {
        navLinksContainer.classList.toggle('active');
    });

    // Load Officials (placeholder - would normally fetch from API)
    function loadOfficials() {
        const officialsGrid = document.getElementById('officialsGrid');
        // This would normally fetch from an API endpoint
        // For now, showing placeholder message
        officialsGrid.innerHTML = '<p>Officials data will be loaded from the admin dashboard.</p>';
    }

    // Initialize
    loadOfficials();
});

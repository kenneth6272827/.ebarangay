// Main client script copied/adapted from script.js

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

    // Check if a user id exists (we rely on `uid` rather than a token for this simple app)
    const uid = localStorage.getItem('uid');

    if (uid) {
        if (mainContainer) {
            showMainApp();
            loadUserProfile();
        }
    } else {
        // Keep main (public) view visible if no auth UI exists – only show auth UI when present
        if (authContainer) showAuth();
    }

    // Authentication Functions
    function showAuth() {
        if (authContainer) authContainer.style.display = 'flex';
        if (mainContainer) mainContainer.style.display = 'none';
    }

    function showMainApp() {
        if (authContainer) authContainer.style.display = 'none';
        if (mainContainer) mainContainer.style.display = 'block';
    }

    // Form Switching (only if those elements exist)
    if (showSignup) {
        showSignup.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm && loginForm.classList.add('hidden');
            signupForm && signupForm.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            signupForm && signupForm.classList.add('hidden');
            loginForm && loginForm.classList.remove('hidden');
        });
    }

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail') ? document.getElementById('loginEmail').value : '';
            const password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : '';

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    // store minimal user info
                    if (data.user) {
                        localStorage.setItem('uid', data.user.id);
                        localStorage.setItem('fullname', data.user.fullname || '');
                        localStorage.setItem('email', data.user.email || '');
                        localStorage.setItem('created_at', data.user.created_at || '');
                    }
                    showMainApp();
                    loadUserProfile();
                    showSection('home');
                } else {
                    alert(data.message || data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    // Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nameEl = document.getElementById('signupName');
            const emailEl = document.getElementById('signupEmail');
            const passwordEl = document.getElementById('signupPassword');
            const confirmEl = document.getElementById('signupConfirmPassword');
            const name = nameEl ? nameEl.value : '';
            const email = emailEl ? emailEl.value : '';
            const password = passwordEl ? passwordEl.value : '';
            const confirmPassword = confirmEl ? confirmEl.value : '';

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

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    alert('Registration successful! Please login.');
                    signupForm.classList.add('hidden');
                    loginForm && loginForm.classList.remove('hidden');
                } else {
                    alert(data.message || data.error || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });
    }

    // Navigation
    if (navLinks && navLinks.length) {
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
    }

    function showSection(sectionId) {
        if (!sections) return;
        sections.forEach(section => {
            section.classList.remove('active');
        });
        const target = document.getElementById(sectionId);
        if (target) target.classList.add('active');
    }

    // Profile Dropdown
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function() {
            profileDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }

    // View Profile
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function() {
            // If user not logged in, prompt to login (or redirect to login page)
            const uidLocal = localStorage.getItem('uid');
            if (!uidLocal) {
                alert('Please log in to view your profile');
                // If an auth page exists, navigate there; otherwise do nothing
                if (document.getElementById('loginForm') || document.querySelector('a[href="index.html"]')) {
                    window.location.href = 'index.html';
                }
                return;
            }

            showSection('profile');
            profileDropdown && profileDropdown.classList.add('hidden');
            navLinks.forEach(l => l.classList.remove('active'));
            const profileNav = document.querySelector('[data-section="profile"]');
            if (profileNav) profileNav.classList.add('active');
            // ensure profile data is fresh
            loadUserProfile();
        });
    }

    // Logout
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', function() {
            // Ask for confirmation before logging out
            if (!confirm('Are you sure you want to log out?')) return;
            // Clear any stored user data
            localStorage.removeItem('token');
            localStorage.removeItem('uid');
            localStorage.removeItem('fullname');
            localStorage.removeItem('email');
            localStorage.removeItem('created_at');
            // Hide dropdown
            profileDropdown && profileDropdown.classList.add('hidden');
            // Redirect to landing / login page
            window.location.href = 'index.html';
        });
    }

    // Load User Profile
    async function loadUserProfile() {
        try {
            const uidLocal = localStorage.getItem('uid');
            if (!uidLocal) return;
            const response = await fetch('/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: uidLocal })
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data) {
                const nameEl = document.getElementById('profileName');
                const emailEl = document.getElementById('profileEmail');
                const idEl = document.getElementById('profileId');
                const regEl = document.getElementById('profileRegistered');

                if (nameEl) nameEl.textContent = data.fullname || localStorage.getItem('fullname') || 'Name';
                if (emailEl) emailEl.textContent = data.email || localStorage.getItem('email') || '—';
                if (idEl) idEl.textContent = data.id || uidLocal;
                if (regEl && data.created_at) regEl.textContent = new Date(data.created_at).toLocaleDateString();

                // Update profile avatar
                const avatar = document.getElementById('profileAvatar');
                if (avatar && (data.fullname || localStorage.getItem('fullname'))) {
                    const fullname = data.fullname || localStorage.getItem('fullname') || '';
                    avatar.textContent = fullname.charAt(0).toUpperCase();
                }
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
    if (hamburger && navLinksContainer) {
        function toggleNav(){
            const isActive = navLinksContainer.classList.toggle('active');
            // update accessible state
            try { hamburger.setAttribute('aria-expanded', isActive ? 'true' : 'false'); } catch(e){}
            try { navLinksContainer.setAttribute('aria-hidden', isActive ? 'false' : 'true'); } catch(e){}
        }

        hamburger.addEventListener('click', function() { toggleNav(); });
        // allow keyboard activation (Enter / Space)
        hamburger.addEventListener('keydown', function(e){
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault(); toggleNav();
            }
        });

        // close menu when a nav link is clicked (mobile)
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.addEventListener('click', function(){
                if (navLinksContainer.classList.contains('active')) toggleNav();
            });
        });
    }

    // Load Officials (from admin endpoint)
    async function loadOfficials() {
        const officialsGrid = document.getElementById('officialsGrid');
        if (!officialsGrid) return;
        officialsGrid.innerHTML = '<p>Loading...</p>';
        try {
            const res = await fetch('/admin/officials');
            if (!res.ok) throw new Error('Failed to fetch officials');
            const list = await res.json();
            if (!Array.isArray(list) || list.length === 0) {
                officialsGrid.innerHTML = '<p>No officials found. Please ask the admin to add them.</p>';
                return;
            }
            officialsGrid.innerHTML = list.map(o => `
                <div class="official-card">
                    <div class="official-name">${escapeHtml(o.name)}</div>
                    <div class="official-position">${escapeHtml(o.position)}</div>
                    <div class="official-contact small">${escapeHtml(o.contact_info || '')}</div>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
            officialsGrid.innerHTML = '<p>Error loading officials.</p>';
        }
    }

    // Initialize
    loadOfficials();
});

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

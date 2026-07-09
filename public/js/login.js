/**
 * login.js — AeroCommand authentication client
 *
 * Handles:
 *   • Login form submission  (POST /api/auth/login)
 *   • Registration form submission (POST /api/auth/register)
 *   • Toggling between login ↔ register views
 *   • Displaying error / success feedback
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM References ──────────────────────────────────────────────────
  const loginForm    = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authError    = document.getElementById('auth-error');
  const authSuccess  = document.getElementById('auth-success');
  const showRegLink  = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');

  // ── Helpers ─────────────────────────────────────────────────────────

  /**
   * Display an error message in the auth-error div.
   * @param {string} msg — message to show
   */
  function showError(msg) {
    if (!authError) return;
    authError.textContent = msg;
    authError.classList.add('error');
    authError.classList.remove('hidden');
    // Clear any previous success
    if (authSuccess) {
      authSuccess.textContent = '';
      authSuccess.classList.add('hidden');
    }
  }

  /**
   * Display a success message in the auth-success div.
   * @param {string} msg — message to show
   */
  function showSuccess(msg) {
    if (!authSuccess) return;
    authSuccess.textContent = msg;
    authSuccess.classList.add('success');
    authSuccess.classList.remove('hidden');
    // Clear any previous error
    if (authError) {
      authError.textContent = '';
      authError.classList.add('hidden');
    }
  }

  /** Hide both feedback divs. */
  function clearMessages() {
    if (authError) {
      authError.textContent = '';
      authError.classList.add('hidden');
      authError.classList.remove('error');
    }
    if (authSuccess) {
      authSuccess.textContent = '';
      authSuccess.classList.add('hidden');
      authSuccess.classList.remove('success');
    }
  }

  // ── Login form submission ───────────────────────────────────────────
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMessages();

      const email    = loginForm.querySelector('[name="email"]').value.trim();
      const password = loginForm.querySelector('[name="password"]').value;

      if (!email || !password) {
        showError('Please enter both email and password.');
        return;
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data.success === true) {
          // Redirect to the role-appropriate dashboard
          window.location.href = '/dashboard';
        } else {
          showError(data.message || 'Login failed. Please check your credentials.');
        }
      } catch (err) {
        console.error('Login error:', err);
        showError('Network error — unable to reach the server.');
      }
    });
  }

  // ── Register form submission ────────────────────────────────────────
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMessages();

      const name     = registerForm.querySelector('[name="name"]').value.trim();
      const email    = registerForm.querySelector('[name="email"]').value.trim();
      const password = registerForm.querySelector('[name="password"]').value;
      const role     = registerForm.querySelector('[name="role"]').value;

      if (!name || !email || !password) {
        showError('Name, email, and password are required.');
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await res.json();

        if (data.success === true) {
          showSuccess(data.message || 'Registration successful! Switching to login…');
          // Auto-switch to login view after a short delay
          setTimeout(() => {
            if (registerForm) registerForm.classList.add('hidden');
            if (loginForm) loginForm.classList.remove('hidden');
            clearMessages();
          }, 1500);
        } else {
          showError(data.message || 'Registration failed.');
        }
      } catch (err) {
        console.error('Register error:', err);
        showError('Network error — unable to reach the server.');
      }
    });
  }

  // ── Toggle between Login ↔ Register ─────────────────────────────────
  if (showRegLink) {
    showRegLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearMessages();
      if (loginForm) loginForm.classList.add('hidden');
      if (registerForm) registerForm.classList.remove('hidden');
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearMessages();
      if (registerForm) registerForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
    });
  }
});

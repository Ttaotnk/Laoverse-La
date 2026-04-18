const t = (key, vars) => window.LanguageManager ? window.LanguageManager.translate(key, vars) : key;

const showMessage = (message, type = "info", duration = 3000) => {
  const messageDiv = document.getElementById(type === "login" ? "login-message" : "register-message");
  messageDiv.textContent = message;
  messageDiv.style.display = "block";
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, duration);
};

let registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function(event) {
    event.preventDefault();

    let username = document.getElementById('register-username').value.trim();
    let email = document.getElementById('register-email').value.trim();
    let password = document.getElementById('register-password').value;
    let confirmPassword = document.getElementById('confirm-password').value;

    if (username === '' || email === '' || password === '' || confirmPassword === '') {
      showMessage(t('auth.fillRegister'), "register");
      return;
    }

    if (password !== confirmPassword) {
      showMessage(t('auth.passwordMismatch'), "register");
      return;
    }
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strong.test(password)) {
      showMessage(t('auth.passwordWeak'), "register");
      return;
    }

    fetch('https://wit-lee-however-coleman.trycloudflare.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, confirmPassword })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          if (data.token) {
            localStorage.setItem('laoverse_jwt', data.token);
          }
          showMessage(t('auth.registerSuccess'), "register");
          window.location.href = 'index2.html';
        } else {
          showMessage(data.message || t('auth.registerFail'), "register");
        }
      })
      .catch(error => console.error('Error:', error));
  });
}

let loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    let username = document.getElementById('login-username').value;
    let password = document.getElementById('login-password').value;

    if (username === '' || password === '') {
      showMessage(t('auth.fillLogin'), "login");
      return;
    }

    fetch('https://wit-lee-however-coleman.trycloudflare.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          if (data.token) {
            localStorage.setItem('laoverse_jwt', data.token);
          }
          window.location.href = 'index.html';
        } else {
          showMessage(data.message || t('auth.loginFail'), "login");
        }
      })
      .catch(error => console.error('Error:', error));
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const themeSelect = document.getElementById("themeSelect");
  const logoutBtn = document.getElementById("logoutBtn");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const usernameInput = document.getElementById("usernameInput");
  const emailInput = document.getElementById("emailInput");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const supportBtn = document.getElementById("supportBtn");
  const languageSelect = document.getElementById("languageSelect");
  const message = document.getElementById("message");
  let lang = localStorage.getItem("laoverse_lang") || "lo";
  const t = (key, vars) => window.LanguageManager ? window.LanguageManager.translate(key, vars) : key;

  function applyLanguage() {
    if (languageSelect) languageSelect.value = lang;
    if (window.LanguageManager) window.LanguageManager.applyLanguage(lang);
  }

  function showMessage(text) {
    message.textContent = text;
    message.style.display = "block";
    setTimeout(() => {
      message.style.display = "none";
    }, 2500);
  }

  const currentTheme = window.ThemeManager ? window.ThemeManager.getTheme() : "default";
  if (themeSelect) themeSelect.value = currentTheme;

  if (themeSelect) {
    themeSelect.addEventListener("change", function () {
      if (window.ThemeManager) {
        window.ThemeManager.setTheme(themeSelect.value);
        showMessage(t("settings.themeOk"));
      }
    });
  }

  if (languageSelect) {
    languageSelect.value = lang;
    languageSelect.addEventListener("change", function () {
      lang = languageSelect.value;
      localStorage.setItem("laoverse_lang", lang);
      if (window.LanguageManager) {
        window.LanguageManager.setLanguage(lang);
      } else {
        applyLanguage();
      }
    });
  }

  async function loadCurrentProfile() {
    const res = await fetch("https://laoverse.vercel.app/api/loadProfile?user_id=current", { credentials: "include" });
    const data = await res.json();
    if (data.success && data.profile) {
      usernameInput.value = data.profile.username || "";
      if (data.profile.email) emailInput.value = data.profile.email;
    }
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async function () {
      const payload = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim()
      };
      const res = await fetch("https://laoverse.vercel.app/api/update_profile_info", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      showMessage(data.success ? t("settings.saved") : (data.message || t("settings.saveFail")));
    });
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async function () {
      const pw = newPassword.value;
      const cpw = confirmPassword.value;
      const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
      if (!strong.test(pw)) {
        showMessage(t("settings.badPassword"));
        return;
      }
      if (pw !== cpw) {
        showMessage(t("settings.pwMismatch"));
        return;
      }
      const res = await fetch("https://laoverse.vercel.app/api/change_password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: pw, confirmPassword: cpw })
      });
      const data = await res.json();
      showMessage(data.success ? t("settings.passwordChanged") : (data.message || t("settings.passwordChangeFail")));
      if (data.success) {
        newPassword.value = "";
        confirmPassword.value = "";
      }
    });
  }

  if (supportBtn) {
    supportBtn.addEventListener("click", function () {
      window.location.href = "support.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      localStorage.removeItem('laoverse_jwt');
      window.location.href = "index2.html";
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async function () {
      const ok = confirm(t("settings.deleteConfirm"));
      if (!ok) return;
      const res = await fetch("https://laoverse.vercel.app/api/delete_account", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('laoverse_jwt');
        alert(t("settings.deleteSuccess"));
        window.location.href = "index2.html";
      } else {
        showMessage(data.message || t("settings.deleteFail"));
      }
    });
  }

  document.addEventListener("laoverse:languagechange", function (event) {
    lang = event.detail.lang;
    applyLanguage();
  });

  loadCurrentProfile();
  applyLanguage();
});

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

  const t = (key, vars) =>
    window.LanguageManager
      ? window.LanguageManager.translate(key, vars)
      : key;

  function applyLanguage() {
    if (languageSelect) languageSelect.value = lang;
    if (window.LanguageManager) window.LanguageManager.applyLanguage(lang);
  }

  function showMessage(text) {
    message.textContent = text;
    message.style.display = "block";
    setTimeout(() => (message.style.display = "none"), 2500);
  }

  // ================= SAFE FETCH =================
  async function apiFetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(window.getAuthHeaders?.() || {}),
          ...(options.headers || {})
        },
        ...options
      });

      if (res.status === 401) {
        localStorage.removeItem("laoverse_jwt");
        window.location.href = "index2.html";
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error("API ERROR:", err);
      showMessage("Server error");
      return null;
    }
  }

  // ================= THEME =================
  const currentTheme = window.ThemeManager?.getTheme() || "default";
  if (themeSelect) themeSelect.value = currentTheme;

  themeSelect?.addEventListener("change", function () {
    window.ThemeManager?.setTheme(themeSelect.value);
    showMessage(t("settings.themeOk"));
  });

  // ================= LANGUAGE =================
  if (languageSelect) {
    languageSelect.value = lang;
    languageSelect.addEventListener("change", function () {
      lang = languageSelect.value;
      localStorage.setItem("laoverse_lang", lang);
      window.LanguageManager?.setLanguage(lang) || applyLanguage();
    });
  }

  // ================= LOAD PROFILE =================
  async function loadCurrentProfile() {
    const data = await apiFetch(`${window.API_BASE_URL}/loadProfile`);

    if (data?.success && data.profile) {
      usernameInput.value = data.profile.username || "";
      emailInput.value = data.profile.email || "";
    }
  }

  // ================= SAVE PROFILE =================
  saveProfileBtn?.addEventListener("click", async function () {

    const payload = {
      username: usernameInput.value.trim(),
      email: emailInput.value.trim()
    };

    const data = await apiFetch(`${window.API_BASE_URL}/update_profile_info`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    showMessage(
      data?.success
        ? t("settings.saved")
        : (data?.message || t("settings.saveFail"))
    );
  });

  // ================= CHANGE PASSWORD =================
  changePasswordBtn?.addEventListener("click", async function () {

    const pw = newPassword.value;
    const cpw = confirmPassword.value;

    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!strong.test(pw)) {
      return showMessage(t("settings.badPassword"));
    }

    if (pw !== cpw) {
      return showMessage(t("settings.pwMismatch"));
    }

    const data = await apiFetch(`${window.API_BASE_URL}/change_password`, {
      method: "POST",
      body: JSON.stringify({
        newPassword: pw,
        confirmPassword: cpw
      })
    });

    showMessage(
      data?.success
        ? t("settings.passwordChanged")
        : (data?.message || t("settings.passwordChangeFail"))
    );

    if (data?.success) {
      newPassword.value = "";
      confirmPassword.value = "";
    }
  });

  // ================= SUPPORT =================
  supportBtn?.addEventListener("click", () => {
    window.location.href = "support.html";
  });

  // ================= LOGOUT =================
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("laoverse_jwt");
    window.location.href = "index2.html";
  });

  // ================= DELETE ACCOUNT =================
  deleteAccountBtn?.addEventListener("click", async function () {

    const confirmed = await showConfirm(t("settings.deleteConfirm"));
    if (!confirmed) return;

    const data = await apiFetch(`${window.API_BASE_URL}/delete_account`, {
      method: "POST"
    });

    if (data?.success) {
      localStorage.removeItem("laoverse_jwt");
      showMessage(t("settings.deleteSuccess"));
      window.location.href = "index2.html";
    } else {
      showMessage(data?.message || t("settings.deleteFail"));
    }
  });

  // ================= LANGUAGE EVENT =================
  document.addEventListener("laoverse:languagechange", function (event) {
    lang = event.detail.lang;
    applyLanguage();
  });

  // INIT
  loadCurrentProfile();
  applyLanguage();
});
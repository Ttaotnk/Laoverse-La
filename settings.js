const wait = setInterval(() => {
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

  if (
    !themeSelect ||
    !logoutBtn ||
    !deleteAccountBtn ||
    !usernameInput ||
    !emailInput ||
    !saveProfileBtn ||
    !newPassword ||
    !confirmPassword ||
    !changePasswordBtn ||
    !supportBtn ||
    !languageSelect ||
    !message
  ) return;

  clearInterval(wait);

  let lang = localStorage.getItem("laoverse_lang") || "lo";

  const t = (key, vars) =>
    window.LanguageManager
      ? window.LanguageManager.translate(key, vars)
      : key;

  function applyLanguage() {
    languageSelect.value = lang;
    window.LanguageManager?.applyLanguage(lang);
  }

  function showMessage(text, type = "info") {
    message.textContent = text;
    message.style.display = "block";

    setTimeout(() => {
      message.style.display = "none";
    }, 2500);
  }

  /* ================= THEME ================= */
  const currentTheme = window.ThemeManager?.getTheme() || "default";
  themeSelect.value = currentTheme;

  themeSelect.addEventListener("change", () => {
    window.ThemeManager?.setTheme(themeSelect.value);
    showMessage(t("settings.themeOk"));
  });

  /* ================= LANGUAGE ================= */
  languageSelect.value = lang;

  languageSelect.addEventListener("change", () => {
    lang = languageSelect.value;
    localStorage.setItem("laoverse_lang", lang);
    window.LanguageManager?.setLanguage(lang);
  });

  /* ================= PROFILE LOAD ================= */
  async function loadCurrentProfile() {
    const res = await fetch(
      `${window.API_BASE_URL}/loadProfile?user_id=current`,
      {
        headers: window.getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success && data.profile) {
      usernameInput.value = data.profile.username || "";
      emailInput.value = data.profile.email || "";
    }
  }

  /* ================= SAVE PROFILE ================= */
  saveProfileBtn.addEventListener("click", async () => {
    const res = await fetch(
      `${window.API_BASE_URL}/update_profile_info`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...window.getAuthHeaders(),
        },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          email: emailInput.value.trim(),
        }),
      }
    );

    const data = await res.json();

    showMessage(
      data.success
        ? t("settings.saved")
        : data.message || t("settings.saveFail")
    );
  });

  /* ================= PASSWORD ================= */
  changePasswordBtn.addEventListener("click", async () => {
    const pw = newPassword.value;
    const cpw = confirmPassword.value;

    const strong =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!strong.test(pw)) {
      return showMessage(t("settings.badPassword"));
    }

    if (pw !== cpw) {
      return showMessage(t("settings.pwMismatch"));
    }

    const res = await fetch(
      `${window.API_BASE_URL}/change_password`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...window.getAuthHeaders(),
        },
        body: JSON.stringify({
          newPassword: pw,
          confirmPassword: cpw,
        }),
      }
    );

    const data = await res.json();

    showMessage(
      data.success
        ? t("settings.passwordChanged")
        : data.message || t("settings.passwordChangeFail")
    );

    if (data.success) {
      newPassword.value = "";
      confirmPassword.value = "";
    }
  });

  /* ================= SUPPORT ================= */
  supportBtn.addEventListener("click", () => {
    window.location.href = "support.html";
  });

  /* ================= LOGOUT ================= */
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("laoverse_jwt");
    window.location.href = "index2.html";
  });

  /* ================= DELETE ACCOUNT ================= */
  deleteAccountBtn.addEventListener("click", async () => {
    const confirmed = await showConfirm(
      t("settings.deleteConfirm")
    );
    if (!confirmed) return;

    const res = await fetch(
      `${window.API_BASE_URL}/delete_account`,
      {
        method: "POST",
        headers: window.getAuthHeaders(),
      }
    );

    const data = await res.json();

    if (data.success) {
      localStorage.removeItem("laoverse_jwt");
      showMessage(t("settings.deleteSuccess"), "success");
      window.location.href = "index2.html";
    } else {
      showMessage(data.message || t("settings.deleteFail"));
    }
  });

  /* ================= LANGUAGE EVENT ================= */
  document.addEventListener(
    "laoverse:languagechange",
    (event) => {
      lang = event.detail.lang;
      applyLanguage();
    }
  );

  loadCurrentProfile();
  applyLanguage();
}, 50);
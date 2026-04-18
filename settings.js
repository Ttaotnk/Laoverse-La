document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  const message = $("message");

  // ================= LANGUAGE =================
  function getLang() {
    return localStorage.getItem("laoverse_lang") || "lo";
  }

  function t(key) {
    const lang = getLang();
    return (window.DICT?.[lang]?.[key]) || key;
  }

  function showMessage(key, type = "info") {
    message.innerText = t(key);
    message.className = type;
    message.style.display = "block";

    setTimeout(() => {
      message.style.display = "none";
    }, 3000);
  }

  // ================= LOAD PROFILE =================
  async function loadProfile() {
    try {
      const res = await fetch(`${window.BACKEND_URL}/loadProfile`);
      const data = await res.json();

      if (data.success) {
        $("usernameInput").value = data.profile.username || "";
        $("emailInput").value = data.profile.email || "";
      }
    } catch (err) {
      showMessage("profile.connectionError");
    }
  }

  // ================= SAVE PROFILE =================
  $("saveProfileBtn").addEventListener("click", async () => {

    const payload = {
      username: $("usernameInput").value.trim(),
      email: $("emailInput").value.trim()
    };

    try {
      const res = await fetch(`${window.BACKEND_URL}/update_profile_info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        showMessage("settings.saved");
      } else {
        showMessage("settings.saveFail");
      }

    } catch {
      showMessage("profile.connectionError");
    }
  });

  // ================= CHANGE PASSWORD =================
  $("changePasswordBtn").addEventListener("click", async () => {

    const pw = $("newPassword").value;
    const cpw = $("confirmPassword").value;

    if (pw !== cpw) {
      return showMessage("settings.pwMismatch");
    }

    if (pw.length < 8) {
      return showMessage("settings.badPassword");
    }

    try {
      const res = await fetch(`${window.BACKEND_URL}/change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: pw,
          confirmPassword: cpw
        })
      });

      const data = await res.json();

      if (data.success) {
        showMessage("settings.passwordChanged");
        $("newPassword").value = "";
        $("confirmPassword").value = "";
      } else {
        showMessage("settings.passwordChangeFail");
      }

    } catch {
      showMessage("profile.connectionError");
    }
  });

  // ================= DELETE ACCOUNT =================
  $("deleteAccountBtn").addEventListener("click", async () => {

    if (!confirm(t("settings.deleteConfirm"))) return;

    try {
      const res = await fetch(`${window.BACKEND_URL}/delete_account`, {
        method: "POST"
      });

      const data = await res.json();

      if (data.success) {
        showMessage("settings.deleteSuccess");
        localStorage.removeItem("laoverse_jwt");
        window.location.href = "index2.html";
      } else {
        showMessage("settings.deleteFail");
      }

    } catch {
      showMessage("profile.connectionError");
    }
  });

  // ================= LOGOUT =================
  $("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("laoverse_jwt");
    window.location.href = "index2.html";
  });

  // ================= THEME =================
  $("themeSelect").addEventListener("change", e => {
    localStorage.setItem("theme", e.target.value);
    document.body.setAttribute("data-theme", e.target.value);
    showMessage("settings.themeOk");
  });

  // ================= LANGUAGE =================
  $("languageSelect").value = getLang();

  $("languageSelect").addEventListener("change", e => {
    localStorage.setItem("laoverse_lang", e.target.value);
    location.reload();
  });

  // INIT
  loadProfile();
});
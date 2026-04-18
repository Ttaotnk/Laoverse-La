document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  const message = $("message");

  function showMessage(text, type = "info") {
    message.innerText = text;
    message.className = type;
    message.style.display = "block";

    setTimeout(() => {
      message.style.display = "none";
    }, 3000);
  }

  // ================= API HELPER =================
  async function apiFetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(window.getAuthHeaders ? window.getAuthHeaders() : {}),
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
      console.error(err);
      showMessage("Server error");
    }
  }

  // ================= LOAD PROFILE =================
  async function loadProfile() {
    const data = await apiFetch(`${window.API_BASE_URL}/loadProfile`);

    if (data && data.success) {
      $("usernameInput").value = data.profile.username || "";
      $("emailInput").value = data.profile.email || "";
    }
  }

  // ================= SAVE PROFILE =================
  $("saveProfileBtn").addEventListener("click", async () => {

    const payload = {
      username: $("usernameInput").value.trim(),
      email: $("emailInput").value.trim()
    };

    const data = await apiFetch(`${window.API_BASE_URL}/update_profile_info`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    showMessage(data?.success ? "Saved!" : (data?.message || "Error"));
  });

  // ================= CHANGE PASSWORD =================
  $("changePasswordBtn").addEventListener("click", async () => {

    const pw = $("newPassword").value;
    const cpw = $("confirmPassword").value;

    if (pw !== cpw) {
      return showMessage("Password not match");
    }

    if (pw.length < 6) {
      return showMessage("Password too short");
    }

    const data = await apiFetch(`${window.API_BASE_URL}/change_password`, {
      method: "POST",
      body: JSON.stringify({
        newPassword: pw,
        confirmPassword: cpw
      })
    });

    if (data?.success) {
      showMessage("Password changed");
      $("newPassword").value = "";
      $("confirmPassword").value = "";
    } else {
      showMessage(data?.message || "Error");
    }
  });

  // ================= DELETE ACCOUNT =================
  $("deleteAccountBtn").addEventListener("click", async () => {

    if (!confirm("Are you sure?")) return;

    const data = await apiFetch(`${window.API_BASE_URL}/delete_account`, {
      method: "POST"
    });

    if (data?.success) {
      localStorage.removeItem("laoverse_jwt");
      window.location.href = "index2.html";
    } else {
      showMessage(data?.message || "Delete failed");
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
  });

  // ================= LANGUAGE =================
  $("languageSelect").addEventListener("change", e => {
    localStorage.setItem("lang", e.target.value);
    showMessage("Language changed (reload page)");
  });

  loadProfile();
});
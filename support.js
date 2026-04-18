document.addEventListener("DOMContentLoaded", function () {
  const title = document.getElementById("supportTitle");
  const content = document.getElementById("supportMessage");
  const btn = document.getElementById("sendSupportBtn");
  const msg = document.getElementById("message");
  const emailField = document.getElementById("supportEmail");
  const t = (key, vars) => window.LanguageManager ? window.LanguageManager.translate(key, vars) : key;

  function getAuthHeaders() {
    const token = localStorage.getItem('laoverse_jwt');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async function loadUserEmail() {
    try {
      const res = await fetch("https://acquisitions-showed-privacy-next.trycloudflare.com/api/loadProfile?user_id=current", { 
        headers: getAuthHeaders(), 
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success && data.profile) {
        emailField.value = data.profile.email || t("support.noEmail", "No email provided");
      } else {
        emailField.placeholder = "Failed to load email";
      }
    } catch (e) {
      console.error(e);
      emailField.placeholder = "Error connecting to server";
    }
  }

  loadUserEmail();

  function show(text) {
    msg.textContent = text;
    msg.style.display = "block";
    setTimeout(() => (msg.style.display = "none"), 2500);
  }

  btn.addEventListener("click", async function () {
    if (!title.value.trim() || !content.value.trim()) {
      show(t("support.fillAll"));
      return;
    }
    const res = await fetch("https://acquisitions-showed-privacy-next.trycloudflare.com/api/support_request", {
      method: "POST",
      credentials: "include",
      headers: { 
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        title: title.value.trim(),
        message: content.value.trim()
      })
    });
    const data = await res.json();
    if (data.success) {
      title.value = "";
      content.value = "";
      show(t("support.success"));
    } else {
      show(data.message || t("support.fail"));
    }
  });
});

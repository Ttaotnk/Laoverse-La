document.addEventListener("DOMContentLoaded", function () {
  const title = document.getElementById("supportTitle");
  const content = document.getElementById("supportMessage");
  const btn = document.getElementById("sendSupportBtn");
  const msgBox = document.getElementById("message");
  const emailField = document.getElementById("supportEmail");

  const t = (key, vars) => (window.LanguageManager ? window.LanguageManager.translate(key, vars) : key);

  function showMessage(text, type = "info") {
    const box = msgBox || createMessageDiv();
    box.textContent = text;
    box.className = `message ${type}`;
    box.style.display = "block";
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      box.style.display = "none";
    }, 3000);
  }

  function createMessageDiv() {
    const div = document.createElement("div");
    div.id = "message";
    document.body.prepend(div);
    return div;
  }

  async function loadUserEmail() {
    try {
      const res = await fetch(`${window.API_BASE_URL}/loadProfile?user_id=current`, { 
        headers: getAuthHeaders(), 
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success && data.profile) {
        emailField.value = data.profile.email || t("support.noEmail");
      } else {
        emailField.placeholder = t("profile.loadFailed");
      }
    } catch (e) {
      console.error(e);
      emailField.placeholder = t("profile.connectionError");
    }
  }

  loadUserEmail();

  btn.addEventListener("click", async function () {
    const tVal = title.value.trim();
    const mVal = content.value.trim();

    if (!tVal || !mVal) {
      showMessage(t("support.fillAll"), "error");
      return;
    }

    try {
        const res = await fetch(`${window.API_BASE_URL}/support_request`, {
          method: "POST",
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            title: tVal,
            message: mVal
          })
        });
        const data = await res.json();
        if (data.success) {
          title.value = "";
          content.value = "";
          showMessage(t("support.success"), "success");
        } else {
          showMessage(data.message || t("support.fail"), "error");
        }
    } catch(e) {
        showMessage(t("profile.connectionError"), "error");
    }
  });
});

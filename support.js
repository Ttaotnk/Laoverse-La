document.addEventListener("DOMContentLoaded", function () {
  const title = document.getElementById("supportTitle");
  const content = document.getElementById("supportMessage");
  const btn = document.getElementById("sendSupportBtn");
  const msg = document.getElementById("message");
  const t = (key, vars) => window.LanguageManager ? window.LanguageManager.translate(key, vars) : key;

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
    const res = await fetch("https://laoverse-production.up.railway.app/api/support_request", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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

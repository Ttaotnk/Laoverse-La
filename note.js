let notifications = [];

function t(key, vars) {
  if (window.LanguageManager && typeof window.LanguageManager.translate === "function") {
    return window.LanguageManager.translate(key, vars);
  }
  return key;
}

function formatRelativeTime(value) {
  if (window.LanguageManager && typeof window.LanguageManager.formatRelativeTime === "function") {
    return window.LanguageManager.formatRelativeTime(value);
  }
  return "";
}

function safeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showLoading(show) {
  const loader = document.getElementById("loading") || createLoadingDiv();
  loader.style.display = show ? "flex" : "none";
}

function createLoadingDiv() {
  const div = document.createElement("div");
  div.id = "loading";
  div.innerHTML = `<div class="spinner"></div><span>${safeHtml(t("common.loading"))}</span>`;
  document.body.appendChild(div);
  return div;
}

function showMessage(message, type) {
  const box = document.getElementById("message") || createMessageDiv();
  box.textContent = message;
  box.className = `message ${type || "info"}`;
  box.style.display = "block";
  window.clearTimeout(showMessage.timer);
  showMessage.timer = window.setTimeout(() => {
    box.style.display = "none";
  }, 3000);
}

function createMessageDiv() {
  const div = document.createElement("div");
  div.id = "message";
  document.body.appendChild(div);
  return div;
}

function goToUserProfile(userId) {
  if (!userId) return;
  window.location.href = `user-profile.html?id=${encodeURIComponent(userId)}`;
}

function getNotificationIcon(type) {
  switch (type) {
    case 'like':
      return '❤️';
    case 'comment':
      return '💬';
    case 'friend-request':
      return '👥';
    default:
      return '🔔';
  }
}

function renderNotifications(notifs) {
  notifications = Array.isArray(notifs) ? notifs : [];
  const container = document.getElementById("notificationsContainer");
  if (!container) return;

  if (!notifications.length) {
    container.innerHTML = `<div class="no-notifications">${safeHtml(t("note.empty") || "No notifications")}</div>`;
    return;
  }

  container.innerHTML = notifications.map((notif) => {
    const icon = getNotificationIcon(notif.type);
    
    if (notif.type === 'friend-request') {
      return `
        <div class="notification friend-request-notif" data-id="${safeHtml(notif.id)}">
          <img src="${safeHtml(notif.actor_pic || "default-profile.png")}"
               class="notif-avatar"
               onclick="goToUserProfile('${safeHtml(notif.actor_id || "")}')"
               style="cursor:pointer;"
               onerror="this.src='default-profile.png'">
          <div class="notif-content">
            <div class="notif-message">
              <span class="notif-icon">${icon}</span>
              <span class="notif-text">
                <strong onclick="goToUserProfile('${safeHtml(notif.actor_id)}')" style="cursor:pointer;">${safeHtml(notif.actor_name)}</strong>
                ${safeHtml(t("note.sentFriendRequest"))}
              </span>
            </div>
            <small class="notif-time">${safeHtml(formatRelativeTime(notif.created_at))}</small>
            <div class="friend-request-actions">
              <button class="accept-request" data-user-id="${safeHtml(notif.actor_id)}" data-request-id="${safeHtml(notif.id)}">✓ ${safeHtml(t("friends.accept"))}</button>
              <button class="decline-request" data-user-id="${safeHtml(notif.actor_id)}" data-request-id="${safeHtml(notif.id)}">✕ ${safeHtml(t("friends.reject"))}</button>
            </div>
          </div>
        </div>
      `;
    }

    let contentPreview = "";
    if (notif.type === 'like') {
      contentPreview = `<span class="content-preview">"${safeHtml((notif.target_content || "").substring(0, 50))}"</span>`;
    } else if (notif.type === 'comment') {
      contentPreview = `<span class="comment-preview">"${safeHtml((notif.comment_text || "").substring(0, 50))}"</span>`;
    }

    return `
      <div class="notification ${notif.type}-notif" data-id="${safeHtml(notif.id)}">
        <img src="${safeHtml(notif.actor_pic || "default-profile.png")}"
             class="notif-avatar"
             onclick="goToUserProfile('${safeHtml(notif.actor_id || "")}')"
             style="cursor:pointer;"
             onerror="this.src='default-profile.png'">
        <div class="notif-content">
          <div class="notif-message">
            <span class="notif-icon">${icon}</span>
            <span class="notif-text">
              <strong onclick="goToUserProfile('${safeHtml(notif.actor_id)}')" style="cursor:pointer;">${safeHtml(notif.actor_name)}</strong>
              ${safeHtml(t(notif.type === 'like' ? "note.likedYourPost" : "note.commentedOnYourPost"))}
            </span>
          </div>
          <small class="notif-time">${safeHtml(formatRelativeTime(notif.created_at))}</small>
          ${contentPreview}
        </div>
      </div>
    `;
  }).join("");
}

async function loadNotifications() {
  showLoading(true);
  try {
    const token = localStorage.getItem('laoverse_jwt') || '';
    const response = await fetch("https://laoverse-production.up.railway.app/api/get-notifications", { 
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      renderNotifications(data.notifications || []);
      return;
    }
    showMessage(data.message || t("note.loadFailed") || "Failed to load notifications", "error");
  } catch (error) {
    showMessage(t("note.loadFailed") || "Failed to load notifications", "error");
  } finally {
    showLoading(false);
  }
}

async function handleFriendRequest(action, userId, requestId) {
  showLoading(true);
  try {
    const status = action === 'accept' ? 'accepted' : 'rejected';
    const token = localStorage.getItem('laoverse_jwt') || '';
    
    const response = await fetch("https://laoverse-production.up.railway.app/api/respond_request", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`
      },
      body: `sender_id=${encodeURIComponent(userId)}&status=${encodeURIComponent(status)}`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(action === 'accept' ? "Friend request accepted" : "Friend request declined", "success");
      await loadNotifications();
      return;
    }
    showMessage(data.message || "Action failed", "error");
  } catch (error) {
    showMessage("Action failed", "error");
  } finally {
    showLoading(false);
  }
}

function setupInteractions() {
  document.addEventListener("click", async (event) => {
    const acceptBtn = event.target.closest(".accept-request");
    if (acceptBtn) {
      await handleFriendRequest('accept', acceptBtn.dataset.userId, acceptBtn.dataset.requestId);
      return;
    }

    const declineBtn = event.target.closest(".decline-request");
    if (declineBtn) {
      await handleFriendRequest('decline', declineBtn.dataset.userId, declineBtn.dataset.requestId);
      return;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem('laoverse_jwt') || '';
    const authResponse = await fetch("https://laoverse-production.up.railway.app/api/check_auth", { 
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const authData = await authResponse.json();
    if (!authData.success) {
      window.location.href = "index2.html";
      return;
    }
  } catch (error) {
    window.location.href = "index2.html";
    return;
  }

  setupInteractions();
  loadNotifications();
});

document.addEventListener("laoverse:languagechange", () => {
  renderNotifications(notifications);
  const loading = document.getElementById("loading");
  if (loading) {
    const text = loading.querySelector("span");
    if (text) text.textContent = t("common.loading");
  }
});

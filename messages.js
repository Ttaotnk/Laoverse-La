let currentUser = null;
let currentFriend = null;
let friends = [];
let messagesByFriend = {};
let pollTimers = { friends: null, messages: null };
let lastFetched = {};
let trackedAudio = [];
let isScrolledUp = false;

function t(key, vars) {
  if (window.LanguageManager && typeof window.LanguageManager.translate === "function") {
    return window.LanguageManager.translate(key, vars);
  }
  return key;
}

function safeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getChatContainer() {
  return document.getElementById("chat-messages") || document.getElementById("chat-box");
}

function formatTimestamp(value) {
  const date = new Date(/z$/i.test(value || "") ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function profileImage(path) {
  if (!path) return "default-profile.png";
  if (window.LanguageManager && window.LanguageManager.resolveMediaUrl) {
    return window.LanguageManager.resolveMediaUrl(path);
  }
  return path;
}

function resolveMediaUrl(filePath) {
  if (!filePath) return "";
  if (window.LanguageManager && window.LanguageManager.resolveMediaUrl) {
    return window.LanguageManager.resolveMediaUrl(filePath);
  }
  
  const raw = String(filePath || "").trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  
  const backendUrl = window.BACKEND_URL;
  const normalized = raw.replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().indexOf("uploads/");
  if (uploadsIndex >= 0) {
    return `${backendUrl}/${normalized.slice(uploadsIndex)}`;
  }
  return `${backendUrl}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}

function detectFileKind(fileType, filePath) {
  const type = String(fileType || "").toLowerCase();
  const path = String(filePath || "").toLowerCase();

  if (type.startsWith("image/") || ["image", "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(type) || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path)) {
    return "image";
  }
  if (type.startsWith("video/") || ["video", "mp4", "webm", "mov", "mkv", "avi", "m4v", "ogv"].includes(type) || /\.(mp4|webm|mov|mkv|avi|m4v|ogv)$/i.test(path)) {
    return "video";
  }
  if (type.startsWith("audio/") || ["audio", "mp3", "wav", "ogg", "aac", "m4a", "flac", "oga"].includes(type) || /\.(mp3|wav|ogg|aac|m4a|flac|oga)$/i.test(path)) {
    return "audio";
  }
  return "file";
}

function setComposerEnabled(enabled) {
  ["message-input", "file-button", "send-button", "file-input"].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.disabled = !enabled;
  });
}

function pauseAllAudio() {
  trackedAudio.forEach((audio) => {
    if (audio && !audio.paused) audio.pause();
  });
  document.querySelectorAll("audio").forEach((audio) => {
    if (!audio.paused) audio.pause();
  });
  document.querySelectorAll("video").forEach((video) => {
    if (!video.paused) video.pause();
  });
}

function renderFriendsList() {
  const container = document.getElementById("friends-list");
  if (!container) return;

  if (!friends.length) {
    container.innerHTML = `<div class="no-friends">${safeHtml(t("friends.noFriends"))}</div>`;
    return;
  }

  container.innerHTML = friends.map((friend) => {
    const active = currentFriend && String(currentFriend.id) === String(friend.id);
    return `
      <div class="friend-item${active ? " active" : ""}" data-friend-id="${safeHtml(friend.id)}">
        <div class="friend-avatar">
          <img src="${safeHtml(profileImage(friend.profile_pic))}" alt="${safeHtml(friend.username)}" onerror="this.src='default-profile.png'">
        </div>
        <div class="friend-info">
          <div class="friend-name">${safeHtml(friend.username || t("messages.noName"))}</div>
          <div class="friend-status">${safeHtml(friend.status || "")}</div>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".friend-item").forEach((item) => {
    item.addEventListener("click", () => {
      const friend = friends.find((entry) => String(entry.id) === String(item.dataset.friendId));
      if (friend) selectFriend(friend);
    });
  });
}

function renderEmptyChat() {
  const container = getChatContainer();
  if (!container) return;
  container.innerHTML = `<div class="loading" id="chat-empty-state">${safeHtml(t("messages.emptyChat"))}</div>`;
}

function renderFile(message) {
  if (!message.file_path) return "";

  const resolvedPath = resolveMediaUrl(message.file_path);
  const filePath = encodeURI(resolvedPath);
  const kind = detectFileKind(message.file_type, resolvedPath);
  const fileName = message.file_name ? ` (${safeHtml(message.file_name)})` : "";

  if (kind === "image") {
    return `<img src="${filePath}" alt="image" class="message-file">`;
  }
  if (kind === "video") {
    return `<video controls playsinline preload="metadata" class="message-file" src="${filePath}">${safeHtml(t("messages.videoUnsupported"))}</video>`;
  }
  if (kind === "audio") {
    const id = `audio-${message.id}-${Date.now()}`;
    window.setTimeout(() => {
      const audio = document.getElementById(id);
      if (audio) trackedAudio.push(audio);
    }, 0);
    return `<audio id="${id}" controls preload="metadata" class="message-file" src="${filePath}">${safeHtml(t("messages.audioUnsupported"))}</audio>`;
  }
  if (/\.pdf$/i.test(filePath) || String(message.file_type || "").toLowerCase() === "application/pdf") {
    return `<a href="${filePath}" target="_blank" class="message-file">${safeHtml(t("messages.downloadPdf"))}${fileName}</a>`;
  }
  return `<a href="${filePath}" target="_blank" class="message-file">${safeHtml(t("messages.downloadFile"))}${fileName}</a>`;
}

function renderMessages(messageList, replaceAll) {
  const container = getChatContainer();
  if (!container) return;

  if (replaceAll) {
    container.innerHTML = "";
    trackedAudio = [];
  }

  if (!Array.isArray(messageList) || !messageList.length) {
    if (replaceAll) renderEmptyChat();
    return;
  }

  const shouldScroll = !isScrolledUp;

  messageList.forEach((message) => {
    const canModify = currentUser && (String(message.sender_id || "") === String(currentUser) || String(message.direction || "") === "right");
    const id = `msg-${message.id}`;
    if (!replaceAll && document.getElementById(id)) return;

    const node = document.createElement("div");
    node.className = `message ${message.direction || message.position || "left"}`;
    node.id = id;
    node.innerHTML = `
      <div class="message-content">
        <div class="message-header">
          <strong>${safeHtml(message.username || message.sender_name || t("messages.unknownSender"))}</strong>
          <small class="timestamp">${safeHtml(formatTimestamp(message.created_at))}</small>
        </div>
        ${message.message ? `<div class="message-text">${safeHtml(message.message)}</div>` : ""}
        ${renderFile(message)}
        ${canModify ? `
          <div class="message-actions">
            <button class="msg-edit-toggle" data-message-id="${safeHtml(message.id)}" title="${safeHtml(t("common.edit"))}"><img src="icons/edit.svg" alt="edit" class="btn-icon edit-icon"></button>
            <button class="msg-delete-btn" data-message-id="${safeHtml(message.id)}" title="${safeHtml(t("common.delete"))}"><img src="icons/delete.svg" alt="delete" class="btn-icon delete-icon"></button>
          </div>
          <div class="message-edit-box" id="edit-msg-${safeHtml(message.id)}" style="display:none;">
            <textarea class="message-edit-input" rows="2">${safeHtml(message.message || "")}</textarea>
            <div class="message-edit-actions">
              <button class="msg-edit-save" data-message-id="${safeHtml(message.id)}">${safeHtml(t("common.save"))}</button>
              <button class="msg-edit-cancel" data-message-id="${safeHtml(message.id)}">${safeHtml(t("common.cancel"))}</button>
            </div>
          </div>
        ` : ``}
      </div>
    `;
    container.appendChild(node);
  });

  if (shouldScroll) {
    window.setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 20);
  }
}

async function deleteMessage(messageId) {
  const payload = new URLSearchParams();
  payload.set("message_id", messageId);

  const response = await fetch(`${window.API_BASE_URL}/delete_message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...getAuthHeaders()
    },
    body: payload.toString(),
    credentials: "include"
  });
  return response.json();
}

async function editMessage(messageId, nextText) {
  const payload = new URLSearchParams();
  payload.set("message_id", messageId);
  payload.set("message", nextText);

  const response = await fetch(`${window.API_BASE_URL}/edit_message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...getAuthHeaders()
    },
    body: payload.toString(),
    credentials: "include"
  });
  return response.json();
}

async function loadFriends() {
  const response = await fetch(`${window.API_BASE_URL}/get_friends`, { headers: getAuthHeaders(), credentials: "include" });
  if (!response.ok) throw new Error("friends");
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "friends");
  friends = Array.isArray(data.friends) ? data.friends : [];
  renderFriendsList();

  const urlParams = new URLSearchParams(window.location.search || "");
  const requestedId = urlParams.get("id");
  if (requestedId && !currentFriend) {
    const matched = friends.find((friend) => String(friend.id) === String(requestedId));
    if (matched) selectFriend(matched);
  }
}

async function loadMessages(friendId, forceFullReload) {
  const query = forceFullReload ? 0 : (lastFetched[friendId] || 0);
  const response = await fetch(`${window.API_BASE_URL}/get_messages?friend_id=${encodeURIComponent(friendId)}&last_update=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
    credentials: "include"
  });
  if (!response.ok) throw new Error("messages");
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "messages");

  if (!Array.isArray(messagesByFriend[friendId]) || forceFullReload) {
    messagesByFriend[friendId] = [];
  }

  const incoming = Array.isArray(data.messages) ? data.messages : [];
  incoming.forEach((message) => {
    if (!messagesByFriend[friendId].some((entry) => String(entry.id) === String(message.id))) {
      messagesByFriend[friendId].push(message);
    }
  });
  lastFetched[friendId] = Date.now();

  if (currentFriend && String(currentFriend.id) === String(friendId)) {
    renderMessages(forceFullReload ? messagesByFriend[friendId] : incoming, !!forceFullReload);
    if (!messagesByFriend[friendId].length) {
      renderEmptyChat();
    }
  }
}

async function selectFriend(friend) {
  currentFriend = friend;
  pauseAllAudio();

  const header = document.getElementById("chat-header-name");
  if (header) {
    header.textContent = friend.username || t("messages.noName");
  }

  renderFriendsList();
  setComposerEnabled(true);
  await loadMessages(friend.id, true);
}

async function sendMessage() {
  if (!currentFriend || !currentFriend.id) return false;

  const input = document.getElementById("message-input");
  const fileInput = document.getElementById("file-input");
  const content = input ? input.value.trim() : "";
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (!content && !file) return false;

  const formData = new FormData();
  formData.append("receiver_id", currentFriend.id);
  if (content) formData.append("message", content);
  if (file) formData.append("file", file);

  const response = await fetch(`${window.API_BASE_URL}/send_message`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
    credentials: "include"
  });
  if (!response.ok) throw new Error("send");
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "send");

  if (input) input.value = "";
  if (fileInput) fileInput.value = "";

  if (!messagesByFriend[currentFriend.id]) {
    messagesByFriend[currentFriend.id] = [];
  }

  if (data.newMessage) {
    messagesByFriend[currentFriend.id].push(data.newMessage);
    renderMessages([data.newMessage], false);
  } else {
    await loadMessages(currentFriend.id);
  }
  return true;
}

function startPolling() {
  stopPolling();
  pollTimers.friends = window.setInterval(() => {
    loadFriends().catch(() => {});
  }, 10000);
  pollTimers.messages = window.setInterval(() => {
    if (currentFriend && currentFriend.id) {
      loadMessages(currentFriend.id).catch(() => {});
    }
  }, 3000);
}

function stopPolling() {
  if (pollTimers.friends) window.clearInterval(pollTimers.friends);
  if (pollTimers.messages) window.clearInterval(pollTimers.messages);
}

function setupEvents() {
  const sendButton = document.getElementById("send-button");
  const fileButton = document.getElementById("file-button");
  const fileInput = document.getElementById("file-input");
  const messageInput = document.getElementById("message-input");
  const chat = getChatContainer();

  if (sendButton) {
    sendButton.addEventListener("click", () => {
      sendMessage().catch(() => {});
    });
  }

  if (fileButton && fileInput) {
    fileButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      sendMessage().catch(() => {});
    });
  }

  if (messageInput) {
    messageInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage().catch(() => {});
      }
    });
  }

  if (chat) {
    chat.addEventListener("scroll", () => {
      isScrolledUp = (chat.scrollHeight - chat.scrollTop - chat.clientHeight) > 100;
    });

    chat.addEventListener("click", async (event) => {
      const editToggle = event.target.closest(".msg-edit-toggle");
      if (editToggle) {
        const box = document.getElementById(`edit-msg-${editToggle.dataset.messageId}`);
        if (box) {
          box.style.display = box.style.display === "none" ? "block" : "none";
          const input = box.querySelector(".message-edit-input");
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }
        return;
      }

      const cancel = event.target.closest(".msg-edit-cancel");
      if (cancel) {
        const box = document.getElementById(`edit-msg-${cancel.dataset.messageId}`);
        if (box) box.style.display = "none";
        return;
      }

      const save = event.target.closest(".msg-edit-save");
      if (save) {
        const box = document.getElementById(`edit-msg-${save.dataset.messageId}`);
        const input = box ? box.querySelector(".message-edit-input") : null;
        const nextText = input ? input.value.trim() : "";
        if (!nextText) return;

        try {
          const data = await editMessage(save.dataset.messageId, nextText);
          if (data.success) {
            if (box) box.style.display = "none";
            await loadMessages(currentFriend.id, true);
          }
        } catch (error) {}
        return;
      }

      const del = event.target.closest(".msg-delete-btn");
      if (del) {
        try {
          const ok = window.showConfirm
            ? await window.showConfirm(t("messages.confirmDeleteMessage"), t("common.confirm"))
            : window.confirm(t("messages.confirmDeleteMessage"));
          if (!ok) return;

          const data = await deleteMessage(del.dataset.messageId);
          if (data.success) {
            await loadMessages(currentFriend.id, true);
          }
        } catch (error) {}
      }
    });
  }

  window.addEventListener("beforeunload", stopPolling);
}

async function init() {
  renderEmptyChat();
  setComposerEnabled(false);
  setupEvents();

  const response = await fetch(`${window.API_BASE_URL}/check_auth`, { headers: getAuthHeaders(), credentials: "include" });
  const data = await response.json();
  if (!data.success || !data.user || !data.user.id) {
    window.location.href = "index2.html";
    return;
  }

  currentUser = data.user.id;
  document.body.setAttribute("data-user-id", currentUser);

  await loadFriends();
  startPolling();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch(() => {
    window.location.href = "index2.html";
  });
});

document.addEventListener("laoverse:languagechange", () => {
  renderFriendsList();
  if (currentFriend) {
    const header = document.getElementById("chat-header-name");
    if (header) header.textContent = currentFriend.username || t("messages.noName");
    renderMessages(messagesByFriend[currentFriend.id] || [], true);
  } else {
    renderEmptyChat();
  }
});

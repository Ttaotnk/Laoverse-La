let currentUser = null;
let currentFriend = null;
let friends = [];
let pollTimers = { friends: null, messages: null, presence: null };
let selectedFile = null;
let editingMessageId = null;

function t(key, vars) {
  return (window.LanguageManager && typeof window.LanguageManager.translate === "function") 
    ? window.LanguageManager.translate(key, vars) : key;
}

function safeHtml(v) {
  return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
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
  div.className = "message";
  document.body.appendChild(div);
  return div;
}

function profileImage(path) {
  return (window.LanguageManager && window.LanguageManager.resolveMediaUrl) 
    ? window.LanguageManager.resolveMediaUrl(path || window.getThemeDefaultProfile()) : (path || window.getThemeDefaultProfile());
}

async function resolveMedia(path, el) {
    if (!path) return "";
    
    // Method 1: Try resolving URL normally
    const backendUrl = window.BACKEND_URL || "http://localhost:3000";
    let fullUrl = path;
    if (!path.startsWith("http") && !path.startsWith("blob:") && !path.startsWith("data:")) {
        fullUrl = backendUrl + (path.startsWith("/") ? "" : "/") + path;
    }
    
    // Method 2: Try Direct Fetch as Blob (for security/consistency)
    if (window.LanguageManager && window.LanguageManager.fetchMediaAsBlob) {
        try {
            const blobUrl = await window.LanguageManager.fetchMediaAsBlob(path);
            if (el) el.src = blobUrl;
            return blobUrl;
        } catch(e) {
            console.error("Blob fetch failed, falling back to URL:", e);
            if (el) el.src = fullUrl;
            return fullUrl;
        }
    }
    if (el) el.src = fullUrl;
    return fullUrl;
}

function formatMsgTime(d) {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderFriendsList() {
  const container = document.getElementById("friends-list");
  if (!container) return;
  if (!friends.length) {
    container.innerHTML = `<div class="empty-chat-msg">${safeHtml(t("friends.noFriends"))}</div>`;
    return;
  }

  container.innerHTML = friends.map((f) => {
    const active = currentFriend && String(currentFriend.id) === String(f.id);
    const unread = f.unread_count > 0 ? `<span class="unread-badge">${f.unread_count}</span>` : "";
    return `
      <div class="friend-item-wa ${f.is_online ? 'online' : ''} ${active ? "active" : ""}" onclick="selectFriendById('${f.id}')">
        <div class="avatar-wrapper">
          <img src="${safeHtml(profileImage(f.profile_pic))}" onerror="this.src=window.getThemeDefaultProfile()">
          <span class="online-dot"></span>
        </div>
        <div class="item-content">
          <div class="item-top">
            <span class="item-name">${safeHtml(f.username)}</span>
            <span class="item-time">${safeHtml(formatMsgTime(f.last_message_time))}</span>
          </div>
          <div class="item-bottom">
            <span class="item-msg">${safeHtml(f.last_message || "")}</span>
            ${unread}
          </div>
        </div>
      </div>`;
  }).join("");
}

function selectFriendById(id) {
    const f = friends.find(item => String(item.id) === String(id));
    if (f) selectFriend(f);
}

async function selectFriend(f) {
  currentFriend = f;
  document.body.classList.add("chat-open");
  
  const local = friends.find(item => String(item.id) === String(f.id));
  if (local) local.unread_count = 0;
  renderFriendsList();

  document.getElementById("chat-header-name").textContent = f.username;
  document.getElementById("chat-avatar").src = profileImage(f.profile_pic);
  const dot = document.getElementById("chat-online-dot");
  dot.style.backgroundColor = f.is_online ? "var(--wa-online)" : "#555";
  dot.style.display = "block";

  cancelFileSelection();
  cancelEdit();
  
  fetch(`${window.API_BASE_URL}/mark_messages_read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ friend_id: f.id })
  }).catch(e => {});

  loadMessages(f.id, true);
}

function renderMessages(list, replaceAll) {
  const container = document.getElementById("chat-messages");
  if (!container) return;
  if (replaceAll) container.innerHTML = "";
  if (!list.length && replaceAll) {
    container.innerHTML = `<div class="empty-chat-msg">${safeHtml(t("messages.emptyChat"))}</div>`;
    return;
  }

  list.forEach(async (m) => {
    if (document.getElementById(`msg-${m.id}`)) return;
    const node = document.createElement("div");
    node.className = `message-wa ${m.direction}`;
    node.id = `msg-${m.id}`;
    
    let mediaHtml = "";
    if (m.file_path) {
        const id = `media-${m.id}`;
        if (m.file_type === 'image') mediaHtml = `<img id="${id}" class="message-file" style="max-width:100%; border-radius:8px;">`;
        else if (m.file_type === 'video') mediaHtml = `<video id="${id}" controls class="message-file" style="max-width:100%; border-radius:8px;"></video>`;
        else if (m.file_type === 'audio') mediaHtml = `<audio id="${id}" controls class="message-file" style="max-width:100%;"></audio>`;
        else mediaHtml = `<a href="#" id="${id}" target="_blank" class="message-file" style="display:block; padding:10px; background:rgba(255,255,255,0.1); border-radius:5px; text-decoration:none; color:inherit;">📄 ${t("common.downloadFile")}</a>`;
        
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) resolveMedia(m.file_path, el).then(url => {
                if (el.tagName === 'A') el.href = url;
            });
        }, 0);
    }

    const isOwn = m.direction === 'right';
    const actionsHtml = `
        <div class="msg-actions">
            ${isOwn ? `<button class="msg-edit-btn" onclick="startEdit('${m.id}', '${safeHtml(m.message)}')">✎</button>` : ''}
            <button class="msg-delete-btn" onclick="deleteMessage('${m.id}')">🗑</button>
        </div>`;

    node.innerHTML = `
      <div class="message-content">
        ${m.message ? `<div class="message-text">${safeHtml(m.message)}</div>` : ""}
        ${mediaHtml}
        <div class="message-info-bottom">
          <span class="message-time">${safeHtml(formatMsgTime(m.created_at))}</span>
          ${actionsHtml}
        </div>
      </div>`;
    container.appendChild(node);
  });
  container.scrollTop = container.scrollHeight;
}

async function loadFriends() {
  try {
    const res = await fetch(`${window.API_BASE_URL}/get_friends`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      friends = data.friends;
      renderFriendsList();
    }
  } catch (e) {}
}

async function loadMessages(friendId, full) {
  try {
    const res = await fetch(`${window.API_BASE_URL}/get_messages?friend_id=${encodeURIComponent(friendId)}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) renderMessages(data.messages, full);
  } catch (e) {}
}

async function sendMessage() {
  if (!currentFriend) return;
  const input = document.getElementById("message-input");
  const msg = input.value.trim();
  if (!msg && !selectedFile) return;

  if (editingMessageId) {
      updateMessage(editingMessageId, msg);
      return;
  }

  const fd = new FormData();
  fd.append("receiver_id", currentFriend.id);
  if (msg) fd.append("message", msg);
  if (selectedFile) fd.append("file", selectedFile);

  input.value = "";
  cancelFileSelection();
  
  try {
    const res = await fetch(`${window.API_BASE_URL}/send_message`, { method: "POST", headers: getAuthHeaders(), body: fd });
    const data = await res.json();
    if (data.success) {
      loadMessages(currentFriend.id, false);
      loadFriends();
      showMessage(t("messages.sentSuccess") || "Message sent successfully", "success");
    }
  } catch (e) {}
}

function startEdit(id, text) {
    editingMessageId = id;
    const input = document.getElementById("message-input");
    input.value = text;
    input.focus();
    
    let bar = document.getElementById("edit-bar");
    if (!bar) {
        bar = document.createElement("div");
        bar.id = "edit-bar";
        bar.className = "file-preview-bar";
        const area = document.querySelector(".input-area-wa");
        area.parentNode.insertBefore(bar, area);
    }
    bar.innerHTML = `<span>✏️ ${t("common.edit")}</span><button onclick="cancelEdit()">✕</button>`;
    updateSendBtnState();
}

function cancelEdit() {
    editingMessageId = null;
    document.getElementById("message-input").value = "";
    const bar = document.getElementById("edit-bar");
    if (bar) bar.remove();
    updateSendBtnState();
}

async function updateMessage(id, newText) {
    try {
        const res = await fetch(`${window.API_BASE_URL}/edit_message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ message_id: id, message: newText })
        });
        const data = await res.json();
        if (data.success) {
            cancelEdit();
            loadMessages(currentFriend.id, true);
            showMessage(t("messages.editSuccess") || "Message updated", "success");
        }
    } catch(e) {}
}

async function deleteMessage(id) {
    const confirmed = await window.showConfirm(t("messages.confirmDeleteMessage"));
    if (!confirmed) return;
    try {
        const res = await fetch(`${window.API_BASE_URL}/delete_message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ message_id: id })
        });
        const data = await res.json();
        if (data.success) {
            loadMessages(currentFriend.id, true);
            showMessage(t("messages.deleteSuccess") || "Message deleted", "success");
        }
    } catch(e) {}
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile = file;
    cancelEdit();
    
    let preview = document.getElementById("file-preview-container");
    if (!preview) {
        preview = document.createElement("div");
        preview.id = "file-preview-container";
        preview.className = "file-preview-bar";
        const area = document.querySelector(".input-area-wa");
        area.parentNode.insertBefore(preview, area);
    }
    
    const isImg = file.type.startsWith('image/');
    preview.innerHTML = `
        <div class="preview-info">
            ${isImg ? `<img src="${URL.createObjectURL(file)}" class="preview-thumb">` : `<span class="preview-icon">📄</span>`}
            <span class="preview-name">${safeHtml(file.name)}</span>
        </div>
        <button class="preview-close" onclick="cancelFileSelection()">✕</button>`;
    updateSendBtnState();
}

function cancelFileSelection() {
    selectedFile = null;
    const p = document.getElementById("file-preview-container");
    if (p) p.remove();
    const fi = document.getElementById("file-input");
    if (fi) fi.value = "";
    updateSendBtnState();
}

function updateSendBtnState() {
    const btn = document.getElementById("send-button");
    const input = document.getElementById("message-input");
    if (btn) {
        if ((input && input.value.trim()) || selectedFile || editingMessageId) btn.classList.add("active");
        else btn.classList.remove("active");
    }
}

function updatePresence() { fetch(`${window.API_BASE_URL}/update_presence`, { method: 'POST', headers: getAuthHeaders() }).catch(e=>{}); }

document.addEventListener("DOMContentLoaded", async () => {
  // Auth check before loading
  try {
    const res = await fetch(`${window.API_BASE_URL}/check_auth`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) {
      window.location.href = "index2.html";
      return;
    }
    if (data.user) currentUser = data.user;
  } catch (e) {
    window.location.href = "index2.html";
    return;
  }

  loadFriends();
  setInterval(loadFriends, 10000);
  setInterval(() => { if (currentFriend) loadMessages(currentFriend.id, false); }, 4000);
  setInterval(updatePresence, 60000);
  updatePresence();

  document.getElementById("message-input").placeholder = t("messages.placeholder") || "Type a message...";
  document.getElementById("send-button").addEventListener("click", sendMessage);
  document.getElementById("message-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  document.getElementById("message-input").addEventListener("input", updateSendBtnState);

  document.getElementById("back-button").addEventListener("click", () => {
    document.body.classList.remove("chat-open");
    currentFriend = null;
    cancelFileSelection();
    cancelEdit();
  });

  document.getElementById("file-button").addEventListener("click", () => document.getElementById("file-input").click());
  document.getElementById("file-input").addEventListener("change", handleFileSelect);

  const toggle = document.getElementById("online-status-toggle");
  if (toggle) toggle.addEventListener("change", (e) => {
      fetch(`${window.API_BASE_URL}/toggle_online_status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ visible: e.target.checked })
      }).catch(e=>{});
  });
});

// Re-render when language changes
document.addEventListener("laoverse:languagechange", () => {
  renderFriendsList();
  if (currentFriend) loadMessages(currentFriend.id, true);
});

window.cancelFileSelection = cancelFileSelection;
window.cancelEdit = cancelEdit;
window.selectFriendById = selectFriendById;
window.startEdit = startEdit;
window.deleteMessage = deleteMessage;
window.goToFriendProfile = () => { if (currentFriend) window.location.href = `user-profile.html?id=${currentFriend.id}`; };

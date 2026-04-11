let friendsState = [];
let friendRequestsState = [];
let searchResultsState = [];

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

function profileImage(path) {
  return path && String(path).trim() ? path : "default-profile.png";
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
  document.body.prepend(div);
  return div;
}

function renderFriends(friends) {
  friendsState = Array.isArray(friends) ? friends : [];
  const container = document.getElementById("friendsList");
  if (!container) return;

  if (friendsState.length === 0) {
    container.innerHTML = `<p>${safeHtml(t("friends.noFriends"))}</p>`;
    return;
  }

  container.innerHTML = friendsState.map((friend) => `
    <div class="friend-item">
      <img src="${safeHtml(profileImage(friend.profile_pic))}"
           onerror="this.src='default-profile.png'"
           alt="${safeHtml(friend.username)}">
      <div>
        <h3>${safeHtml(friend.username)}</h3>
        <button onclick="messageFriend('${safeHtml(friend.id)}')">${safeHtml(t("friends.sendMessage"))}</button>
        <button onclick="removeFriend('${safeHtml(friend.id)}')" class="remove-btn">${safeHtml(t("friends.remove"))}</button>
      </div>
    </div>
  `).join("");
}

function renderFriendRequests(requests) {
  friendRequestsState = Array.isArray(requests) ? requests : [];
  const container = document.getElementById("friendRequestsList");
  if (!container) return;

  if (friendRequestsState.length === 0) {
    container.innerHTML = `<p>${safeHtml(t("friends.noRequests"))}</p>`;
    return;
  }

  container.innerHTML = friendRequestsState.map((request) => `
    <div class="request-item">
      <img src="${safeHtml(profileImage(request.profile_pic))}"
           onerror="this.src='default-profile.png'"
           alt="${safeHtml(request.username)}">
      <div>
        <h3>${safeHtml(request.username)}</h3>
        <button onclick="acceptRequest('${safeHtml(request.id)}')" class="accept-btn">${safeHtml(t("friends.accept"))}</button>
        <button onclick="rejectRequest('${safeHtml(request.id)}')" class="reject-btn">${safeHtml(t("friends.reject"))}</button>
      </div>
    </div>
  `).join("");
}

function renderSearchResults(users) {
  searchResultsState = Array.isArray(users) ? users : [];
  const container = document.getElementById("searchResults");
  if (!container) return;

  if (searchResultsState.length === 0) {
    container.innerHTML = `<p>${safeHtml(t("friends.noUsers"))}</p>`;
    return;
  }

  container.innerHTML = searchResultsState.map((user) => `
    <div class="search-result-item">
      <img src="${safeHtml(profileImage(user.profile_pic))}"
           onerror="this.src='default-profile.png'"
           alt="${safeHtml(user.username)}">
      <div>
        <h3>${safeHtml(user.username)}</h3>
        <button onclick="sendFriendRequest('${safeHtml(user.id)}')">${safeHtml(t("friends.sendRequest"))}</button>
      </div>
    </div>
  `).join("");
}

async function loadFriends() {
  try {
    const response = await fetch("https://laoverse.vercel.app/api/get_friends", { credentials: "include" });
    const data = await response.json();
    if (data.success) {
      renderFriends(data.friends || []);
    }
  } catch (error) {}
}

async function loadFriendRequests() {
  try {
    const response = await fetch("https://laoverse.vercel.app/api/get_friend_requests", { credentials: "include" });
    const data = await response.json();
    if (data.success) {
      renderFriendRequests(data.requests || []);
    }
  } catch (error) {}
}

async function handleSearch(event) {
  const query = String(event.target.value || "").trim();
  if (query.length < 2) {
    renderSearchResults([]);
    return;
  }

  try {
    const response = await fetch(`https://laoverse.vercel.app/api/search_users?query=${encodeURIComponent(query)}`, { credentials: "include" });
    const data = await response.json();
    if (data.success) {
      renderSearchResults(data.users || []);
    }
  } catch (error) {}
}

function setupSearch() {
  const input = document.getElementById("searchFriends");
  if (input) {
    input.addEventListener("input", handleSearch);
  }
}

async function acceptRequest(senderId) {
  try {
    const response = await fetch("https://laoverse.vercel.app/api/respond_request", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `sender_id=${encodeURIComponent(senderId)}&status=accepted`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("friends.accepted"), "success");
      loadFriendRequests();
      loadFriends();
    }
  } catch (error) {}
}

async function rejectRequest(senderId) {
  try {
    const response = await fetch("https://laoverse.vercel.app/api/respond_request", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `sender_id=${encodeURIComponent(senderId)}&status=rejected`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("friends.rejected"), "info");
      loadFriendRequests();
    }
  } catch (error) {}
}

async function sendFriendRequest(userId) {
  try {
    const response = await fetch("https://laoverse.vercel.app/api/send_request", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `receiver_id=${encodeURIComponent(userId)}`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("friends.requestSent"), "success");
      return;
    }
    showMessage(data.message || t("friends.requestFailed"), "error");
  } catch (error) {
    showMessage(t("friends.requestFailed"), "error");
  }
}

async function removeFriend(friendId) {
  const confirmed = await showConfirm(t("friends.removeConfirm"));
  if (!confirmed) return;

  try {
    const response = await fetch("https://laoverse.vercel.app/api/remove_friend", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `friend_id=${encodeURIComponent(friendId)}`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("friends.removeSuccess"), "info");
      loadFriends();
    }
  } catch (error) {}
}

function messageFriend(friendId) {
  window.location.href = `message.html?id=${encodeURIComponent(friendId)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadFriends();
  loadFriendRequests();
  setupSearch();
});

document.addEventListener("laoverse:languagechange", () => {
  renderFriends(friendsState);
  renderFriendRequests(friendRequestsState);
  renderSearchResults(searchResultsState);
});

window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.sendFriendRequest = sendFriendRequest;
window.removeFriend = removeFriend;
window.messageFriend = messageFriend;

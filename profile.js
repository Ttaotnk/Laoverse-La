let currentProfile = null;
let currentProfilePosts = [];
let currentProfileId = "current";
let currentUserId = null;
let interactionsBound = false;
let editingPostId = null;

const UI_EMOJI = {
  liked: "❤️",
  unliked: "🤍",
  comment: "💬",
  reply: "↩️"
};

function getAuthHeaders() {
  const token = localStorage.getItem('laoverse_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

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

function getUrlParams() {
  return new URLSearchParams(window.location.search || "");
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
  document.body.insertBefore(div, document.body.firstChild);
  return div;
}

function goToUserProfile(userId) {
  if (!userId) return;
  window.location.href = `user-profile.html?id=${encodeURIComponent(userId)}`;
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

function renderComments(comments, postId) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return `<div class="no-comments">${safeHtml(t("feed.noComments"))}</div>`;
  }

  const groups = {};
  comments.forEach((comment) => {
    const parent = comment.parent_comment_id || "root";
    if (!groups[parent]) groups[parent] = [];
    groups[parent].push(comment);
  });

  const renderThread = (parentId, level) => {
    const list = groups[parentId] || [];
    return list.map((comment) => `
      <div class="comment ${level > 0 ? "comment-reply" : ""}" style="${level > 0 ? `margin-left:${Math.min(level, 3) * 20}px;` : ""}">
        <img src="${safeHtml(comment.profile_pic || "default-profile.png")}"
             alt="comment-avatar"
             class="comment-profile-pic"
             onclick="goToUserProfile('${safeHtml(comment.user_id || "")}')"
             style="cursor:pointer;"
             onerror="this.src='default-profile.png'">
        <div class="comment-content">
          <div class="comment-header">
            <strong class="comment-username" onclick="goToUserProfile('${safeHtml(comment.user_id || "")}')" style="cursor:pointer;">${safeHtml(comment.username || t("profile.unknownUser"))}</strong>
            <small class="comment-time">${safeHtml(formatRelativeTime(comment.created_at))}</small>
          </div>
          <p class="comment-text">${safeHtml(comment.comment)}</p>
          <div class="comment-actions">
            <button class="reply-toggle" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}">${UI_EMOJI.reply} ${safeHtml(t("feed.reply"))}</button>
          </div>
          <div class="reply-box" id="reply-box-${safeHtml(postId)}-${safeHtml(comment.id)}" style="display:none;">
            <input type="text" class="reply-input" placeholder="${safeHtml(t("feed.replyPlaceholder"))}">
            <button class="submit-reply" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}">${safeHtml(t("common.submit"))}</button>
          </div>
          ${renderThread(comment.id, level + 1)}
        </div>
      </div>
    `).join("");
  };

  return renderThread("root", 0);
}

function renderProfile(profile) {
  currentProfile = profile || null;
  if (!profile) return;

  const username = document.getElementById("profileUsername");
  const pic = document.getElementById("profilePic");
  const postCount = document.getElementById("postCount");
  const friendCount = document.getElementById("friendCount");
  const friendBtn = document.getElementById("friendBtn");
  const editBtn = document.getElementById("editProfileBtn");
  const editUsername = document.getElementById("editUsername");

  if (username) username.textContent = profile.username || "";
  if (pic) {
    pic.src = profile.profile_pic || "default-profile.png";
    pic.onerror = function onError() {
      this.src = "default-profile.png";
    };
  }
  if (postCount) postCount.textContent = String(profile.post_count || 0);
  if (friendCount) friendCount.textContent = String(profile.friend_count || 0);
  if (editUsername) editUsername.value = profile.username || "";

  if (editBtn) {
    editBtn.style.display = profile.is_current_user ? "inline-block" : "none";
  }

  if (!friendBtn) return;

  if (profile.is_current_user) {
    friendBtn.style.display = "none";
    return;
  }

  friendBtn.style.display = "inline-block";
  friendBtn.disabled = false;

  if (profile.friend_status === "accepted") {
    friendBtn.textContent = t("profile.alreadyFriend");
    friendBtn.disabled = true;
    return;
  }
  if (profile.friend_status === "pending") {
    friendBtn.textContent = t("profile.pending");
    friendBtn.disabled = true;
    return;
  }

  friendBtn.textContent = t("profile.sendRequest");
  friendBtn.disabled = false;
  friendBtn.onclick = () => {
    sendFriendRequest(profile.id);
  };
}

function renderProfilePosts(posts) {
  currentProfilePosts = Array.isArray(posts) ? posts : [];
  const container = document.getElementById("profilePosts");
  if (!container) return;

  if (!currentProfilePosts.length) {
    container.innerHTML = `<h2>${safeHtml(t("profile.posts"))}</h2><div class="no-posts">${safeHtml(t("profile.noPosts"))}</div>`;
    return;
  }

  container.innerHTML = `<h2>${safeHtml(t("profile.posts"))}</h2>${currentProfilePosts.map((post) => {
    let mediaHtml = "";
    if (post.image) {
      const kind = detectFileKind(post.file_type, post.image);
      if (kind === "video") {
        mediaHtml = `<video controls playsinline preload="metadata" class="post-image" src="${safeHtml(post.image)}"></video>`;
      } else if (kind === "audio") {
        mediaHtml = `<audio controls preload="metadata" class="post-audio" src="${safeHtml(post.image)}"></audio>`;
      } else if (kind === "file") {
        mediaHtml = `<a href="${safeHtml(post.image)}" class="post-file" target="_blank" rel="noopener">${safeHtml(t("common.downloadFile"))}</a>`;
      } else {
        mediaHtml = `<img src="${safeHtml(post.image)}" class="post-image" alt="post-image">`;
      }
    }

    const isOwnPost = post.user_id === currentUserId;
    const postActions = `
      <button class="like-btn" data-id="${safeHtml(post.id)}">
        ${post.is_liked ? UI_EMOJI.liked : UI_EMOJI.unliked} <span class="like-count">${Number(post.likes || 0)}</span>
      </button>
      <button class="comment-btn" data-id="${safeHtml(post.id)}">
        ${UI_EMOJI.comment} <span class="comment-count">${Array.isArray(post.comments) ? post.comments.length : 0}</span>
      </button>
      ${isOwnPost ? `
        <button class="edit-btn" data-id="${safeHtml(post.id)}" title="${safeHtml(t("common.edit") || "Edit")}">✏️ ${safeHtml(t("common.edit") || "Edit")}</button>
        <button class="delete-btn" data-id="${safeHtml(post.id)}" title="${safeHtml(t("common.delete") || "Delete")}">🗑️ ${safeHtml(t("common.delete") || "Delete")}</button>
      ` : ''}
    `;

    return `
      <div class="post" data-id="${safeHtml(post.id)}">
        <div class="post-header">
          <img src="${safeHtml(post.profile_pic || "default-profile.png")}"
               class="post-profile-pic"
               onclick="goToUserProfile('${safeHtml(post.user_id || "")}')"
               style="cursor:pointer;"
               onerror="this.src='default-profile.png'">
          <div class="post-user-info">
            <strong onclick="goToUserProfile('${safeHtml(post.user_id || "")}')" style="cursor:pointer;">${safeHtml(post.username || t("profile.unknownUser"))}</strong>
            <small>${safeHtml(formatRelativeTime(post.created_at))}</small>
          </div>
        </div>
        <div class="post-content">
          ${post.content ? `<p class="post-text">${safeHtml(post.content)}</p>` : ""}
          ${mediaHtml}
        </div>
        <div class="post-actions">
          ${postActions}
        </div>
        <div class="comments-section" id="comments-${safeHtml(post.id)}" style="display:none;">
          ${renderComments(post.comments || [], post.id)}
          <div class="add-comment">
            <input type="text" class="comment-input" data-postid="${safeHtml(post.id)}" placeholder="${safeHtml(t("feed.commentPlaceholder"))}">
            <button class="submit-comment" data-id="${safeHtml(post.id)}">${safeHtml(t("common.submit"))}</button>
          </div>
        </div>
      </div>
    `;
  }).join("")}`;
}

async function loadProfile(profileId) {
  showLoading(true);
  try {
    const response = await fetch(`https://laoverse-production.up.railway.app/api/loadProfile?user_id=${encodeURIComponent(profileId)}`, {
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      renderProfile(data.profile);
      await loadProfilePosts(data.profile.id || profileId);
      return;
    }
    showMessage(data.message || t("profile.notFound"), "error");
  } catch (error) {
    showMessage(t("profile.loadFailed"), "error");
  } finally {
    showLoading(false);
  }
}

async function loadProfilePosts(profileId) {
  try {
    const response = await fetch(`https://laoverse-production.up.railway.app/api/loadProfilePosts?user_id=${encodeURIComponent(profileId)}`, {
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      renderProfilePosts(data.posts || []);
      return;
    }
    renderProfilePosts([]);
  } catch (error) {
    showMessage(t("profile.connectionError"), "error");
  }
}

async function likePost(postId) {
  try {
    const response = await fetch("https://laoverse-production.up.railway.app/api/like", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeaders()
      },
      body: `post_id=${encodeURIComponent(postId)}`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      await loadProfile(currentProfileId);
    }
  } catch (error) {}
}

async function addComment(postId, comment, parentCommentId) {
  try {
    const payload = new URLSearchParams();
    payload.set("post_id", postId);
    payload.set("comment", comment);
    if (parentCommentId) payload.set("parent_comment_id", parentCommentId);

    const response = await fetch("https://laoverse-production.up.railway.app/api/comment", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeaders()
      },
      body: payload.toString(),
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      await loadProfile(currentProfileId);
      return true;
    }
    showMessage(data.message || t("feed.commentFailed"), "error");
  } catch (error) {
    showMessage(t("feed.commentFailed"), "error");
  }
  return false;
}

async function sendFriendRequest(userId) {
  try {
    const response = await fetch("https://laoverse-production.up.railway.app/api/send_request", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeaders()
      },
      body: `receiver_id=${encodeURIComponent(userId)}`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("friends.requestSent"), "success");
      await loadProfile(currentProfileId);
      return;
    }
    showMessage(data.message || t("friends.requestFailed"), "error");
  } catch (error) {
    showMessage(t("friends.requestFailed"), "error");
  }
}

function openEditModal() {
  const modal = document.getElementById("editProfileModal");
  if (modal) modal.style.display = "block";
}

function closeEditModal() {
  const modal = document.getElementById("editProfileModal");
  if (modal) modal.style.display = "none";
}

function openEditPostModal(postId) {
  const modal = document.getElementById("editPostModal");
  const post = currentProfilePosts.find((p) => p.id === postId);
  
  if (!post) return;
  
  editingPostId = postId;
  const contentInput = document.getElementById("editPostContent");
  const fileInputName = document.getElementById("editPostImageName");
  
  if (contentInput) {
    contentInput.value = post.content || "";
  }
  if (fileInputName) {
    fileInputName.textContent = "";
  }
  
  if (modal) {
    modal.style.display = "block";
  }
}

function closeEditPostModal() {
  const modal = document.getElementById("editPostModal");
  if (modal) modal.style.display = "none";
  editingPostId = null;
  const form = document.getElementById("editPostForm");
  if (form) form.reset();
}

async function deletePost(postId) {
  if (!confirm(t("common.confirmDelete") || "Are you sure you want to delete this post?")) {
    return;
  }

  showLoading(true);
  try {
    const response = await fetch("https://laoverse-production.up.railway.app/api/delete_post", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeaders()
      },
      body: `post_id=${encodeURIComponent(postId)}`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("profile.postDeleted") || "Post deleted successfully", "success");
      await loadProfile(currentProfileId);
      return;
    }
    showMessage(data.message || t("profile.deleteFailed") || "Failed to delete post", "error");
  } catch (error) {
    showMessage(t("profile.deleteFailed") || "Failed to delete post", "error");
  } finally {
    showLoading(false);
  }
}

async function handleEditPost(event) {
  event.preventDefault();
  
  if (!editingPostId) return;

  const form = event.target || document.getElementById("editPostForm");
  const formData = new FormData(form);
  formData.set("post_id", editingPostId);

  showLoading(true);
  try {
    const response = await fetch("https://laoverse-production.up.railway.app/api/edit_post", {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("profile.postUpdated") || "Post updated successfully", "success");
      closeEditPostModal();
      await loadProfile(currentProfileId);
      return;
    }
    showMessage(data.message || t("profile.updateFailed") || "Failed to update post", "error");
  } catch (error) {
    showMessage(t("profile.updateFailed") || "Failed to update post", "error");
  } finally {
    showLoading(false);
  }
}

function closeEditModal() {
  const modal = document.getElementById("editProfileModal");
  if (modal) modal.style.display = "none";
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const form = event.target || document.getElementById("editProfileForm");
  const formData = new FormData(form);

  try {
    const response = await fetch("https://laoverse-production.up.railway.app/api/updateProfile", {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("profile.updateSuccess"), "success");
      closeEditModal();
      await loadProfile("current");
      return;
    }
    showMessage(data.message || t("profile.updateFailed"), "error");
  } catch (error) {
    showMessage(t("profile.updateFailed"), "error");
  }
}

function setupInteractions() {
  if (interactionsBound) return;
  interactionsBound = true;

  const editBtn = document.getElementById("editProfileBtn");
  const editForm = document.getElementById("editProfileForm");
  const fileInput = document.getElementById("editProfilePic");
  const fileInputName = document.getElementById("fileInputName");
  const editPostForm = document.getElementById("editPostForm");
  const editPostImage = document.getElementById("editPostImage");
  const editPostImageName = document.getElementById("editPostImageName");

  if (editBtn) {
    editBtn.addEventListener("click", openEditModal);
  }

  if (editForm) {
    editForm.addEventListener("submit", handleProfileUpdate);
  }

  if (fileInput && fileInputName) {
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      fileInputName.textContent = file ? file.name : t("common.fileNone");
    });
  }

  if (editPostForm) {
    editPostForm.addEventListener("submit", handleEditPost);
  }

  if (editPostImage && editPostImageName) {
    editPostImage.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      editPostImageName.textContent = file ? file.name : "";
    });
  }

  document.addEventListener("click", async (event) => {
    const likeBtn = event.target.closest(".like-btn");
    if (likeBtn) {
      await likePost(likeBtn.dataset.id);
      return;
    }

    const commentBtn = event.target.closest(".comment-btn");
    if (commentBtn) {
      const section = document.getElementById(`comments-${commentBtn.dataset.id}`);
      if (section) {
        section.style.display = section.style.display === "none" ? "block" : "none";
      }
      return;
    }

    const editPostBtn = event.target.closest(".edit-btn");
    if (editPostBtn) {
      openEditPostModal(editPostBtn.dataset.id);
      return;
    }

    const deletePostBtn = event.target.closest(".delete-btn");
    if (deletePostBtn) {
      await deletePost(deletePostBtn.dataset.id);
      return;
    }

    const submitBtn = event.target.closest(".submit-comment");
    if (submitBtn) {
      const input = document.querySelector(`.comment-input[data-postid="${submitBtn.dataset.id}"]`);
      const comment = input ? input.value.trim() : "";
      if (!comment) {
        showMessage(t("feed.commentRequired"), "error");
        return;
      }
      if (await addComment(submitBtn.dataset.id, comment) && input) {
        input.value = "";
      }
      return;
    }

    const replyToggle = event.target.closest(".reply-toggle");
    if (replyToggle) {
      const box = document.getElementById(`reply-box-${replyToggle.dataset.postId}-${replyToggle.dataset.commentId}`);
      if (box) {
        box.style.display = box.style.display === "none" ? "block" : "none";
      }
      return;
    }

    const submitReplyBtn = event.target.closest(".submit-reply");
    if (submitReplyBtn) {
      const box = document.getElementById(`reply-box-${submitReplyBtn.dataset.postId}-${submitReplyBtn.dataset.commentId}`);
      const input = box ? box.querySelector(".reply-input") : null;
      const comment = input ? input.value.trim() : "";
      if (!comment) {
        showMessage(t("feed.replyRequired"), "error");
        return;
      }
      if (await addComment(submitReplyBtn.dataset.postId, comment, submitReplyBtn.dataset.commentId) && input) {
        input.value = "";
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("https://laoverse-production.up.railway.app/api/check_auth", { 
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!data.success) {
      window.location.href = "index2.html";
      return;
    }
    currentUserId = data.user?.id;
  } catch (error) {
    window.location.href = "index2.html";
    return;
  }

  currentProfileId = getUrlParams().get("id") || "current";
  setupInteractions();
  loadProfile(currentProfileId);
});

document.addEventListener("laoverse:languagechange", () => {
  renderProfile(currentProfile);
  renderProfilePosts(currentProfilePosts);
  const loading = document.getElementById("loading");
  if (loading) {
    const text = loading.querySelector("span");
    if (text) text.textContent = t("common.loading");
  }
});

window.goToUserProfile = goToUserProfile;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;

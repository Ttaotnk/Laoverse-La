const postForm = document.getElementById("postForm");
const feedContainer = document.getElementById("feedContainer");
const postContent = document.getElementById("postContent");
const postImage = document.getElementById("postImage");
const imagePreview = document.getElementById("image-preview") || document.createElement("div");

let feedPosts = [];
let feedRefreshTimer = null;
let currentUserId = null;
let editingPostId = null;

const UI_EMOJI = {
  liked: "??",
  unliked: "??",
  comment: "??",
  reply: "??"
};



function t(key, vars) {
  if (window.LanguageManager && typeof window.LanguageManager.translate === "function") {
    return window.LanguageManager.translate(key, vars);
  }
  return key;
}

function formatRelativeTime(dateString) {
  if (window.LanguageManager && typeof window.LanguageManager.formatRelativeTime === "function") {
    return window.LanguageManager.formatRelativeTime(dateString);
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

function getProfileImage(path) {
  return path && String(path).trim() ? path : window.getThemeDefaultProfile();
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

function getProfileImage(pic) {
  if (!pic) return window.getThemeDefaultProfile();
  if (window.LanguageManager && window.LanguageManager.resolveMediaUrl) {
    return window.LanguageManager.resolveMediaUrl(pic);
  }
  return pic;
}

function renderPostMedia(post) {
  if (!post || !post.image) return "";
  
  const resolve = (url) => {
    if (window.LanguageManager && window.LanguageManager.resolveMediaUrl) {
      return window.LanguageManager.resolveMediaUrl(url);
    }
    return url;
  };

  const fileUrl = resolve(post.image);
  const type = detectFileKind(post.file_type, post.image);

  if (type === "video") {
    return `<video controls playsinline preload="metadata" class="post-image" src="${fileUrl}"></video>`;
  }
  if (type === "audio") {
    return `<audio controls preload="metadata" class="post-audio" src="${fileUrl}"></audio>`;
  }
  if (type === "image") {
    return `<img src="${fileUrl}" alt="post-media" class="post-image">`;
  }
  return `<a href="${fileUrl}" class="post-file" target="_blank" rel="noopener">${safeHtml(t("common.downloadFile"))}</a>`;
}

let isSearching = false;

async function handlePostSearch() {
  const searchInput = document.getElementById("postSearch");
  const query = searchInput ? searchInput.value.trim() : "";
  
  if (!query) {
    isSearching = false;
    loadFeed();
    return;
  }

  isSearching = true;
  showLoading(true);
  try {
    const response = await fetch(`${window.API_BASE_URL}/search_posts?query=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.success) {
      renderPosts(data.posts || []);
    } else {
      showMessage(data.message || t("feed.loadFailed"), "error");
    }
  } catch (error) {
    showMessage(t("feed.loadFailed"), "error");
  } finally {
    showLoading(false);
  }
}

function setupSearch() {
  const searchInput = document.getElementById("postSearch");
  const searchButton = document.getElementById("searchButton");

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handlePostSearch();
      }
    });
    // Optional: search as user types with debounce
    let timeout = null;
    searchInput.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!searchInput.value.trim()) {
          isSearching = false;
          loadFeed();
        }
      }, 500);
    });
  }

  if (searchButton) {
    searchButton.addEventListener("click", handlePostSearch);
  }
}

function shouldPauseFeedRefresh() {
  if (document.hidden || isSearching) return true;
  if (document.querySelector("#postContent:focus, .comment-input:focus, .reply-input:focus, #postSearch:focus")) return true;

  return Array.from(document.querySelectorAll("video, audio")).some((media) => {
    try {
      return !media.paused && !media.ended;
    } catch (error) {
      return false;
    }
  });
}

function renderContentWithEmbeds(content) {
  const text = String(content || "");
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  let embeds = "";

  urls.forEach((url) => {
    const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (youtube && youtube[1]) {
      embeds += `<div class="post-embed"><iframe src="https://www.youtube.com/embed/${youtube[1]}" title="youtube" frameborder="0" allowfullscreen></iframe></div>`;
      return;
    }
    if (url.includes("x.com") || url.includes("twitter.com") || url.includes("facebook.com")) {
      const safeUrl = safeHtml(url);
      embeds += `<div class="post-embed"><a href="${safeUrl}" target="_blank" rel="noopener">${safeUrl}</a></div>`;
    }
  });

  return `<p class="post-text">${safeHtml(text)}</p>${embeds}`;
}

function renderComments(comments, postId, postOwnerId) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return `<div class="no-comments">${safeHtml(t("feed.noComments"))}</div>`;
  }

  const byParent = {};
  comments.forEach((comment) => {
    const parentId = comment.parent_comment_id || "root";
    if (!byParent[parentId]) byParent[parentId] = [];
    byParent[parentId].push(comment);
  });

  const renderThread = (parentId, level) => {
    const items = byParent[parentId] || [];
    const currentId = currentUserId ? String(currentUserId) : "";
    return items.map((comment) => `
      <div class="comment ${level > 0 ? "comment-reply" : ""}" style="${level > 0 ? `margin-left:${Math.min(level, 3) * 20}px;` : ""}">
        <img src="${safeHtml(getProfileImage(comment.profile_pic))}"
             alt="comment-avatar"
             class="comment-profile-pic"
             onclick="viewProfile('${safeHtml(comment.user_id)}')"
             style="cursor:pointer;"
             onerror="this.onerror=null; this.src=window.getThemeDefaultProfile()">
        <div class="comment-content">
          <div class="comment-header">
            <strong class="comment-username" onclick="viewProfile('${safeHtml(comment.user_id)}')" style="cursor:pointer;">${safeHtml(comment.username)}</strong>
            <small class="comment-time">${safeHtml(formatRelativeTime(comment.created_at))}</small>
          </div>
          <p class="comment-text">${safeHtml(comment.is_deleted ? t("feed.deletedComment") : comment.comment)}</p>
          <div class="comment-actions">
            ${!comment.is_deleted ? `<button class="reply-toggle" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}"><img src="icons/reply.svg" alt="reply" class="btn-icon reply-icon"> ${safeHtml(t("feed.reply"))}</button>` : ''}
            ${currentId && !comment.is_deleted && (String(comment.user_id) === currentId || currentId === String(postOwnerId)) ? `
              ${String(comment.user_id) === currentId ? `<button class="comment-edit-toggle" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}"><img src="icons/edit.svg" alt="edit" class="btn-icon edit-icon"> ${safeHtml(t("common.edit"))}</button>` : ``}
              <button class="comment-delete-btn" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}"><img src="icons/delete.svg" alt="delete" class="btn-icon delete-icon"> ${safeHtml(t("common.delete"))}</button>
            ` : ``}
          </div>
          ${currentId && String(comment.user_id) === currentId && !comment.is_deleted ? `
            <div class="comment-edit-box" id="edit-box-${safeHtml(postId)}-${safeHtml(comment.id)}" style="display:none;">
              <input type="text" class="comment-edit-input" value="${safeHtml(comment.comment)}" placeholder="${safeHtml(t("feed.commentPlaceholder"))}">
              <button class="submit-comment-edit" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}">${safeHtml(t("common.save"))}</button>
              <button class="cancel-comment-edit" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}">${safeHtml(t("common.cancel"))}</button>
            </div>
          ` : ``}
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

function renderPosts(posts) {
  feedPosts = Array.isArray(posts) ? posts : [];

  if (!feedContainer) return;
  if (feedPosts.length === 0) {
    feedContainer.innerHTML = `<div class="no-posts">${safeHtml(t("feed.noPosts"))}</div>`;
    return;
  }

  feedContainer.innerHTML = "";
  feedPosts.forEach(post => {
      const postEl = document.createElement("div");
      postEl.className = "post";
      postEl.dataset.id = post.id;
      
      const userPicId = `userPic_${post.id}`;
      const mediaContId = `media_${post.id}`;

      postEl.innerHTML = `
        <div class="post-header">
            <img id="${userPicId}" class="post-profile-pic" alt="profile" style="cursor:pointer;" onclick="viewProfile('${post.user_id}')">
            <div class="post-user-info">
                <h3 class="username" onclick="viewProfile('${post.user_id}')" style="cursor:pointer;">${safeHtml(post.username)}</h3>
                <small class="post-time">${safeHtml(formatRelativeTime(post.created_at))}</small>
            </div>
        </div>
        <div class="post-content">
            ${renderContentWithEmbeds(post.content)}
            <div id="${mediaContId}"></div>
        </div>
        <div class="post-actions">
            <button class="like-btn ${post.is_liked ? 'liked' : ''}" data-id="${safeHtml(post.id)}">
                <img src="icons/heart.svg" alt="like" class="btn-icon like-icon"> <span class="like-count">${Number(post.likes || 0)}</span>
            </button>
            <button class="comment-btn" data-id="${safeHtml(post.id)}">
                <img src="icons/comment.svg" alt="comment" class="btn-icon comment-icon"> <span class="comment-count">${Array.isArray(post.comments) ? post.comments.length : 0}</span>
            </button>
            ${currentUserId && String(post.user_id) === String(currentUserId) ? `
                <button class="edit-post-btn" data-id="${safeHtml(post.id)}" title="${safeHtml(t("common.editPost"))}">✎</button>
                <button class="delete-post-btn" data-id="${safeHtml(post.id)}" title="${safeHtml(t("common.delete"))}">🗑</button>
            ` : ``}
        </div>
        <div class="comments-section" id="comments-${safeHtml(post.id)}" style="display:none;">
            ${renderComments(post.comments || [], post.id, post.user_id)}
            <div class="add-comment">
                <input type="text" placeholder="${safeHtml(t("feed.commentPlaceholder"))}" class="comment-input">
                <button class="submit-comment" data-id="${safeHtml(post.id)}">${safeHtml(t("common.submit"))}</button>
            </div>
        </div>`;
      
      feedContainer.appendChild(postEl);

      // Smart load profile pic
      const upic = document.getElementById(userPicId);
      if (upic) window.LanguageManager.smartLoad(upic, post.profile_pic || window.getThemeDefaultProfile());

      // Smart load post media
      if (post.image) {
          const container = document.getElementById(mediaContId);
          const kind = detectFileKind(post.file_type, post.image);
          let el;
          if (kind === 'video') {
              el = document.createElement('video');
              el.className = 'post-image';
              el.controls = true;
          } else if (kind === 'audio') {
              el = document.createElement('audio');
              el.className = 'post-audio';
              el.controls = true;
          } else {
              el = document.createElement('img');
              el.className = 'post-image';
          }
          container.appendChild(el);
          window.LanguageManager.smartLoad(el, post.image);
      }
  });
}

function viewProfile(userId) {
  if (!userId) return;
  window.location.href = `user-profile.html?id=${encodeURIComponent(userId)}`;
}

function ensureEditPostModal() {
  if (document.getElementById("feedEditPostModal")) return;

  const modal = document.createElement("div");
  modal.id = "feedEditPostModal";
  modal.className = "modal";
  modal.style.display = "none";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-button" id="feedEditPostModalClose">&times;</span>
      <h2 data-i18n="common.editPost">${safeHtml(t("common.editPost"))}</h2>
      <form id="feedEditPostForm">
        <div>
          <label for="feedEditPostContent" data-i18n="common.content">${safeHtml(t("common.content"))}</label>
          <textarea id="feedEditPostContent" name="content" rows="4" maxlength="1000"></textarea>
        </div>
        <div>
          <label for="feedEditPostImage" class="file-input-label">
            <span data-i18n="common.image">${safeHtml(t("common.image"))}</span>
            <span id="feedEditPostImageName" class="file-input-name"></span>
          </label>
          <input type="file" id="feedEditPostImage" name="image" accept="image/*,video/*,audio/*" style="display:none;">
        </div>
        <button type="submit" data-i18n="common.save">${safeHtml(t("common.save"))}</button>
        <button type="button" class="cancel-button" id="feedEditPostCancel" data-i18n="common.cancel">${safeHtml(t("common.cancel"))}</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => closeEditPostModal();
  const closeBtn = document.getElementById("feedEditPostModalClose");
  const cancelBtn = document.getElementById("feedEditPostCancel");
  const form = document.getElementById("feedEditPostForm");
  const fileInput = document.getElementById("feedEditPostImage");
  const fileName = document.getElementById("feedEditPostImageName");

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (cancelBtn) cancelBtn.addEventListener("click", close);
  if (form) form.addEventListener("submit", handleEditPostSubmit);
  if (fileInput && fileName) {
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      fileName.textContent = file ? file.name : "";
    });
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
}

function openEditPostModal(postId) {
  ensureEditPostModal();
  const post = feedPosts.find((p) => String(p.id) === String(postId));
  if (!post) return;

  editingPostId = postId;
  const modal = document.getElementById("feedEditPostModal");
  const content = document.getElementById("feedEditPostContent");
  const fileName = document.getElementById("feedEditPostImageName");
  const fileInput = document.getElementById("feedEditPostImage");
  if (content) content.value = post.content || "";
  if (fileName) fileName.textContent = "";
  if (fileInput) fileInput.value = "";

  if (modal) modal.style.display = "flex";
}

function closeEditPostModal() {
  const modal = document.getElementById("feedEditPostModal");
  if (modal) modal.style.display = "none";
  editingPostId = null;
  const form = document.getElementById("feedEditPostForm");
  if (form) form.reset();
}

async function handleEditPostSubmit(event) {
  event.preventDefault();
  if (!editingPostId) return;

  const form = event.target || document.getElementById("feedEditPostForm");
  const formData = new FormData(form);
  formData.set("post_id", editingPostId);

  showLoading(true);
  try {
    const response = await fetch(`${window.API_BASE_URL}/edit_post`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      showMessage(t("profile.postUpdated"), "success");
      closeEditPostModal();
      await loadFeed();
      return;
    }
    showMessage(data.message || t("profile.updateFailed"), "error");
  } catch (error) {
    showMessage(t("profile.updateFailed"), "error");
  } finally {
    showLoading(false);
  }
}

async function deletePost(postId) {
  const ok = window.showConfirm
    ? await window.showConfirm(t("common.confirmDelete"), t("common.confirm"))
    : window.confirm(t("common.confirmDelete"));
  if (!ok) return;

  showLoading(true);
  try {
    const response = await fetch(`${window.API_BASE_URL}/delete_post`, {
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
      showMessage(t("profile.postDeleted"), "success");
      await loadFeed();
      return;
    }
    showMessage(data.message || t("profile.deleteFailed"), "error");
  } catch (error) {
    showMessage(t("profile.deleteFailed"), "error");
  } finally {
    showLoading(false);
  }
}

function handleImagePreview(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    imagePreview.innerHTML = "";
    return;
  }

  const fileURL = URL.createObjectURL(file);
  let previewHTML = "";

  if (file.type.startsWith("image/")) {
    previewHTML = `<img src="${fileURL}" alt="preview" style="max-width:100%;max-height:200px;">`;
  } else if (file.type.startsWith("video/")) {
    previewHTML = `<video src="${fileURL}" controls style="max-width:100%;max-height:200px;"></video>`;
  } else if (file.type.startsWith("audio/")) {
    previewHTML = `<audio src="${fileURL}" controls style="width:100%;max-width:400px;"></audio>`;
  } else {
    previewHTML = `<div style="padding:1rem;background:rgba(255,255,255,0.1);border-radius:5px;">?? ${file.name}</div>`;
  }

  imagePreview.innerHTML = previewHTML;
}

async function handlePostSubmit(event) {
  event.preventDefault();

  const content = postContent ? postContent.value.trim() : "";
  const image = postImage && postImage.files ? postImage.files[0] : null;

  if (!content && !image) {
    showMessage(t("feed.emptyPostError"), "error");
    return;
  }

  const formData = new FormData();
  formData.append("content", content);
  if (image) formData.append("image", image);

  // Setup Progress Bar UI
  let progressContainer = document.querySelector(".upload-progress-container");
  if (!progressContainer) {
    progressContainer = document.createElement("div");
    progressContainer.className = "upload-progress-container";
    progressContainer.innerHTML = `
      <div class="upload-progress-bar"></div>
      <div class="upload-progress-text">0%</div>
    `;
    if (postForm) {
      const actions = postForm.querySelector(".post-actions");
      postForm.insertBefore(progressContainer, actions);
    }
  }

  const progressBar = progressContainer.querySelector(".upload-progress-bar");
  const progressText = progressContainer.querySelector(".upload-progress-text");
  
  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "0%";

  try {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `${window.API_BASE_URL}/post`;
    
    xhr.open("POST", uploadUrl, true);
    
    // Auth Headers
    const headers = getAuthHeaders();
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key]);
    });

    // Progress Listener
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = percent + "%";
        progressText.textContent = percent + "%";
      }
    };

    xhr.onload = async () => {
      progressContainer.style.display = "none";
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          showMessage(t("feed.postSuccess"), "success");
          postForm.reset();
          imagePreview.innerHTML = "";
          await loadFeed();
          return;
        }
        showMessage(data.message || t("feed.postFailed"), "error");
      } else {
        showMessage(t("feed.postFailed"), "error");
      }
    };

    xhr.onerror = () => {
      progressContainer.style.display = "none";
      showMessage(t("feed.postFailed"), "error");
    };

    xhr.send(formData);

  } catch (error) {
    progressContainer.style.display = "none";
    showMessage(t("feed.postFailed"), "error");
  }
}

async function loadFeed() {
  try {
    showLoading(true);
    const response = await fetch(`${window.API_BASE_URL}/loadFeed`, { 
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.success) {
      renderPosts(data.posts || []);
      return;
    }

    showMessage(data.message || t("feed.loadFailed"), "error");
  } catch (error) {
    showMessage(t("feed.loadFailed"), "error");
  } finally {
    showLoading(false);
  }
}

async function toggleLike(postId, button) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/like`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeaders()
      },
      body: `post_id=${encodeURIComponent(postId)}`
    });
    const data = await response.json();

    if (data.success) {
      button.innerHTML = `<img src="icons/heart.svg" alt="like" class="btn-icon like-icon"> <span class="like-count">${Number(data.likes || 0)}</span>`;
      button.className = `like-btn ${data.is_liked ? 'liked' : ''}`;
    }
  } catch (error) {}
}

async function submitComment(postId, comment, parentCommentId) {
  const payload = new URLSearchParams();
  payload.set("post_id", postId);
  payload.set("comment", comment);
  if (parentCommentId) payload.set("parent_comment_id", parentCommentId);

  try {
    const response = await fetch(`${window.API_BASE_URL}/comment`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeaders()
      },
      body: payload.toString()
    });
    const data = await response.json();

    if (data.success) {
      await loadFeed();
      showMessage(parentCommentId ? (t("feed.replyAdded") || "Reply added successfully") : (t("feed.commentAdded") || "Comment added successfully"), "success");
      return true;
    }

    showMessage(data.message || t(parentCommentId ? "feed.replyFailed" : "feed.commentFailed"), "error");
  } catch (error) {
    showMessage(t(parentCommentId ? "feed.replyFailed" : "feed.commentFailed"), "error");
  }

  return false;
}

async function editComment(commentId, nextText) {
  const payload = new URLSearchParams();
  payload.set("comment_id", commentId);
  payload.set("comment", nextText);

  const response = await fetch(`${window.API_BASE_URL}/edit_comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...getAuthHeaders()
    },
    body: payload.toString()
  });

  return response.json();
}

async function deleteComment(commentId) {
  const payload = new URLSearchParams();
  payload.set("comment_id", commentId);

  const response = await fetch(`${window.API_BASE_URL}/delete_comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...getAuthHeaders()
    },
    body: payload.toString()
  });

  return response.json();
}

function setupEventDelegation() {
  document.addEventListener("click", async (event) => {
    const likeBtn = event.target.closest(".like-btn");
    if (likeBtn) {
      await toggleLike(likeBtn.dataset.id, likeBtn);
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

    const editPostBtn = event.target.closest(".edit-post-btn");
    if (editPostBtn) {
      openEditPostModal(editPostBtn.dataset.id);
      return;
    }

    const deletePostBtn = event.target.closest(".delete-post-btn");
    if (deletePostBtn) {
      await deletePost(deletePostBtn.dataset.id);
      return;
    }

    const submitBtn = event.target.closest(".submit-comment");
    if (submitBtn) {
      const wrapper = submitBtn.closest(".add-comment");
      const input = wrapper ? wrapper.querySelector(".comment-input") : null;
      const comment = input ? input.value.trim() : "";
      if (!comment) {
        showMessage(t("feed.commentRequired"), "error");
        return;
      }
      if (await submitComment(submitBtn.dataset.id, comment)) {
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

    const editToggle = event.target.closest(".comment-edit-toggle");
    if (editToggle) {
      const box = document.getElementById(`edit-box-${editToggle.dataset.postId}-${editToggle.dataset.commentId}`);
      if (box) {
        box.style.display = box.style.display === "none" ? "block" : "none";
        const input = box.querySelector(".comment-edit-input");
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
      return;
    }

    const cancelEdit = event.target.closest(".cancel-comment-edit");
    if (cancelEdit) {
      const box = document.getElementById(`edit-box-${cancelEdit.dataset.postId}-${cancelEdit.dataset.commentId}`);
      if (box) box.style.display = "none";
      return;
    }

    const submitEdit = event.target.closest(".submit-comment-edit");
    if (submitEdit) {
      const box = document.getElementById(`edit-box-${submitEdit.dataset.postId}-${submitEdit.dataset.commentId}`);
      const input = box ? box.querySelector(".comment-edit-input") : null;
      const nextText = input ? input.value.trim() : "";
      if (!nextText) {
        showMessage(t("feed.commentRequired"), "error");
        return;
      }

      try {
        const data = await editComment(submitEdit.dataset.commentId, nextText);
        if (data.success) {
          if (box) box.style.display = "none";
          showMessage(t("feed.commentEdited"), "success");
          await loadFeed();
          return;
        }
        showMessage(data.message || t("feed.commentEditFailed"), "error");
      } catch (error) {
        showMessage(t("feed.commentEditFailed"), "error");
      }
      return;
    }

    const deleteBtn = event.target.closest(".comment-delete-btn");
    if (deleteBtn) {
      try {
        const ok = window.showConfirm
          ? await window.showConfirm(t("feed.confirmDeleteComment"), t("common.confirm"))
          : window.confirm(t("feed.confirmDeleteComment"));
        if (!ok) return;

        const data = await deleteComment(deleteBtn.dataset.commentId);
        if (data.success) {
          showMessage(t("feed.commentDeleted"), "success");
          await loadFeed();
          return;
        }
        showMessage(data.message || t("feed.commentDeleteFailed"), "error");
      } catch (error) {
        showMessage(t("feed.commentDeleteFailed"), "error");
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
      if (await submitComment(submitReplyBtn.dataset.postId, comment, submitReplyBtn.dataset.commentId)) {
        input.value = "";
      }
    }
  });

  document.addEventListener("keypress", (event) => {
    if (event.key !== "Enter") return;

    if (event.target.classList.contains("comment-input")) {
      event.preventDefault();
      const wrapper = event.target.closest(".add-comment");
      const button = wrapper ? wrapper.querySelector(".submit-comment") : null;
      if (button) button.click();
      return;
    }

    if (event.target.classList.contains("reply-input")) {
      event.preventDefault();
      const box = event.target.closest(".reply-box");
      const button = box ? box.querySelector(".submit-reply") : null;
      if (button) button.click();
      return;
    }

    if (event.target.classList.contains("comment-edit-input")) {
      event.preventDefault();
      const box = event.target.closest(".comment-edit-box");
      const button = box ? box.querySelector(".submit-comment-edit") : null;
      if (button) button.click();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (postImage) {
    postImage.addEventListener("change", handleImagePreview);
  }
  if (postForm) {
    postForm.addEventListener("submit", handlePostSubmit);
  }

  setupEventDelegation();

  try {
    const response = await fetch(`${window.API_BASE_URL}/check_auth`, { 
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!data.success) {
      window.location.href = "index2.html";
      return;
    }
    currentUserId = data.user && data.user.id ? data.user.id : null;
  } catch (error) {
    window.location.href = "index2.html";
    return;
  }

  loadFeed();
  setupSearch();
  feedRefreshTimer = window.setInterval(() => {
    if (!shouldPauseFeedRefresh()) {
      loadFeed();
    }
  }, 30000);
});

document.addEventListener("laoverse:languagechange", () => {
  renderPosts(feedPosts);
  const loading = document.getElementById("loading");
  if (loading) {
    const text = loading.querySelector("span");
    if (text) text.textContent = t("common.loading");
  }
});

window.viewProfile = viewProfile;

const postForm = document.getElementById("postForm");
const feedContainer = document.getElementById("feedContainer");
const postContent = document.getElementById("postContent");
const postImage = document.getElementById("postImage");
const imagePreview = document.getElementById("image-preview") || document.createElement("div");

let feedPosts = [];
let feedRefreshTimer = null;

const UI_EMOJI = {
  liked: "??",
  unliked: "??",
  comment: "??",
  reply: "??"
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
  return path && String(path).trim() ? path : "default-profile.png";
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

function renderPostMedia(post) {
  if (!post || !post.image) return "";
  const fileUrl = safeHtml(post.image);
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

function shouldPauseFeedRefresh() {
  if (document.hidden) return true;
  if (document.querySelector("#postContent:focus, .comment-input:focus, .reply-input:focus")) return true;

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

function renderComments(comments, postId) {
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
    return items.map((comment) => `
      <div class="comment ${level > 0 ? "comment-reply" : ""}" style="${level > 0 ? `margin-left:${Math.min(level, 3) * 20}px;` : ""}">
        <img src="${safeHtml(getProfileImage(comment.profile_pic))}"
             alt="comment-avatar"
             class="comment-profile-pic"
             onclick="viewProfile('${safeHtml(comment.user_id)}')"
             style="cursor:pointer;"
             onerror="this.onerror=null; this.src='default-profile.png'">
        <div class="comment-content">
          <div class="comment-header">
            <strong class="comment-username" onclick="viewProfile('${safeHtml(comment.user_id)}')" style="cursor:pointer;">${safeHtml(comment.username)}</strong>
            <small class="comment-time">${safeHtml(formatRelativeTime(comment.created_at))}</small>
          </div>
          <p class="comment-text">${safeHtml(comment.comment)}</p>
          <div class="comment-actions">
            <button class="reply-toggle" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}"><span class="btn-icon reply-icon">↩️</span> ${safeHtml(t("feed.reply"))}</button>
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

function renderPosts(posts) {
  feedPosts = Array.isArray(posts) ? posts : [];

  if (!feedContainer) return;
  if (feedPosts.length === 0) {
    feedContainer.innerHTML = `<div class="no-posts">${safeHtml(t("feed.noPosts"))}</div>`;
    return;
  }

  feedContainer.innerHTML = feedPosts.map((post) => `
    <div class="post" data-id="${safeHtml(post.id)}">
      <div class="post-header">
        <img src="${safeHtml(getProfileImage(post.profile_pic))}"
             alt="profile-avatar"
             class="profile-pic"
             onclick="viewProfile('${safeHtml(post.user_id)}')"
             style="cursor:pointer;"
             onerror="this.onerror=null; this.src='default-profile.png'">
        <div class="post-user-info">
          <h3 class="username" onclick="viewProfile('${safeHtml(post.user_id)}')" style="cursor:pointer;">${safeHtml(post.username)}</h3>
          <small class="post-time">${safeHtml(formatRelativeTime(post.created_at))}</small>
        </div>
      </div>
      <div class="post-content">
        ${renderContentWithEmbeds(post.content)}
        ${renderPostMedia(post)}
      </div>
      <div class="post-actions">
        <button class="like-btn ${post.is_liked ? 'liked' : ''}" data-id="${safeHtml(post.id)}">
          <span class="btn-icon like-icon">${post.is_liked ? "♥" : "♡"}</span> <span class="like-count">${Number(post.likes || 0)}</span>
        </button>
        <button class="comment-btn" data-id="${safeHtml(post.id)}">
          <span class="btn-icon comment-icon">💬</span> <span class="comment-count">${Array.isArray(post.comments) ? post.comments.length : 0}</span>
        </button>
      </div>
      <div class="comments-section" id="comments-${safeHtml(post.id)}" style="display:none;">
        ${renderComments(post.comments || [], post.id)}
        <div class="add-comment">
          <input type="text" placeholder="${safeHtml(t("feed.commentPlaceholder"))}" class="comment-input">
          <button class="submit-comment" data-id="${safeHtml(post.id)}">${safeHtml(t("common.submit"))}</button>
        </div>
      </div>
    </div>
  `).join("");
}

function viewProfile(userId) {
  if (!userId) return;
  window.location.href = `user-profile.html?id=${encodeURIComponent(userId)}`;
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

  try {
    const response = await fetch("https://laoverse.vercel.app/api/post", {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData
    });
    const data = await response.json();

    if (data.success) {
      showMessage(t("feed.postSuccess"), "success");
      postForm.reset();
      imagePreview.innerHTML = "";
      await loadFeed();
      return;
    }

    showMessage(data.message || t("feed.postFailed"), "error");
  } catch (error) {
    showMessage(t("feed.postFailed"), "error");
  }
}

async function loadFeed() {
  try {
    showLoading(true);
    const response = await fetch("https://laoverse.vercel.app/api/loadFeed", { 
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
    const response = await fetch("https://laoverse.vercel.app/api/like", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeaders()
      },
      body: `post_id=${encodeURIComponent(postId)}`
    });
    const data = await response.json();

    if (data.success) {
      button.innerHTML = `<span class="btn-icon like-icon">${data.is_liked ? "♥" : "♡"}</span> <span class="like-count">${Number(data.likes || 0)}</span>`;
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
    const response = await fetch("https://laoverse.vercel.app/api/comment", {
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
      return true;
    }

    showMessage(data.message || t(parentCommentId ? "feed.replyFailed" : "feed.commentFailed"), "error");
  } catch (error) {
    showMessage(t(parentCommentId ? "feed.replyFailed" : "feed.commentFailed"), "error");
  }

  return false;
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
    const response = await fetch("https://laoverse.vercel.app/api/check_auth", { 
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!data.success) {
      window.location.href = "index2.html";
      return;
    }
  } catch (error) {
    window.location.href = "index2.html";
    return;
  }

  loadFeed();
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

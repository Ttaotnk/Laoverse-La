let notedPosts = [];

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
             class="comment-profile-pic"
             onclick="goToUserProfile('${safeHtml(comment.user_id || "")}')"
             style="cursor:pointer;"
             onerror="this.src='default-profile.png'">
        <div class="comment-content">
          <div class="comment-header">
            <strong onclick="goToUserProfile('${safeHtml(comment.user_id || "")}')" style="cursor:pointer;">${safeHtml(comment.username)}</strong>
            <small>${safeHtml(formatRelativeTime(comment.created_at))}</small>
          </div>
          <p>${safeHtml(comment.comment)}</p>
          <div class="comment-actions">
            <button class="reply-toggle" data-post-id="${safeHtml(postId)}" data-comment-id="${safeHtml(comment.id)}">${safeHtml(t("feed.reply"))}</button>
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
  notedPosts = Array.isArray(posts) ? posts : [];
  const container = document.getElementById("commentedPostsContainer");
  if (!container) return;

  if (!notedPosts.length) {
    container.innerHTML = `<div class="no-posts">${safeHtml(t("note.empty"))}</div>`;
    return;
  }

  container.innerHTML = notedPosts.map((post) => {
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

    return `
      <div class="post" data-id="${safeHtml(post.id)}">
        <div class="post-header">
          <img src="${safeHtml((post.user && post.user.profile_pic) || "default-profile.png")}"
               class="post-profile-pic"
               onclick="goToUserProfile('${safeHtml((post.user && post.user.id) || "")}')"
               style="cursor:pointer;"
               onerror="this.src='default-profile.png'">
          <div class="post-user-info">
            <strong onclick="goToUserProfile('${safeHtml((post.user && post.user.id) || "")}')" style="cursor:pointer;">${safeHtml((post.user && post.user.username) || t("profile.unknownUser"))}</strong>
            <small>${safeHtml(formatRelativeTime(post.created_at))}</small>
          </div>
        </div>
        <div class="post-content">
          ${post.content ? `<p class="post-text">${safeHtml(post.content)}</p>` : ""}
          ${mediaHtml}
        </div>
        <div class="post-actions">
          <button class="like-btn ${post.is_liked ? "liked" : ""}" data-id="${safeHtml(post.id)}">
            ${post.is_liked ? "❤︎" : "♡"} <span class="like-count">${Number(post.likes_count || 0)}</span>
          </button>
          <button class="comment-btn" data-id="${safeHtml(post.id)}">
            💬 <span class="comment-count">${Number(post.comments_count || (post.comments || []).length || 0)}</span>
          </button>
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
  }).join("");
}

async function loadCommentedPosts() {
  showLoading(true);
  try {
    const response = await fetch("https://laoverse-production.up.railway.app/api/note/commented-posts", { credentials: "include" });
    if (!response.ok) throw new Error("load");
    const data = await response.json();
    if (data.success) {
      renderPosts(data.posts || []);
      return;
    }
    showMessage(data.message || t("note.loadFailed"), "error");
  } catch (error) {
    showMessage(t("note.loadFailed"), "error");
  } finally {
    showLoading(false);
  }
}

async function likePost(postId) {
  showLoading(true);
  try {
    const formData = new FormData();
    formData.append("post_id", postId);
    const response = await fetch("https://laoverse-production.up.railway.app/api/note/like", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      await loadCommentedPosts();
      return;
    }
    showMessage(data.message || t("note.likeFailed"), "error");
  } catch (error) {
    showMessage(t("note.likeFailed"), "error");
  } finally {
    showLoading(false);
  }
}

async function addComment(postId, comment, parentCommentId) {
  showLoading(true);
  try {
    const formData = new FormData();
    formData.append("post_id", postId);
    formData.append("comment", comment);
    if (parentCommentId) formData.append("parent_comment_id", parentCommentId);

    const response = await fetch("https://laoverse-production.up.railway.app/api/note/comment", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      await loadCommentedPosts();
      return true;
    }
    showMessage(data.message || t("note.addCommentFailed"), "error");
  } catch (error) {
    showMessage(t("note.addCommentFailed"), "error");
  } finally {
    showLoading(false);
  }
  return false;
}

function setupInteractions() {
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

  document.addEventListener("keypress", (event) => {
    if (event.key !== "Enter") return;
    if (event.target.classList.contains("comment-input")) {
      event.preventDefault();
      const postId = event.target.getAttribute("data-postid");
      const button = document.querySelector(`.submit-comment[data-id="${postId}"]`);
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

document.addEventListener("DOMContentLoaded", () => {
  setupInteractions();
  loadCommentedPosts();
});

document.addEventListener("laoverse:languagechange", () => {
  renderPosts(notedPosts);
  const loading = document.getElementById("loading");
  if (loading) {
    const text = loading.querySelector("span");
    if (text) text.textContent = t("common.loading");
  }
});

window.goToUserProfile = goToUserProfile;

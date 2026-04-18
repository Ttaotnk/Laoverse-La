let notifications = [];

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

function viewPostFromNotification(postId) {
  if (!postId) return;
  // Store the post ID to load in the modal
  sessionStorage.setItem('viewPostId', postId);
  openPostModal();
}

async function openPostModal() {
  const postId = sessionStorage.getItem('viewPostId');
  if (!postId) return;

  const token = localStorage.getItem('laoverse_jwt') || '';
  try {
    const response = await fetch(`https://wit-lee-however-coleman.trycloudflare.com/api/get_post/${postId}`, {
      headers: { "Authorization": `Bearer ${token}` },
      credentials: "include"
    });
    const data = await response.json();
    
    if (!data.success || !data.post) {
      showMessage("Post not found", "error");
      return;
    }

    const post = data.post;
    const comments = post.comments || [];
    
    // Group comments by parent (for threading)
    const parentComments = comments.filter(c => !c.parent_comment_id);
    const childComments = {};
    comments.forEach(c => {
      if (c.parent_comment_id) {
        if (!childComments[c.parent_comment_id]) {
          childComments[c.parent_comment_id] = [];
        }
        childComments[c.parent_comment_id].push(c);
      }
    });

    // Build comments HTML
    let commentsHtml = '';
    if (comments.length > 0) {
      commentsHtml += `<div class="comments-section"><h4><img src="icons/comment.svg" alt="comments" class="btn-icon comment-icon"> Comments</h4>`;
      parentComments.forEach(pComment => {
        commentsHtml += `
          <div class="comment-thread">
            <div class="comment">
              <img src="${safeHtml(pComment.user_pic || 'default-profile.png')}" 
                   class="comment-profile-pic"
                   onclick="goToUserProfile('${safeHtml(pComment.user_id)}')"
                   style="cursor:pointer;"
                   onerror="this.src='default-profile.png'">
              <div class="comment-content">
                <div class="comment-header">
                  <strong onclick="goToUserProfile('${safeHtml(pComment.user_id)}')" style="cursor:pointer;">${safeHtml(pComment.username)}</strong>
                  <small>${safeHtml(formatRelativeTime(pComment.created_at))}</small>
                </div>
                <p>${safeHtml(pComment.text)}</p>
                <button class="reply-to-comment-btn" onclick="showReplyInput('${safeHtml(pComment._id)}', '${safeHtml(pComment.username)}')"><img src="icons/reply.svg" alt="reply" class="btn-icon reply-icon"> ${t("feed.reply")}</button>
              </div>
            </div>
        `;
        
        // Add child comments (replies)
        if (childComments[pComment._id]) {
          commentsHtml += '<div class="child-comments">';
          childComments[pComment._id].forEach(childComment => {
            commentsHtml += `
              <div class="comment child-comment">
                <img src="${safeHtml(childComment.user_pic || 'default-profile.png')}" 
                     class="comment-profile-pic"
                     onclick="goToUserProfile('${safeHtml(childComment.user_id)}')"
                     style="cursor:pointer;"
                     onerror="this.src='default-profile.png'">
                <div class="comment-content">
                  <div class="comment-header">
                    <strong onclick="goToUserProfile('${safeHtml(childComment.user_id)}')" style="cursor:pointer;">${safeHtml(childComment.username)}</strong>
                    <small>${safeHtml(formatRelativeTime(childComment.created_at))}</small>
                  </div>
                  <p>${safeHtml(childComment.text)}</p>
                  <button class="reply-to-comment-btn" onclick="showReplyInput('${safeHtml(pComment._id)}', '${safeHtml(childComment.username)}')"><img src="icons/reply.svg" alt="reply" class="btn-icon reply-icon"> ${t("feed.reply")}</button>
                </div>
              </div>
            `;
          });
          commentsHtml += '</div>';
        }
        
        // Reply input for this comment
        commentsHtml += `
          <div class="reply-input-section" id="replySection_${safeHtml(pComment._id)}" style="display:none;">
            <div class="add-reply">
              <input type="text" 
                     class="reply-input-field"
                     placeholder="${t("feed.replyPlaceholder")}"
                     data-parent-id="${safeHtml(pComment._id)}"
                     data-post-id="${safeHtml(postId)}">
              <button class="submit-reply-btn" onclick="submitReplyToComment('${safeHtml(postId)}', '${safeHtml(pComment._id)}', event)">${t("common.submit")}</button>
              <button class="cancel-reply-btn" onclick="closeReplyInput('${safeHtml(pComment._id)}')">${t("common.cancel")}</button>
            </div>
          </div>
        `;
        
        commentsHtml += '</div>';
      });
      commentsHtml += '</div>';
    } else {
      commentsHtml = '<div class="comments-section"><p class="no-comments">' + t("feed.noComments") + '</p></div>';
    }
    
    const modal = document.createElement('div');
    modal.id = 'postModal';
    modal.className = 'post-modal';
    
    const postContent = `
      <div class="post-modal-content">
        <button class="close-modal" onclick="closePostModal()">&times;</button>
        <div class="modal-post">
          <div class="post-header">
            <img src="${safeHtml(post.user_pic || 'default-profile.png')}" 
                 class="post-profile-pic"
                 onclick="goToUserProfile('${safeHtml(post.user_id)}')"
                 style="cursor:pointer;"
                 onerror="this.src='default-profile.png'">
            <div class="post-user-info">
              <strong onclick="goToUserProfile('${safeHtml(post.user_id)}')" style="cursor:pointer;">${safeHtml(post.username)}</strong>
              <small>${safeHtml(formatRelativeTime(post.created_at))}</small>
            </div>
          </div>
          <div class="post-content">
            <p class="post-text">${safeHtml(post.content)}</p>
            ${post.image ? `<img src="${safeHtml(post.image)}" class="post-image" onerror="this.style.display='none'">` : ''}
          </div>
          <div class="post-actions">
            <button class="like-btn ${post.is_liked ? 'liked' : ''}" onclick="toggleLike('${safeHtml(post._id)}', event)"><img src="icons/heart.svg" alt="like" class="btn-icon like-icon"> Like</button>
            <button class="comment-btn" onclick="focusReplyInput()"><img src="icons/comment.svg" alt="comment" class="btn-icon comment-icon"> ${t("feed.commentPlaceholder")}</button>
          </div>
        </div>

        ${commentsHtml}

        <div class="reply-section">
          <h4>${t("feed.commentPlaceholder")}</h4>
          <div class="add-comment">
            <input type="text" 
                   id="replyInput" 
                   class="comment-input"
                   placeholder="${t("feed.commentPlaceholder")}"
                   data-post-id="${safeHtml(post._id)}">
            <button class="submit-comment" onclick="submitReply('${safeHtml(post._id)}', event)">${t("common.submit")}</button>
          </div>
        </div>
      </div>
    `;
    
    modal.innerHTML = postContent;
    document.body.appendChild(modal);
    modal.style.display = 'block';
  } catch (error) {
    showMessage("Unable to load post", "error");
  }
}

function closePostModal() {
  const modal = document.getElementById('postModal');
  if (modal) modal.remove();
  sessionStorage.removeItem('viewPostId');
}

async function toggleLike(postId, event) {
  event.stopPropagation();
  const token = localStorage.getItem('laoverse_jwt') || '';
  try {
    const response = await fetch("https://wit-lee-however-coleman.trycloudflare.com/api/toggle_like", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`
      },
      body: `post_id=${encodeURIComponent(postId)}`,
      credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
      event.target.closest('.like-btn').classList.toggle('liked');
    }
  } catch (error) {
    showMessage(t("note.likeFailed") || "Unable to like post", "error");
  }
}

function focusReplyInput() {
  const input = document.getElementById('replyInput');
  if (input) input.focus();
}

async function submitReply(postId, event) {
  event.preventDefault();
  const input = document.getElementById('replyInput');
  if (!input || !input.value.trim()) {
    showMessage(t("feed.commentRequired") || "Please enter a comment", "error");
    return;
  }

  const token = localStorage.getItem('laoverse_jwt') || '';
  try {
    showLoading(true);
    const response = await fetch("https://wit-lee-however-coleman.trycloudflare.com/api/comment", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`
      },
      body: `post_id=${encodeURIComponent(postId)}&comment=${encodeURIComponent(input.value.trim())}`,
      credentials: "include"
    });
    const data = await response.json();
    
    if (data.success) {
      showMessage("Comment added successfully", "success");
      input.value = '';
      // Reload post to show new comment
      setTimeout(() => {
        const postId = sessionStorage.getItem('viewPostId');
        if (postId) {
          closePostModal();
          openPostModal();
        }
      }, 500);
    } else {
      showMessage(data.message || t("feed.commentFailed") || "Unable to add comment", "error");
    }
  } catch (error) {
    showMessage(t("feed.commentFailed") || "Unable to add comment", "error");
  } finally {
    showLoading(false);
  }
}

function showReplyInput(commentId, commenterName) {
  const replySection = document.getElementById(`replySection_${commentId}`);
  if (replySection) {
    replySection.style.display = 'block';
    const input = replySection.querySelector('.reply-input-field');
    if (input) {
      input.focus();
      input.placeholder = `${t("feed.replyPlaceholder")} @${commenterName}`;
    }
  }
}

function closeReplyInput(commentId) {
  const replySection = document.getElementById(`replySection_${commentId}`);
  if (replySection) {
    replySection.style.display = 'none';
    const input = replySection.querySelector('.reply-input-field');
    if (input) input.value = '';
  }
}

async function submitReplyToComment(postId, parentCommentId, event) {
  event.preventDefault();
  const replySection = document.getElementById(`replySection_${parentCommentId}`);
  if (!replySection) return;
  
  const input = replySection.querySelector('.reply-input-field');
  if (!input || !input.value.trim()) {
    showMessage(t("feed.replyRequired") || "Please enter a reply", "error");
    return;
  }

  const token = localStorage.getItem('laoverse_jwt') || '';
  try {
    showLoading(true);
    const response = await fetch("https://wit-lee-however-coleman.trycloudflare.com/api/comment", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`
      },
      body: `post_id=${encodeURIComponent(postId)}&comment=${encodeURIComponent(input.value.trim())}&parent_comment_id=${encodeURIComponent(parentCommentId)}`,
      credentials: "include"
    });
    const data = await response.json();
    
    if (data.success) {
      showMessage("Reply added successfully", "success");
      input.value = '';
      closeReplyInput(parentCommentId);
      // Reload post to show new reply
      setTimeout(() => {
        const postId = sessionStorage.getItem('viewPostId');
        if (postId) {
          closePostModal();
          openPostModal();
        }
      }, 500);
    } else {
      showMessage(data.message || t("feed.replyFailed") || "Unable to add reply", "error");
    }
  } catch (error) {
    showMessage(t("feed.replyFailed") || "Unable to add reply", "error");
  } finally {
    showLoading(false);
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case 'like':
      return '<img src="icons/heart.svg" alt="like" class="btn-icon">';
    case 'comment':
      return '<img src="icons/comment.svg" alt="comment" class="btn-icon">';
    case 'reply':
      return '<img src="icons/reply.svg" alt="reply" class="btn-icon">';
    case 'friend-request':
      return '<img src="icons/friend.svg" alt="friend" class="btn-icon">';
    default:
      return '<img src="icons/notification.svg" alt="notification" class="btn-icon">';
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
              <button class="accept-request" data-user-id="${safeHtml(notif.actor_id)}" data-request-id="${safeHtml(notif.id)}">? ${safeHtml(t("friends.accept"))}</button>
              <button class="decline-request" data-user-id="${safeHtml(notif.actor_id)}" data-request-id="${safeHtml(notif.id)}">? ${safeHtml(t("friends.reject"))}</button>
            </div>
          </div>
        </div>
      `;
    }

    let contentPreview = "";
    if (notif.type === 'like') {
      contentPreview = `<span class="content-preview" onclick="viewPostFromNotification('${safeHtml(notif.target_id)}')" style="cursor:pointer;">"${safeHtml((notif.target_content || "").substring(0, 50))}"</span>`;
    } else if (notif.type === 'comment') {
      contentPreview = `<span class="comment-preview" onclick="viewPostFromNotification('${safeHtml(notif.target_id)}')" style="cursor:pointer;">"${safeHtml((notif.comment_text || "").substring(0, 50))}"</span>`;
    } else if (notif.type === 'reply') {
      contentPreview = `<span class="comment-preview" onclick="viewPostFromNotification('${safeHtml(notif.target_id)}')" style="cursor:pointer;">"${safeHtml((notif.comment_text || "").substring(0, 50))}"</span>`;
    }

    return `
      <div class="notification ${notif.type}-notif" data-id="${safeHtml(notif.id)}" onclick="viewPostFromNotification('${safeHtml(notif.target_id)}')">
        <img src="${safeHtml(notif.actor_pic || "default-profile.png")}"
             class="notif-avatar"
             onclick="event.stopPropagation(); goToUserProfile('${safeHtml(notif.actor_id || "")}')"
             style="cursor:pointer;"
             onerror="this.src='default-profile.png'">
        <div class="notif-content">
          <div class="notif-message">
            <span class="notif-icon">${icon}</span>
            <span class="notif-text">
              <strong onclick="event.stopPropagation(); goToUserProfile('${safeHtml(notif.actor_id)}')" style="cursor:pointer;">${safeHtml(notif.actor_name)}</strong>
              ${safeHtml(t(notif.type === 'like' ? "note.likedYourPost" : notif.type === 'reply' ? "note.repliedToYourComment" : "note.commentedOnYourPost"))}
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
    const response = await fetch("https://wit-lee-however-coleman.trycloudflare.com/api/get-notifications", { 
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
    
    const response = await fetch("https://wit-lee-however-coleman.trycloudflare.com/api/respond_request", {
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
    const authResponse = await fetch("https://wit-lee-however-coleman.trycloudflare.com/api/check_auth", { 
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

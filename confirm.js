// Shared confirmation modal utility with language.js support
(function() {
  let confirmModal = null;
  let confirmCallback = null;

  // Safe translation function
  function t(key, fallback) {
    if (typeof window.t === 'function') {
      return window.t(key) || fallback;
    }
    if (window.LanguageManager && typeof window.LanguageManager.translate === 'function') {
      return window.LanguageManager.translate(key) || fallback;
    }
    return fallback;
  }

  function updateConfirmLanguage() {
    if (!confirmModal) return;
    
    const titleEl = document.getElementById('confirmModalTitle');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    const okBtn = document.getElementById('confirmOkBtn');
    
    // Update buttons with current language
    if (cancelBtn) {
      cancelBtn.textContent = t('common.cancel', 'ยกเลิก');
    }
    if (okBtn) {
      okBtn.textContent = t('common.confirm', 'ยืนยัน');
    }
  }

  function createConfirmModal() {
    if (document.getElementById('globalConfirmModal')) return;

    const modalHTML = `
    <div id="globalConfirmModal" class="confirm-modal">
      <div class="confirm-modal-content">
        <h3 id="confirmModalTitle">${t('common.confirm', 'ยืนยัน')}</h3>
        <p id="confirmModalMessage"></p>
        <div class="confirm-modal-buttons">
          <button id="confirmCancelBtn" class="confirm-btn cancel">${t('common.cancel', 'ยกเลิก')}</button>
          <button id="confirmOkBtn" class="confirm-btn ok">${t('common.confirm', 'ยืนยัน')}</button>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    confirmModal = document.getElementById('globalConfirmModal');

    // Add styles
    const style = document.createElement('style');
    style.id = 'confirm-modal-styles';
    style.textContent = `
      .confirm-modal {
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        animation: fadeIn 0.3s ease;
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
      }

      .confirm-modal-content {
        background-color: var(--gray, #222);
        padding: 2rem;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        border: 1px solid var(--neon-blue, #66f0ff);
        text-align: center;
        animation: slideDown 0.3s ease;
        position: relative;
      }

      .confirm-modal-content h3 {
        color: var(--neon-blue, #66f0ff);
        margin-bottom: 1rem;
        font-size: 1.3rem;
      }

      .confirm-modal-content p {
        color: var(--white, #fff);
        margin-bottom: 1.5rem;
        font-size: 1rem;
        line-height: 1.5;
      }

      .confirm-modal-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .confirm-btn {
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 100px;
        max-width: 150px;
      }

      .confirm-btn.cancel {
        background-color: var(--light-gray, #333);
        color: var(--white, #fff);
        border: 1px solid var(--neon-blue, #66f0ff);
      }

      .confirm-btn.cancel:hover {
        background-color: var(--neon-blue, #66f0ff);
        color: var(--black, #000);
        box-shadow: 0 0 15px var(--neon-blue, #66f0ff);
      }

      .confirm-btn.ok {
        background-color: #ff4444;
        color: var(--white, #fff);
      }

      .confirm-btn.ok:hover {
        background-color: #ff6666;
        box-shadow: 0 0 15px rgba(255, 68, 68, 0.5);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideDown {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @media (max-width: 480px) {
        .confirm-modal-content {
          margin: 20% auto;
          padding: 1.5rem;
          width: 95%;
        }

        .confirm-modal-content h3 {
          font-size: 1.1rem;
        }

        .confirm-modal-content p {
          font-size: 0.9rem;
        }

        .confirm-btn {
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          min-width: 80px;
          max-width: 120px;
        }
      }
    `;
    document.head.appendChild(style);

    // Event listeners
    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
      console.log('Cancel button clicked!');
      hideConfirmModal();
    });

    document.getElementById('confirmOkBtn').addEventListener('click', () => {
      console.log('Confirm OK button clicked!');
      const callback = confirmCallback;
      confirmCallback = null;
      confirmModal.style.display = 'none';
      if (callback) {
        console.log('Calling callback with true');
        callback(true);
      } else {
        console.error('No callback found!');
      }
    });

    // Close when clicking outside
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        hideConfirmModal();
      }
    });

    // Listen for language changes
    document.addEventListener('laoverse:languagechange', () => {
      updateConfirmLanguage();
    });
  }

  function showConfirmModal(message, title, callback) {
    console.log('showConfirmModal called with:', { message, title });
    if (!confirmModal) {
      createConfirmModal();
    }

    const messageEl = document.getElementById('confirmModalMessage');
    const titleEl = document.getElementById('confirmModalTitle');

    if (messageEl) messageEl.textContent = message;
    if (titleEl) titleEl.textContent = title || t('common.confirm', 'ยืนยัน');

    confirmCallback = callback;
    confirmModal.style.display = 'flex';
    console.log('Modal displayed, callback set.');
  }

  function hideConfirmModal() {
    const modal = document.getElementById('globalConfirmModal');
    if (modal) {
      modal.style.display = 'none';
    }
    if (confirmCallback) {
      console.log('Hide confirm modal - calling callback with false');
      const callback = confirmCallback;
      confirmCallback = null;
      callback(false);
    }
  }

  // Expose to global scope
  window.showConfirm = function(message, title) {
    console.log('window.showConfirm called');
    return new Promise((resolve) => {
      showConfirmModal(message, title, (result) => {
        console.log('Confirm modal resolved with:', result);
        resolve(result);
      });
    });
  };

  // Add a specialized modal for deleting messages with 3 options
  window.showDeleteOptions = function() {
    return new Promise((resolve) => {
      // Create or get the delete options modal
      let deleteModal = document.getElementById('deleteOptionsModal');
      if (!deleteModal) {
        const modalHTML = `
        <div id="deleteOptionsModal" class="confirm-modal">
          <div class="confirm-modal-content">
            <h3 id="deleteModalTitle">${t('common.delete', 'ลบข้อความ')}</h3>
            <p id="deleteModalMessage">${t('messages.confirmDeleteMessage', 'ท่านต้องการลบข้อความนี้อย่างไร?')}</p>
            <div class="confirm-modal-buttons" style="flex-direction: column;">
              <button id="deleteEveryoneBtn" class="confirm-btn ok" style="max-width: 100%; width: 100%; margin-bottom: 0.5rem; background-color: #ff4444;">
                ${t('messages.confirmDeleteForEveryone', 'ลบสำหรับทุกคน')}
              </button>
              <button id="deleteMeBtn" class="confirm-btn ok" style="max-width: 100%; width: 100%; margin-bottom: 0.5rem; background-color: #555;">
                ${t('messages.confirmDeleteForMe', 'ลบเฉพาะฉัน')}
              </button>
              <button id="deleteCancelBtn" class="confirm-btn cancel" style="max-width: 100%; width: 100%;">
                ${t('common.cancel', 'ยกเลิก')}
              </button>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        deleteModal = document.getElementById('deleteOptionsModal');
      }

      const everyoneBtn = document.getElementById('deleteEveryoneBtn');
      const meBtn = document.getElementById('deleteMeBtn');
      const cancelBtn = document.getElementById('deleteCancelBtn');

      const cleanup = (val) => {
        deleteModal.style.display = 'none';
        everyoneBtn.onclick = null;
        meBtn.onclick = null;
        cancelBtn.onclick = null;
        resolve(val);
      };

      everyoneBtn.onclick = () => cleanup('everyone');
      meBtn.onclick = () => cleanup('me');
      cancelBtn.onclick = () => cleanup(null);
      
      deleteModal.style.display = 'flex';
    });
  };

  window.hideConfirm = hideConfirmModal;

  // Auto-create on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createConfirmModal();
    });
  } else {
    createConfirmModal();
  }
})();

(function () {
  const THEMES = {
    default: {
      "--neon-blue": "#66f0ff",
      "--light-blue": "#00b7d4",
      "--soft-blue": "#8bd8e5",
      "--black": "#000000",
      "--white": "#ffffff",
      "--gray": "#222222",
      "--light-gray": "#333333",
      "--chat-gray": "#1a1a1a"
    },
    green: {
      "--neon-blue": "#78ff8a",
      "--light-blue": "#29c64a",
      "--soft-blue": "#9cf1ab",
      "--black": "#041109",
      "--white": "#ecfff0",
      "--gray": "#12301c",
      "--light-gray": "#1d4429",
      "--chat-gray": "#0e2717"
    },
    pink: {
      "--neon-blue": "#ff74d4",
      "--light-blue": "#ff3fb8",
      "--soft-blue": "#ffc0eb",
      "--black": "#180712",
      "--white": "#fff0fa",
      "--gray": "#36152b",
      "--light-gray": "#4a1f3a",
      "--chat-gray": "#260f1e"
    },
    light: {
      "--neon-blue": "#3b82f6",     /* ฟ้าหลัก */
      "--light-blue": "#60a5fa",    /* ฟ้ารอง */
      "--soft-blue": "#93c5fd",     /* ฟ้านุ่ม */

      "--black": "#ffffff",         /* พื้นหลังในธีມสว่าง */
      "--white": "#1f2937",         /* ตัวอักษรในธีมสว่าง */
      "--gray": "#f3f4f6",          /* พื้นหลัง Card/Box */
      "--light-gray": "#e5e7eb",    /* พื้นหลัง Input */
      "--chat-gray": "#f9fafb",     /* กล่องแชท */

      /* WhatsApp light theme colors */
      "--wa-dark-bg": "#ffffff",
      "--wa-item-bg": "#f0f2f5",
      "--wa-chat-bg": "#efeae2",
      "--wa-header-bg": "#f0f2f5",
      "--wa-input-bg": "#ffffff",
      "--wa-msg-left": "#ffffff",
      "--wa-msg-right": "#d9fdd3",
      "--wa-text": "#111b21",
      "--wa-dim": "#667781",
      "--wa-online": "#00a884"
    }
  };

  const THEME_LOGOS = {
    default: "logo.png",
    green: "logo1.png",
    pink: "logo2.png",
    light: "logo3.png"
  };

  const THEME_PROFILES = {
    default: "default-profile.png",
    green: "green-profile.png",
    pink: "pink-profile.png",
    light: "light-profile.png"
  };

  function getThemeDefaultProfile() {
    const themeName = window.ThemeManager ? window.ThemeManager.getTheme() : "default";
    return THEME_PROFILES[themeName] || THEME_PROFILES.default;
  }

  function applyProfilesForTheme(themeName) {
    const profilePicPath = THEME_PROFILES[themeName] || THEME_PROFILES.default;
    // Heuristic selector: targets img tags whose src attribute contains 'default-profile.png'
    // This selector assumes that un-set profile pictures are named 'default-profile.png'
    // and will be updated to the theme-specific profile picture.
    const profileImages = document.querySelectorAll('img[src*="default-profile.png"], img[src*="green-profile.png"], img[src*="pink-profile.png"], img[src*="light-profile.png"]');

    profileImages.forEach(img => {
      img.src = profilePicPath;
      img.setAttribute('data-theme-profile', themeName); // Optional: track applied theme
    });
  }

  window.getThemeDefaultProfile = getThemeDefaultProfile;

  function ensureThemeUiStyles() {
    const styleId = "theme-ui-overrides";
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      :root[data-theme="light"] body {
        background-color: #ffffff !important;
        color: #1f2937 !important;
        background-image: none !important;
      }
      :root[data-theme="light"] .main-header,
      :root[data-theme="light"] .haha,
      :root[data-theme="light"] .haha1,
      :root[data-theme="light"] header:not(.main-header) {
        background-color: #ffffff !important;
        border-color: #e5e7eb !important;
      }
      :root[data-theme="light"] .card,
      :root[data-theme="light"] .profile-container,
      :root[data-theme="light"] .post,
      :root[data-theme="light"] .login-container,
      :root[data-theme="light"] .register-container,
      :root[data-theme="light"] .modal-content,
      :root[data-theme="light"] .settings-container .card {
        background-color: #f9fafb !important;
        border-color: #e5e7eb !important;
        color: #1f2937 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
      }
      :root[data-theme="light"] input,
      :root[data-theme="light"] textarea,
      :root[data-theme="light"] select {
        background-color: #ffffff !important;
        border-color: #d1d5db !important;
        color: #1f2937 !important;
      }
      :root[data-theme="light"] input::placeholder,
      :root[data-theme="light"] textarea::placeholder {
        color: #9ca3af !important;
      }
      :root[data-theme="light"] .post-text,
      :root[data-theme="light"] .comment-text,
      :root[data-theme="light"] .user-name,
      :root[data-theme="light"] .profile-info p {
        color: #1f2937 !important;
      }
      :root[data-theme="light"] .main-nav a {
        background-color: #f3f4f6 !important;
        color: #4b5563 !important;
        border-color: #d1d5db !important;
      }
      :root[data-theme="light"] .main-nav a.active {
        background-color: #3b82f6 !important;
        color: #ffffff !important;
        border-color: #3b82f6 !important;
      }
      :root[data-theme="light"] .post-actions button,
      :root[data-theme="light"] .comment-actions button {
        background-color: #f3f4f6 !important;
        color: #4b5563 !important;
      }
      :root[data-theme="light"] .profile-container {
        background-color: #ffffff !important;
        border: 1px solid #e5e7eb !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
      }
      :root[data-theme="light"] .post-user-info strong,
      :root[data-theme="light"] .comment-username {
        color: #1f2937 !important;
      }
      :root[data-theme="light"] .comment-text {
        color: #374151 !important;
      }
      :root[data-theme="light"] .comments-section {
        background-color: #f9fafb !important;
        border: 1px solid #e5e7eb !important;
      }
      :root[data-theme="light"] .profile-container img {
        width: 140px !important;
        height: 140px !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        flex-shrink: 0 !important;
        min-width: 140px !important;
        border-color: #d1d5db !important;
        box-shadow: none !important;
      }
      :root[data-theme="light"] .post-profile-pic {
        width: 38px !important;
        height: 38px !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        border-color: #d1d5db !important;
      }
      :root[data-theme="light"] .comment-profile-pic {
        width: 30px !important;
        height: 30px !important;
        border-radius: 50% !important;
        object-fit: cover !important;
      }
      :root[data-theme="light"] .profile-info h2 {
        color: #1f2937 !important;
      }
      :root[data-theme="light"] .message {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
      }
      :root[data-theme="light"] .contact-item {
        background-color: #f3f4f6 !important;
        border-color: #d1d5db !important;
        color: #1f2937 !important;
      }
      :root[data-theme="light"] .contact-item:hover {
        background-color: #e5e7eb !important;
        border-color: #3b82f6 !important;
      }
      :root[data-theme="light"] .contact-label {
        color: #2563eb !important;
      }
      :root[data-theme="light"] .contact-value {
        color: #4b5563 !important;
      }
      /*
        โลโก้ JPG มักมีกรอบดำรอบตัวอักษร — ให้กลมกลืนกับพื้นหลัง header/ธีม
        - ธีมมืด: screen ทำให้พิกเซลดำ (0) รับสีพื้นหลังด้านหลัง
        - ธีมสว่าง: multiply ทำให้พื้นขาวในรูปกลืนกับพื้นขาว (ถ้าในไฟล์เป็นขาวจริง)
        ถ้ายังเห็นกรอบดำชัด: แนะนำใช้ PNG โปร่งใสแทน JPG
      */
      .main-header .logo,
      header:not(.main-header) {
        background: transparent !important;
      }
      .main-header .logo img,
      header img#logo,
      img#logo {
        vertical-align: middle;
        background: transparent !important;
      }

      :root[data-theme="default"] .main-header .logo img,
      :root[data-theme="green"] .main-header .logo img,
      :root[data-theme="pink"] .main-header .logo img,
      :root[data-theme="default"] header img#logo,
      :root[data-theme="green"] header img#logo,
      :root[data-theme="pink"] header img#logo {
        mix-blend-mode: screen;
      }

      :root[data-theme="light"] .main-header .logo img,
      :root[data-theme="light"] header img#logo,
      :root[data-theme="light"] img#logo {
        mix-blend-mode: multiply;
      }
    `;
    document.head.appendChild(style);
  }

  function applyLogoForTheme(themeName) {
    const logoPath = THEME_LOGOS[themeName] || THEME_LOGOS.default;
    document.querySelectorAll(".logo img, img#logo").forEach((img) => {
      img.src = logoPath;
    });
  }

  function syncBodyOffsetWithHeader() {
    const header = document.querySelector(".main-header");
    if (!header || !document.body) return;
    const safeGap = 14;
    const height = Math.ceil(header.getBoundingClientRect().height) + safeGap;
    document.body.style.paddingTop = `${height}px`;
  }

  function initHeaderOffsetSync() {
    const run = () => {
      requestAnimationFrame(syncBodyOffsetWithHeader);
      setTimeout(syncBodyOffsetWithHeader, 80);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
      run();
    }

    window.addEventListener("resize", syncBodyOffsetWithHeader);
    window.addEventListener("orientationchange", syncBodyOffsetWithHeader);
    window.addEventListener("load", syncBodyOffsetWithHeader);
  }

  function applyTheme(themeName) {
    const theme = THEMES[themeName] || THEMES.default;
    const root = document.documentElement;
    Object.keys(theme).forEach((key) => {
      root.style.setProperty(key, theme[key]);
    });
    root.setAttribute("data-theme", themeName);

    /* โลโก้: ถ้า script อยู่ใน <head> ยังไม่มี .logo ใน DOM — รอ DOM พร้อม */
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function onReady() {
          applyLogoForTheme(themeName);
          applyProfilesForTheme(themeName);
        },
        { once: true }
      );
    } else {
      applyLogoForTheme(themeName);
      applyProfilesForTheme(themeName);
    }

    ensureThemeUiStyles();
    syncBodyOffsetWithHeader();
  }

  window.ThemeManager = {
    applyTheme,
    getTheme: function () {
      return localStorage.getItem("laoverse_theme") || "default";
    },
    setTheme: function (name) {
      localStorage.setItem("laoverse_theme", name);
      applyTheme(name);
    },
    themes: Object.keys(THEMES),
    getProfilePic: function (themeName) {
      const name = themeName || this.getTheme();
      return THEME_PROFILES[name] || THEME_PROFILES.default;
    }
  };

  initHeaderOffsetSync();
  applyTheme(window.ThemeManager.getTheme());
})();
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
      "--neon-blue": "#1658c7",
      "--light-blue": "#2a76ff",
      "--soft-blue": "#87aef7",
      "--black": "#ffffff",
      "--white": "#000000",
      "--gray": "#ffffff",
      "--light-gray": "#e7edf7",
      "--chat-gray": "#dce5f3"
    }
  };

  const THEME_LOGOS = {
    default: "logo.png",
    green: "logo1.png",
    pink: "logo2.png",
    light: "logo3.png"
  };

  function ensureThemeUiStyles() {
    const styleId = "theme-ui-overrides";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      :root[data-theme="light"] body {
        background-color: #ffffff !important;
        color: #000000 !important;
        background-image: none !important;
      }
      :root[data-theme="light"] .main-header,
      :root[data-theme="light"] .haha,
      :root[data-theme="light"] .haha1,
      :root[data-theme="light"] header:not(.main-header) {
        background-color: #ffffff !important;
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
        },
        { once: true }
      );
    } else {
      applyLogoForTheme(themeName);
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
    themes: Object.keys(THEMES)
  };

  initHeaderOffsetSync();
  applyTheme(window.ThemeManager.getTheme());
})();

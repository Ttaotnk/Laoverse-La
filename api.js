const API_BASE_URL = "https://servertnk-nakhaworking.click/api";
const BACKEND_URL = API_BASE_URL.replace(/\/api$/, "");

function getAuthHeaders() {
  const token = localStorage.getItem('laoverse_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Make globally available
window.API_BASE_URL = API_BASE_URL;
window.BACKEND_URL = BACKEND_URL;
window.getAuthHeaders = getAuthHeaders;

window.safeHtml = function(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

window.linkify = function(text) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener" class="post-link">${url}</a>`;
  });
};

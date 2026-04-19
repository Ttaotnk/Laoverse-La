const API_BASE_URL = "https://dried-ampland-armstrong-terms.trycloudflare.com/api";
const BACKEND_URL = API_BASE_URL.replace(/\/api$/, "");

function getAuthHeaders() {
  const token = localStorage.getItem('laoverse_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Make globally available
window.API_BASE_URL = API_BASE_URL;
window.BACKEND_URL = BACKEND_URL;
window.getAuthHeaders = getAuthHeaders;

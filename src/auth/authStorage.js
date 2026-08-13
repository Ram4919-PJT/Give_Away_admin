export const ACCESS_TOKEN_KEY = "giveaway-admin-access-token";
export const REFRESH_TOKEN_KEY = "giveaway-admin-refresh-token";
export const ADMIN_USER_KEY = "giveaway-admin-user";

export function saveTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
}

export function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveAdminUser(user) {
  if (user) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

export function loadAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAdminRole(user) {
  const roleName = user?.role?.role_name || user?.role_name;
  return roleName === "SUPER_ADMIN";
}

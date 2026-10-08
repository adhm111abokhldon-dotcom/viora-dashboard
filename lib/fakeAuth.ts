const SESSION_KEY = "viora-dashboard-local-access";
const ACCESS_ID = "viora";
const ACCESS_CODE = "2004";

export function startLocalSession(id: string, code: string): boolean {
  if (id.trim().toLowerCase() !== ACCESS_ID || code !== ACCESS_CODE) {
    return false;
  }

  window.sessionStorage.setItem(SESSION_KEY, "granted");
  return true;
}

export function hasLocalSession(): boolean {
  return window.sessionStorage.getItem(SESSION_KEY) === "granted";
}

export function endLocalSession(): void {
  window.sessionStorage.removeItem(SESSION_KEY);
}

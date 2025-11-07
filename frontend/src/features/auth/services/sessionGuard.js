let sharedController = new AbortController();
let handling401 = false;

export function getAbortSignal() {
  return sharedController.signal;
}

export function abortAllRequests() {
  try {
    sharedController.abort();
  } catch {}
  sharedController = new AbortController();
}

export function getAuthToken() {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export async function handleUnauthorized() {
  if (handling401) return;
  handling401 = true;
  try {
    // Clear local session
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } catch {}
    // Abort any in-flight requests
    abortAllRequests();
    // Redirect to login
    window.location.replace('/');
  } finally {
    handling401 = false;
  }
}



export function generateSessionId(): string {
  // Generate a unique session ID based on timestamp and random number
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function getSessionId(formId: string): string {
  const storageKey = `session_${formId}`;
  let sessionId = localStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

export const USERNAME_PATTERN =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

// Accepts "torvalds", "@torvalds" or a URL-encoded path segment and returns
// the bare login, or null when it cannot be a GitHub username.
export function normalizeUsername(input: string): string | null {
  const decoded = (() => {
    try {
      return decodeURIComponent(input);
    } catch {
      return input;
    }
  })();
  const login = decoded.trim().replace(/^@/, "");
  return USERNAME_PATTERN.test(login) ? login : null;
}

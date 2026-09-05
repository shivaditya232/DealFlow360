// Shared HTTP error factory — use this instead of copy-pasting in every service.
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

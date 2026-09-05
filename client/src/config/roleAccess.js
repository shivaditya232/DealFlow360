// Single source of truth for "which internal roles can see this section".
// Used both to hide nav links (AppShell) and to guard the route itself
// (RoleRoute) so a role without access can't reach the page by typing the
// URL directly.
export const APPROVALS_ROLES = ['MANAGER', 'FINANCE', 'ADMIN'];

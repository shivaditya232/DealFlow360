// Single source of truth for "which internal roles can see this section".
// Used both to hide nav links (AppShell) and to guard the route itself
// (RoleRoute) so a role without access can't reach the page by typing the
// URL directly.
export const APPROVALS_ROLES = ['MANAGER', 'FINANCE', 'ADMIN'];

// Products catalog + discount/approval config — PS: "Admin: manages backend
// setup (products, price lists, discount tiers, warehouses, subscription
// plans)". Reps still fetch the product list directly (AddLineModal) without
// this nav/route — this gates the management screen, not the read-only data.
export const PRODUCTS_ROLES = ['ADMIN'];

// Team management (create Manager/Finance/Sales Rep/Admin accounts) — Admin
// only, same rationale as PRODUCTS_ROLES.
export const TEAM_ROLES = ['ADMIN'];

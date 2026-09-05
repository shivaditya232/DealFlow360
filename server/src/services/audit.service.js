import prisma from "../config/prisma.js";

// Single write path for AuditLog so every module logs the same shape.
// userId is nullable — pass null for system-triggered actions (e.g. auto-approve).
export async function logAction({ companyId, userId = null, entityType, entityId, action, metadata }) {
  await prisma.auditLog.create({
    data: { companyId, userId, entityType, entityId, action, metadata: metadata ?? undefined },
  });
}

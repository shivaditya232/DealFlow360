import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.util.js";

let io;

/**
 * Initialises Socket.IO on the given http.Server.
 * Call once from src/index.js after creating the HTTP server.
 *
 * Clients join a room named after the quotationId they are viewing:
 *   socket.emit("join", { quotationId })
 *
 * Auth: JWT passed as handshake auth token:
 *   io({ auth: { token: "Bearer ..." } })
 */
export function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Middleware — authenticate every socket connection
  io.use((socket, next) => {
    try {
      const raw = socket.handshake.auth?.token ?? "";
      const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
      socket.auth = verifyAccessToken(token);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // Client sends "join" to subscribe to real-time events for a specific quotation
    socket.on("join", ({ quotationId }) => {
      if (quotationId) socket.join(`quotation:${quotationId}`);
    });

    socket.on("leave", ({ quotationId }) => {
      if (quotationId) socket.leave(`quotation:${quotationId}`);
    });
  });

  return io;
}

/**
 * Broadcasts a payload to all sockets watching a given quotation.
 * Safe to call from any service — no-ops gracefully if IO not yet initialised.
 *
 * @param {string} quotationId
 * @param {object} payload  e.g. { event: "PROPOSAL_CREATED", ... }
 */
export function broadcast(quotationId, payload) {
  if (!io) return;
  io.to(`quotation:${quotationId}`).emit("quotation:update", payload);
}

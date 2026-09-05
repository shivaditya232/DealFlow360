import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';

/**
 * Subscribes to real-time events for one quotation's room
 * (server/src/sockets/index.js: `quotation:${quotationId}`), covering both
 * the negotiation thread (PROPOSAL_CREATED/COUNTERED/ACCEPTED/REJECTED/
 * EXPIRED) and status changes (QUOTATION_CONFIRMED, APPROVAL_STEP_APPROVED,
 * etc.) that approval.service.js and portal.service.js broadcast.
 *
 * onUpdate fires with the raw { event, ...payload } — callers typically just
 * re-fetch (load()) rather than trying to hand-patch state from the payload,
 * since a few different services can touch the same quotation.
 */
export default function useQuotationSocket(quotationId, onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!quotationId) return undefined;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const join = () => socket.emit('join', { quotationId });
    const handleUpdate = (payload) => onUpdateRef.current?.(payload);

    socket.on('connect', join);
    socket.on('quotation:update', handleUpdate);
    if (socket.connected) join();

    return () => {
      socket.emit('leave', { quotationId });
      socket.off('connect', join);
      socket.off('quotation:update', handleUpdate);
    };
  }, [quotationId]);
}

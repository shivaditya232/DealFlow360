import React from 'react';
import { WifiOff } from 'lucide-react';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Sticky, app-wide notice — sits above everything (including Login/Signup,
// which aren't wrapped by AppShell) so the user always knows *why* things
// aren't loading instead of staring at a stuck spinner or a confusing
// "invalid credentials" message that's actually just "no connection".
export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="df-offline-banner" role="status">
      <WifiOff size={14} />
      <span>You're offline — changes won't save until your connection is back.</span>
    </div>
  );
}

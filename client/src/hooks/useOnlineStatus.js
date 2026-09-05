import { useEffect, useState } from 'react';

// navigator.onLine only reflects "has a network interface", not "can
// actually reach our API" — but combined with the axios interceptor
// flagging real request-level network failures (see lib/api.js), it's
// enough to drive a simple, honest "you're offline" banner without
// polling anything.
export default function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

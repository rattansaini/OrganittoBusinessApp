import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWA';
import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setJustReconnected(false);
    } else if (showBanner && isOnline) {
      setJustReconnected(true);
      setTimeout(() => {
        setShowBanner(false);
        setJustReconnected(false);
      }, 3000);
    }
  }, [isOnline, showBanner]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        justReconnected
          ? 'bg-gradient-to-r from-sage to-primary'
          : 'bg-gradient-to-r from-accent to-soft-red'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3 text-white">
          {justReconnected ? (
            <>
              <Wifi className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">Back online! Data syncing...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">You're offline</span>
              <span className="hidden sm:inline text-sm opacity-90">
                - Changes will sync when you reconnect
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export default function PWAInstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (isInstallable && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg border-2 border-primary/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-sage rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🌿</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-bold text-primary mb-1">
              Install Organitto
            </h3>
            <p className="text-sm text-dark-brown/70 mb-4">
              Install our app for quick access, offline support, and a native experience!
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-sage text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
              >
                <Download className="w-4 h-4" />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 bg-dark-brown/5 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/10 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-dark-brown/5 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-dark-brown/40" />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-brown/5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-xs text-dark-brown/60">Fast</p>
            </div>
            <div>
              <div className="text-2xl mb-1">📱</div>
              <p className="text-xs text-dark-brown/60">Native</p>
            </div>
            <div>
              <div className="text-2xl mb-1">📡</div>
              <p className="text-xs text-dark-brown/60">Offline</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

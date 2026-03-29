import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '../hooks/usePWA';
import { useState } from 'react';

export default function UpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  if (!isUpdateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg border-2 border-accent/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-6 h-6 text-accent" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-bold text-primary mb-1">
              Update Available
            </h3>
            <p className="text-sm text-dark-brown/70 mb-4">
              A new version of Organitto is ready. Update now to get the latest features!
            </p>

            <button
              onClick={updateServiceWorker}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-sage text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Update Now
            </button>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-dark-brown/5 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-dark-brown/40" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { X, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const router = useRouter();

  // Memoize allowedRoutes to avoid recreating on every render
  const allowedRoutes = useMemo(() => ['/', '/reports'], []);

  useEffect(() => {
    const hasDismissed = sessionStorage.getItem('pwaPromptDismissed');
    const isAllowedRoute = allowedRoutes.includes(router.pathname);

    if (hasDismissed || !isAllowedRoute) return;

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 1000);
    };

    const handleAppInstalled = () => {
      console.log('App was installed');
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [router.pathname, allowedRoutes]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwaPromptDismissed', 'true');
  };

  if (!showPrompt || isInstalled || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <Smartphone className="text-white w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Install Expense Tracker
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add to your home screen for quick access and offline use.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md text-sm font-medium hover:shadow"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
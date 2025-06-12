import '../../styles/globals.css'
import { SessionProvider } from "next-auth/react";
import ThemeToggle from "../components/ThemeToggle";

import { useEffect } from 'react';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            updateViaCache: 'none'
          });
          console.log('Service Worker registered successfully:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      });
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', (event) => {
      console.log('App was installed', event);
    });

    // Detect if app is installable
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install button or UI element
      const installButton = document.getElementById('install-button');
      if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', async () => {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
        });
      }
    });
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <ThemeToggle />
      </div>
      {/* Install PWA Button, initially hidden */}
      <button id="install-button" style={{ display: 'none', position: 'fixed', bottom: 80, right: 24, zIndex: 1000 }}>
        Install App
      </button>
    </SessionProvider>
  );
}


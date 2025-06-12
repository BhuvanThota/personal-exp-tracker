import '../../styles/globals.css'
import { SessionProvider } from "next-auth/react";
import ThemeToggle from "../components/ThemeToggle";
import PWAInstallPrompt from "../components/PWAInstallPrompt";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <PWAInstallPrompt />
      <Component {...pageProps} />
      {/* Theme Toggle */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <ThemeToggle />
      </div>
    </SessionProvider>
  );
}
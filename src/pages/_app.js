import '../../styles/globals.css'
import { SessionProvider } from "next-auth/react";
import ThemeToggle from "../components/ThemeToggle";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <ThemeToggle />
      </div>
    </SessionProvider>
  );
}

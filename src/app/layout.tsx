import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "./SessionProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget Tracker - Expense Manager",
  description: "Track your personal expenses easily with our intuitive dashboard. Manage budgets, visualize spending patterns, and take control of your finances.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ExpenseTracker',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Budget Tracker - Expense Manager',
    description: 'Track your personal expenses easily with our intuitive dashboard',
    type: 'website',
    siteName: 'ExpenseTracker',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Budget Tracker - Expense Manager',
    description: 'Track your personal expenses easily with our intuitive dashboard',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-180x180.png' },
      { url: '/icon-152x152.png', sizes: '152x152' },
      { url: '/icon-167x167.png', sizes: '167x167' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icon-512x512.png',
      },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3B82F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1E40AF' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
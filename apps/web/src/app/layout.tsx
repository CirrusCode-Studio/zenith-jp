import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL("https://zenith-jp.vercel.app"),

    title: {
      default: "Zenith Japanese",
      template: "%s | Zenith Japanese",
    },

    description:
      "Audio-first Japanese learning system focused on speaking, listening, recall, and long-term retention through progressive neural acquisition.",

    keywords: [
      "Zenith Japanese",
      "learn Japanese",
      "Japanese learning app",
      "Japanese for Vietnamese",
      "Japanese speaking practice",
      "Japanese listening practice",
      "JLPT",
      "Hiragana",
      "Katakana",
      "spaced repetition",
      "language acquisition",
      "Japanese immersion",
      "Japanese conversation",
    ],

    authors: [
      {
        name: "Zenith Japanese",
        url: "https://zenith-jp.vercel.app",
      },
    ],

    creator: "Zenith Japanese",
    publisher: "Zenith Japanese",

    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },

    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://zenith-jp.vercel.app",
      siteName: "Zenith Japanese",

      title: "Zenith Japanese",
      description:
        "Learn Japanese through audio-first immersion, speaking practice, active recall, and adaptive reinforcement.",

      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Zenith Japanese — Audio-first Japanese acquisition system",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title: "Zenith Japanese",

      description:
        "A progressive Japanese acquisition system optimized for real communication and long-term retention.",

      images: ["/og-image.png"],
    },

    icons: {
      icon: [
        {
          url: "/favicon.ico",
        },
        {
          url: "/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        {
          url: "/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
      ],

      apple: [
        {
          url: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],

      shortcut: ["/favicon.ico"],
    },

    manifest: "/site.webmanifest",

    category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="yLHW31bWqEXVsA9Ww0fjRkuj2anGGeOJMxVdXpUKxiQ" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

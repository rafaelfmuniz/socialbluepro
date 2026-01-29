import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../globals.css";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ToastProvider from "@/components/providers/ToastProvider";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'optional',
  preload: true,
  fallback: ['system-ui', 'arial'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: 'optional',
  preload: true,
  fallback: ['Georgia', 'serif'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "SocialBluePro | Professional Landscaping & Sod Installation in Denver, CO",
  description: "SocialBluePro is Denver's top-rated landscaping company specializing in sod installation, hardscaping, decorative rock, mulch, and snow removal. Get a free estimate today!",
  keywords: [
    "Landscaping Denver CO",
    "Sod installation Denver",
    "Snow removal Denver",
    "Hardscaping Denver",
    "Landscape maintenance Colorado",
    "Sod laying Denver",
    "Decorative rock landscaping Denver",
    "SocialBluePro Landscaping",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
         <meta charSet="utf-8" />
         <meta name="viewport" content="width=device-width, initial-scale=1" />

           <link rel="preload" href="/imgs/Imgs_AVIF/landscaping-1.avif" as="image" type="image/avif" />
         <meta name="description" content={metadata.description || ""} />
         <meta name="keywords" content={Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : (metadata.keywords || "")} />
         <link rel="icon" href="/favicon.ico" />
         <link rel="shortcut icon" href="/favicon.ico" />
         <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

"use client";

import { useEffect, useState } from "react";

interface TrackingPixel {
  id: string;
  name: string;
  type: string;
  code: string;
}

function generatePixelScript(pixel: TrackingPixel): { script: string; isExternal: boolean; src?: string } | null {
  const { type, code, name } = pixel;

  switch (type) {
    case "google_analytics":
      if (code.startsWith("G-") || code.startsWith("UA-")) {
        return {
          script: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${code}');
          `,
          isExternal: true,
          src: `https://www.googletagmanager.com/gtag/js?id=${code}`,
        };
      }
      if (code.includes("<script")) {
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        return {
          script: scriptMatch ? scriptMatch[1] : code,
          isExternal: false,
        };
      }
      break;

    case "google_ads":
      if (code.startsWith("AW-")) {
        return {
          script: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${code}');
          `,
          isExternal: true,
          src: `https://www.googletagmanager.com/gtag/js?id=${code}`,
        };
      }
      if (code.includes("<script")) {
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        return {
          script: scriptMatch ? scriptMatch[1] : code,
          isExternal: false,
        };
      }
      break;

    case "facebook_pixel":
      if (code.match(/^\d{14,16}$/)) {
        return {
          script: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${code}');
            fbq('track', 'PageView');
          `,
          isExternal: false,
        };
      }
      if (code.includes("<script")) {
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        return {
          script: scriptMatch ? scriptMatch[1] : code,
          isExternal: false,
        };
      }
      break;

    case "tiktok_pixel":
      if (code.match(/^[A-Z0-9]{20}$/)) {
        return {
          script: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${code}');
              ttq.page();
            }(window, document, 'ttq');
          `,
          isExternal: false,
        };
      }
      if (code.includes("<script")) {
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        return {
          script: scriptMatch ? scriptMatch[1] : code,
          isExternal: false,
        };
      }
      break;

    case "custom":
      if (code.includes("<script")) {
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        const srcMatch = code.match(/<script[^>]*src=["']([^"']+)["']/i);
        if (srcMatch) {
          return {
            script: scriptMatch ? scriptMatch[1] : "",
            isExternal: true,
            src: srcMatch[1],
          };
        }
        return {
          script: scriptMatch ? scriptMatch[1] : code,
          isExternal: false,
        };
      }
      if (code.trim()) {
        return {
          script: code,
          isExternal: false,
        };
      }
      break;

    default:
      if (code.includes("<script")) {
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        const srcMatch = code.match(/<script[^>]*src=["']([^"']+)["']/i);
        if (srcMatch) {
          return {
            script: scriptMatch ? scriptMatch[1] : "",
            isExternal: true,
            src: srcMatch[1],
          };
        }
        return {
          script: scriptMatch ? scriptMatch[1] : code,
          isExternal: false,
        };
      }
  }

  return null;
}

export function TrackingPixelsInjector() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;

    async function injectPixels() {
      try {
        const res = await fetch("/api/tracking-pixels");
        const data = await res.json();

        if (!data.success || !data.pixels?.length) {
          return;
        }

        for (const pixel of data.pixels as TrackingPixel[]) {
          const scriptData = generatePixelScript(pixel);
          if (!scriptData) continue;

          if (scriptData.isExternal && scriptData.src) {
            const script = document.createElement("script");
            script.async = true;
            script.src = scriptData.src;
            document.head.appendChild(script);
          }

          if (scriptData.script) {
            const inlineScript = document.createElement("script");
            inlineScript.textContent = scriptData.script;
            document.head.appendChild(inlineScript);
          }

          if (pixel.type === "facebook_pixel" && pixel.code.match(/^\d{14,16}$/)) {
            const noscript = document.createElement("noscript");
            const img = document.createElement("img");
            img.height = 1;
            img.width = 1;
            img.style.display = "none";
            img.src = `https://www.facebook.com/tr?id=${pixel.code}&ev=PageView&noscript=1`;
            noscript.appendChild(img);
            document.body.appendChild(noscript);
          }
        }

        setLoaded(true);
      } catch (error) {
        console.error("[TrackingPixels] Error injecting pixels:", error);
      }
    }

    injectPixels();
  }, [loaded]);

  return null;
}

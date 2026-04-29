import Script from 'next/script'
import type { OrganizationSettings } from '@uniframe/db/types'

interface Props {
  settings: OrganizationSettings
}

export default function ThirdPartyScripts({ settings }: Props) {
  const { google_analytics_id, meta_pixel_id, custom_head_scripts, custom_body_scripts, custom_script_files } = settings
  const headFiles = (custom_script_files ?? []).filter(f => f.position === 'head')
  const bodyFiles = (custom_script_files ?? []).filter(f => f.position === 'body')

  return (
    <>
      {/* ── Google Analytics ──────────────────────────────────────────────── */}
      {google_analytics_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${google_analytics_id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${google_analytics_id}');
            `}
          </Script>
        </>
      )}

      {/* ── Meta (Facebook) Pixel ─────────────────────────────────────────── */}
      {meta_pixel_id && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${meta_pixel_id}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1" width="1" style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${meta_pixel_id}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* ── Custom head scripts (Google Tag Manager, Hotjar, etc.) ────────── */}
      {custom_head_scripts && (
        <Script id="custom-head" strategy="afterInteractive">
          {custom_head_scripts}
        </Script>
      )}

      {/* ── Uploaded head files (.js / .css) ──────────────────────────────── */}
      {headFiles.map((f, i) =>
        f.type === 'css'
          ? <link key={`head-css-${i}`} rel="stylesheet" href={f.url} />
          : <Script key={`head-js-${i}`} src={f.url} strategy="afterInteractive" />
      )}

      {/* ── Custom body scripts ───────────────────────────────────────────── */}
      {custom_body_scripts && (
        <Script id="custom-body" strategy="lazyOnload">
          {custom_body_scripts}
        </Script>
      )}

      {/* ── Uploaded body files (.js / .css) ──────────────────────────────── */}
      {bodyFiles.map((f, i) =>
        f.type === 'css'
          ? <link key={`body-css-${i}`} rel="stylesheet" href={f.url} />
          : <Script key={`body-js-${i}`} src={f.url} strategy="lazyOnload" />
      )}
    </>
  )
}

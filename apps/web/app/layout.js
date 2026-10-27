import { Geist, Geist_Mono, Playfair_Display, DM_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ui/ServiceWorkerRegister";
import WebsiteThemeRuntime from "@/components/ui/WebsiteThemeRuntime";
import SettingsProvider from "@/components/providers/SettingsProvider";
import GlobalFeedbackDialog from "@/components/ui/GlobalFeedbackDialog";
import { buildRestaurantJsonLd, buildSeoProfile, getPublicSeoSettings } from "@/lib/seo";

const GOOGLE_SITE_VERIFICATIONS = [
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  '46pbNawMjbZqE0MNfAcjr2feOQElFtjjka__TWgIe2w',
  '7vFz7gwdblKaXkkPMjtMsD-Lx-gyNjt5_nv7jIzGqEg',
].filter(Boolean);

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], variable: "--font-bebas", weight: "400" });

export async function generateMetadata() {
  const settings = await getPublicSeoSettings();
  const profile = buildSeoProfile(settings);

  return {
    metadataBase: new URL(profile.siteUrl),
    title: {
      default: profile.browserTitle,
      template: `%s | ${profile.storeName}`,
    },
    description: profile.description,
    applicationName: profile.storeName,
    keywords: profile.keywords,
    authors: [{ name: profile.storeName }],
    creator: profile.storeName,
    publisher: profile.storeName,
    alternates: {
      canonical: '/',
    },
    manifest: '/api/manifest',
    icons: {
      icon: [
        { url: '/api/app-icon?size=192', sizes: '192x192', type: 'image/png' },
        { url: '/api/app-icon?size=512', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/api/app-icon?size=180', sizes: '180x180', type: 'image/png' },
      ],
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: '/',
      siteName: profile.storeName,
      title: profile.browserTitle,
      description: profile.description,
      images: [
        {
          url: profile.heroImage,
          width: 1600,
          height: 900,
          alt: `${profile.storeName} - kebab premium dan menu Timur Tengah`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.browserTitle,
      description: profile.description,
      images: [profile.heroImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    verification: {
      google: GOOGLE_SITE_VERIFICATIONS,
    },
  };
}

export const viewport = {
  themeColor: '#C9A84C',
};

export default async function RootLayout({ children }) {
  const settings = await getPublicSeoSettings();
  const profile = buildSeoProfile(settings);
  const restaurantJsonLd = buildRestaurantJsonLd(profile);

  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${dmSans.variable} ${bebasNeue.variable} antialiased`}>
        <SettingsProvider>
          <WebsiteThemeRuntime />
          {children}
          <GlobalFeedbackDialog />
        </SettingsProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

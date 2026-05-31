import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Be_Vietnam_Pro } from "next/font/google"
import { AuthProvider } from '@/context/AuthContext';
import { ShopProvider } from '@/context/ShopContext';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'TeementPOD Seller Portal',
  description: 'Hệ thống quản lý đối tác bán hàng',
  icons: {
    icon: 'https://mya3bussinessbucket.s3.ap-southeast-2.amazonaws.com/myTeementProductsBucket/Teement_logo.png',
  },
};

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap"
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col">
        <AuthProvider>
          <ShopProvider>
        {children}
        </ShopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

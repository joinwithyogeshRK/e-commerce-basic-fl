import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Toaster from '@/components/ui/Toaster';
import Assistant from '@/components/Assistant';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK'],
});

export const metadata: Metadata = {
  title: {
    default: 'Atlas & Oak — Clothing, Footwear & Accessories',
    template: '%s · Atlas & Oak',
  },
  description:
    'A considered wardrobe: heavyweight hoodies, waxed outerwear, silk dresses, leather sneakers and watches built to be handed down.',
};

export const viewport: Viewport = { themeColor: '#faf8f4', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <StoreProvider>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <CartDrawer />
          <Assistant />
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}

import './globals.css';
import { Outfit, Playfair_Display, Arizonia, Permanent_Marker } from 'next/font/google';
import { Providers } from '@/components/Providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const arizonia = Arizonia({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-arizonia',
});

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-permanent',
});

export const metadata = {
  title: 'Menu3D – Menus de restaurant en 3D et réalité augmentée',
  description: 'Scannez le QR code de votre table, découvrez le menu et posez les plats en 3D sur votre table avant de commander.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${playfair.variable} ${arizonia.variable} ${permanentMarker.variable}`}>
      <body className={outfit.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

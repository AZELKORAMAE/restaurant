import './globals.css';
import { Outfit, Playfair_Display, Arizonia, Permanent_Marker, Sora } from 'next/font/google';
import { Providers } from '@/components/Providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-sora',
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
  title: '3D Restaurant – Le menu en 3D et en réalité augmentée',
  description: 'Scannez le QR code de votre table, découvrez le menu et posez les plats en 3D sur votre table avant de commander.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${playfair.variable} ${arizonia.variable} ${permanentMarker.variable} ${sora.variable}`}>
      <body className={outfit.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

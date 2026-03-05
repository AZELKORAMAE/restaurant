import './globals.css';
import { Outfit, Playfair_Display, Arizonia } from 'next/font/google';
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

export const metadata = {
  title: 'Gourmet - L’art de bien manger',
  description: 'Découvrez une expérience culinaire d’exception, livrée chez vous.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${playfair.variable} ${arizonia.variable}`}>
      <body className={outfit.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

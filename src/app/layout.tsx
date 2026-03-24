import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Digital Twin — Commercial Real Estate',
  description: 'Interactive 3D digital twin for mixed-use commercial buildings',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-[#0a0a0f] text-gray-100 antialiased`}>
        <Nav />
        <main className="h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}

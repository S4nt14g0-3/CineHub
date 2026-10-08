// ============================================================
// Layout raíz de la aplicación.
// - Define las fuentes, los metadatos y el idioma del documento.
// - Envuelve toda la app con <AuthProvider> para que cualquier
//   página pueda usar useAuth() (sesión del usuario).
// ============================================================
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'CineHub | Gestión de Cine',
  description: 'Reserva tus boletas, consulta cartelera, dulcería y gestiona el cine.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - AuthProvider es un componente cliente; puede envolver niños de servidor.
   - Si agregas un nuevo panel (p. ej. /admin), no necesitas tocar este layout.
   ============================================================ */

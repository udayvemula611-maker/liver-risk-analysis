import type { Metadata } from "next"; // Type definition for Next.js metadata.
import { Inter } from "next/font/google"; // Google Font import for the Inter typeface.
import "./globals.css"; // Global CSS styles for the application.
import Navbar from "@/components/Navbar"; // Navigation bar component.
import { Toaster } from "react-hot-toast"; // Toast notification component.

// Initialize the Inter font with the "latin" subset.
const inter = Inter({ subsets: ["latin"] });

/**
 * Metadata for the application, used by Next.js to generate <head> tags.
 * This includes title, description, keywords for SEO, and author information.
 */
export const metadata: Metadata = {
  title: "Liver Analysis | Advanced Medical Liver Analysis",
  description: "An AI-powered SaaS platform for Doctors and Patients to perform predictive, non-invasive liver risk analysis and generate actionable health reports.",
  keywords: ["medical SaaS", "liver disease", "AI analysis", "health tech", "Next.js", "Supabase"],
  authors: [{ name: "Uday Vemula" }],
};

/**
 * RootLayout Component
 *
 * This is the root layout component for the entire Next.js application.
 * It defines the basic HTML structure, applies global styles, includes the
 * navigation bar, and wraps the main content (`children`). It also integrates
 * a toast notification system.
 *
 * @param {object} props - The properties for the component.
 * @param {React.ReactNode} props.children - The child components or pages to be rendered within the layout.
 * @returns {JSX.Element} The rendered root HTML structure of the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar /> {/* Renders the global navigation bar. */}
        <main>{children}</main> {/* Main content area where pages are rendered. */}
        <Toaster position="top-right" /> {/* Integrates the toast notification system. */}
      </body>
    </html>
  );
}

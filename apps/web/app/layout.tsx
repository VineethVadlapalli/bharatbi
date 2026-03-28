import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "BharatBI — India's GenBI",
  description: "Ask questions about your business data in plain English",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" },
          }}
        />
        {children}
      </body>
    </html>
  );
}
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextAuthProvider from "./context/NextAuthProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth-options";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/shadcn/ui/toaster";
import { SolanaProvider } from "./context/SolanaProviderContext";
import "@solana/wallet-adapter-react-ui/styles.css";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={`${inter.className} main-layout`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SolanaProvider>
            <NextAuthProvider session={session}>{children}</NextAuthProvider>
          </SolanaProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

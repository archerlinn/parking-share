import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";
import { ParkingProvider } from "./providers/ParkingProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ParkingShare - Share Your Parking Spot",
  description: "Airbnb for parking spaces - find and share parking spots in your area",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ParkingProvider>
            {children}
          </ParkingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

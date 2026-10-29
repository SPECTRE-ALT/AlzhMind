import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NavigationBar } from "@/components/navigation/NavigationBar";

export const metadata: Metadata = {
  title: "Alzhmind | Cognitive Safety & IoT Assistive Care",
  description: "An Apple-minimalist IoT wearable ecosystem and cognitive safety bridge for Alzheimer's patients, caregivers, and neurologists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-black text-[#f4f4f5]">
        <AuthProvider>
          <NavigationBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

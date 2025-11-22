import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import Drawer from "./layout/Drawer";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { CameraProvider } from "@/contexts/CameraContext";
import { ToastContainer } from "@/components/toast/ToastContainer";
import FloatingCameraPreview from "@/components/camera/FloatingCameraPreview";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "Person Tracking & Facial Recognition",
  description:
    "A Person Tracking System in a Classroom Using Facial Recognition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansThai.variable} antialiased`}>
        <ThemeProvider>
          <LocaleProvider>
            <CameraProvider>
              <ToastProvider>
                <Drawer>{children}</Drawer>
                <ToastContainer />
                <FloatingCameraPreview />
              </ToastProvider>
            </CameraProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

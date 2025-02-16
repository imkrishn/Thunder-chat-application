'use client'

import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const Roboto = localFont({
  src: [
    {
      path: "./assests/fonts/Roboto-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./assests/fonts/Roboto-Bold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./assests/fonts/Roboto-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./assests/fonts/Roboto-Light.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./assests/fonts/Roboto-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./assests/fonts/Roboto-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./assests/fonts/Roboto-Thin.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "./assests/fonts/Roboto-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
  ],
  variable: "--font-roboto",
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const pathname = usePathname()
  return (
    <html lang="en">
      <body className={`w-screen dark ${Roboto.variable}`}>
        <Provider store={store}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Provider>
      </body>
    </html>

  );
}

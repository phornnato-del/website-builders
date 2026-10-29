import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebBuilder | Create your website",
  description: "A visual website builder, built for your ideas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

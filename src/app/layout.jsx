import "./globals.css";
import InteractionFeedbackProvider from "@/components/providers/InteractionFeedbackProvider";
import BrandingHead from "@/components/BrandingHead";

export const metadata = {
  title: "AfroVision Admin",
  description: "AfroVision Command Center",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <BrandingHead />
        <InteractionFeedbackProvider />
        {children}
      </body>
    </html>
  );
}

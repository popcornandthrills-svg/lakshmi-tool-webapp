import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Lakshmi Stock Manager",
    template: "%s | Lakshmi Stock Manager",
  },
  description: "A stock management webapp for product search, worksheets, and order estimates.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/site.css" />
      </head>
      <body>
        <div className="app-shell">
          <div className="app-content">{children}</div>
        </div>
      </body>
    </html>
  );
}

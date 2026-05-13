import "./globals.css";

export const metadata = {
  title: "Project Pulse - AIOps Dashboard",
  description: "AIOps Incident Response Agent Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import Script from 'next/script';

export const metadata = {
  title: "Medical Consultation",
  description: "An Online Medical Consultation that can determine patients heart rate per minute and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

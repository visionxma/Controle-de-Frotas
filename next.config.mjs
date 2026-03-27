/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // firebase-admin usa módulos nativos do Node.js (grpc, protobuf, etc.)
  // que o webpack não consegue fazer bundle. Essa config diz ao Next.js
  // para tratá-los como externos — importados em runtime pelo Node, não
  // empacotados — o que resolve falhas de build em Vercel e ambientes similares.
  serverExternalPackages: ["firebase-admin", "@google-cloud/firestore", "google-gax"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ]
  },
}

export default nextConfig

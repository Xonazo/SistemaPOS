/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false, // Desactiva el indicador de actividad de construcción
  },
    experimental: {
    instrumentationHook: false,
  },


  async rewrites() {
    return [
      {
        source: '/:path*', // todos los paths
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`, // hacia backend
      },
    ];
  },
};

export default nextConfig;


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
// };

// export default nextConfig;

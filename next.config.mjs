/** @type {import('next').NextConfig} */
const nextConfig = {
  // 3D processing libraries load native / WebAssembly files at runtime: keep them out of the bundle
  serverExternalPackages: [
    'sharp',
    'draco3dgltf',
    'meshoptimizer',
    '@gltf-transform/core',
    '@gltf-transform/extensions',
    '@gltf-transform/functions',
  ],
  // ...and make sure their binary files are deployed with the API routes (Vercel)
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/draco3dgltf/**/*', './node_modules/meshoptimizer/**/*'],
  },
};

export default nextConfig;

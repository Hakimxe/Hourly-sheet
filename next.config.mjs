/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server bundle in .next/standalone
  // (Railway/Docker friendly; minimal dependencies copied automatically).
  output: "standalone",

  // Do NOT bundle better-sqlite3 (native .node binary) into webpack output.
  // Let Node load it from node_modules at runtime.
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;

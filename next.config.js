/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... outras configurações
  outputFileTracingIncludes: {
    '/api/chat': ['./data/estoque.json'],
  },
};

module.exports = nextConfig;
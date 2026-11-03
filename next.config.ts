import type { NextConfig } from "next";

// Cabeçalhos de segurança aplicados em todas as rotas. Sem Content-Security-Policy por
// enquanto: o checkout carrega scripts de terceiros (Turnstile, SDK do PagBank) e uma CSP
// precisa ser testada página a página antes de entrar.
const SECURITY_HEADERS = [
  // impede que o site seja aberto dentro de um iframe de outro domínio (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // só o domínio do site (sem includeSubDomains, para não afetar n8n.boramei.cloud e afins)
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;

import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // O asterisco significa "qualquer robô de busca" (Google, Bing, etc)
      allow: '/', // Permite ler o site inteiro...
      disallow: ['/checkout', '/user', '/financeiro', '/seguranca', '/api'], // ...EXCETO checkout, área logada do cliente e as rotas de API
    },
    sitemap: 'https://boramei.cloud/sitemap.xml', // Avisa onde está o mapa
  }
}
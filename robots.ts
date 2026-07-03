import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // O asterisco significa "qualquer robô de busca" (Google, Bing, etc)
      allow: '/', // Permite ler o site inteiro...
      disallow: ['/checkout', '/painel'], // ...EXCETO o checkout e o painel interno
    },
    sitemap: 'https://boramei.cloud/sitemap.xml', // Avisa onde está o mapa
  }
}
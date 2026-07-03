import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://boramei.cloud', // Sua página inicial
      lastModified: new Date(),
      changeFrequency: 'weekly', // Avisa o Google que você atualiza o site semanalmente
      priority: 1.0, // Prioridade máxima (1.0) para a home
    },
    // Se no futuro você criar uma página de "Sobre" ou "Preços", você adiciona aqui:
    // {
    //   url: 'https://www.seudominio.com.br/sobre',
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
  ]
}
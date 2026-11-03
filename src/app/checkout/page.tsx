import { Suspense } from "react";
import CheckoutForm from "@/components/CheckoutForm";
import { buscarCampanhaValida, normalizarCodigoCampanha } from "@/lib/campanhas";
import { obterPlano } from "@/lib/planos";

type SearchParams = Promise<{ [chave: string]: string | string[] | undefined }>;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

// Server Component só para validar o ?cupom= no servidor antes de renderizar:
// o formulário recebe a campanha já conferida no banco, e o /api/checkout
// confere de novo no envio — o navegador nunca decide trial nem preço.
export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const codigo = normalizarCodigoCampanha(primeiro(params.cupom));
  const campanha = codigo ? await buscarCampanhaValida(codigo, obterPlano(primeiro(params.plano))) : null;

  return (
    <div className="relative min-h-screen bg-brand-bgLight flex flex-col justify-center items-center p-4 md:p-8 overflow-hidden">
      {/* Mesh gradients: container relative + overflow-hidden evita barra de rolagem das "bolas de luz" */}

      {/* Reflexo verde discreto descendo do canto superior direito */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-green rounded-full blur-[120px] opacity-[0.09] z-0"></div>

      {/* Reflexo roxo bem suave subindo do canto inferior esquerdo */}
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-brand-purple rounded-full blur-[120px] opacity-[0.1] z-0"></div>

      {/* Conteúdo principal em z-10 para ficar acima do efeito de luz */}
      <div className="relative z-10 w-full flex flex-col items-center gap-4">
        {codigo && !campanha && (
          <p className="w-full max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            Este link promocional não é válido ou expirou. Você pode continuar com as condições normais do plano.
          </p>
        )}
        <Suspense fallback={<div className="text-brand-purple font-bold">Carregando formulário...</div>}>
          <CheckoutForm campanha={campanha} />
        </Suspense>
      </div>
    </div>
  );
}

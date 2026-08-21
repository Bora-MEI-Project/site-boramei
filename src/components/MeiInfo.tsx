import Link from "next/link";

const STATS = [
  {
    label: "Limite anual de faturamento",
    value: "R$ 81 mil",
    color: "purple" as const,
  },
  {
    label: "DAS a partir de",
    value: "R$ 82,05",
    color: "green" as const,
  },
  {
    label: "Pode contratar",
    value: "1 funcionário CLT",
    color: "purple" as const,
  },
  {
    label: "Benefícios do INSS",
    value: "4 garantias",
    color: "green" as const,
  },
];

const DAS_TABELA = [
  {
    categoria: "Comércio e Indústria",
    valor: "R$ 82,05",
    composicao: "R$ 81,05 de INSS + R$ 1,00 de ICMS",
  },
  {
    categoria: "Serviços",
    valor: "R$ 86,05",
    composicao: "R$ 81,05 de INSS + R$ 5,00 de ISS",
  },
  {
    categoria: "Comércio e Serviços",
    valor: "R$ 87,05",
    composicao: "R$ 81,05 de INSS + R$ 1,00 de ICMS + R$ 5,00 de ISS",
  },
];

const BENEFICIOS_INSS = [
  {
    titulo: "Aposentadoria por idade",
    descricao: "65 anos para homens e 62 anos para mulheres.",
  },
  {
    titulo: "Auxílio-doença",
    descricao: "Após 12 contribuições mensais em dia.",
  },
  {
    titulo: "Salário-maternidade",
    descricao: "Após 10 contribuições mensais em dia.",
  },
  {
    titulo: "Pensão por morte",
    descricao: "Garantida aos seus dependentes.",
  },
];

export default function MeiInfo() {
  return (
    <section id="mei" className="bg-white py-24 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 px-4 py-1.5 text-xs font-semibold text-brand-purple uppercase tracking-wider mb-4">
            Guia rápido
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tudo que você precisa saber sobre o MEI
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            As regras do MEI mudam todo ano. Separamos os números de 2026 para você não cair em nenhuma pegadinha da Receita.
          </p>
        </div>

        {/* Faixa de Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl p-6 border text-center ${
                stat.color === "purple"
                  ? "bg-brand-purple/5 border-brand-purple/20"
                  : "bg-brand-green/5 border-brand-green/20"
              }`}
            >
              <p
                className={`text-2xl font-extrabold mb-1 ${
                  stat.color === "purple" ? "text-brand-purple" : "text-brand-green"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabela de valores do DAS */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Valores do DAS-MEI em 2026
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DAS_TABELA.map((item) => (
              <div
                key={item.categoria}
                className="bg-brand-bgLight rounded-2xl p-8 border border-gray-100 text-center flex flex-col"
              >
                <h4 className="text-lg font-bold text-gray-900 mb-2">{item.categoria}</h4>
                <p className="text-4xl font-extrabold text-brand-purple mb-3">{item.valor}</p>
                <p className="text-sm text-gray-500 leading-relaxed mt-auto">{item.composicao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefícios do INSS */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Benefícios que o seu DAS garante
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {BENEFICIOS_INSS.map((beneficio) => (
              <div
                key={beneficio.titulo}
                className="flex items-start gap-3 bg-brand-green/5 border border-brand-green/20 rounded-xl p-5"
              >
                <span className="text-brand-green mt-0.5 text-lg">✓</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{beneficio.titulo}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{beneficio.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Callout de risco + CTA */}
        <div className="bg-brand-purple/5 border-2 border-brand-purple/20 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Esqueceu o DAS ou a declaração anual?
            </h4>
            <p className="text-gray-600 leading-relaxed max-w-xl">
              Atraso gera multa, bloqueio do CNPJ e até exclusão do MEI. O BoraMEI te avisa antes de cada vencimento e emite sua guia na hora, direto pelo WhatsApp.
            </p>
          </div>
          <Link
            href="/#planos"
            className="shrink-0 inline-flex items-center justify-center bg-brand-purple hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full transition-all duration-200 shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Ver planos
          </Link>
        </div>
      </div>
    </section>
  );
}

function Secao({ numero, titulo }: { numero: string; titulo: string }) {
  return <h4 className="text-base font-bold text-gray-900 pt-2">{numero}. {titulo}</h4>;
}

function SubSecao({ numero, titulo }: { numero: string; titulo: string }) {
  return <h5 className="text-sm font-bold text-gray-800">{numero} {titulo}</h5>;
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr>
            {cabecalho.map((coluna) => (
              <th key={coluna} className="border-b border-gray-200 py-1.5 pr-3 font-semibold text-gray-700">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i}>
              {linha.map((celula, j) => (
                <td key={j} className="border-b border-gray-100 py-1.5 pr-3 align-top">
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacidadeContent() {
  return (
    <>
      <p className="text-xs text-gray-400">Última atualização: 23 de julho de 2026</p>

      <p>
        Esta Política explica como o BoraMEI, operado por MN SOFTWARE, CNPJ 47.187.762/0001-02, coleta,
        usa, compartilha e protege dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei nº
        13.709/2018 – LGPD).
      </p>
      <p>
        <strong>Controlador dos dados:</strong> MN SOFTWARE – CNPJ 47.187.762/0001-02
        <br />
        R. Cap. José da Luz, 25 – Coelhos, Recife/PE, CEP 50070-540
        <br />
        <strong>Encarregado (DPO):</strong> Yuri Mattos – yuri.mattos@bmncontabilidade.com
      </p>

      <Secao numero="1" titulo="Dados que coletamos" />

      <SubSecao numero="1.1" titulo="Fornecidos por você" />
      <Tabela
        cabecalho={["Dado", "Finalidade"]}
        linhas={[
          ["Nome completo", "Identificação e emissão de cobrança"],
          ["CPF", "Identificação, cobrança e consulta de dados fiscais"],
          ["E-mail", "Autenticação, comunicação e envio de comprovantes"],
          ["Telefone / WhatsApp", "Notificações de vencimento e atendimento"],
          ["CEP e número do endereço", "Cadastro e requisitos do processador de pagamento"],
        ]}
      />

      <SubSecao numero="1.2" titulo="Dados de pagamento" />
      <p>
        Os dados do cartão são criptografados <strong>no seu navegador</strong>, pelo SDK do PagBank, antes
        de qualquer envio. O número completo do cartão, o CVV e a validade{" "}
        <strong>não trafegam pelos nossos servidores e não são armazenados por nós</strong>.
      </p>
      <p>Armazenamos apenas:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>um token do cartão (identificador que permite cobranças futuras, inútil fora do PagBank);</li>
        <li>os quatro últimos dígitos e a bandeira, para você identificar o cartão;</li>
        <li>identificadores da transação, status e histórico de cobranças.</li>
      </ul>

      <SubSecao numero="1.3" titulo="Dados obtidos de fontes públicas" />
      <p>
        Mediante sua autorização, consultamos e tratamos dados vinculados ao seu CPF e CNPJ em sistemas
        públicos, incluindo:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>situação cadastral do CNPJ e atividade principal (CNAE);</li>
        <li>guias DAS emitidas, pagas e em aberto;</li>
        <li>pendências, débitos e certidões.</li>
      </ul>

      <SubSecao numero="1.4" titulo="Dados de uso" />
      <p>
        Registros de acesso (endereço IP, data e hora, navegador), conforme exigido pelo art. 15 do Marco
        Civil da Internet, e interações com a plataforma.
      </p>

      <Secao numero="2" titulo="Bases legais" />
      <Tabela
        cabecalho={["Tratamento", "Base legal (LGPD)"]}
        linhas={[
          ["Execução dos serviços contratados", "Execução de contrato – art. 7º, V"],
          ["Consulta a dados fiscais em seu nome", "Consentimento – art. 7º, I"],
          ["Armazenamento do token do cartão", "Consentimento – art. 7º, I"],
          ["Cobrança e prevenção a fraude", "Legítimo interesse – art. 7º, IX"],
          ["Guarda de registros de acesso", "Obrigação legal – art. 7º, II"],
          ["Comunicações de marketing", "Consentimento – art. 7º, I"],
        ]}
      />
      <p>
        Consentimentos podem ser revogados a qualquer momento, sem prejuízo dos tratamentos já realizados.
        A revogação do consentimento para consulta de dados fiscais inviabiliza a prestação do serviço.
      </p>

      <Secao numero="3" titulo="Como usamos os dados" />
      <ul className="list-disc pl-5 space-y-1">
        <li>Executar as funcionalidades contratadas, incluindo consultas fiscais e emissão de guias.</li>
        <li>Processar pagamentos e renovações.</li>
        <li>Enviar lembretes de vencimento e comunicações operacionais.</li>
        <li>Gerar orientações personalizadas por meio de inteligência artificial.</li>
        <li>Prevenir fraudes e proteger a plataforma.</li>
        <li>Cumprir obrigações legais e regulatórias.</li>
      </ul>
      <p>
        <strong>Não vendemos dados pessoais.</strong> Não usamos seus dados para publicidade de terceiros.
      </p>

      <Secao numero="4" titulo="Inteligência artificial" />
      <p>
        Para gerar resumos e orientações, enviamos dados do seu contexto (situação do CNPJ, guias em
        aberto, dúvidas que você digita) ao provedor de IA que utilizamos, o Google (Gemini).
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Enviamos apenas o necessário para a resposta solicitada.</li>
        <li>Não enviamos dados de cartão nem credenciais.</li>
        <li>O provedor atua como operador, vinculado contratualmente às finalidades definidas por nós.</li>
      </ul>
      <p>
        Você pode optar por não utilizar os recursos de IA; nesse caso, as demais funcionalidades
        permanecem disponíveis.
      </p>

      <Secao numero="5" titulo="Com quem compartilhamos" />
      <Tabela
        cabecalho={["Terceiro", "Papel", "O que recebe"]}
        linhas={[
          ["PagBank", "Processamento de pagamentos", "Nome, CPF, e-mail, telefone, endereço parcial, dados de cartão criptografados"],
          ["Infosimples", "Consulta a sistemas públicos", "CPF e CNPJ"],
          ["Google (Gemini)", "Geração de conteúdo por IA", "Contexto da consulta e dados fiscais pertinentes"],
          ["Provedores de infraestrutura", "Hospedagem e automação", "Dados armazenados na plataforma"],
        ]}
      />
      <p>
        Também podemos compartilhar dados por ordem judicial, requisição de autoridade competente ou para
        exercício regular de direitos.
      </p>

      <Secao numero="6" titulo="Transferência internacional" />
      <p>
        Alguns fornecedores processam dados fora do Brasil. Nesses casos, adotamos as salvaguardas
        previstas no art. 33 da LGPD, incluindo cláusulas contratuais de proteção de dados.
      </p>

      <Secao numero="7" titulo="Retenção" />
      <Tabela
        cabecalho={["Dado", "Prazo"]}
        linhas={[
          ["Cadastro e conta", "Enquanto a conta estiver ativa"],
          ["Registros de acesso", "6 meses (art. 15, Marco Civil)"],
          ["Dados fiscais e financeiros", "5 anos após o encerramento, por obrigação legal e defesa em eventual litígio"],
          ["Token do cartão", "Até a revogação do consentimento ou o cancelamento da assinatura"],
        ]}
      />
      <p>Encerrado o prazo, os dados são eliminados ou anonimizados.</p>

      <Secao numero="8" titulo="Seus direitos" />
      <p>Nos termos do art. 18 da LGPD, você pode a qualquer momento:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>confirmar a existência de tratamento;</li>
        <li>acessar seus dados;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
        <li>solicitar a portabilidade;</li>
        <li>revogar consentimento;</li>
        <li>obter informação sobre com quem compartilhamos seus dados;</li>
        <li>opor-se a tratamento realizado com base em legítimo interesse.</li>
      </ul>
      <p>
        Para exercer qualquer desses direitos, escreva para yuri.mattos@bmncontabilidade.com.
        Responderemos em até 15 dias.
      </p>
      <p>Você também pode peticionar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

      <Secao numero="9" titulo="Segurança" />
      <p>Adotamos medidas técnicas e administrativas para proteger seus dados, entre elas:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>criptografia dos dados de cartão no navegador, antes do envio;</li>
        <li>comunicação exclusivamente por HTTPS;</li>
        <li>controle de acesso restrito aos sistemas internos;</li>
        <li>validação de autenticidade das notificações de pagamento;</li>
        <li>monitoramento e registro de acessos.</li>
      </ul>
      <p>
        Nenhum sistema é totalmente imune. Em caso de incidente de segurança com risco relevante,
        comunicaremos você e a ANPD, conforme o art. 48 da LGPD.
      </p>

      <Secao numero="10" titulo="Cookies" />
      <p>
        Utilizamos cookies necessários ao funcionamento da plataforma (sessão e autenticação) e, mediante
        consentimento, cookies analíticos. Você pode gerenciar preferências no banner exibido no primeiro
        acesso ou nas configurações do navegador.
      </p>

      <Secao numero="11" titulo="Menores de idade" />
      <p>
        A plataforma destina-se a maiores de 18 anos. Não coletamos intencionalmente dados de menores.
        Identificado um cadastro nessa condição, a conta será encerrada e os dados eliminados.
      </p>

      <Secao numero="12" titulo="Alterações" />
      <p>
        Podemos atualizar esta Política. Mudanças relevantes serão comunicadas por e-mail ou na plataforma
        com antecedência mínima de 30 dias.
      </p>

      <Secao numero="13" titulo="Contato" />
      <p>
        Encarregado pelo Tratamento de Dados Pessoais: Yuri Mattos – yuri.mattos@bmncontabilidade.com
        <br />
        Atendimento geral: contato@boramei.cloud
      </p>
    </>
  );
}

function Secao({ numero, titulo }: { numero: string; titulo: string }) {
  return <h4 className="text-base font-bold text-gray-900 pt-2">{numero}. {titulo}</h4>;
}

function SubSecao({ numero, titulo }: { numero: string; titulo: string }) {
  return <h5 className="text-sm font-bold text-gray-800">{numero} {titulo}</h5>;
}

export default function TermosContent() {
  return (
    <>
      <p className="text-xs text-gray-400">Última atualização: 23 de julho de 2026</p>

      <p>
        Estes Termos regulam o uso da plataforma BoraMEI, oferecida por MN SOFTWARE, inscrita no CNPJ sob o
        nº 47.187.762/0001-02, com sede na R. Cap. José da Luz, 25 – Coelhos, Recife/PE, CEP 50070-540
        (&quot;BoraMEI&quot;, &quot;nós&quot;).
      </p>
      <p>
        Ao criar uma conta ou contratar qualquer plano, você declara que leu, entendeu e concorda com estes
        Termos. Se não concordar, não utilize a plataforma.
      </p>

      <Secao numero="1" titulo="O que o BoraMEI é – e o que não é" />
      <p>
        O BoraMEI é uma plataforma de tecnologia que automatiza consultas e rotinas administrativas do
        Microempreendedor Individual, incluindo:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>consulta à situação cadastral do CNPJ e ao Portal do Simples Nacional;</li>
        <li>emissão e acompanhamento da guia DAS;</li>
        <li>lembretes de vencimentos e obrigações;</li>
        <li>respostas e orientações geradas por inteligência artificial a partir dos seus dados.</li>
      </ul>
      <p>
        <strong>O BoraMEI não é um escritório de contabilidade e não presta serviços contábeis.</strong> A
        atividade contábil é privativa de profissionais registrados no Conselho Regional de Contabilidade,
        nos termos do Decreto-Lei nº 9.295/1946. Nada na plataforma substitui a orientação de um contador,
        advogado ou outro profissional habilitado.
      </p>
      <p>
        As informações fornecidas pela plataforma têm caráter informativo e de apoio. A responsabilidade
        pelo cumprimento das obrigações fiscais, tributárias e legais permanece integralmente com você.
      </p>

      <Secao numero="2" titulo="Cadastro e conta" />
      <p>Para usar a plataforma você precisa:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>ser maior de 18 anos e civilmente capaz;</li>
        <li>fornecer informações verdadeiras, completas e atualizadas;</li>
        <li>ser o titular do CPF e do CNPJ informados, ou ter autorização expressa do titular.</li>
      </ul>
      <p>
        Você é responsável por manter a confidencialidade das suas credenciais e por todas as atividades
        realizadas na sua conta. Comunique-nos imediatamente qualquer uso não autorizado.
      </p>
      <p>
        Podemos suspender ou encerrar contas que apresentem dados falsos, uso fraudulento ou violação
        destes Termos.
      </p>

      <Secao numero="3" titulo="Autorização para consultas em nome do usuário" />
      <p>
        Ao contratar a plataforma, você <strong>autoriza expressamente</strong> o BoraMEI a acessar, em seu
        nome e por meio de prestadores de serviço, sistemas públicos e dados relacionados ao seu CPF e CNPJ,
        incluindo Receita Federal e Portal do Simples Nacional, com a finalidade exclusiva de executar os
        serviços contratados.
      </p>
      <p>Essa autorização:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>é limitada às finalidades descritas nestes Termos e na Política de Privacidade;</li>
        <li>pode ser revogada a qualquer momento, mediante cancelamento do plano ou solicitação pelos canais de atendimento;</li>
        <li>não constitui procuração para atos que exijam instrumento próprio.</li>
      </ul>
      <p>O BoraMEI não solicita nem armazena senhas de portais governamentais.</p>

      <Secao numero="4" titulo="Planos, pagamento e renovação" />

      <SubSecao numero="4.1" titulo="Preços e cobrança" />
      <p>
        Os valores vigentes são os exibidos na página de contratação no momento da compra. Aceitamos
        pagamento via PIX e cartão de crédito, processados pelo PagBank.
      </p>

      <SubSecao numero="4.2" titulo="Período de teste" />
      <p>
        Podemos oferecer período de teste gratuito ou promocional. Ao fim do período, a assinatura passa a
        ser cobrada automaticamente no valor vigente do plano, salvo cancelamento anterior. As condições e
        a duração de cada oferta são informadas no momento da contratação.
      </p>

      <SubSecao numero="4.3" titulo="Renovação automática no cartão de crédito" />
      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
        <strong>Atenção:</strong> ao escolher cartão de crédito como forma de pagamento, você contrata uma{' '}
        <strong>assinatura de cobrança recorrente mensal</strong>. O valor do plano será debitado
        automaticamente no mesmo cartão, todo mês, sem necessidade de nova autorização, até que você
        cancele.
      </div>
      <p>Ao concluir a compra com cartão, você declara estar ciente e de acordo com:</p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>a cobrança mensal automática, no valor vigente do plano;</li>
        <li>
          o armazenamento de um <strong>token do seu cartão</strong> junto ao PagBank, para viabilizar as
          cobranças seguintes – nunca o número completo, que não trafega nem é armazenado em nossos
          sistemas;
        </li>
        <li>a renovação por prazo indeterminado, ciclo a ciclo, enquanto a assinatura estiver ativa.</li>
      </ol>
      <p>
        Enviaremos um comprovante por e-mail a cada cobrança realizada. Se você contratou um período de
        teste, avisaremos por e-mail antes da primeira cobrança.
      </p>
      <p>
        <strong>Como cancelar:</strong> a qualquer momento, pelo painel do cliente ou pelo e-mail
        contato@boramei.cloud. O cancelamento interrompe as cobranças futuras, e o acesso permanece até o
        fim do período já pago. Não há multa nem fidelidade.
      </p>
      <p>Pagamentos via PIX não geram cobrança automática: cada ciclo exige nova ação sua.</p>

      <SubSecao numero="4.4" titulo="Falha na cobrança" />
      <p>
        Se a cobrança recorrente for recusada, tentaremos novamente e notificaremos você. Persistindo a
        falha, o acesso pode ser suspenso até a regularização.
      </p>

      <Secao numero="5" titulo="Cancelamento e reembolso" />

      <SubSecao numero="5.1" titulo="Direito de arrependimento" />
      <p>
        Nos termos do art. 49 do Código de Defesa do Consumidor, você pode desistir da contratação em até{' '}
        <strong>7 (sete) dias corridos</strong> contados da compra, com devolução integral do valor pago.
      </p>

      <SubSecao numero="5.2" titulo="Cancelamento após esse prazo" />
      <p>
        Você pode cancelar a assinatura a qualquer momento. O acesso permanece disponível até o fim do
        período já pago, sem reembolso proporcional, salvo disposição legal em contrário.
      </p>

      <SubSecao numero="5.3" titulo="Cancelamento por nossa iniciativa" />
      <p>
        Podemos encerrar o serviço em caso de violação destes Termos, uso fraudulento ou determinação
        legal, com devolução proporcional do valor não usufruído quando cabível.
      </p>

      <Secao numero="6" titulo="Uso da inteligência artificial" />
      <p>Parte do conteúdo da plataforma é gerado por modelos de inteligência artificial. Esse conteúdo:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>pode conter imprecisões e não deve ser tratado como aconselhamento profissional;</li>
        <li>não constitui parecer contábil, jurídico ou tributário;</li>
        <li>deve ser conferido antes de embasar qualquer decisão com efeitos fiscais ou legais.</li>
      </ul>
      <p>
        Ao usar recursos de IA, você concorda em não inserir dados de terceiros sem autorização e em não
        utilizar a ferramenta para finalidades ilícitas.
      </p>

      <Secao numero="7" titulo="Disponibilidade e limitações" />
      <p>
        Empregamos esforços razoáveis para manter a plataforma disponível, mas não garantimos operação
        ininterrupta ou livre de erros.
      </p>
      <p>
        O BoraMEI depende de sistemas de terceiros – órgãos públicos, provedores de dados e processadores
        de pagamento. Indisponibilidades, alterações ou inconsistências nesses sistemas podem afetar os
        serviços, e não respondemos por falhas que lhes sejam atribuíveis.
      </p>
      <p>Não nos responsabilizamos por multas, juros, perda de benefícios ou quaisquer prejuízos decorrentes de:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>informações incorretas ou desatualizadas fornecidas por você;</li>
        <li>indisponibilidade de sistemas governamentais;</li>
        <li>decisões tomadas exclusivamente com base em conteúdo gerado por IA;</li>
        <li>descumprimento de prazos que permaneçam sob sua responsabilidade.</li>
      </ul>

      <Secao numero="8" titulo="Obrigações do usuário" />
      <p>Você se compromete a não:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>usar a plataforma para fins ilícitos ou fraudulentos;</li>
        <li>tentar acessar áreas restritas, contas de terceiros ou o código-fonte;</li>
        <li>automatizar acessos, raspar dados ou sobrecarregar a infraestrutura;</li>
        <li>revender ou sublicenciar o acesso sem autorização escrita.</li>
      </ul>

      <Secao numero="9" titulo="Propriedade intelectual" />
      <p>
        A plataforma, sua marca, layout, código e conteúdos são de titularidade do BoraMEI ou de seus
        licenciadores. A contratação concede apenas licença de uso pessoal, limitada e não transferível,
        durante a vigência do plano.
      </p>
      <p>Os dados que você insere permanecem seus.</p>

      <Secao numero="10" titulo="Alterações nestes Termos" />
      <p>
        Podemos alterar estes Termos. Mudanças relevantes serão comunicadas por e-mail ou na plataforma com
        antecedência mínima de 30 dias. O uso continuado após a vigência implica concordância. Se você não
        concordar, pode cancelar sem ônus.
      </p>

      <Secao numero="11" titulo="Legislação e foro" />
      <p>
        Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro do domicílio do consumidor para
        dirimir controvérsias, conforme o Código de Defesa do Consumidor.
      </p>

      <Secao numero="12" titulo="Contato" />
      <p>Dúvidas sobre estes Termos: contato@boramei.cloud</p>

      <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
        Documento em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990), o Marco Civil
        da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>
    </>
  );
}

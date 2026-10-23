const LINK_WHATSAPP = "https://wa.me/5581986195043?text=Ola%2C%20quero%20ser%20o%20novo%20cliente%20BoraMEI%21";

export default function WhatsappQr() {
  return (
    <section className="scroll-mt-20 bg-white py-20 px-6" id="planos">
      <div className="max-w-6xl mx-auto">

        {/* Cabeçalho da Seção */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comece agora, em uma conversa
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Aponte a câmera para o QR Code e fale com o BoraMEI no WhatsApp.
          </p>
        </div>

        <div className="max-w-md mx-auto">

          {/* CARD: QR CODE DO WHATSAPP */}
          <div className="flex flex-col items-center text-center p-8 rounded-3xl border-2 border-brand-green/40 bg-brand-bgLight">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-4 py-1.5 text-xs font-semibold text-brand-green ring-1 ring-inset ring-brand-green/20 uppercase tracking-wider mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
              Direto no WhatsApp
            </span>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-200 shadow-lg shadow-green-100">
              <img
                src="/qrcode-boramei-robo.svg"
                alt="QR Code para conversar com o BoraMEI no WhatsApp"
                className="h-52 w-52 sm:h-60 sm:w-60"
              />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-2">
              Aponte a câmera do celular
            </h3>
            <p className="text-gray-500 text-base leading-relaxed max-w-xs">
              A conversa abre automaticamente no seu WhatsApp. Sem instalar nada, sem cadastro complicado.
            </p>

            {/* No celular o QR Code não serve, então o botão assume */}
            <a
              href={LINK_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full sm:w-auto justify-center inline-flex items-center bg-brand-green hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full transition-all duration-200 shadow-lg shadow-green-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Abrir no WhatsApp
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}

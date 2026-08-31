import QRCode from "qrcode";

/** Gera a imagem do QR Code (data URL) a partir do PIX Copia e Cola, direto no navegador. */
export async function gerarQrCodeDataUrl(copiaECola: string): Promise<string> {
  return QRCode.toDataURL(copiaECola, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
}

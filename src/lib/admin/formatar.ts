/** "81999998888" -> "(81) 99999-8888" */
export function formatarTelefone(valor: string | null): string | null {
  if (!valor) return null;
  const v = valor.replace(/\D/g, "");
  if (v.length !== 11) return valor;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

/** "12345678901" -> "123.456.789-01" */
export function formatarCpf(valor: string): string {
  const v = valor.replace(/\D/g, "");
  if (v.length !== 11) return valor;
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
}

/** "12345678000199" -> "12.345.678/0001-99" */
export function formatarCnpj(valor: string | null): string | null {
  if (!valor) return null;
  const v = valor.replace(/\D/g, "");
  if (v.length !== 14) return valor;
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
}

/** usuarios.valor_plano é gravado em centavos: 3590 -> "R$ 35,90" */
export function formatarCentavos(centavos: number | null): string | null {
  if (centavos === null) return null;
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** NUMERIC chega do pg como string: "5000.00" -> "R$ 5.000,00" */
export function formatarReais(valor: string | null): string | null {
  if (valor === null) return null;
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Coluna DATE ("YYYY-MM-DD") -> "DD/MM/YYYY", sem passar por Date (evita deslocar o dia pelo fuso). */
export function formatarDataIso(valor: string | null): string | null {
  if (!valor) return null;
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-10" -> "out/26" */
export function formatarMesCurto(valor: string): string {
  const [ano, mes] = valor.split("-");
  return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`;
}

export const PLANOS = {
  basico: {
    nome: "Básico",
    preco: "9.90",
  },
  essencial: {
    nome: "Essencial",
    preco: "29.99",
  },
} as const;

export type PlanoId = keyof typeof PLANOS;

export function isPlanoId(value: unknown): value is PlanoId {
  return typeof value === "string" && value in PLANOS;
}

export function obterPlano(value: unknown): PlanoId {
  return isPlanoId(value) ? value : "basico";
}

export type StockStatus = "disponivel" | "atencao" | "esgotado";

export interface StockInfo {
  status: StockStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
}

export function getStockStatus(quantidade: number, minimo: number): StockInfo {
  if (quantidade <= 0) {
    return {
      status: "esgotado",
      label: "Esgotado",
      badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
      dotClass: "bg-destructive",
    };
  }
  if (quantidade <= minimo) {
    return {
      status: "atencao",
      label: "Pouco stock",
      badgeClass: "bg-warning/15 text-warning-foreground border-warning/40",
      dotClass: "bg-warning",
    };
  }
  return {
    status: "disponivel",
    label: "Disponível",
    badgeClass: "bg-success/10 text-success border-success/30",
    dotClass: "bg-success",
  };
}

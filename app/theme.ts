import { Stat } from "../engine/types";

// Single fixed dark palette — the product's visual direction (docs/05-ui-ux.md)
// is deliberately dark/cinematic in both light and dark OS settings, not
// theme-adaptive. Shares its identity with the design dossier artifact.
export const color = {
  ground: "#14110E",
  surface: "#1E1A15",
  surface2: "#262019",
  ink: "#EFE8DA",
  inkDim: "#A79B87",
  rule: "#3A3227",
  accent: "#C9A24B",
  danger: "#B0616B",
} as const;

export const statColor: Record<Stat, string> = {
  morality: "#7C9A92",
  wealth: "#C9A24B",
  relationships: "#B0616B",
  sanity: "#6B7FA3",
};

export const space = (n: number): number => n * 4;

export const radius = 4;

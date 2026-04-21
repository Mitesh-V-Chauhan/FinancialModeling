import type { Bond } from "./bond-math";

// Table 1: Bond Parameters (Face = 1000, YTM = 6% for all)
export const BONDS: Bond[] = [
  {
    id: "B1",
    name: "Bond 1 · Short (Premium)",
    face: 1000,
    coupon: 0.08,
    maturity: 2,
    ytm: 0.06,
    color: "#FF6B6B",
  },
  {
    id: "B2",
    name: "Bond 2 · Medium (Par)",
    face: 1000,
    coupon: 0.06,
    maturity: 5,
    ytm: 0.06,
    color: "#4ECDC4",
  },
  {
    id: "B3",
    name: "Bond 3 · Long (Discount)",
    face: 1000,
    coupon: 0.04,
    maturity: 10,
    ytm: 0.06,
    color: "#A78BFA",
  },
];

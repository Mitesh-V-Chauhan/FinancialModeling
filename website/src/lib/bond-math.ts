// Bond mathematics: price, Macaulay & modified duration, convexity.
// All bonds assume annual coupons paid at t = 1..N and face redeemed at N.

export interface Bond {
  id: string;
  name: string;
  face: number; // face value
  coupon: number; // annual coupon rate (decimal, e.g. 0.06)
  maturity: number; // years
  ytm: number; // yield to maturity (decimal)
  color: string;
}

export interface BondMetrics {
  price: number;
  macaulay: number;
  modified: number;
  convexity: number;
  cashflows: { t: number; cf: number; pv: number; weight: number }[];
}

export function computeMetrics(bond: Bond, yieldOverride?: number): BondMetrics {
  const y = yieldOverride ?? bond.ytm;
  const c = bond.coupon * bond.face;
  const N = bond.maturity;

  let price = 0;
  let macNum = 0;
  let convNum = 0;
  const cashflows: BondMetrics["cashflows"] = [];

  for (let t = 1; t <= N; t++) {
    const cf = t === N ? c + bond.face : c;
    const pv = cf / Math.pow(1 + y, t);
    price += pv;
    macNum += t * pv;
    convNum += t * (t + 1) * pv;
    cashflows.push({ t, cf, pv, weight: 0 });
  }

  cashflows.forEach((cfRow) => (cfRow.weight = cfRow.pv / price));

  const macaulay = macNum / price;
  const modified = macaulay / (1 + y);
  const convexity = convNum / (price * Math.pow(1 + y, 2));

  return { price, macaulay, modified, convexity, cashflows };
}

// Approximated price change using duration + convexity:
// ΔP/P ≈ -D_mod * Δy + 0.5 * C * (Δy)^2
export function approxPctChange(
  modified: number,
  convexity: number,
  deltaY: number,
): number {
  return -modified * deltaY + 0.5 * convexity * deltaY * deltaY;
}

export function approxPriceFromDurationOnly(
  price: number,
  modified: number,
  deltaY: number,
): number {
  return price * (1 - modified * deltaY);
}

export function approxPriceWithConvexity(
  price: number,
  modified: number,
  convexity: number,
  deltaY: number,
): number {
  return price * (1 + approxPctChange(modified, convexity, deltaY));
}

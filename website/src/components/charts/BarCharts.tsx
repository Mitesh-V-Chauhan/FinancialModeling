import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { BONDS } from "@/lib/bond-data";
import { computeMetrics } from "@/lib/bond-math";

export function DurationBars({ currentY }: { currentY: number }) {
  const data = BONDS.map((b) => {
    const m = computeMetrics(b, currentY);
    return {
      name: b.id,
      Macaulay: +m.macaulay.toFixed(3),
      Modified: +m.modified.toFixed(3),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis dataKey="name" stroke="#000" tick={{ fontSize: 11 }} label={{ value: "Bond", position: "insideBottom", offset: -5, fontSize: 11 }} />
        <YAxis stroke="#000" tick={{ fontSize: 11 }} label={{ value: "Years", angle: -90, position: "insideLeft", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Macaulay" fill="#FF6B6B" radius={[6, 6, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="Modified" fill="#4ECDC4" radius={[6, 6, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ConvexityBars({ currentY }: { currentY: number }) {
  const data = BONDS.map((b) => ({
    name: b.id,
    Convexity: +computeMetrics(b, currentY).convexity.toFixed(2),
    color: b.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis dataKey="name" stroke="#000" tick={{ fontSize: 11 }} label={{ value: "Bond", position: "insideBottom", offset: -5, fontSize: 11 }} />
        <YAxis stroke="#000" tick={{ fontSize: 11 }} label={{ value: "Convexity", angle: -90, position: "insideLeft", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="Convexity" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CashFlowChart({ bondId, currentY }: { bondId: string; currentY: number }) {
  const bond = BONDS.find((b) => b.id === bondId)!;
  const m = computeMetrics(bond, currentY);
  const data = m.cashflows.map((c) => ({
    t: c.t,
    PV: +c.pv.toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis dataKey="t" stroke="#000" tick={{ fontSize: 11 }} label={{ value: "Time t (years)", position: "insideBottom", offset: -5, fontSize: 11 }} />
        <YAxis stroke="#000" tick={{ fontSize: 11 }} label={{ value: "PV ($)", angle: -90, position: "insideLeft", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="PV" fill={bond.color} radius={[6, 6, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

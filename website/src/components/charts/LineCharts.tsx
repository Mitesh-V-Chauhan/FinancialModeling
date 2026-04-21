import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { BONDS } from "@/lib/bond-data";
import { computeMetrics } from "@/lib/bond-math";

interface RangeProps {
  yMin: number;
  yMax: number;
  step: number;
}

export function PriceYieldCurve({
  currentY,
  range,
}: {
  currentY: number;
  range: RangeProps;
}) {
  const yields: number[] = [];
  const stepDec = range.step / 100;
  for (let y = range.yMin / 100; y <= range.yMax / 100 + 1e-9; y += stepDec)
    yields.push(y);

  const data = yields.map((y) => {
    const row: Record<string, number> = { yield: +(y * 100).toFixed(3) };
    BONDS.forEach((b) => {
      row[b.id] = +computeMetrics(b, y).price.toFixed(2);
    });
    return row;
  });

  const yPct = +(currentY * 100).toFixed(3);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis
          dataKey="yield"
          stroke="#000"
          tick={{ fontSize: 11 }}
          type="number"
          domain={[range.yMin, range.yMax]}
          label={{ value: "YTM (%)", position: "insideBottom", offset: -5, fontSize: 11 }}
        />
        <YAxis
          stroke="#000"
          tick={{ fontSize: 11 }}
          label={{ value: "Price ($)", angle: -90, position: "insideLeft", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 8, fontSize: 12 }}
          formatter={(v) => `$${Number(v).toFixed(2)}`}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {yPct >= range.yMin && yPct <= range.yMax && (
          <ReferenceLine x={yPct} stroke="#000" strokeDasharray="4 2" />
        )}
        {BONDS.map((b) => (
          <Line key={b.id} type="monotone" dataKey={b.id} stroke={b.color} strokeWidth={2.5} dot={false} name={b.name} isAnimationActive={false} />
        ))}
        {yPct >= range.yMin && yPct <= range.yMax && BONDS.map((b) => (
          <ReferenceDot
            key={`dot-${b.id}`}
            x={yPct}
            y={+computeMetrics(b, currentY).price.toFixed(2)}
            r={5}
            fill={b.color}
            stroke="#000"
            strokeWidth={1.5}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface BpsRangeProps {
  bpsRange: number;
  bpsStep: number;
}

export function DurationApproxChart({
  bondId,
  currentY,
  range,
}: {
  bondId: string;
  currentY: number;
  range: BpsRangeProps;
}) {
  const bond = BONDS.find((b) => b.id === bondId)!;
  const base = computeMetrics(bond, currentY);
  const shocks: number[] = [];
  for (let bps = -range.bpsRange; bps <= range.bpsRange; bps += range.bpsStep)
    shocks.push(bps);

  const data = shocks.map((bps) => {
    const dy = bps / 10000;
    const newY = currentY + dy;
    const actual = computeMetrics(bond, newY).price;
    const durOnly = base.price * (1 - base.modified * dy);
    const durConv = base.price * (1 + (-base.modified * dy + 0.5 * base.convexity * dy * dy));
    return {
      bps,
      Actual: +actual.toFixed(2),
      "Duration only": +durOnly.toFixed(2),
      "Duration + Convexity": +durConv.toFixed(2),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis dataKey="bps" stroke="#000" tick={{ fontSize: 11 }} label={{ value: "Δy (bps)", position: "insideBottom", offset: -5, fontSize: 11 }} />
        <YAxis stroke="#000" tick={{ fontSize: 11 }} domain={["auto", "auto"]} label={{ value: "Price ($)", angle: -90, position: "insideLeft", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine x={0} stroke="#000" strokeDasharray="2 2" />
        <Line type="monotone" dataKey="Actual" stroke="#FF6B6B" strokeWidth={3} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="Duration only" stroke="#4ECDC4" strokeWidth={2} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="Duration + Convexity" stroke="#A78BFA" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PctChangeChart({
  currentY,
  range,
}: {
  currentY: number;
  range: BpsRangeProps;
}) {
  const shocks: number[] = [];
  for (let bps = -range.bpsRange; bps <= range.bpsRange; bps += range.bpsStep)
    shocks.push(bps);

  const baseMetrics = BONDS.map((b) => ({ b, m: computeMetrics(b, currentY) }));

  const data = shocks.map((bps) => {
    const dy = bps / 10000;
    const row: Record<string, number> = { bps };
    baseMetrics.forEach(({ b, m }) => {
      const newPrice = computeMetrics(b, currentY + dy).price;
      row[b.id] = +(((newPrice - m.price) / m.price) * 100).toFixed(3);
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis dataKey="bps" stroke="#000" tick={{ fontSize: 11 }} label={{ value: "Δy (bps)", position: "insideBottom", offset: -5, fontSize: 11 }} />
        <YAxis stroke="#000" tick={{ fontSize: 11 }} label={{ value: "% ΔP", angle: -90, position: "insideLeft", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 8, fontSize: 12 }} formatter={(v) => `${Number(v).toFixed(2)}%`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine x={0} stroke="#000" strokeDasharray="2 2" />
        <ReferenceLine y={0} stroke="#000" strokeDasharray="2 2" />
        {BONDS.map((b) => (
          <Line key={b.id} type="monotone" dataKey={b.id} stroke={b.color} strokeWidth={2.5} dot={false} name={b.name} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

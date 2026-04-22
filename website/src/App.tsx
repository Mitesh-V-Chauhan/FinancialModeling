import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { BONDS } from "@/lib/bond-data";
import { computeMetrics } from "@/lib/bond-math";
import {
  PriceYieldCurve,
  DurationApproxChart,
  PctChangeChart,
} from "@/components/charts/LineCharts";
import {
  DurationBars,
  ConvexityBars,
  CashFlowChart,
} from "@/components/charts/BarCharts";

export default function App() {
  const [selected, setSelected] = useState<string>("B2");
  const [bps, setBps] = useState(0);

  // Per-chart interactive controls
  const [pyMin, setPyMin] = useState(1);
  const [pyMax, setPyMax] = useState(15);
  const [pyStep, setPyStep] = useState(0.25);

  const [shockRange, setShockRange] = useState(300);
  const [shockStep, setShockStep] = useState(20);

  const dy = bps / 10000;
  const baseY = 0.06;
  const currentY = baseY + dy;

  const portfolio = useMemo(
    () =>
      BONDS.map((b) => {
        const base = computeMetrics(b, baseY);
        const shocked = computeMetrics(b, currentY);
        return {
          b,
          base,
          shocked,
          pnl: shocked.price - base.price,
          pct: ((shocked.price - base.price) / base.price) * 100,
        };
      }),
    [currentY],
  );

  const totalBase = portfolio.reduce((s, r) => s + r.base.price, 0);
  const totalNow = portfolio.reduce((s, r) => s + r.shocked.price, 0);
  const totalPnL = totalNow - totalBase;

  const sel = portfolio.find((r) => r.b.id === selected)!;

  return (
    <div className="h-screen overflow-hidden bg-white text-black">
      <div className="flex h-full flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-3 border-b-2 border-black bg-white p-4 lg:h-screen lg:w-[360px] lg:overflow-y-auto lg:border-b-0 lg:border-r-2">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Group 15</span>
              <span className="h-px flex-1 bg-black/20" />
              <span>Rate Risk</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Bond Risk Lab<span className="text-rose-500">.</span>
            </h1>
          </div>

          {/* Table 1: Bond Parameters (sidebar copy of uploaded image) */}
          <div className="overflow-hidden rounded-lg border-2 border-black">
            <div className="bg-black px-2 py-1 text-center font-mono text-[10px] uppercase tracking-widest text-white">
              Table 1 · Bond Parameters
            </div>
            <table className="w-full font-mono text-[10.5px]">
              <thead className="bg-[#3b5b9b] text-white">
                <tr>
                  <th className="p-1.5 text-left font-bold">Parameter</th>
                  <th className="p-1.5 text-center font-bold">B1<br /><span className="text-[9px] font-normal opacity-80">Short</span></th>
                  <th className="p-1.5 text-center font-bold">B2<br /><span className="text-[9px] font-normal opacity-80">Medium</span></th>
                  <th className="p-1.5 text-center font-bold">B3<br /><span className="text-[9px] font-normal opacity-80">Long</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Face Value", "1,000", "1,000", "1,000"],
                  ["Maturity", "2 yr", "5 yr", "10 yr"],
                  ["Coupon", "8%", "6%", "4%"],
                  ["Init YTM (y)", "6%", "6%", "6%"],
                  ["Type", "Premium", "Par", "Discount"],
                ].map((row, i) => (
                  <tr key={row[0]} className={i % 2 === 0 ? "bg-[#eef2f9]" : "bg-white"}>
                    <td className="p-1.5">{row[0]}</td>
                    <td className="p-1.5 text-center">{row[1]}</td>
                    <td className="p-1.5 text-center">{row[2]}</td>
                    <td className="p-1.5 text-center">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Yield-shock slider */}
          <div className="rounded-lg border-2 border-black p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Yield Shock Δy
              </span>
              <motion.span
                key={bps}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                className={`font-mono text-xl font-bold ${bps > 0 ? "text-rose-500" : bps < 0 ? "text-emerald-500" : "text-black"}`}
              >
                {bps > 0 ? "+" : ""}
                {bps} bps
              </motion.span>
            </div>
            <Slider
              className="mt-2"
              min={-300}
              max={300}
              step={5}
              value={[bps]}
              onValueChange={(v) => setBps(v[0])}
            />
            <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
              <span>-300</span>
              <span>0</span>
              <span>+300</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2 font-mono text-[10px]">
              <span className="text-muted-foreground">New YTM</span>
              <span className="font-bold">{(currentY * 100).toFixed(2)}%</span>
            </div>
          </div>

          {/* Live computed table — updates with shock */}
          <div className="overflow-hidden rounded-lg border-2 border-black">
            <div className="bg-black px-2 py-1 text-center font-mono text-[10px] uppercase tracking-widest text-white">
              Live · D, C, Price @ y={(currentY * 100).toFixed(2)}%
            </div>
            <table className="w-full font-mono text-[10.5px]">
              <thead className="bg-black/5">
                <tr>
                  <th className="p-1.5 text-left">Bond</th>
                  <th className="p-1.5 text-right">Price</th>
                  <th className="p-1.5 text-right">D_mod</th>
                  <th className="p-1.5 text-right">Conv</th>
                  <th className="p-1.5 text-right">%Δ</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map(({ b, shocked, pct }) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b.id)}
                    className={`cursor-pointer border-t border-black/10 transition-colors ${
                      selected === b.id ? "bg-black/5" : "hover:bg-black/5"
                    }`}
                  >
                    <td className="p-1.5">
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ background: b.color }}
                      />
                      {b.id}
                    </td>
                    <td className="p-1.5 text-right">{shocked.price.toFixed(2)}</td>
                    <td className="p-1.5 text-right">{shocked.modified.toFixed(2)}</td>
                    <td className="p-1.5 text-right">{shocked.convexity.toFixed(1)}</td>
                    <td
                      className={`p-1.5 text-right font-bold ${pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {pct >= 0 ? "+" : ""}
                      {pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Portfolio totals */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Σ Value" value={`$${totalNow.toFixed(0)}`} />
            <Stat
              label="P&L"
              value={`${totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(1)}`}
              tone={totalPnL >= 0 ? "pos" : "neg"}
            />
            <Stat
              label="Return"
              value={`${totalPnL >= 0 ? "+" : ""}${((totalPnL / totalBase) * 100).toFixed(2)}%`}
              tone={totalPnL >= 0 ? "pos" : "neg"}
            />
          </div>

          <div className="rounded-lg bg-black p-3 font-mono text-[10px] leading-relaxed text-white">
            <div className="mb-1 uppercase tracking-wider text-white/50">Formulas</div>
            P = Σ CFₜ/(1+y)ᵗ
            <br />
            D_mac = Σ t·PVₜ / P
            <br />
            D_mod = D_mac/(1+y)
            <br />
            C = Σ t(t+1)·PVₜ / [P(1+y)²]
            <br />
            ΔP/P ≈ -D_mod·Δy + ½·C·(Δy)²
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          {/* Project criteria banner */}
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Criterion n="1" title="Compute D & C" desc="Macaulay, Modified, Convexity for all 3 bonds (live in sidebar table)" />
            <Criterion n="2" title="Simulate ΔP" desc="Parallel yield shifts via Δy slider; per-bond + portfolio P&L" />
            <Criterion n="3" title="Analyze Risk" desc="Price-yield convexity, duration vs actual, % change asymmetry" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              n="01"
              title="Price–Yield Curve"
              axes="X: YTM (%) · Y: Price ($)"
              criterion="Analyze · 1"
              controls={
                <RangeBar
                  items={[
                    { label: "X min %", value: pyMin, min: 0.5, max: 5, step: 0.5, set: setPyMin, fmt: (v) => `${v}%` },
                    { label: "X max %", value: pyMax, min: 6, max: 25, step: 0.5, set: setPyMax, fmt: (v) => `${v}%` },
                    { label: "Step %", value: pyStep, min: 0.1, max: 1, step: 0.05, set: setPyStep, fmt: (v) => `${v.toFixed(2)}` },
                  ]}
                />
              }
            >
              <PriceYieldCurve currentY={currentY} range={{ yMin: pyMin, yMax: pyMax, step: pyStep }} />
            </ChartCard>

            <ChartCard
              n="02"
              title={`Duration vs Actual · ${sel.b.id}`}
              axes="X: Δy (bps) · Y: Price ($)"
              criterion="Simulate · 2"
              controls={
                <RangeBar
                  items={[
                    { label: "± Range", value: shockRange, min: 50, max: 600, step: 25, set: setShockRange, fmt: (v) => `±${v}` },
                    { label: "Step bps", value: shockStep, min: 5, max: 50, step: 5, set: setShockStep, fmt: (v) => `${v}` },
                  ]}
                />
              }
            >
              <DurationApproxChart
                bondId={selected}
                currentY={baseY}
                range={{ bpsRange: shockRange, bpsStep: shockStep }}
              />
            </ChartCard>

            <ChartCard
              n="03"
              title="% Price Change vs Yield Shock"
              axes="X: Δy (bps) · Y: % ΔP"
              criterion="Analyze · 3"
              controls={
                <RangeBar
                  items={[
                    { label: "± Range", value: shockRange, min: 50, max: 600, step: 25, set: setShockRange, fmt: (v) => `±${v}` },
                    { label: "Step bps", value: shockStep, min: 5, max: 50, step: 5, set: setShockStep, fmt: (v) => `${v}` },
                  ]}
                />
              }
            >
              <PctChangeChart
                currentY={baseY}
                range={{ bpsRange: shockRange, bpsStep: shockStep }}
              />
            </ChartCard>

            <ChartCard
              n="04"
              title="Macaulay vs Modified Duration"
              axes="X: Bond · Y: Years"
              criterion="Compute · 1"
            >
              <DurationBars currentY={currentY} />
            </ChartCard>

            <ChartCard
              n="05"
              title="Convexity by Bond"
              axes="X: Bond · Y: Convexity"
              criterion="Compute · 1"
            >
              <ConvexityBars currentY={currentY} />
            </ChartCard>

            <ChartCard
              n="06"
              title={`PV-Weighted Cash Flows · ${sel.b.id}`}
              axes="X: t (yr) · Y: PV ($)"
              criterion="Compute · 1"
            >
              <CashFlowChart bondId={selected} currentY={currentY} />
            </ChartCard>
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  const color =
    tone === "pos" ? "text-emerald-600" : tone === "neg" ? "text-rose-600" : "text-black";
  return (
    <div className="rounded-md border border-black bg-white p-1.5 text-center">
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 font-mono text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Criterion({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border-2 border-black bg-white p-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black font-mono text-xs font-bold text-white">
        {n}
      </div>
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-wider">{title}</div>
        <div className="font-mono text-[10.5px] leading-tight text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

interface RangeItem {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  set: (v: number) => void;
  fmt: (v: number) => string;
}

function RangeBar({ items }: { items: RangeItem[] }) {
  return (
    <div className="mb-2 grid grid-cols-1 gap-2 rounded-md border border-black/20 bg-black/[0.02] p-2 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="uppercase tracking-wider text-muted-foreground">{it.label}</span>
            <span className="font-bold">{it.fmt(it.value)}</span>
          </div>
          <Slider
            className="mt-1"
            min={it.min}
            max={it.max}
            step={it.step}
            value={[it.value]}
            onValueChange={(v) => it.set(v[0])}
          />
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  n,
  title,
  axes,
  criterion,
  controls,
  children,
}: {
  n: string;
  title: string;
  axes: string;
  criterion: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border-2 border-black bg-white p-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="font-mono text-sm font-bold">
          <span className="text-muted-foreground">{n}.</span> {title}
        </h3>
        <span className="rounded-full bg-black px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
          {criterion}
        </span>
      </div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {axes}
      </div>
      {controls}
      {children}
    </div>
  );
}

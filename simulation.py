"""
=============================================================
  GROUP 15 — Duration and Interest Rate Risk
  Bond Price, Duration, Convexity Analysis + Simulations
=============================================================
  Bonds:
    Bond A  →  2-year,   8% coupon  (Short-Term)
    Bond B  →  5-year,   6% coupon  (Medium-Term)
    Bond C  →  10-year,  4% coupon  (Long-Term)
  Common: FV = ₹1000, Base YTM = 6%
=============================================================
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.gridspec import GridSpec

# ─────────────────────────────────────────────
#  CORE FUNCTIONS
# ─────────────────────────────────────────────

def bond_price(face_value, coupon_rate, ytm, maturity):
    """
    Calculate the present value (price) of a bond.
    
    Parameters:
        face_value  : Par / Face value of the bond
        coupon_rate : Annual coupon rate (e.g., 0.08 for 8%)
        ytm         : Yield to Maturity (e.g., 0.06 for 6%)
        maturity    : Number of years to maturity (integer)
    
    Returns:
        float : Bond price (present value of all cash flows)
    """
    coupon = face_value * coupon_rate
    price = 0.0
    for t in range(1, maturity + 1):
        price += coupon / (1 + ytm) ** t
    price += face_value / (1 + ytm) ** maturity
    return price


def macaulay_duration(face_value, coupon_rate, ytm, maturity):
    """
    Calculate Macaulay Duration — weighted average time to receive cash flows.
    
    Returns:
        float : Macaulay Duration in years
    """
    coupon = face_value * coupon_rate
    price  = bond_price(face_value, coupon_rate, ytm, maturity)

    weighted_sum = 0.0
    for t in range(1, maturity + 1):
        cf = coupon if t < maturity else coupon + face_value
        weighted_sum += t * cf / (1 + ytm) ** t

    return weighted_sum / price


def modified_duration(face_value, coupon_rate, ytm, maturity):
    """
    Modified Duration = Macaulay Duration / (1 + YTM)
    Measures % price sensitivity to a 1-unit change in yield.
    
    Returns:
        float : Modified Duration
    """
    d_mac = macaulay_duration(face_value, coupon_rate, ytm, maturity)
    return d_mac / (1 + ytm)


def convexity(face_value, coupon_rate, ytm, maturity):
    """
    Convexity — second-order price sensitivity to yield changes.
    Captures the curvature of the price-yield relationship.
    
    Formula:
        Conv = [1 / (P × (1+y)²)] × Σ [t(t+1) × CF_t / (1+y)^t]
    
    Returns:
        float : Convexity
    """
    coupon = face_value * coupon_rate
    price  = bond_price(face_value, coupon_rate, ytm, maturity)

    conv_sum = 0.0
    for t in range(1, maturity + 1):
        cf = coupon if t < maturity else coupon + face_value
        conv_sum += t * (t + 1) * cf / (1 + ytm) ** t

    return conv_sum / (price * (1 + ytm) ** 2)


# ─────────────────────────────────────────────
#  PRICE CHANGE ESTIMATES
# ─────────────────────────────────────────────

def duration_estimate(price, d_mod, delta_y):
    """
    Estimate new price using Duration only (linear approximation).
    
    ΔP ≈ -Dmod × P × Δy
    """
    delta_p = -d_mod * price * delta_y
    return price + delta_p


def duration_convexity_estimate(price, d_mod, conv, delta_y):
    """
    Estimate new price using Duration + Convexity (quadratic approximation).
    
    ΔP ≈ (-Dmod × P × Δy) + (½ × Conv × P × Δy²)
    """
    delta_p = (-d_mod * price * delta_y) + (0.5 * conv * price * delta_y ** 2)
    return price + delta_p


# ─────────────────────────────────────────────
#  SIMULATION FUNCTION
# ─────────────────────────────────────────────

def simulate_bond(name, face_value, coupon_rate, base_ytm, maturity, yield_changes):
    """
    Full simulation for a single bond across all yield change scenarios.
    Prints a formatted summary table and returns results dict.
    """
    # Base metrics
    P      = bond_price(face_value, coupon_rate, base_ytm, maturity)
    D_mac  = macaulay_duration(face_value, coupon_rate, base_ytm, maturity)
    D_mod  = modified_duration(face_value, coupon_rate, base_ytm, maturity)
    Conv   = convexity(face_value, coupon_rate, base_ytm, maturity)

    print(f"\n{'='*65}")
    print(f"  {name}")
    print(f"  Coupon: {coupon_rate*100:.0f}%  |  Maturity: {maturity}Y  |  FV: ₹{face_value}")
    print(f"{'='*65}")
    print(f"  Base Price        : ₹{P:>10.4f}")
    print(f"  Macaulay Duration : {D_mac:>10.4f} years")
    print(f"  Modified Duration : {D_mod:>10.4f}")
    print(f"  Convexity         : {Conv:>10.4f}")
    print(f"{'-'*65}")

    # Table A — Actual Price
    print(f"\n  TABLE A — Actual Mathematical Price")
    print(f"  {'Δy':>6}  {'New YTM':>8}  {'Actual Price':>13}  {'Actual ΔP':>11}")
    print(f"  {'-'*50}")
    actual_prices = {}
    for dy in yield_changes:
        new_ytm = base_ytm + dy
        actual_p = bond_price(face_value, coupon_rate, new_ytm, maturity)
        actual_dp = actual_p - P
        actual_prices[dy] = actual_p
        print(f"  {dy*100:>+5.0f}%  {new_ytm*100:>7.0f}%  ₹{actual_p:>12.2f}  {actual_dp:>+10.2f}")

    # Table B — Duration Estimate
    print(f"\n  TABLE B — Duration-Based Estimates")
    print(f"  {'Δy':>6}  {'New YTM':>8}  {'Est. Price':>11}  {'Est. ΔP':>9}  {'Error':>8}")
    print(f"  {'-'*55}")
    dur_prices = {}
    for dy in yield_changes:
        new_ytm = base_ytm + dy
        est_p = duration_estimate(P, D_mod, dy)
        est_dp = est_p - P
        error  = est_p - actual_prices[dy]
        dur_prices[dy] = est_p
        print(f"  {dy*100:>+5.0f}%  {new_ytm*100:>7.0f}%  ₹{est_p:>10.2f}  {est_dp:>+8.2f}  {error:>+7.2f}")

    # Table C — Duration + Convexity Estimate
    print(f"\n  TABLE C — Duration + Convexity Estimates")
    print(f"  {'Δy':>6}  {'New YTM':>8}  {'Est. Price':>11}  {'Est. ΔP':>9}  {'Error':>8}")
    print(f"  {'-'*55}")
    conv_prices = {}
    for dy in yield_changes:
        new_ytm = base_ytm + dy
        est_p = duration_convexity_estimate(P, D_mod, Conv, dy)
        est_dp = est_p - P
        error  = est_p - actual_prices[dy]
        conv_prices[dy] = est_p
        print(f"  {dy*100:>+5.0f}%  {new_ytm*100:>7.0f}%  ₹{est_p:>10.2f}  {est_dp:>+8.2f}  {error:>+7.2f}")

    return {
        "name": name,
        "maturity": maturity,
        "coupon_rate": coupon_rate,
        "base_price": P,
        "d_mac": D_mac,
        "d_mod": D_mod,
        "conv": Conv,
        "actual_prices": actual_prices,
        "dur_prices": dur_prices,
        "conv_prices": conv_prices,
    }


# ─────────────────────────────────────────────
#  BOND DEFINITIONS
# ─────────────────────────────────────────────

FACE_VALUE    = 1000
BASE_YTM      = 0.06
YIELD_CHANGES = [-0.02, -0.01, 0.00, +0.01, +0.02]

bonds_config = [
    {"name": "Bond A  —  Short-Term   (2Y, 8% Coupon)",  "coupon_rate": 0.08, "maturity": 2},
    {"name": "Bond B  —  Medium-Term  (5Y, 6% Coupon)",  "coupon_rate": 0.06, "maturity": 5},
    {"name": "Bond C  —  Long-Term   (10Y, 4% Coupon)",  "coupon_rate": 0.04, "maturity": 10},
]

# ─────────────────────────────────────────────
#  RUN SIMULATIONS
# ─────────────────────────────────────────────

print("\n" + "█"*65)
print("  GROUP 15 — Duration & Interest Rate Risk  |  Bond Simulations")
print("█"*65)

results = []
for cfg in bonds_config:
    res = simulate_bond(
        name         = cfg["name"],
        face_value   = FACE_VALUE,
        coupon_rate  = cfg["coupon_rate"],
        base_ytm     = BASE_YTM,
        maturity     = cfg["maturity"],
        yield_changes= YIELD_CHANGES,
    )
    results.append(res)


# ─────────────────────────────────────────────
#  PLOTTING
# ─────────────────────────────────────────────

COLORS = {
    "yash":  "#2563EB",   # blue   — 2Y
    "sai":   "#16A34A",   # green  — 5Y
    "sug":   "#DC2626",   # red    — 10Y
    "actual": "#1e1e2e",
    "dur":    "#f59e0b",
    "conv":   "#7c3aed",
    "bg":     "#F8FAFC",
    "grid":   "#E2E8F0",
}

BOND_COLORS = [COLORS["yash"], COLORS["sai"], COLORS["sug"]]
LABELS_SHORT = ["Bond A  (2Y / 8%)", "Bond B  (5Y / 6%)", "Bond C  (10Y / 4%)"]

yield_range = np.linspace(0.01, 0.15, 300)  # 1% to 15% for smooth curves


# ── FIGURE SETUP ──────────────────────────────
fig = plt.figure(figsize=(18, 14), facecolor=COLORS["bg"])
gs  = GridSpec(2, 2, figure=fig, hspace=0.42, wspace=0.32,
               left=0.07, right=0.97, top=0.93, bottom=0.07)

ax_main   = fig.add_subplot(gs[0, :])   # top full-width
ax_bonds  = [fig.add_subplot(gs[1, i]) for i in range(3) if False]  # placeholder
ax_b0     = fig.add_subplot(gs[1, 0])
ax_b1_ax  = fig.add_subplot(gs[1, 1])
ax_b2     = fig.add_subplot(gs[1, 2] if gs.ncols > 2 else gs[1, 1])

# Recreate properly
fig.clear()
fig = plt.figure(figsize=(20, 15), facecolor=COLORS["bg"])

# Title
fig.suptitle(
    "GROUP 15 — Duration & Interest Rate Risk Analysis",
    fontsize=18, fontweight="bold", color="#0f172a",
    fontfamily="monospace", y=0.97
)

# Layout: 1 big plot on top, 3 bond plots on bottom
ax0 = fig.add_axes([0.06, 0.54, 0.88, 0.38])         # Price vs Yield — all bonds
ax1 = fig.add_axes([0.04, 0.07, 0.27, 0.38])         # Bond A (2Y)
ax2 = fig.add_axes([0.37, 0.07, 0.27, 0.38])         # Bond B (5Y)
ax3 = fig.add_axes([0.69, 0.07, 0.27, 0.38])         # Bond C (10Y)
bond_axes = [ax1, ax2, ax3]

# ── GRAPH 1: Price vs Yield — All Bonds Together ──────────────
ax0.set_facecolor("white")
ax0.set_title("Price vs. Yield  —  All Three Bonds", fontsize=13,
              fontweight="bold", color="#0f172a", pad=10)

for i, (res, color, lbl) in enumerate(zip(results, BOND_COLORS, LABELS_SHORT)):
    prices_curve = [
        bond_price(FACE_VALUE, res["coupon_rate"], y, res["maturity"])
        for y in yield_range
    ]
    ax0.plot(yield_range * 100, prices_curve,
             color=color, linewidth=2.5, label=lbl, zorder=3)

    # Mark the 5 simulated points
    sim_ytms   = [BASE_YTM + dy for dy in YIELD_CHANGES]
    sim_prices = [res["actual_prices"][dy] for dy in YIELD_CHANGES]
    ax0.scatter([y * 100 for y in sim_ytms], sim_prices,
                color=color, s=60, zorder=5, edgecolors="white", linewidths=1.2)

# Base YTM vertical line
ax0.axvline(BASE_YTM * 100, color="#94a3b8", linestyle="--",
            linewidth=1.4, label="Base YTM (6%)", zorder=2)

ax0.set_xlabel("Yield to Maturity (%)", fontsize=11, color="#334155")
ax0.set_ylabel("Bond Price (₹)", fontsize=11, color="#334155")
ax0.legend(fontsize=10, framealpha=0.9, loc="upper right")
ax0.grid(True, color=COLORS["grid"], linewidth=0.8, zorder=1)
ax0.yaxis.set_major_formatter(mticker.StrMethodFormatter("₹{x:,.0f}"))
ax0.xaxis.set_major_formatter(mticker.StrMethodFormatter("{x:.0f}%"))
ax0.tick_params(labelsize=9)

# ── GRAPHS 2–4: Per-Bond Convexity Analysis ───────────────────
titles = [
    "Bond A  —  Short-Term  (2Y, 8% Coupon)",
    "Bond B  —  Medium-Term  (5Y, 6% Coupon)",
    "Bond C  —  Long-Term  (10Y, 4% Coupon)",
]

for ax, res, color, title in zip(bond_axes, results, BOND_COLORS, titles):
    ax.set_facecolor("white")
    ax.set_title(title, fontsize=10, fontweight="bold",
                 color="#0f172a", pad=8)

    # Actual price curve
    prices_curve = [
        bond_price(FACE_VALUE, res["coupon_rate"], y, res["maturity"])
        for y in yield_range
    ]
    ax.plot(yield_range * 100, prices_curve,
            color=COLORS["actual"], linewidth=2.2,
            label="Actual Price", zorder=4)

    # Duration-based estimate at simulated points
    sim_ytms = [BASE_YTM + dy for dy in YIELD_CHANGES]
    dur_est  = [res["dur_prices"][dy]  for dy in YIELD_CHANGES]
    conv_est = [res["conv_prices"][dy] for dy in YIELD_CHANGES]
    actual_p = [res["actual_prices"][dy] for dy in YIELD_CHANGES]

    ax.plot([y * 100 for y in sim_ytms], dur_est,
            "o--", color=COLORS["dur"], linewidth=1.8, markersize=6,
            label="Duration Estimate", zorder=5)

    ax.plot([y * 100 for y in sim_ytms], conv_est,
            "s-.", color=COLORS["conv"], linewidth=1.8, markersize=6,
            label="Dur + Convexity Est.", zorder=5)

    ax.scatter([y * 100 for y in sim_ytms], actual_p,
               color=COLORS["actual"], s=50, zorder=6,
               edgecolors="white", linewidths=1.2)

    ax.axvline(BASE_YTM * 100, color="#94a3b8",
               linestyle="--", linewidth=1.2, zorder=2)

    ax.set_xlabel("Yield (%)", fontsize=9, color="#334155")
    ax.set_ylabel("Price (₹)", fontsize=9, color="#334155")
    ax.legend(fontsize=7.5, framealpha=0.9)
    ax.grid(True, color=COLORS["grid"], linewidth=0.7, zorder=1)
    ax.yaxis.set_major_formatter(mticker.StrMethodFormatter("₹{x:,.0f}"))
    ax.xaxis.set_major_formatter(mticker.StrMethodFormatter("{x:.0f}%"))
    ax.tick_params(labelsize=8)

    # Add metrics text box
    textstr = (
        f"D_mac = {res['d_mac']:.4f}y\n"
        f"D_mod = {res['d_mod']:.4f}\n"
        f"Conv  = {res['conv']:.4f}"
    )
    ax.text(0.03, 0.97, textstr, transform=ax.transAxes,
            fontsize=7.5, verticalalignment="top",
            fontfamily="monospace",
            bbox=dict(boxstyle="round,pad=0.4", facecolor="#f1f5f9",
                      edgecolor="#cbd5e1", alpha=0.95))

# ── SAVE & SHOW ───────────────────────────────
plt.savefig("bond_analysis_graphs.png",
            dpi=160, bbox_inches="tight", facecolor=COLORS["bg"])
print("\n\n✅  Graphs saved → bond_analysis_graphs.png")

plt.show()
print("\n✅  Done! All simulations complete.")
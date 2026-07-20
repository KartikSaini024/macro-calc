import React, { useState, useMemo } from "react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`;

const GOALS = [
  { id: "fatloss", label: "Fat loss", note: "~22% deficit", factor: 0.78 },
  { id: "recomp", label: "Body recomp", note: "~7% deficit", factor: 0.93 },
  { id: "maintenance", label: "Maintenance", note: "at TDEE", factor: 1.0 },
  { id: "musclegain", label: "Muscle gain", note: "~12% surplus", factor: 1.12 },
];

const ACTIVITY = [
  { id: "sedentary", label: "Sedentary", desc: "little/no exercise", mult: 1.2, waterBonus: 0 },
  { id: "light", label: "Light", desc: "1–3 days/week", mult: 1.375, waterBonus: 0.25 },
  { id: "moderate", label: "Moderate", desc: "3–5 days/week", mult: 1.55, waterBonus: 0.4 },
  { id: "active", label: "Active", desc: "6–7 days/week", mult: 1.725, waterBonus: 0.55 },
  { id: "veryactive", label: "Very active", desc: "2x/day or physical job", mult: 1.9, waterBonus: 0.7 },
];

function round(n, d = 0) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

export default function MacroCalculator() {
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState(28);
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(178);
  const [bodyFat, setBodyFat] = useState("");
  const [activityId, setActivityId] = useState("moderate");
  const [goalId, setGoalId] = useState("recomp");

  const activity = ACTIVITY.find((a) => a.id === activityId);
  const goal = GOALS.find((g) => g.id === goalId);

  const result = useMemo(() => {
    const kg = weightUnit === "kg" ? Number(weight) : Number(weight) * 0.453592;
    const cm = heightUnit === "cm" ? Number(height) : Number(height) * 2.54;
    const a = Number(age) || 0;

    if (!kg || !cm || !a) return null;

    const bmr =
      sex === "male" ? 10 * kg + 6.25 * cm - 5 * a + 5 : 10 * kg + 6.25 * cm - 5 * a - 161;
    const tdee = bmr * activity.mult;
    const calories = tdee * goal.factor;

    const bf = bodyFat === "" ? null : Number(bodyFat);
    const lbm = bf ? kg * (1 - bf / 100) : null;

    let proteinG;
    if (lbm) {
      const perKgLBM = goalId === "fatloss" || goalId === "recomp" ? 2.6 : 2.2;
      proteinG = lbm * perKgLBM;
    } else {
      const perKgBW = goalId === "fatloss" || goalId === "recomp" ? 2.2 : 1.8;
      proteinG = kg * perKgBW;
    }

    const fatFloor = kg * 0.5;
    const fatFromPct = (calories * 0.3) / 9;
    const fatG = Math.max(fatFromPct, fatFloor);

    const fiberG = (calories / 1000) * 14;

    const carbsG = Math.max((calories - proteinG * 4 - fatG * 9) / 4, 0);

    const waterL = kg * 0.035 + activity.waterBonus;

    const bmi = kg / Math.pow(cm / 100, 2);

    const proteinCals = proteinG * 4;
    const fatCals = fatG * 9;
    const carbCals = carbsG * 4;
    const totalCalsCheck = proteinCals + fatCals + carbCals;

    return {
      kg, cm, bmr, tdee, calories,
      proteinG, fatG, fiberG, carbsG, waterL, bmi,
      proteinPct: (proteinCals / totalCalsCheck) * 100,
      fatPct: (fatCals / totalCalsCheck) * 100,
      carbPct: (carbCals / totalCalsCheck) * 100,
      usedLBM: !!lbm,
    };
  }, [sex, age, weight, height, weightUnit, heightUnit, bodyFat, activity, goal, goalId]);

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        background: "#ECEEE8",
        minHeight: "100vh",
        color: "#1C2B3A",
        padding: "0",
      }}
    >
      <style>{`
        ${FONT_IMPORT}
        .grid-paper {
          background-image:
            linear-gradient(#C3CEDA 1px, transparent 1px),
            linear-gradient(90deg, #C3CEDA 1px, transparent 1px);
          background-size: 22px 22px;
          background-position: -1px -1px;
        }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        .seg-btn { transition: all .15s ease; }
        .field-input:focus, .seg-btn:focus-visible, .unit-btn:focus-visible {
          outline: 2px solid #B23A2F;
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
        .worksheet-card {
          display: grid;
          grid-template-columns: minmax(280px, 380px) 1fr;
          gap: 0;
          border: 2px solid #1C2B3A;
        }
        .worksheet-left {
          padding: 24px;
          border-right: 2px solid #1C2B3A;
          background: rgba(236,238,232,0.85);
        }
        .worksheet-right {
          padding: 24px;
          background: rgba(236,238,232,0.4);
        }
        .page-wrap { padding: 40px 20px 64px; }
        .page-title { font-size: 32px; }
        @media (max-width: 720px) {
          .worksheet-card { grid-template-columns: 1fr; }
          .worksheet-left { border-right: none; border-bottom: 2px solid #1C2B3A; }
          .page-wrap { padding: 24px 14px 48px; }
          .page-title { font-size: 25px; }
        }
        @media (max-width: 400px) {
          .worksheet-left, .worksheet-right { padding: 16px; }
        }
      `}</style>

      <div className="page-wrap" style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, borderBottom: "2px solid #1C2B3A", paddingBottom: 18 }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: 2, color: "#B23A2F", fontWeight: 600, marginBottom: 6 }}>
            NUTRITION WORKSHEET — REV. 02
          </div>
          <h1 className="page-title" style={{ fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
            Macro & Calorie Calculator
          </h1>
          <p style={{ fontSize: 15, color: "#55606B", marginTop: 8, maxWidth: 560, lineHeight: 1.5 }}>
            Built on Mifflin-St Jeor + activity multipliers, with protein, fat, fiber and
            water targets adjusted to your goal — not a flat multiplier applied to everyone.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
          <div className="worksheet-card grid-paper">
            {/* LEFT: inputs */}
            <div className="worksheet-left">
              <SectionLabel>01 — About you</SectionLabel>

              <Field label="Sex">
                <SegGroup
                  options={[{ id: "male", label: "Male" }, { id: "female", label: "Female" }]}
                  value={sex}
                  onChange={setSex}
                />
              </Field>

              <Field label="Age">
                <NumberInput value={age} onChange={setAge} suffix="yrs" min={14} max={90} />
              </Field>

              <Field label="Weight" unitToggle={
                <UnitToggle options={["kg", "lb"]} value={weightUnit} onChange={setWeightUnit} />
              }>
                <NumberInput value={weight} onChange={setWeight} suffix={weightUnit} min={30} max={250} />
              </Field>

              <Field label="Height" unitToggle={
                <UnitToggle options={["cm", "in"]} value={heightUnit} onChange={setHeightUnit} />
              }>
                <NumberInput value={height} onChange={setHeight} suffix={heightUnit} min={120} max={230} />
              </Field>

              <Field label="Body fat % (optional)" hint="Sharpens protein target using lean mass instead of total weight.">
                <NumberInput value={bodyFat} onChange={setBodyFat} suffix="%" min={4} max={60} placeholder="—" />
              </Field>

              <SectionLabel style={{ marginTop: 28 }}>02 — Activity</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ACTIVITY.map((a) => (
                  <RadioRow
                    key={a.id}
                    active={activityId === a.id}
                    title={a.label}
                    desc={a.desc}
                    onClick={() => setActivityId(a.id)}
                  />
                ))}
              </div>

              <SectionLabel style={{ marginTop: 28 }}>03 — Goal</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {GOALS.map((g) => (
                  <RadioRow
                    key={g.id}
                    active={goalId === g.id}
                    title={g.label}
                    desc={g.note}
                    onClick={() => setGoalId(g.id)}
                  />
                ))}
              </div>

              <div style={{ marginTop: 24, fontSize: 12, color: "#7A8390", lineHeight: 1.5 }}>
                Body recomp = small deficit + high protein + resistance training. It's the
                slow route to losing fat and building muscle at once — works best if you're
                new to lifting or returning after a break.
              </div>
            </div>

            {/* RIGHT: readout */}
            <div className="worksheet-right">
              {result ? (
                <Readout
                  r={result}
                  goal={goal}
                  activity={activity}
                  inputs={{ sex, age, weight, weightUnit, height, heightUnit, bodyFat }}
                />
              ) : (
                <div style={{ color: "#7A8390", fontSize: 14, padding: 40 }}>
                  Fill in age, weight, and height to generate your numbers.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function buildSummaryText({ inputs, r, goal, activity }) {
  const lines = [
    "MACRO & CALORIE WORKSHEET",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "ABOUT YOU",
    `Sex: ${inputs.sex === "male" ? "Male" : "Female"}`,
    `Age: ${inputs.age} yrs`,
    `Weight: ${inputs.weight} ${inputs.weightUnit}`,
    `Height: ${inputs.height} ${inputs.heightUnit}`,
    `Body fat: ${inputs.bodyFat === "" ? "Not provided" : `${inputs.bodyFat}%`}`,
    "",
    `Activity: ${activity.label} (${activity.desc})`,
    `Goal: ${goal.label} (${goal.note})`,
    "",
    "DAILY TARGETS",
    `Calories: ${round(r.calories)} kcal`,
    `Protein: ${round(r.proteinG)} g (${round(r.proteinPct)}%)`,
    `Fat: ${round(r.fatG)} g (${round(r.fatPct)}%)`,
    `Carbs: ${round(r.carbsG)} g (${round(r.carbPct)}%)`,
    `Fiber: ${round(r.fiberG)} g`,
    `Water: ${round(r.waterL, 1)} L`,
    "",
    "REFERENCE",
    `BMR: ${round(r.bmr)} kcal`,
    `TDEE (maintenance): ${round(r.tdee)} kcal`,
    `BMI: ${round(r.bmi, 1)}`,
    `Protein basis: ${r.usedLBM ? "Lean mass" : "Total weight"}`,
    "",
    "Estimates from population formulas — a starting point, not a prescription.",
  ];
  return lines.join("\n");
}

function buildSummaryJSON({ inputs, r, goal, activity }) {
  return {
    generatedAt: new Date().toISOString(),
    inputs: {
      sex: inputs.sex,
      age: Number(inputs.age),
      weight: Number(inputs.weight),
      weightUnit: inputs.weightUnit,
      height: Number(inputs.height),
      heightUnit: inputs.heightUnit,
      bodyFatPercent: inputs.bodyFat === "" ? null : Number(inputs.bodyFat),
    },
    activity: { id: activity.id, label: activity.label, description: activity.desc },
    goal: { id: goal.id, label: goal.label, note: goal.note },
    dailyTargets: {
      calories_kcal: round(r.calories),
      protein_g: round(r.proteinG),
      protein_pct: round(r.proteinPct, 1),
      fat_g: round(r.fatG),
      fat_pct: round(r.fatPct, 1),
      carbs_g: round(r.carbsG),
      carbs_pct: round(r.carbPct, 1),
      fiber_g: round(r.fiberG),
      water_L: round(r.waterL, 1),
    },
    reference: {
      bmr_kcal: round(r.bmr),
      tdee_kcal: round(r.tdee),
      bmi: round(r.bmi, 1),
      proteinBasis: r.usedLBM ? "lean_mass" : "total_weight",
    },
  };
}

function CopyDownloadBar({ inputs, r, goal, activity }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = buildSummaryText({ inputs, r, goal, activity });
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const json = buildSummaryJSON({ inputs, r, goal, activity });
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "macro-worksheet.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const btnStyle = {
    flex: 1,
    padding: "10px 0",
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: 0.5,
    cursor: "pointer",
    border: "1.5px solid #1C2B3A",
    background: "#F6F5F0",
    color: "#1C2B3A",
  };

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
      <button className="mono seg-btn" onClick={handleCopy} style={btnStyle}>
        {copied ? "✓ Copied" : "Copy summary"}
      </button>
      <button className="mono seg-btn" onClick={handleDownload} style={{ ...btnStyle, background: "#1C2B3A", color: "#ECEEE8" }}>
        Download JSON
      </button>
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 11,
        letterSpacing: 1.5,
        fontWeight: 600,
        color: "#1C2B3A",
        marginBottom: 14,
        paddingBottom: 6,
        borderBottom: "1px solid #B7C0CA",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children, hint, unitToggle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#39434D" }}>{label}</label>
        {unitToggle}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: "#8A929C", marginTop: 4, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function NumberInput({ value, onChange, suffix, min, max, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        className="field-input mono"
        type="number"
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 44px 10px 12px",
          fontSize: 16,
          fontWeight: 500,
          border: "1.5px solid #1C2B3A",
          background: "#F6F5F0",
          color: "#1C2B3A",
        }}
      />
      {suffix && (
        <span
          className="mono"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            color: "#8A929C",
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function SegGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", border: "1.5px solid #1C2B3A" }}>
      {options.map((o, i) => (
        <button
          key={o.id}
          className="seg-btn"
          onClick={() => onChange(o.id)}
          style={{
            flex: 1,
            padding: "9px 0",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            borderLeft: i > 0 ? "1.5px solid #1C2B3A" : "none",
            background: value === o.id ? "#1C2B3A" : "#F6F5F0",
            color: value === o.id ? "#ECEEE8" : "#1C2B3A",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function UnitToggle({ options, value, onChange }) {
  return (
    <div className="mono" style={{ display: "flex", fontSize: 11, gap: 2 }}>
      {options.map((u) => (
        <button
          key={u}
          className="unit-btn"
          onClick={() => onChange(u)}
          style={{
            padding: "2px 8px",
            border: "1px solid #1C2B3A",
            cursor: "pointer",
            background: value === u ? "#1C2B3A" : "transparent",
            color: value === u ? "#ECEEE8" : "#1C2B3A",
            fontWeight: 600,
          }}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function RadioRow({ active, title, desc, onClick }) {
  return (
    <button
      className="seg-btn"
      onClick={onClick}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        padding: "9px 12px",
        cursor: "pointer",
        border: active ? "1.5px solid #B23A2F" : "1.5px solid #C7CFD8",
        background: active ? "#FBEDEA" : "#F6F5F0",
      }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1C2B3A" }}>{title}</span>
      <span className="mono" style={{ fontSize: 11, color: active ? "#B23A2F" : "#8A929C" }}>{desc}</span>
    </button>
  );
}

function Readout({ r, goal, activity, inputs }) {
  const rows = [
    { label: "CALORIES", value: round(r.calories), unit: "kcal", big: true },
    { label: "PROTEIN", value: round(r.proteinG), unit: "g", sub: `${round(r.proteinPct)}%` },
    { label: "FAT", value: round(r.fatG), unit: "g", sub: `${round(r.fatPct)}%` },
    { label: "CARBS", value: round(r.carbsG), unit: "g", sub: `${round(r.carbPct)}%` },
    { label: "FIBER", value: round(r.fiberG), unit: "g" },
    { label: "WATER", value: round(r.waterL, 1), unit: "L" },
  ];

  return (
    <div>
      <div
        style={{
          background: "#16202B",
          border: "2px solid #1C2B3A",
          padding: "0 0 4px",
          position: "relative",
        }}
      >
        {/* perforated top edge */}
        <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 8px 0" }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ECEEE8" }} />
          ))}
        </div>

        <div style={{ padding: "18px 22px 8px" }}>
          <div className="mono" style={{ fontSize: 11, color: "#6F8A9E", letterSpacing: 1.5, marginBottom: 2 }}>
            GOAL: {goal.label.toUpperCase()} · {goal.note.toUpperCase()}
          </div>

          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: row.big ? "10px 0 14px" : "8px 0",
                borderBottom: row.big ? "1px solid #2A3B4D" : "1px dashed #2A3B4D",
              }}
            >
              <span className="mono" style={{ fontSize: row.big ? 13 : 12, color: "#8FA4B5", letterSpacing: 1 }}>
                {row.label}
              </span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                {row.sub && <span className="mono" style={{ fontSize: 11, color: "#5F7488" }}>{row.sub}</span>}
                <span className="mono" style={{ fontSize: row.big ? 34 : 20, fontWeight: 600, color: "#F2A93B" }}>
                  {row.value}
                  <span style={{ fontSize: row.big ? 15 : 12, color: "#C9863F", marginLeft: 4 }}>{row.unit}</span>
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* macro bar */}
      <div style={{ marginTop: 18 }}>
        <div className="mono" style={{ fontSize: 11, color: "#8A929C", marginBottom: 6, letterSpacing: 1 }}>
          CALORIE SPLIT
        </div>
        <div style={{ display: "flex", height: 14, border: "1.5px solid #1C2B3A", overflow: "hidden" }}>
          <div style={{ width: `${r.proteinPct}%`, background: "#B23A2F" }} title="Protein" />
          <div style={{ width: `${r.fatPct}%`, background: "#E0A458" }} title="Fat" />
          <div style={{ width: `${r.carbPct}%`, background: "#4C7A5E" }} title="Carbs" />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#55606B" }}>
          <LegendDot color="#B23A2F" label="Protein" />
          <LegendDot color="#E0A458" label="Fat" />
          <LegendDot color="#4C7A5E" label="Carbs" />
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatBox label="BMR" value={`${round(r.bmr)} kcal`} />
        <StatBox label="TDEE (maintenance)" value={`${round(r.tdee)} kcal`} />
        <StatBox label="BMI" value={round(r.bmi, 1)} />
        <StatBox label="Protein basis" value={r.usedLBM ? "Lean mass" : "Total weight"} />
      </div>

      <CopyDownloadBar r={r} goal={goal} activity={activity} inputs={inputs} />

      <p style={{ fontSize: 11.5, color: "#8A929C", marginTop: 18, lineHeight: 1.5 }}>
        Estimates from population formulas — treat as a starting point, not a prescription.
        Adjust every 2–3 weeks based on real-world results. Not medical advice; check with a
        doctor or dietitian if you have a health condition.
      </p>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ border: "1px solid #C7CFD8", padding: "8px 10px", background: "#F6F5F0" }}>
      <div className="mono" style={{ fontSize: 10, color: "#8A929C", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1C2B3A", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 8, height: 8, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}



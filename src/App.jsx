import { useState, useEffect } from "react";

// ── Persistence helpers ──────────────────────────────────────────────────────
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── Constants ────────────────────────────────────────────────────────────────
const MUSCLE_GROUPS = ["Pecho","Espalda","Hombros","Bíceps","Tríceps","Piernas","Glúteos","Core","Cardio"];
const MUSCLE_COLORS = {
  Pecho:"#ef4444",Espalda:"#3b82f6",Hombros:"#f97316",
  Bíceps:"#8b5cf6",Tríceps:"#ec4899",Piernas:"#10b981",
  Glúteos:"#f59e0b",Core:"#06b6d4",Cardio:"#6366f1",
};

// ── Icon ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  dumbbell: "M6 4v16M18 4v16M3 8h6M15 8h6M3 16h6M15 16h6",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  check: "M20 6L9 17l-5-5",
  back: "M19 12H5M12 5l-7 7 7 7",
  flame: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z",
  close: "M18 6L6 18M6 6l12 12",
};

// ── Tiny UI components ───────────────────────────────────────────────────────
const Tag = ({ label, color }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
    letterSpacing: ".04em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif",
  }}>{label}</span>
);

const Btn = ({ onClick, children, variant = "primary", small, full, disabled }) => {
  const styles = {
    primary: { background: "#c8f74a", color: "#0d1117", border: "none" },
    ghost:   { background: "transparent", color: "#9ca3af", border: "1px solid #2a2d35" },
    danger:  { background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      borderRadius: 10, padding: small ? "6px 12px" : "10px 18px",
      fontSize: small ? 13 : 14, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1,
      display: "inline-flex", alignItems: "center", gap: 6,
      width: full ? "100%" : "auto", justifyContent: "center",
      transition: "opacity .15s",
    }}>{children}</button>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder, min, step }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</label>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} step={step}
      style={{
        background: "#161b22", border: "1px solid #2a2d35", borderRadius: 10,
        color: "#f0f6fc", padding: "10px 14px", fontSize: 14, width: "100%",
        outline: "none",
      }}
    />
  </div>
);

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: "#161b22", border: "1px solid #21262d", borderRadius: 16,
    padding: 16, cursor: onClick ? "pointer" : "default", ...style,
  }}>{children}</div>
);

const StatCard = ({ emoji, value, label }) => (
  <Card style={{ flex: 1, textAlign: "center", padding: "10px 8px" }}>
    <div style={{ fontSize: 18 }}>{emoji}</div>
    <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f6fc", fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</div>
    <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
  </Card>
);

// ── Sparkline chart ──────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (data.length < 2) return (
    <div style={{ textAlign: "center", color: "#6b7280", marginTop: 30 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
      <div>Necesitas al menos 2 sesiones para ver el progreso</div>
    </div>
  );
  const W = 340, H = 100, pad = 16;
  const maxV = Math.max(...data.map(d => d.max));
  const minV = Math.min(...data.map(d => d.max));
  const range = maxV - minV || 1;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((d.max - minV) / range) * (H - pad * 2),
    ...d,
  }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M${pts[0].x},${H - pad} ` + pts.map(p => `L${p.x},${p.y}`).join(" ") + ` L${pts[pts.length - 1].x},${H - pad} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad)" />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={color} />
          <text x={p.x} y={H} textAnchor="middle" fontSize="9" fill="#6b7280">{p.date}</text>
          {(i === 0 || i === data.length - 1 || p.max === maxV) && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill={color} fontWeight="700">{p.max}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fmtDate = (iso, opts) => new Date(iso).toLocaleDateString("es-ES", opts);

// ── HomeScreen ───────────────────────────────────────────────────────────────
function HomeScreen({ exercises, sessions, onSelect, onAdd }) {
  const [filter, setFilter] = useState("Todos");
  const groups = ["Todos", ...MUSCLE_GROUPS];
  const filtered = filter === "Todos" ? exercises : exercises.filter(e => e.group === filter);

  const getBest = id => {
    const ss = sessions.filter(s => s.exerciseId === id);
    if (!ss.length) return null;
    return ss.reduce((b, s) => Math.max(b, ...s.sets.map(x => x.weight)), 0);
  };
  const getStreak = id => {
    const weeks = {};
    sessions.filter(s => s.exerciseId === id).forEach(s => { weeks[Math.floor(new Date(s.date) / (7 * 86400000))] = 1; });
    return Object.keys(weeks).length;
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 16px" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-.5px" }}>GymTrack</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{exercises.length} ejercicios registrados</div>
        </div>
        <button onClick={onAdd} style={{
          width: 42, height: 42, borderRadius: 12, background: "#c8f74a",
          border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d1117",
        }}><Icon d={Icons.plus} size={22} /></button>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none", marginBottom: 4 }}>
        {groups.map(g => {
          const color = MUSCLE_COLORS[g] || "#c8f74a";
          const active = filter === g;
          return (
            <button key={g} onClick={() => setFilter(g)} style={{
              whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20,
              border: active ? "none" : "1px solid #2a2d35",
              background: active ? color : "transparent",
              color: active ? (g === "Todos" ? "#0d1117" : "#fff") : "#9ca3af",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>{g}</button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b7280", marginTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontWeight: 700, color: "#9ca3af", marginBottom: 6 }}>Sin ejercicios aún</div>
          <div style={{ fontSize: 13 }}>Toca el + para agregar tu primer ejercicio</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {filtered.map(ex => {
            const best = getBest(ex.id);
            const streak = getStreak(ex.id);
            const count = sessions.filter(s => s.exerciseId === ex.id).length;
            const color = MUSCLE_COLORS[ex.group] || "#c8f74a";
            return (
              <Card key={ex.id} onClick={() => onSelect(ex)} style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", color: "#f0f6fc", marginBottom: 6 }}>{ex.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Tag label={ex.group} color={color} />
                      {streak > 0 && <Tag label={`${streak} sem`} color="#c8f74a" />}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {best !== null
                      ? <><div style={{ fontSize: 22, fontWeight: 800, color: "#c8f74a", fontFamily: "'Barlow Condensed', sans-serif" }}>{best}<span style={{ fontSize: 12, color: "#6b7280" }}> kg</span></div><div style={{ fontSize: 11, color: "#6b7280" }}>{count} sesiones</div></>
                      : <div style={{ fontSize: 12, color: "#6b7280" }}>Sin datos</div>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── AddExerciseScreen ────────────────────────────────────────────────────────
function AddExerciseScreen({ onSave, onBack }) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState("Pecho");
  const [notes, setNotes] = useState("");

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 24px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 0 }}>
          <Icon d={Icons.back} size={22} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif" }}>Nuevo Ejercicio</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Nombre del ejercicio" value={name} onChange={setName} placeholder="ej. Press Banca" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Grupo muscular</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MUSCLE_GROUPS.map(g => {
              const color = MUSCLE_COLORS[g];
              const sel = group === g;
              return (
                <button key={g} onClick={() => setGroup(g)} style={{
                  padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: sel ? color + "33" : "transparent",
                  color: sel ? color : "#9ca3af",
                  border: sel ? `2px solid ${color}` : "1px solid #2a2d35",
                }}>{g}</button>
              );
            })}
          </div>
        </div>
        <Field label="Notas (opcional)" value={notes} onChange={setNotes} placeholder="Forma, agarre, rack..." />
        <Btn onClick={() => { if (name.trim()) onSave({ name: name.trim(), group, notes }); }} full disabled={!name.trim()}>
          <Icon d={Icons.check} size={18} /> Guardar Ejercicio
        </Btn>
      </div>
    </div>
  );
}

// ── ExerciseScreen ───────────────────────────────────────────────────────────
function ExerciseScreen({ exercise, sessions, onLogSession, onDelete, onBack }) {
  const [tab, setTab] = useState("log");
  const [sets, setSets] = useState([{ weight: "", reps: "" }]);
  const [note, setNote] = useState("");

  const ss = sessions.filter(s => s.exerciseId === exercise.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastSess = ss[0];
  const allW = ss.flatMap(s => s.sets.map(x => x.weight));
  const globalMax = allW.length ? Math.max(...allW) : 0;
  const color = MUSCLE_COLORS[exercise.group] || "#c8f74a";

  const saveSession = () => {
    const valid = sets.filter(s => s.weight !== "" && s.reps !== "");
    if (!valid.length) return;
    onLogSession({ exerciseId: exercise.id, date: new Date().toISOString(), sets: valid.map(s => ({ weight: parseFloat(s.weight), reps: parseInt(s.reps) })), note });
    setSets([{ weight: "", reps: "" }]);
    setNote("");
    setTab("history");
  };

  const progressData = [...ss].reverse().map(s => ({
    date: fmtDate(s.date, { day: "2-digit", month: "2-digit" }),
    max: Math.max(...s.sets.map(x => x.weight)),
  }));

  const TABS = [["log", "Registrar"], ["history", "Historial"], ["progress", "Progreso"]];

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 4px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 0 }}>
          <Icon d={Icons.back} size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif" }}>{exercise.name}</div>
          <Tag label={exercise.group} color={color} />
        </div>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}>
          <Icon d={Icons.trash} size={18} />
        </button>
      </div>

      {exercise.notes && (
        <div style={{ background: "#21262d", borderRadius: 10, padding: "8px 12px", margin: "10px 0", fontSize: 13, color: "#9ca3af" }}>
          📝 {exercise.notes}
        </div>
      )}

      {ss.length > 0 && (
        <div style={{ display: "flex", gap: 10, margin: "12px 0 16px" }}>
          <StatCard emoji="🏆" value={`${globalMax} kg`} label="Mejor marca" />
          <StatCard emoji="📅" value={ss.length} label="Sesiones" />
          <StatCard emoji="⏱" value={fmtDate(ss[0].date, { day: "2-digit", month: "2-digit" })} label="Última" />
        </div>
      )}

      <div style={{ display: "flex", background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: 4, marginBottom: 16, gap: 2 }}>
        {TABS.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: 8, borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: tab === t ? color : "transparent",
            color: tab === t ? (color === "#c8f74a" ? "#0d1117" : "#fff") : "#6b7280",
            transition: "all .2s",
          }}>{label}</button>
        ))}
      </div>

      {/* LOG TAB */}
      {tab === "log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lastSess && (
            <Card style={{ border: `1px solid ${color}33`, background: color + "0d" }}>
              <div style={{ fontSize: 12, color, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>
                Última sesión — {fmtDate(lastSess.date, { day: "2-digit", month: "2-digit" })}
              </div>
              {lastSess.sets.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: "#9ca3af", display: "flex", gap: 16 }}>
                  <span>Serie {i + 1}</span>
                  <span style={{ color: "#f0f6fc", fontWeight: 700 }}>{s.weight} kg × {s.reps} reps</span>
                </div>
              ))}
            </Card>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "'Barlow Condensed', sans-serif" }}>Series de hoy</div>
          {sets.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "22", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0, marginBottom: 2, fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</div>
              <div style={{ flex: 1 }}><Field label="Kg" type="number" min="0" step="0.5" value={s.weight} onChange={v => setSets(sets.map((x, j) => j === i ? { ...x, weight: v } : x))} placeholder="0" /></div>
              <div style={{ flex: 1 }}><Field label="Reps" type="number" min="0" step="1" value={s.reps} onChange={v => setSets(sets.map((x, j) => j === i ? { ...x, reps: v } : x))} placeholder="0" /></div>
              {sets.length > 1 && (
                <button onClick={() => setSets(sets.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ef444480", cursor: "pointer", padding: 4, marginBottom: 2 }}>
                  <Icon d={Icons.close} size={16} />
                </button>
              )}
            </div>
          ))}
          <Btn onClick={() => setSets([...sets, { weight: "", reps: "" }])} variant="ghost" full>+ Agregar serie</Btn>
          <Field label="Nota (opcional)" value={note} onChange={setNote} placeholder="Cómo te sentiste..." />
          <Btn onClick={saveSession} full disabled={!sets.some(s => s.weight !== "" && s.reps !== "")}>
            <Icon d={Icons.check} size={18} /> Guardar Sesión
          </Btn>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ss.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b7280", marginTop: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div>No hay sesiones aún</div>
            </div>
          ) : ss.map(s => {
            const maxW = Math.max(...s.sets.map(x => x.weight));
            const vol = s.sets.reduce((a, x) => a + x.weight * x.reps, 0);
            return (
              <Card key={s.id} style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Vol: {vol.toLocaleString()} kg</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {s.sets.map((st, i) => (
                    <span key={i} style={{
                      borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 600,
                      background: st.weight === maxW ? color + "22" : "#21262d",
                      border: `1px solid ${st.weight === maxW ? color + "55" : "#2a2d35"}`,
                      color: st.weight === maxW ? color : "#9ca3af",
                    }}>{st.weight}kg × {st.reps}</span>
                  ))}
                </div>
                {s.note && <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>"{s.note}"</div>}
              </Card>
            );
          })}
        </div>
      )}

      {/* PROGRESS TAB */}
      {tab === "progress" && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Barlow Condensed', sans-serif" }}>Peso máximo por sesión (kg)</div>
          <Sparkline data={progressData} color={color} />
          {progressData.length >= 2 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", margin: "20px 0 12px", fontFamily: "'Barlow Condensed', sans-serif" }}>Últimas sesiones</div>
              {[...progressData].slice(-5).reverse().map((d, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ color: "#9ca3af" }}>{d.date}</span>
                    <span style={{ fontWeight: 700 }}>{d.max} kg</span>
                  </div>
                  <div style={{ background: "#21262d", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${(d.max / globalMax) * 100}%`, height: "100%", background: color, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── TodayScreen ───────────────────────────────────────────────────────────────
function TodayScreen({ exercises, sessions, onLogSession }) {
  const [sel, setSel] = useState("");
  const [sets, setSets] = useState([{ weight: "", reps: "" }]);

  const ts = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const totalVol = ts.reduce((a, s) => a + s.sets.reduce((b, x) => b + x.weight * x.reps, 0), 0);
  const totalSets = ts.reduce((a, s) => a + s.sets.length, 0);
  const dateStr = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  const save = () => {
    const valid = sets.filter(s => s.weight !== "" && s.reps !== "");
    if (!sel || !valid.length) return;
    onLogSession({ exerciseId: sel, date: new Date().toISOString(), sets: valid.map(s => ({ weight: parseFloat(s.weight), reps: parseInt(s.reps) })) });
    setSets([{ weight: "", reps: "" }]);
    setSel("");
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ padding: "20px 0 16px" }}>
        <div style={{ fontSize: 13, color: "#6b7280", textTransform: "capitalize" }}>{dateStr}</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif" }}>Sesión de Hoy</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <StatCard emoji="💪" value={totalVol ? `${totalVol.toLocaleString()} kg` : "—"} label="Volumen" />
        <StatCard emoji="🔁" value={totalSets || "—"} label="Series" />
        <StatCard emoji="📋" value={ts.length || "—"} label="Ejercicios" />
      </div>

      <Card style={{ marginBottom: 16, border: "1px solid #c8f74a33" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#c8f74a", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Barlow Condensed', sans-serif" }}>Registro rápido</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Ejercicio</label>
          <select value={sel} onChange={e => setSel(e.target.value)} style={{
            width: "100%", background: "#161b22", border: "1px solid #2a2d35",
            borderRadius: 10, color: sel ? "#f0f6fc" : "#6b7280", padding: "10px 14px", fontSize: 14,
          }}>
            <option value="">Selecciona un ejercicio...</option>
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>

        {sets.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-end" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#c8f74a22", color: "#c8f74a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, marginBottom: 2, fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</div>
            <div style={{ flex: 1 }}><Field label="Kg" type="number" min="0" step="0.5" value={s.weight} onChange={v => setSets(sets.map((x, j) => j === i ? { ...x, weight: v } : x))} placeholder="0" /></div>
            <div style={{ flex: 1 }}><Field label="Reps" type="number" min="0" step="1" value={s.reps} onChange={v => setSets(sets.map((x, j) => j === i ? { ...x, reps: v } : x))} placeholder="0" /></div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn onClick={() => setSets([...sets, { weight: "", reps: "" }])} variant="ghost" small>+ Serie</Btn>
          <Btn onClick={save} small disabled={!sel || !sets.some(s => s.weight && s.reps)}>
            <Icon d={Icons.check} size={14} /> Guardar
          </Btn>
        </div>
      </Card>

      {ts.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Barlow Condensed', sans-serif" }}>Completado hoy</div>
          {ts.map(s => {
            const ex = exercises.find(e => e.id === s.exerciseId);
            const color = MUSCLE_COLORS[ex?.group] || "#c8f74a";
            return (
              <Card key={s.id} style={{ marginBottom: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{ex?.name || "Ejercicio"}</div>
                    <div style={{ display: "flex", gap: 6 }}>{s.sets.map((st, i) => <span key={i} style={{ fontSize: 12, color: "#9ca3af" }}>{st.weight}×{st.reps}</span>)}</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [exercises, setExercises] = useState(() => load("gym_exercises", []));
  const [sessions, setSessions]   = useState(() => load("gym_sessions", []));
  const [screen, setScreen]       = useState("main");
  const [navTab, setNavTab]       = useState("today");
  const [selected, setSelected]   = useState(null);

  useEffect(() => save("gym_exercises", exercises), [exercises]);
  useEffect(() => save("gym_sessions", sessions), [sessions]);

  const addExercise = data => {
    setExercises(prev => [...prev, { ...data, id: uid() }]);
    setScreen("main"); setNavTab("exercises");
  };
  const deleteExercise = id => {
    setExercises(prev => prev.filter(e => e.id !== id));
    setSessions(prev => prev.filter(s => s.exerciseId !== id));
    setScreen("main"); setNavTab("exercises");
  };
  const logSession = data => setSessions(prev => [...prev, { ...data, id: uid() }]);

  const NAV = [
    { id: "today", label: "Hoy", icon: Icons.flame },
    { id: "exercises", label: "Ejercicios", icon: Icons.dumbbell },
  ];

  return (
    <div style={{ background: "#0d1117", minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative" }}>
      {screen === "add" && <AddExerciseScreen onSave={addExercise} onBack={() => setScreen("main")} />}
      {screen === "detail" && selected && (
        <ExerciseScreen
          exercise={selected} sessions={sessions}
          onLogSession={logSession}
          onDelete={() => deleteExercise(selected.id)}
          onBack={() => { setScreen("main"); setNavTab("exercises"); }}
        />
      )}
      {screen === "main" && (
        <>
          {navTab === "today" && <TodayScreen exercises={exercises} sessions={sessions} onLogSession={logSession} />}
          {navTab === "exercises" && (
            <HomeScreen exercises={exercises} sessions={sessions}
              onSelect={ex => { setSelected(ex); setScreen("detail"); }}
              onAdd={() => setScreen("add")}
            />
          )}
          <nav style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 430, background: "#0d1117",
            borderTop: "1px solid #21262d", display: "flex", padding: "8px 0 20px",
          }}>
            {NAV.map(t => (
              <button key={t.id} onClick={() => setNavTab(t.id)} style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                color: navTab === t.id ? "#c8f74a" : "#6b7280",
                fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                transition: "color .2s",
              }}>
                <Icon d={t.icon} size={22} />
                {t.label}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";

const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fmtDate = (iso, opts) => new Date(iso).toLocaleDateString("es-ES", opts);

const MUSCLE_GROUPS = ["Pecho","Espalda","Hombros","Bíceps","Tríceps","Piernas","Glúteos","Core","Cardio"];
const MUSCLE_COLORS = {
  Pecho:"#c0392b", Espalda:"#2471a3", Hombros:"#d35400",
  Bíceps:"#7d3c98", Tríceps:"#c0185a", Piernas:"#1a7a4a",
  Glúteos:"#b7770d", Core:"#0e7490", Cardio:"#3730a3",
};
const REST_PRESETS = [60, 90, 120, 180];

const T = {
  bg:"#f7f5f2", bg2:"#f0ede8", surface:"#ffffff", surface2:"#faf9f7",
  border:"#e8e3dc", border2:"#d9d2c8",
  text:"#1a1714", text2:"#4a4540", muted:"#8a837a", dim:"#b5afa8",
  shadow:"0 1px 3px rgba(26,23,20,0.06), 0 4px 16px rgba(26,23,20,0.04)",
  shadowMd:"0 2px 8px rgba(26,23,20,0.08), 0 8px 32px rgba(26,23,20,0.06)",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  dumbbell:"M6 4v16M18 4v16M3 8h6M15 8h6M3 16h6M15 16h6",
  plus:"M12 5v14M5 12h14",
  trash:"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  check:"M20 6L9 17l-5-5",
  back:"M19 12H5M12 5l-7 7 7 7",
  flame:"M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z",
  close:"M18 6L6 18M6 6l12 12",
  play:"M5 3l14 9-14 9V3z",
  pause:"M6 4h4v16H6zM14 4h4v16h-4z",
  reset:"M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15",
};

// ── UI Components ─────────────────────────────────────────────────────────────
const Tag = ({ label, color }) => (
  <span style={{
    background:color+"18", color, border:`1px solid ${color}30`,
    borderRadius:4, padding:"2px 7px", fontSize:10, fontWeight:600,
    letterSpacing:".07em", textTransform:"uppercase",
  }}>{label}</span>
);

const Btn = ({ onClick, children, variant="primary", small, full, disabled }) => {
  const styles = {
    primary:{ background:T.text, color:"#fff", border:"none" },
    ghost:{ background:"transparent", color:T.muted, border:`1px solid ${T.border2}` },
    danger:{ background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], borderRadius:8,
      padding:small?"6px 14px":"11px 20px",
      fontSize:small?12:13, fontWeight:600, letterSpacing:".02em",
      cursor:disabled?"not-allowed":"pointer", opacity:disabled?.35:1,
      display:"inline-flex", alignItems:"center", gap:6,
      width:full?"100%":"auto", justifyContent:"center", transition:"opacity .15s",
    }}>{children}</button>
  );
};

const Field = ({ label, value, onChange, type="text", placeholder, min, step }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <label style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase" }}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} min={min} step={step}
      style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"10px 13px", fontSize:14, width:"100%" }}
    />
  </div>
);

const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{
    background:T.surface, border:`1px solid ${T.border}`, borderRadius:14,
    padding:16, boxShadow:T.shadow, cursor:onClick?"pointer":"default", ...style,
  }}>{children}</div>
);

const StatCard = ({ emoji, value, label }) => (
  <Card style={{ flex:1, textAlign:"center", padding:"12px 8px" }}>
    <div style={{ fontSize:16, marginBottom:4 }}>{emoji}</div>
    <div style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"'Cormorant Garamond', serif", letterSpacing:"-.02em" }}>{value}</div>
    <div style={{ fontSize:9, color:T.dim, textTransform:"uppercase", fontWeight:600, letterSpacing:".08em", marginTop:2 }}>{label}</div>
  </Card>
);

// ── Rest Timer ────────────────────────────────────────────────────────────────
function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => setRemaining(r => r - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      if (remaining === 0 && running) {
        setRunning(false);
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [running, remaining]);

  const start = (dur) => {
    setDuration(dur);
    setRemaining(dur);
    setRunning(true);
  };
  const toggle = () => setRunning(r => !r);
  const reset = () => { clearInterval(intervalRef.current); setRunning(false); setRemaining(null); };

  const idle = remaining === null;
  const finished = remaining === 0;
  const pct = idle ? 100 : (remaining / duration) * 100;
  const mins = idle ? Math.floor(duration / 60) : Math.floor(remaining / 60);
  const secs = idle ? duration % 60 : remaining % 60;

  // SVG circle
  const R = 40, C = 2 * Math.PI * R;
  const strokeColor = finished ? "#10b981" : running ? T.text : T.muted;

  return (
    <Card style={{ marginBottom:20 }}>
      <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", marginBottom:14 }}>
        Descanso entre series
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        {/* Circle */}
        <div style={{ position:"relative", width:96, height:96, flexShrink:0 }}>
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={R} fill="none" stroke={T.bg2} strokeWidth="5"/>
            <circle cx="48" cy="48" r={R} fill="none"
              stroke={strokeColor}
              strokeWidth="5"
              strokeDasharray={`${(pct/100)*C} ${C}`}
              strokeDashoffset={C*0.25}
              strokeLinecap="round"
              style={{ transition:"stroke-dasharray 1s linear, stroke .3s" }}
            />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            {finished ? (
              <div style={{ fontSize:26, color:"#10b981" }}>✓</div>
            ) : (
              <>
                <div style={{ fontSize:20, fontWeight:300, fontFamily:"'Cormorant Garamond', serif", color:T.text, lineHeight:1 }}>
                  {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
                </div>
                <div style={{ fontSize:8, color:T.dim, letterSpacing:".06em", textTransform:"uppercase", marginTop:2 }}>
                  {idle?"listo":running?"activo":"pausado"}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side */}
        <div style={{ flex:1 }}>
          {/* Presets */}
          <div style={{ display:"flex", gap:5, marginBottom:12, flexWrap:"wrap" }}>
            {REST_PRESETS.map(s => (
              <button key={s} onClick={() => start(s)} style={{
                padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
                background: !idle && duration===s ? T.text : T.bg2,
                color: !idle && duration===s ? "#fff" : T.muted,
                border:`1px solid ${T.border}`, transition:"all .15s",
              }}>{s<60?`${s}s`:`${s/60}m`}</button>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display:"flex", gap:6 }}>
            {idle ? (
              <button onClick={() => start(duration)} style={{
                flex:1, padding:"8px", borderRadius:8, border:"none",
                background:T.text, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5,
              }}>
                <Icon d={Icons.play} size={13}/> Iniciar
              </button>
            ) : (
              <>
                <button onClick={toggle} style={{
                  flex:1, padding:"8px", borderRadius:8, border:`1px solid ${T.border}`,
                  background:T.surface2, color:T.text, fontSize:12, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                }}>
                  <Icon d={running?Icons.pause:Icons.play} size={13}/>
                  {running?"Pausar":"Reanudar"}
                </button>
                <button onClick={reset} style={{
                  padding:"8px 11px", borderRadius:8, border:`1px solid ${T.border}`,
                  background:"transparent", color:T.dim, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <Icon d={Icons.reset} size={13}/>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {finished && (
        <div style={{ marginTop:12, textAlign:"center", fontSize:12, color:"#10b981", fontWeight:600, letterSpacing:".02em" }}>
          ¡Tiempo! Listo para la siguiente serie 💪
        </div>
      )}
    </Card>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (data.length < 2) return (
    <div style={{ textAlign:"center", color:T.dim, padding:"40px 0" }}>
      <div style={{ fontSize:28, marginBottom:10 }}>〰️</div>
      <div style={{ fontSize:13 }}>Necesitas al menos 2 sesiones para ver el progreso</div>
    </div>
  );
  const W=340,H=110,padX=20,padY=20;
  const maxV=Math.max(...data.map(d=>d.max)), minV=Math.min(...data.map(d=>d.max)), range=maxV-minV||1;
  const pts=data.map((d,i)=>({ x:padX+(i/(data.length-1))*(W-padX*2), y:H-padY-((d.max-minV)/range)*(H-padY*2), ...d }));
  const poly=pts.map(p=>`${p.x},${p.y}`).join(" ");
  const area=`M${pts[0].x},${H-padY} `+pts.map(p=>`L${p.x},${p.y}`).join(" ")+` L${pts[pts.length-1].x},${H-padY} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".15"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad)"/>
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill={T.surface} stroke={color} strokeWidth="1.5"/>
          <text x={p.x} y={H+2} textAnchor="middle" fontSize="8.5" fill={T.dim} fontFamily="DM Sans">{p.date}</text>
          {(i===0||i===data.length-1||p.max===maxV)&&(
            <text x={p.x} y={p.y-9} textAnchor="middle" fontSize="9.5" fill={color} fontWeight="600" fontFamily="DM Sans">{p.max}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── HomeScreen ────────────────────────────────────────────────────────────────
function HomeScreen({ exercises, sessions, onSelect, onAdd }) {
  const [filter, setFilter] = useState("Todos");
  const groups = ["Todos",...MUSCLE_GROUPS];
  const filtered = filter==="Todos" ? exercises : exercises.filter(e=>e.group===filter);

  const getBest = id => { const ss=sessions.filter(s=>s.exerciseId===id); if(!ss.length)return null; return ss.reduce((b,s)=>Math.max(b,...s.sets.map(x=>x.weight)),0); };
  const getStreak = id => { const w={}; sessions.filter(s=>s.exerciseId===id).forEach(s=>{w[Math.floor(new Date(s.date)/(7*86400000))]=1;}); return Object.keys(w).length; };

  return (
    <div style={{ padding:"0 20px 100px", background:T.bg, minHeight:"100vh" }}>
      <div style={{ padding:"28px 0 8px", borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <div style={{ fontSize:11, color:T.dim, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", marginBottom:4 }}>Tu colección</div>
            <div style={{ fontSize:30, fontWeight:300, fontFamily:"'Cormorant Garamond', serif", letterSpacing:"-.03em", color:T.text, lineHeight:1 }}>Ejercicios</div>
          </div>
          <button onClick={onAdd} style={{ width:38, height:38, borderRadius:10, background:T.text, border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", boxShadow:T.shadowMd }}>
            <Icon d={Icons.plus} size={18}/>
          </button>
        </div>
        <div style={{ fontSize:12, color:T.dim, marginTop:6 }}>{exercises.length} ejercicios · {sessions.length} sesiones totales</div>
      </div>

      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:16, scrollbarWidth:"none" }}>
        {groups.map(g=>{
          const color=MUSCLE_COLORS[g]||T.text, active=filter===g;
          return <button key={g} onClick={()=>setFilter(g)} style={{ whiteSpace:"nowrap", padding:"5px 13px", borderRadius:20, border:active?`1.5px solid ${color}`:`1px solid ${T.border}`, background:active?color+"12":T.surface, color:active?color:T.muted, fontSize:12, fontWeight:600, cursor:"pointer", boxShadow:active?"none":T.shadow, transition:"all .2s" }}>{g}</button>;
        })}
      </div>

      {filtered.length===0 ? (
        <div style={{ textAlign:"center", color:T.dim, marginTop:80, padding:"0 20px" }}>
          <div style={{ fontSize:36, marginBottom:16 }}>🏋️</div>
          <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:400, color:T.text2, marginBottom:8 }}>Sin ejercicios aún</div>
          <div style={{ fontSize:13, lineHeight:1.6 }}>Toca el botón + para registrar tu primer ejercicio</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(ex=>{
            const best=getBest(ex.id), streak=getStreak(ex.id), count=sessions.filter(s=>s.exerciseId===ex.id).length, color=MUSCLE_COLORS[ex.group]||T.text;
            return (
              <Card key={ex.id} onClick={()=>onSelect(ex)} style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:6, letterSpacing:"-.01em" }}>{ex.name}</div>
                    <div style={{ display:"flex", gap:5 }}>
                      <Tag label={ex.group} color={color}/>
                      {streak>0&&<Tag label={`${streak} sem`} color={T.muted}/>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", paddingLeft:12 }}>
                    {best!==null ? (
                      <>
                        <div style={{ fontSize:22, fontWeight:300, color:T.text, fontFamily:"'Cormorant Garamond', serif", letterSpacing:"-.02em", lineHeight:1 }}>{best}<span style={{ fontSize:12, color:T.dim }}> kg</span></div>
                        <div style={{ fontSize:10, color:T.dim, marginTop:3, letterSpacing:".04em" }}>{count} sesiones</div>
                      </>
                    ) : <div style={{ fontSize:11, color:T.dim }}>Sin datos</div>}
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

// ── AddExerciseScreen ─────────────────────────────────────────────────────────
function AddExerciseScreen({ onSave, onBack }) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState("Pecho");
  const [notes, setNotes] = useState("");
  return (
    <div style={{ padding:"0 20px 100px", background:T.bg, minHeight:"100vh" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"28px 0 24px", borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", padding:0, display:"flex" }}><Icon d={Icons.back} size={20}/></button>
        <div>
          <div style={{ fontSize:11, color:T.dim, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase" }}>Nuevo</div>
          <div style={{ fontSize:26, fontWeight:300, fontFamily:"'Cormorant Garamond', serif", letterSpacing:"-.03em", lineHeight:1.1 }}>Ejercicio</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <Field label="Nombre del ejercicio" value={name} onChange={setName} placeholder="ej. Press Banca"/>
        <div>
          <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", marginBottom:10 }}>Grupo muscular</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {MUSCLE_GROUPS.map(g=>{ const color=MUSCLE_COLORS[g], sel=group===g; return <button key={g} onClick={()=>setGroup(g)} style={{ padding:"7px 13px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:sel?color+"15":T.surface, color:sel?color:T.muted, border:sel?`1.5px solid ${color}40`:`1px solid ${T.border}`, boxShadow:sel?"none":T.shadow, transition:"all .15s" }}>{g}</button>; })}
          </div>
        </div>
        <Field label="Notas (opcional)" value={notes} onChange={setNotes} placeholder="Forma, agarre, observaciones..."/>
        <Btn onClick={()=>{ if(name.trim()) onSave({name:name.trim(),group,notes}); }} full disabled={!name.trim()}>
          <Icon d={Icons.check} size={16}/> Guardar ejercicio
        </Btn>
      </div>
    </div>
  );
}

// ── ExerciseScreen ────────────────────────────────────────────────────────────
function ExerciseScreen({ exercise, sessions, onLogSession, onDelete, onBack }) {
  const [tab, setTab] = useState("log");
  const [sets, setSets] = useState([{weight:"",reps:""}]);
  const [note, setNote] = useState("");

  const ss = sessions.filter(s=>s.exerciseId===exercise.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const lastSess = ss[0];
  const allW = ss.flatMap(s=>s.sets.map(x=>x.weight));
  const globalMax = allW.length ? Math.max(...allW) : 0;
  const color = MUSCLE_COLORS[exercise.group]||T.text;

  const saveSession = () => {
    const valid=sets.filter(s=>s.weight!==""&&s.reps!=="");
    if(!valid.length) return;
    onLogSession({ exerciseId:exercise.id, date:new Date().toISOString(), sets:valid.map(s=>({weight:parseFloat(s.weight),reps:parseInt(s.reps)})), note });
    setSets([{weight:"",reps:""}]); setNote(""); setTab("history");
  };

  const progressData=[...ss].reverse().map(s=>({ date:fmtDate(s.date,{day:"2-digit",month:"2-digit"}), max:Math.max(...s.sets.map(x=>x.weight)) }));
  const TABS=[["log","Registrar"],["history","Historial"],["progress","Progreso"]];

  return (
    <div style={{ padding:"0 20px 100px", background:T.bg, minHeight:"100vh" }}>
      <div style={{ padding:"28px 0 16px", borderBottom:`1px solid ${T.border}`, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", padding:"2px 0", display:"flex" }}><Icon d={Icons.back} size={20}/></button>
          <button onClick={onDelete} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", padding:2, display:"flex" }}><Icon d={Icons.trash} size={16}/></button>
        </div>
        <div style={{ fontSize:28, fontWeight:300, fontFamily:"'Cormorant Garamond', serif", letterSpacing:"-.03em", color:T.text, lineHeight:1.1, marginBottom:8 }}>{exercise.name}</div>
        <Tag label={exercise.group} color={color}/>
        {exercise.notes&&<div style={{ marginTop:10, fontSize:12, color:T.muted, fontStyle:"italic", lineHeight:1.5 }}>{exercise.notes}</div>}
      </div>

      {ss.length>0&&(
        <div style={{ display:"flex", gap:8, marginBottom:18 }}>
          <StatCard emoji="🏆" value={`${globalMax} kg`} label="Mejor marca"/>
          <StatCard emoji="📅" value={ss.length} label="Sesiones"/>
          <StatCard emoji="⏱" value={fmtDate(ss[0].date,{day:"2-digit",month:"2-digit"})} label="Última"/>
        </div>
      )}

      <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, marginBottom:20, gap:0 }}>
        {TABS.map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"10px 0", border:"none", background:"transparent", fontSize:12, fontWeight:600, letterSpacing:".04em", cursor:"pointer", color:tab===t?T.text:T.dim, borderBottom:tab===t?`2px solid ${T.text}`:"2px solid transparent", marginBottom:"-1px", transition:"all .2s" }}>{label}</button>
        ))}
      </div>

      {/* LOG TAB */}
      {tab==="log"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {lastSess&&(
            <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:10, color:T.dim, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", marginBottom:8 }}>Última sesión · {fmtDate(lastSess.date,{day:"numeric",month:"short"})}</div>
              {lastSess.sets.map((s,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:T.muted, padding:"2px 0" }}>
                  <span>Serie {i+1}</span>
                  <span style={{ color:T.text, fontWeight:600 }}>{s.weight} kg · {s.reps} reps</span>
                </div>
              ))}
            </div>
          )}

          {/* REST TIMER */}
          <RestTimer/>

          <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase" }}>Series de hoy</div>
          {sets.map((s,i)=>(
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
              <div style={{ width:26, height:26, borderRadius:7, background:T.bg2, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.muted, flexShrink:0, marginBottom:2 }}>{i+1}</div>
              <div style={{ flex:1 }}><Field label="Kg" type="number" min="0" step="0.5" value={s.weight} onChange={v=>setSets(sets.map((x,j)=>j===i?{...x,weight:v}:x))} placeholder="0"/></div>
              <div style={{ flex:1 }}><Field label="Reps" type="number" min="0" step="1" value={s.reps} onChange={v=>setSets(sets.map((x,j)=>j===i?{...x,reps:v}:x))} placeholder="0"/></div>
              {sets.length>1&&<button onClick={()=>setSets(sets.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", padding:4, marginBottom:2 }}><Icon d={Icons.close} size={14}/></button>}
            </div>
          ))}
          <Btn onClick={()=>setSets([...sets,{weight:"",reps:""}])} variant="ghost" full small>+ Agregar serie</Btn>
          <Field label="Nota (opcional)" value={note} onChange={setNote} placeholder="Cómo te sentiste hoy..."/>
          <Btn onClick={saveSession} full disabled={!sets.some(s=>s.weight!==""&&s.reps!=="")}>
            <Icon d={Icons.check} size={16}/> Guardar sesión
          </Btn>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab==="history"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {ss.length===0 ? (
            <div style={{ textAlign:"center", color:T.dim, padding:"50px 0" }}>
              <div style={{ fontSize:28, marginBottom:12 }}>📋</div>
              <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, color:T.text2 }}>Sin sesiones aún</div>
            </div>
          ) : ss.map(s=>{
            const maxW=Math.max(...s.sets.map(x=>x.weight)), vol=s.sets.reduce((a,x)=>a+x.weight*x.reps,0);
            return (
              <Card key={s.id} style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{fmtDate(s.date,{weekday:"short",day:"numeric",month:"short"})}</div>
                  <div style={{ fontSize:11, color:T.dim }}>{vol.toLocaleString()} kg·rep</div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {s.sets.map((st,i)=>(
                    <span key={i} style={{ borderRadius:6, padding:"3px 9px", fontSize:12, fontWeight:500, background:st.weight===maxW?color+"12":T.bg2, border:`1px solid ${st.weight===maxW?color+"30":T.border}`, color:st.weight===maxW?color:T.muted }}>{st.weight} × {st.reps}</span>
                  ))}
                </div>
                {s.note&&<div style={{ marginTop:8, fontSize:11, color:T.dim, fontStyle:"italic" }}>"{s.note}"</div>}
              </Card>
            );
          })}
        </div>
      )}

      {/* PROGRESS TAB */}
      {tab==="progress"&&(
        <div>
          <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", marginBottom:16 }}>Peso máximo por sesión</div>
          <Sparkline data={progressData} color={color}/>
          {progressData.length>=2&&(
            <>
              <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", margin:"24px 0 14px" }}>Desglose</div>
              {[...progressData].slice(-5).reverse().map((d,i)=>(
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:12 }}>
                    <span style={{ color:T.muted }}>{d.date}</span>
                    <span style={{ fontWeight:600, color:T.text }}>{d.max} kg</span>
                  </div>
                  <div style={{ background:T.bg2, borderRadius:4, height:4, overflow:"hidden" }}>
                    <div style={{ width:`${(d.max/globalMax)*100}%`, height:"100%", background:color, borderRadius:4, transition:"width .5s ease" }}/>
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
  const [sets, setSets] = useState([{weight:"",reps:""}]);

  const ts=sessions.filter(s=>new Date(s.date).toDateString()===new Date().toDateString());
  const totalVol=ts.reduce((a,s)=>a+s.sets.reduce((b,x)=>b+x.weight*x.reps,0),0);
  const totalSets=ts.reduce((a,s)=>a+s.sets.length,0);
  const now=new Date();
  const dateStr=now.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
  const dayNum=now.toLocaleDateString("es-ES",{day:"numeric"});
  const monthStr=now.toLocaleDateString("es-ES",{month:"long"});

  const saveQuick=()=>{
    const valid=sets.filter(s=>s.weight!==""&&s.reps!=="");
    if(!sel||!valid.length) return;
    onLogSession({ exerciseId:sel, date:new Date().toISOString(), sets:valid.map(s=>({weight:parseFloat(s.weight),reps:parseInt(s.reps)})) });
    setSets([{weight:"",reps:""}]); setSel("");
  };

  return (
    <div style={{ padding:"0 20px 100px", background:T.bg, minHeight:"100vh" }}>
      <div style={{ padding:"28px 0 20px", borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <div style={{ fontSize:11, color:T.dim, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", marginBottom:4 }}>{dateStr}</div>
            <div style={{ fontSize:30, fontWeight:300, fontFamily:"'Cormorant Garamond', serif", letterSpacing:"-.03em", color:T.text, lineHeight:1 }}>Sesión de hoy</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:36, fontWeight:300, fontFamily:"'Cormorant Garamond', serif", color:T.border2, lineHeight:1 }}>{dayNum}</div>
            <div style={{ fontSize:10, color:T.dim, textTransform:"capitalize", letterSpacing:".04em" }}>{monthStr}</div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:22 }}>
        <StatCard emoji="💪" value={totalVol?`${totalVol.toLocaleString()} kg`:"—"} label="Volumen"/>
        <StatCard emoji="🔁" value={totalSets||"—"} label="Series"/>
        <StatCard emoji="📋" value={ts.length||"—"} label="Ejercicios"/>
      </div>

      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", marginBottom:14 }}>Registro rápido</div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:10, color:T.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Ejercicio</label>
          <select value={sel} onChange={e=>setSel(e.target.value)} style={{ width:"100%", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8, color:sel?T.text:T.dim, padding:"10px 13px", fontSize:14 }}>
            <option value="">Selecciona un ejercicio...</option>
            {exercises.map(ex=><option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
        {sets.map((s,i)=>(
          <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-end" }}>
            <div style={{ width:26, height:26, borderRadius:7, background:T.bg2, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.muted, flexShrink:0, marginBottom:2 }}>{i+1}</div>
            <div style={{ flex:1 }}><Field label="Kg" type="number" min="0" step="0.5" value={s.weight} onChange={v=>setSets(sets.map((x,j)=>j===i?{...x,weight:v}:x))} placeholder="0"/></div>
            <div style={{ flex:1 }}><Field label="Reps" type="number" min="0" step="1" value={s.reps} onChange={v=>setSets(sets.map((x,j)=>j===i?{...x,reps:v}:x))} placeholder="0"/></div>
          </div>
        ))}
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <Btn onClick={()=>setSets([...sets,{weight:"",reps:""}])} variant="ghost" small>+ Serie</Btn>
          <Btn onClick={saveQuick} small disabled={!sel||!sets.some(s=>s.weight&&s.reps)}>
            <Icon d={Icons.check} size={14}/> Guardar
          </Btn>
        </div>
      </Card>

      {ts.length>0&&(
        <>
          <div style={{ fontSize:10, color:T.muted, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", marginBottom:12 }}>Completado hoy</div>
          {ts.map(s=>{
            const ex=exercises.find(e=>e.id===s.exerciseId), color=MUSCLE_COLORS[ex?.group]||T.text;
            return (
              <Card key={s.id} style={{ marginBottom:8, padding:"12px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:T.text, marginBottom:5 }}>{ex?.name||"Ejercicio"}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{s.sets.map((st,i)=><span key={i} style={{ fontSize:11, color:T.muted }}>{st.weight}×{st.reps}</span>)}</div>
                  </div>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [exercises, setExercises] = useState(()=>load("gym_exercises",[]));
  const [sessions, setSessions]   = useState(()=>load("gym_sessions",[]));
  const [screen, setScreen]       = useState("main");
  const [navTab, setNavTab]       = useState("today");
  const [selected, setSelected]   = useState(null);

  useEffect(()=>save("gym_exercises",exercises),[exercises]);
  useEffect(()=>save("gym_sessions",sessions),[sessions]);

  const addExercise = data=>{ setExercises(p=>[...p,{...data,id:uid()}]); setScreen("main"); setNavTab("exercises"); };
  const deleteExercise = id=>{ setExercises(p=>p.filter(e=>e.id!==id)); setSessions(p=>p.filter(s=>s.exerciseId!==id)); setScreen("main"); setNavTab("exercises"); };
  const logSession = data=>setSessions(p=>[...p,{...data,id:uid()}]);

  const NAV=[{id:"today",label:"Hoy",icon:Icons.flame},{id:"exercises",label:"Ejercicios",icon:Icons.dumbbell}];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto" }}>
      {screen==="add"&&<AddExerciseScreen onSave={addExercise} onBack={()=>setScreen("main")}/>}
      {screen==="detail"&&selected&&(
        <ExerciseScreen exercise={selected} sessions={sessions} onLogSession={logSession}
          onDelete={()=>deleteExercise(selected.id)}
          onBack={()=>{ setScreen("main"); setNavTab("exercises"); }}/>
      )}
      {screen==="main"&&(
        <>
          {navTab==="today"&&<TodayScreen exercises={exercises} sessions={sessions} onLogSession={logSession}/>}
          {navTab==="exercises"&&<HomeScreen exercises={exercises} sessions={sessions} onSelect={ex=>{setSelected(ex);setScreen("detail");}} onAdd={()=>setScreen("add")}/>}
          <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(247,245,242,0.92)", backdropFilter:"blur(12px)", borderTop:`1px solid ${T.border}`, display:"flex", padding:"10px 0 22px" }}>
            {NAV.map(t=>(
              <button key={t.id} onClick={()=>setNavTab(t.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color:navTab===t.id?T.text:T.dim, fontSize:9, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", transition:"color .2s" }}>
                <Icon d={t.icon} size={20}/>{t.label}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}

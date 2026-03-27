import { useState, useEffect, useMemo, useCallback } from "react";

const SK = "melody-finanzas-v3";

const DEFAULT_EXPENSES = [
  { id: "1", name: "Arriendo", amount: 1160000, dueDay: 1, dueMonth: null, dueYear: null, frequency: "monthly", category: "hogar", paid: false },
  { id: "2", name: "Tarjetas de Crédito", amount: 400000, dueDay: 5, dueMonth: null, dueYear: null, frequency: "monthly", category: "deuda", paid: false },
  { id: "3", name: "Pediatra bebé", amount: 200000, dueDay: 15, dueMonth: null, dueYear: null, frequency: "monthly", category: "bebe", paid: false },
  { id: "4", name: "Gastos bebé", amount: 100000, dueDay: 10, dueMonth: null, dueYear: null, frequency: "monthly", category: "bebe", paid: false },
  { id: "5", name: "Imprevistos/Nosotros", amount: 200000, dueDay: 20, dueMonth: null, dueYear: null, frequency: "monthly", category: "personal", paid: false },
  { id: "6", name: "Internet", amount: 0, dueDay: 12, dueMonth: null, dueYear: null, frequency: "monthly", category: "servicios", paid: false },
  { id: "7", name: "Luz", amount: 0, dueDay: 18, dueMonth: null, dueYear: null, frequency: "monthly", category: "servicios", paid: false },
  { id: "8", name: "Gas", amount: 0, dueDay: 18, dueMonth: null, dueYear: null, frequency: "monthly", category: "servicios", paid: false },
  { id: "9", name: "Agua", amount: 0, dueDay: 1, dueMonth: null, dueYear: null, frequency: "bimonthly", category: "servicios", paid: false },
];

const CATS = {
  hogar:        { label: "Hogar",        icon: "🏠", color: "#e8a0bf", grad: "linear-gradient(135deg,#f0b8d0,#e8a0bf)" },
  deuda:        { label: "Deudas",       icon: "💳", color: "#c9a0dc", grad: "linear-gradient(135deg,#d8b4e8,#c9a0dc)" },
  bebe:         { label: "Bebé",         icon: "👶", color: "#a0d2db", grad: "linear-gradient(135deg,#b8e0e8,#a0d2db)" },
  personal:     { label: "Personal",     icon: "✨", color: "#f0c38e", grad: "linear-gradient(135deg,#f8d8a8,#f0c38e)" },
  servicios:    { label: "Servicios",    icon: "⚡", color: "#b8d4e3", grad: "linear-gradient(135deg,#c8e0f0,#b8d4e3)" },
  alimentacion: { label: "Alimentación", icon: "🍽️", color: "#c5e0b4", grad: "linear-gradient(135deg,#d4ecc4,#c5e0b4)" },
  otro:         { label: "Otro",         icon: "📌", color: "#d4a0a0", grad: "linear-gradient(135deg,#e0b8b8,#d4a0a0)" },
};

const FREQ = { monthly: "Mensual", bimonthly: "Bimestral", once: "Pago único" };

const MOTIV = [
  "¡Vas increíble, reina! 👑","Cada peso cuenta 💪🌸","¡Tú puedes con todo! 🔥",
  "Disciplina = Libertad 🦋","El orden es tu superpoder ✨","¡Melody imparable! 💖",
  "Un día a la vez, bonita 🌷","¡Eres una guerrera! 🌟","Flow financiero activado 💸",
  "Tu bebé tiene la mejor mamá 👶💕",
];

const MN = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DL = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

const fmt = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0,maximumFractionDigits:0}).format(n);
const fmtShort = n => {
  if(n>=1000000) return `$${(n/1000000).toFixed(1)}M`;
  if(n>=1000) return `$${Math.round(n/1000)}K`;
  return `$${n}`;
};
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);

function load(){try{const r=localStorage.getItem(SK);return r?JSON.parse(r):null;}catch{return null;}}
function save(d){try{localStorage.setItem(SK,JSON.stringify(d));}catch(e){console.error(e);}}

function daysUntil(day,month,year){
  const t=new Date();t.setHours(0,0,0,0);
  const g=new Date(year,month,day);g.setHours(0,0,0,0);
  return Math.round((g-t)/86400000);
}

function getDue(exp,rm,ry){
  return {day:exp.dueDay,month:exp.dueMonth!=null?exp.dueMonth:rm,year:exp.dueYear!=null?exp.dueYear:ry};
}

function inMonth(exp,m,y){
  if(exp.frequency==="once"){
    if(exp.dueMonth!=null&&exp.dueYear!=null) return exp.dueMonth===m&&exp.dueYear===y;
    if(exp.dueMonth!=null) return exp.dueMonth===m;
    return true;
  }
  return true;
}

/* ─── Sub-components ─── */
function Pill({children,active,onClick,color,small}){
  return <button onClick={onClick} style={{
    padding:small?"3px 10px":"5px 14px",borderRadius:20,
    border:active?`2px solid ${color||"#e8a0bf"}`:"1.5px solid #f0d4e4",
    background:active?(color||"#e8a0bf")+"22":"#fff",
    color:active?(color||"#c47a9a"):"#b0a0a8",
    fontFamily:"'Quicksand',sans-serif",fontWeight:600,fontSize:small?11:12,
    cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",
  }}>{children}</button>;
}

function Card({children,style,onClick,glow}){
  return <div onClick={onClick} style={{
    background:"#fff",borderRadius:18,padding:"16px 18px",
    boxShadow:glow?"0 0 20px rgba(220,140,180,.25)":"0 2px 14px rgba(200,140,170,.08)",
    border:"1px solid #f8e8f0",transition:"all .25s",cursor:onClick?"pointer":"default",
    ...style,
  }}>{children}</div>;
}

function Modal({open,onClose,title,children}){
  if(!open)return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(160,120,140,.35)",backdropFilter:"blur(6px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#fff",borderRadius:"24px 24px 0 0",padding:"8px 22px 30px",width:"100%",maxWidth:480,
        boxShadow:"0 -8px 40px rgba(180,120,160,.2)",maxHeight:"92vh",overflowY:"auto",animation:"sheetUp .35s cubic-bezier(.22,1,.36,1)",
      }}>
        <div style={{width:40,height:4,borderRadius:2,background:"#e8d4e0",margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontFamily:"'Quicksand',sans-serif",fontWeight:700,color:"#8a5a6a",fontSize:17}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,color:"#c0a0b0",cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Confirm({open,onConfirm,onCancel,title,message}){
  if(!open)return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(160,120,140,.4)",backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:22,padding:"24px 22px",width:"88%",maxWidth:340,boxShadow:"0 12px 40px rgba(180,120,160,.2)",animation:"modalIn .25s ease",textAlign:"center"}}>
        <p style={{fontSize:28,margin:"0 0 8px"}}>{title}</p>
        <p style={{fontSize:14,color:"#6a4a5a",margin:"0 0 18px",fontFamily:"'Quicksand',sans-serif",fontWeight:500,lineHeight:1.5}}>{message}</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:11,borderRadius:12,border:"1.5px solid #f0d4e4",background:"#fff",fontFamily:"'Quicksand',sans-serif",fontWeight:700,fontSize:14,color:"#a090a0",cursor:"pointer"}}>No</button>
          <button onClick={onConfirm} style={{flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f0a6c0,#d4a0dc)",fontFamily:"'Quicksand',sans-serif",fontWeight:700,fontSize:14,color:"#fff",cursor:"pointer"}}>Sí</button>
        </div>
      </div>
    </div>
  );
}

function Field({label,children}){
  return <div style={{marginBottom:13}}><label style={{display:"block",fontSize:11,fontWeight:700,color:"#b08898",marginBottom:3,fontFamily:"'Quicksand',sans-serif",textTransform:"uppercase",letterSpacing:.4}}>{label}</label>{children}</div>;
}

function Toast({message,show}){
  if(!show)return null;
  return <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:1200,background:"linear-gradient(135deg,#a0d4a0,#80c080)",color:"#fff",padding:"10px 24px",borderRadius:14,fontFamily:"'Quicksand',sans-serif",fontWeight:700,fontSize:13,boxShadow:"0 4px 20px rgba(100,180,100,.3)",animation:"bounceIn .4s ease",whiteSpace:"nowrap"}}>{message}</div>;
}

const iS = {width:"100%",padding:"10px 14px",borderRadius:12,border:"1.5px solid #f0d4e4",fontFamily:"'Quicksand',sans-serif",fontSize:14,color:"#6a4a5a",outline:"none",boxSizing:"border-box",background:"#fef8fb",transition:"border-color .2s"};
const bP = {width:"100%",padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f0a6c0,#d4a0dc)",color:"#fff",fontFamily:"'Quicksand',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer",boxShadow:"0 4px 14px rgba(220,140,180,.25)",transition:"transform .15s,opacity .2s"};

function ProgressRing({pct,size=88,stroke=7,color="#e8a0bf"}){
  const r=(size-stroke)/2,c=2*Math.PI*r,o=c-(Math.min(pct,100)/100)*c;
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f8e8f0" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{transition:"stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)"}}/></svg>;
}

function Confetti({show}){
  if(!show)return null;
  const p=Array.from({length:35},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*.7,color:["#f0a6c0","#d4a0dc","#f8d080","#a0d2db","#c5e0b4","#ff90b0","#ffd700"][i%7],size:4+Math.random()*7}));
  return <div style={{position:"fixed",inset:0,zIndex:2000,pointerEvents:"none",overflow:"hidden"}}>{p.map(q=><div key={q.id} style={{position:"absolute",left:`${q.x}%`,top:"-5%",width:q.size,height:q.size,borderRadius:q.id%3===0?"50%":"2px",background:q.color,animation:`confettiFall 2s ${q.delay}s ease-out forwards`}}/>)}</div>;
}

/* ─── USD converter ─── */
function UsdConverter(){
  const [usd,setUsd]=useState("");
  const [rate,setRate]=useState(()=>{try{const r=localStorage.getItem("melody-tasa-usd");return r?Number(r):3600;}catch{return 3600;}});
  useEffect(()=>{try{localStorage.setItem("melody-tasa-usd",String(rate));}catch{}},[rate]);
  const cop=usd?Math.round(Number(usd)*rate):0;
  return (
    <Card style={{background:"linear-gradient(135deg,#f0f8ff,#e8f0fa)",border:"1.5px solid #d0e0f0",marginBottom:12}}>
      <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#6080a0"}}>💱 Convertir USD → COP</p>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:16}}>🇺🇸</span>
            <input type="number" value={usd} onChange={e=>setUsd(e.target.value)} placeholder="USD" style={{...iS,background:"#fff",padding:"8px 10px",fontSize:15}}/>
          </div>
        </div>
        <span style={{fontSize:18,color:"#b0c0d0"}}>→</span>
        <div style={{flex:1,textAlign:"center"}}>
          <span style={{fontSize:11,color:"#8090a0",display:"block"}}>🇨🇴 COP</span>
          <span style={{fontSize:18,fontWeight:800,color:"#5a7a4a",fontFamily:"'Playfair Display',serif"}}>{cop?fmt(cop):"—"}</span>
        </div>
      </div>
      <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:10,color:"#8090a0",fontWeight:600}}>Tasa:</span>
        <input type="number" value={rate} onChange={e=>setRate(Number(e.target.value)||0)} style={{...iS,width:80,padding:"4px 8px",fontSize:12,background:"#fff"}}/>
        <span style={{fontSize:10,color:"#a0b0c0"}}>COP/USD</span>
      </div>
    </Card>
  );
}

/* ─── Bar Chart ─── */
function BarChart({expenses}){
  const data=useMemo(()=>{
    const m={};
    expenses.forEach(e=>{if(!m[e.category])m[e.category]={total:0,paid:0};m[e.category].total+=e.amount;if(e.paid)m[e.category].paid+=e.amount;});
    return Object.entries(m).filter(([,v])=>v.total>0).sort((a,b)=>b[1].total-a[1].total);
  },[expenses]);
  const max=Math.max(...data.map(([,v])=>v.total),1);
  return <div>{data.map(([cat,v],idx)=>{
    const c=CATS[cat]||CATS.otro;const pt=(v.total/max)*100;const pp=v.total>0?(v.paid/v.total)*100:0;
    return <div key={cat} style={{marginBottom:14,animation:`slideRight .35s ${idx*.06}s ease both`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:12,fontWeight:700,color:"#6a4a5a"}}>{c.icon} {c.label}</span>
        <span style={{fontSize:11,color:"#a090a0",fontWeight:600}}>{fmtShort(v.paid)} / {fmtShort(v.total)}</span>
      </div>
      <div style={{height:24,borderRadius:12,background:"#f8eff4",overflow:"hidden",position:"relative"}}>
        <div style={{height:"100%",borderRadius:12,background:"#f0dae4",width:`${pt}%`,transition:"width .6s ease",position:"absolute",top:0,left:0}}/>
        <div style={{height:"100%",borderRadius:12,background:c.grad,width:`${pp/100*pt}%`,transition:"width .9s cubic-bezier(.4,0,.2,1)",position:"absolute",top:0,left:0,boxShadow:pp>0?`0 0 12px ${c.color}50`:"none"}}/>
        {pp>12&&<span style={{position:"absolute",left:8,top:4,fontSize:10,fontWeight:700,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,.2)"}}>{Math.round(pp)}%</span>}
      </div>
    </div>;
  })}</div>;
}

/* ─── Mini Calendar ─── */
function MiniCalendar({month,year,expenses,onChangeMonth,today,onDayClick}){
  const fd=new Date(year,month,1).getDay();const sh=fd===0?6:fd-1;
  const dim=new Date(year,month+1,0).getDate();
  const cells=[];for(let i=0;i<sh;i++)cells.push(null);for(let d=1;d<=dim;d++)cells.push(d);

  const ebd={};expenses.forEach(e=>{const dd=e.dueDay;if(dd>=1&&dd<=dim){if(!ebd[dd])ebd[dd]=[];ebd[dd].push(e);}});
  const isT=d=>d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <button onClick={()=>onChangeMonth(-1)} style={{background:"none",border:"none",fontSize:24,color:"#c47a9a",cursor:"pointer",padding:"4px 14px",fontWeight:700}}>‹</button>
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#8a5a6a"}}>{MN[month]} {year}</span>
      <button onClick={()=>onChangeMonth(1)} style={{background:"none",border:"none",fontSize:24,color:"#c47a9a",cursor:"pointer",padding:"4px 14px",fontWeight:700}}>›</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
      {DL.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#c0a8b4",padding:"4px 0"}}>{d}</div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
      {cells.map((d,i)=>{
        if(d===null)return <div key={`e${i}`}/>;
        const exps=ebd[d]||[];const hasU=exps.some(e=>!e.paid);const allP=exps.length>0&&exps.every(e=>e.paid);const tc=isT(d);
        return <div key={d} onClick={()=>exps.length>0&&onDayClick&&onDayClick(d,exps)} style={{
          position:"relative",textAlign:"center",padding:"7px 2px",borderRadius:12,cursor:exps.length?"pointer":"default",
          background:tc?"linear-gradient(135deg,#f0a6c0,#d4a0dc)":hasU?"#fff5f8":"transparent",
          border:hasU&&!tc?"1.5px solid #f0c0d0":allP?"1.5px solid #b8e0b8":"1.5px solid transparent",
          transition:"all .2s",animation:tc?"glow 2.5s infinite":"none",
        }}>
          <span style={{fontSize:12,fontWeight:tc||exps.length?700:500,color:tc?"#fff":hasU?"#c06080":"#8a7a84"}}>{d}</span>
          {exps.length>0&&<div style={{display:"flex",justifyContent:"center",gap:2,marginTop:2}}>
            {exps.slice(0,3).map((e,j)=><div key={j} style={{width:5,height:5,borderRadius:"50%",background:e.paid?"#90c890":(CATS[e.category]||CATS.otro).color}}/>)}
            {exps.length>3&&<span style={{fontSize:7,color:"#c0a0b0",fontWeight:700}}>+{exps.length-3}</span>}
          </div>}
        </div>;
      })}
    </div>
    <div style={{display:"flex",gap:14,marginTop:10,justifyContent:"center",flexWrap:"wrap"}}>
      {[["Hoy","linear-gradient(135deg,#f0a6c0,#d4a0dc)"],["Pendiente","#f0c0d0"],["Pagado","#90c890"]].map(([l,bg])=>(
        <span key={l} style={{fontSize:10,color:"#a090a0",display:"flex",alignItems:"center",gap:3}}>
          <span style={{width:8,height:8,borderRadius:4,background:bg,display:"inline-block"}}/>{l}
        </span>
      ))}
    </div>
  </div>;
}

/* ─── Day Detail Sheet ─── */
function DayDetail({day,expenses,month,year,onClose,onToggle}){
  if(!day)return null;
  return <Modal open={!!day} onClose={onClose} title={`📅 ${day} de ${MN[month]}`}>
    {expenses.map(e=>{
      const cat=CATS[e.category]||CATS.otro;
      return <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f8e8f0"}}>
        <div>
          <span style={{fontSize:13,fontWeight:700}}>{cat.icon} {e.name}</span>
          <p style={{margin:"2px 0 0",fontSize:15,fontWeight:700,color:"#8a5a6a",fontFamily:"'Playfair Display',serif"}}>{fmt(e.amount)}</p>
          <span style={{fontSize:10,color:e.paid?"#80b080":"#c0a0b0",fontWeight:600}}>{e.paid?"✓ Pagado":FREQ[e.frequency]}</span>
        </div>
        <button onClick={()=>onToggle(e.id)} style={{
          width:40,height:40,borderRadius:14,border:e.paid?"none":"2px solid #e8d0dc",
          background:e.paid?"linear-gradient(135deg,#a0d4a0,#80c080)":"#fff",
          color:e.paid?"#fff":"#c0a0b0",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        }}>{e.paid?"✓":"○"}</button>
      </div>;
    })}
  </Modal>;
}

/* ════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════ */
export default function MelodyFinanzas(){
  const today=new Date();
  const [loaded,setLoaded]=useState(false);
  const [incomes,setIncomes]=useState([]);
  const [expenses,setExpenses]=useState(DEFAULT_EXPENSES);
  const [view,setView]=useState("home");
  const [calM,setCalM]=useState(today.getMonth());
  const [calY,setCalY]=useState(today.getFullYear());
  const [showAddInc,setShowAddInc]=useState(false);
  const [showAddExp,setShowAddExp]=useState(false);
  const [editExp,setEditExp]=useState(null);
  const [filterCat,setFilterCat]=useState("all");
  const [confetti,setConfetti]=useState(false);
  const [toast,setToast]=useState("");
  const [confirmData,setConfirmData]=useState(null);
  const [dayDetail,setDayDetail]=useState(null);
  const [dayDetailExps,setDayDetailExps]=useState([]);
  const [motivIdx]=useState(Math.floor(Math.random()*MOTIV.length));

  // form
  const [incAmt,setIncAmt]=useState("");
  const [incNote,setIncNote]=useState("");
  const [expName,setExpName]=useState("");
  const [expAmt,setExpAmt]=useState("");
  const [expDay,setExpDay]=useState("1");
  const [expMonth,setExpMonth]=useState("");
  const [expYear,setExpYear]=useState("");
  const [expFreq,setExpFreq]=useState("monthly");
  const [expCat,setExpCat]=useState("otro");
  const [formErr,setFormErr]=useState("");

  useEffect(()=>{const d=load();if(d){if(d.incomes)setIncomes(d.incomes);if(d.expenses)setExpenses(d.expenses);}setLoaded(true);},[]);
  useEffect(()=>{if(!loaded)return;save({incomes,expenses});},[incomes,expenses,loaded]);

  const showToast=useCallback((m)=>{setToast(m);setTimeout(()=>setToast(""),2200);},[]);

  /* computed */
  const mInc=incomes.filter(i=>{const d=new Date(i.date);return d.getMonth()===calM&&d.getFullYear()===calY;});
  const totInc=mInc.reduce((s,i)=>s+i.amount,0);
  const actExp=expenses.filter(e=>inMonth(e,calM,calY));
  const totUnpaid=actExp.filter(e=>!e.paid).reduce((s,e)=>s+e.amount,0);
  const totPaid=actExp.filter(e=>e.paid).reduce((s,e)=>s+e.amount,0);
  const allTot=totPaid+totUnpaid;
  const pct=allTot>0?Math.round((totPaid/allTot)*100):0;
  const balance=totInc-totPaid;
  const streak=actExp.filter(e=>e.paid).length;

  // daily income streak
  const incDays=useMemo(()=>{
    const s=new Set();mInc.forEach(i=>{s.add(new Date(i.date).getDate());});
    let count=0;for(let d=today.getDate();d>=1;d--){if(s.has(d))count++;else break;}
    return count;
  },[mInc,today]);

  const sorted=[...actExp].filter(e=>filterCat==="all"||e.category===filterCat).sort((a,b)=>{
    if(a.paid!==b.paid)return a.paid?1:-1;
    const da=getDue(a,calM,calY),db=getDue(b,calM,calY);
    return daysUntil(da.day,da.month,da.year)-daysUntil(db.day,db.month,db.year);
  });

  const upcoming=actExp.filter(e=>{if(e.paid)return false;const dd=getDue(e,calM,calY);const d=daysUntil(dd.day,dd.month,dd.year);return d>=0&&d<=5;}).sort((a,b)=>{const da=getDue(a,calM,calY),db=getDue(b,calM,calY);return daysUntil(da.day,da.month,da.year)-daysUntil(db.day,db.month,db.year);});

  /* handlers */
  function addIncome(){
    const amt=Number(incAmt);
    if(!incAmt||isNaN(amt)||amt<=0){setFormErr("Ingresa un monto válido");return;}
    setIncomes(p=>[...p,{id:uid(),amount:amt,note:incNote||"Tango Live",date:new Date().toISOString()}]);
    setIncAmt("");setIncNote("");setFormErr("");setShowAddInc(false);showToast("💰 ¡Ingreso registrado!");
  }

  function addExpense(){
    if(!expName.trim()){setFormErr("Dale un nombre al gasto");return;}
    const amt=Number(expAmt);
    if(!expAmt||isNaN(amt)||amt<0){setFormErr("Monto inválido");return;}
    const d=Number(expDay);
    if(d<1||d>31){setFormErr("Día debe ser entre 1 y 31");return;}
    setExpenses(p=>[...p,{id:uid(),name:expName.trim(),amount:amt,dueDay:d,
      dueMonth:expMonth!==""?Number(expMonth):null,dueYear:expYear!==""?Number(expYear):null,
      frequency:expFreq,category:expCat,paid:false}]);
    resetF();setShowAddExp(false);setFormErr("");showToast("📋 ¡Gasto agregado!");
  }

  function updateExpense(){
    if(!editExp)return;
    if(!expName.trim()){setFormErr("Dale un nombre");return;}
    const amt=Number(expAmt);if(isNaN(amt)||amt<0){setFormErr("Monto inválido");return;}
    setExpenses(p=>p.map(e=>e.id===editExp.id?{...e,name:expName.trim(),amount:amt,dueDay:Number(expDay),
      dueMonth:expMonth!==""?Number(expMonth):null,dueYear:expYear!==""?Number(expYear):null,
      frequency:expFreq,category:expCat}:e));
    resetF();setEditExp(null);setFormErr("");showToast("✏️ Gasto actualizado");
  }

  function requestDelete(id){
    setConfirmData({title:"🗑️",message:"¿Segura que quieres eliminar este gasto?",onConfirm:()=>{setExpenses(p=>p.filter(e=>e.id!==id));setEditExp(null);resetF();setConfirmData(null);showToast("Gasto eliminado");}});
  }

  function togglePaid(id){
    const exp=expenses.find(e=>e.id===id);
    if(exp&&!exp.paid){setConfetti(true);setTimeout(()=>setConfetti(false),2200);showToast("✅ ¡Pagado! Genial 🎉");}
    setExpenses(p=>p.map(e=>e.id===id?{...e,paid:!e.paid}:e));
  }

  function requestReset(){
    setConfirmData({title:"🔄",message:"Esto desmarcará todos los pagos del mes (excepto pagos únicos). ¿Continuar?",onConfirm:()=>{setExpenses(p=>p.map(e=>e.frequency!=="once"?{...e,paid:false}:e));setConfirmData(null);showToast("Mes reiniciado 🔄");}});
  }

  function resetF(){setExpName("");setExpAmt("");setExpDay("1");setExpMonth("");setExpYear("");setExpFreq("monthly");setExpCat("otro");setFormErr("");}

  function openEdit(e){setExpName(e.name);setExpAmt(String(e.amount));setExpDay(String(e.dueDay));setExpMonth(e.dueMonth!=null?String(e.dueMonth):"");setExpYear(e.dueYear!=null?String(e.dueYear):"");setExpFreq(e.frequency);setExpCat(e.category);setEditExp(e);setFormErr("");}

  function chgMonth(dir){let m=calM+dir,y=calY;if(m>11){m=0;y++;}if(m<0){m=11;y--;}setCalM(m);setCalY(y);}

  function onDayClick(d,exps){setDayDetail(d);setDayDetailExps(exps);}

  const isCur=calM===today.getMonth()&&calY===today.getFullYear();

  if(!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"'Quicksand',sans-serif",color:"#c0a0b0",fontSize:16}}><span style={{animation:"pulse 1.2s infinite"}}>🌸 Cargando...</span></div>;

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(170deg,#fef6fa 0%,#fdf0f5 35%,#f6e8f2 70%,#f0e4f0 100%)",fontFamily:"'Quicksand',sans-serif",color:"#5a3a4a",paddingBottom:90,paddingTop:"env(safe-area-inset-top,0px)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
        @keyframes modalIn{from{opacity:0;transform:scale(.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.7}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg) scale(1);opacity:1}70%{opacity:1}100%{transform:translateY(105vh) rotate(720deg) scale(.3);opacity:0}}
        @keyframes bounceIn{0%{transform:scale(0)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
        @keyframes slideRight{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(220,140,180,.2)}50%{box-shadow:0 0 22px rgba(220,140,180,.5)}}
        @keyframes wobble{0%,100%{transform:rotate(0)}25%{transform:rotate(-2deg)}75%{transform:rotate(2deg)}}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#f0d4e4;border-radius:4px}
        input:focus,select:focus{border-color:#e8a0bf !important}
        body{overscroll-behavior:none}
      `}</style>

      <Confetti show={confetti}/>
      <Toast message={toast} show={!!toast}/>
      <Confirm open={!!confirmData} title={confirmData?.title} message={confirmData?.message} onConfirm={confirmData?.onConfirm} onCancel={()=>setConfirmData(null)}/>
      <DayDetail day={dayDetail} expenses={dayDetailExps} month={calM} year={calY} onClose={()=>setDayDetail(null)} onToggle={togglePaid}/>

      {/* Header */}
      <div style={{padding:"22px 20px 18px",background:"linear-gradient(135deg,#f2bcd4 0%,#e0a8cc 40%,#d8a0d0 100%)",borderRadius:"0 0 30px 30px",boxShadow:"0 6px 28px rgba(200,130,170,.2)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,.1)"}}/>
        <div style={{position:"absolute",bottom:-25,left:30,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
        <p style={{margin:0,fontSize:12,color:"#fff",opacity:.85,fontWeight:500}}>✿ {today.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
        <h1 style={{margin:"3px 0 6px",fontFamily:"'Playfair Display',serif",fontSize:26,color:"#fff",fontWeight:800}}>Hola, Melody 🌸</h1>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <p style={{margin:0,fontSize:13,color:"#fff",opacity:.9,fontWeight:600,fontStyle:"italic"}}>{MOTIV[motivIdx]}</p>
          {incDays>1&&<span style={{fontSize:11,background:"rgba(255,255,255,.25)",padding:"2px 10px",borderRadius:10,color:"#fff",fontWeight:700}}>🔥 {incDays} días seguidos</span>}
        </div>
      </div>

      {/* Stats */}
      <div style={{padding:"14px 14px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,animation:"fadeUp .4s ease"}}>
        <Card glow={totInc>0}>
          <p style={{margin:0,fontSize:10,color:"#b0a0a8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>💰 Acumulado</p>
          <p style={{margin:"4px 0 0",fontSize:18,fontWeight:700,color:"#6a9a5a",fontFamily:"'Playfair Display',serif"}}>{fmt(totInc)}</p>
        </Card>
        <Card glow={totUnpaid>0}>
          <p style={{margin:0,fontSize:10,color:"#b0a0a8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>🔥 Por pagar</p>
          <p style={{margin:"4px 0 0",fontSize:18,fontWeight:700,color:"#c47a6a",fontFamily:"'Playfair Display',serif"}}>{fmt(totUnpaid)}</p>
        </Card>
      </div>

      {/* Progress */}
      <div style={{padding:"10px 14px 0",animation:"fadeUp .5s ease"}}>
        <Card style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{position:"relative",flexShrink:0}}>
            <ProgressRing pct={pct}/>
            <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#8a5a6a"}}>{pct}%</span>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{margin:0,fontSize:11,color:"#b0a0a8",fontWeight:600}}>Balance disponible</p>
            <p style={{margin:"2px 0",fontSize:20,fontWeight:800,color:balance>=0?"#6a9a5a":"#c47a6a",fontFamily:"'Playfair Display',serif"}}>{fmt(balance)}</p>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:10,color:"#c0a0b0"}}>Pagado: {fmtShort(totPaid)}</span>
              {streak>0&&<span style={{fontSize:10,fontWeight:700,color:"#e8a0bf",background:"#fef0f5",padding:"2px 8px",borderRadius:8,animation:"bounceIn .4s ease"}}>🔥 {streak} pagos</span>}
            </div>
          </div>
        </Card>
      </div>

      {/* Urgent */}
      {upcoming.length>0&&(
        <div style={{padding:"10px 14px 0",animation:"fadeUp .55s ease"}}>
          <Card style={{background:"linear-gradient(135deg,#fff5f8,#fff0f3)",border:"1.5px solid #f5c8d8",animation:"glow 3s infinite"}}>
            <p style={{margin:"0 0 6px",fontSize:13,fontWeight:700,color:"#c47a6a"}}>⏰ ¡Ojo! Pagos próximos</p>
            {upcoming.map(e=>{
              const dd=getDue(e,calM,calY);const d=daysUntil(dd.day,dd.month,dd.year);
              return <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #f8e4ec"}}>
                <span style={{fontSize:12,fontWeight:600}}>{(CATS[e.category]||CATS.otro).icon} {e.name}</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:d===0?"#e04060":"#c47a6a"}}>{d===0?"¡HOY!":d===1?"Mañana":`${d}d`}</span>
                  <button onClick={()=>togglePaid(e.id)} style={{fontSize:10,padding:"3px 10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontFamily:"'Quicksand',sans-serif",background:"linear-gradient(135deg,#a0d4a0,#80c080)",color:"#fff"}}>Pagar ✓</button>
                </div>
              </div>;
            })}
          </Card>
        </div>
      )}

      {/* Nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,.95)",backdropFilter:"blur(16px)",borderTop:"1px solid #f8e8f0",padding:"5px 0 max(8px,env(safe-area-inset-bottom,8px))",display:"flex",justifyContent:"space-around",boxShadow:"0 -2px 18px rgba(200,140,170,.08)",zIndex:100}}>
        {[{key:"home",label:"Inicio",icon:"🏠"},{key:"calendar",label:"Calendario",icon:"📅"},{key:"income",label:"Ingresos",icon:"💰"},{key:"expenses",label:"Gastos",icon:"📋"},{key:"chart",label:"Resumen",icon:"📊"}].map(t=>(
          <button key={t.key} onClick={()=>setView(t.key)} style={{
            background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:1,cursor:"pointer",padding:"3px 6px",
            color:view===t.key?"#c47a9a":"#c0b0b8",transition:"all .2s",transform:view===t.key?"scale(1.12)":"scale(1)",
          }}>
            <span style={{fontSize:18,transition:"transform .2s",transform:view===t.key?"translateY(-2px)":"none"}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:700,fontFamily:"'Quicksand',sans-serif"}}>{t.label}</span>
            {view===t.key&&<div style={{width:4,height:4,borderRadius:2,background:"#e8a0bf",marginTop:1}}/>}
          </button>
        ))}
      </div>

      {/* ═══ VIEWS ═══ */}

      {view==="home"&&(
        <div style={{padding:"12px 14px",animation:"fadeUp .35s ease"}}>
          <button onClick={()=>{setFormErr("");setShowAddInc(true);}} style={{...bP,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8,animation:"glow 2.5s infinite"}}>💵 Registrar ingreso de hoy</button>

          <UsdConverter/>

          <h3 style={{fontSize:13,fontWeight:700,color:"#8a5a6a",margin:"12px 0 8px"}}>Últimos ingresos</h3>
          {mInc.length===0&&<Card style={{textAlign:"center",padding:24}}><span style={{fontSize:36,display:"block",marginBottom:8}}>🌱</span><p style={{fontSize:14,fontWeight:600,color:"#b0a0a8",margin:0}}>Aún no hay ingresos</p><p style={{fontSize:12,color:"#c0b0b8",margin:"4px 0 0"}}>¡Registra tu primer día!</p></Card>}
          {mInc.slice(-5).reverse().map((inc,i)=>(
            <Card key={inc.id} style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 16px",animation:`slideRight .3s ${i*.07}s ease both`}}>
              <div>
                <p style={{margin:0,fontSize:13,fontWeight:600}}>{inc.note}</p>
                <p style={{margin:0,fontSize:10,color:"#c0a0b0"}}>{new Date(inc.date).toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"})}</p>
              </div>
              <span style={{fontWeight:700,color:"#6a9a5a",fontSize:15}}>+{fmt(inc.amount)}</span>
            </Card>
          ))}
          <button onClick={requestReset} style={{marginTop:16,width:"100%",padding:10,borderRadius:12,border:"1.5px solid #f0d4e4",background:"#fff",fontFamily:"'Quicksand',sans-serif",fontWeight:600,fontSize:13,color:"#c47a6a",cursor:"pointer"}}>🔄 Reiniciar pagos del mes</button>
        </div>
      )}

      {view==="calendar"&&(
        <div style={{padding:"12px 14px",animation:"fadeUp .35s ease"}}>
          <Card style={{marginBottom:14}}>
            <MiniCalendar month={calM} year={calY} expenses={actExp} onChangeMonth={chgMonth} today={today} onDayClick={onDayClick}/>
          </Card>
          <h3 style={{fontSize:13,fontWeight:700,color:"#8a5a6a",margin:"4px 0 10px"}}>Pagos de {MN[calM]} {calY} {isCur?"(este mes)":""}</h3>
          {sorted.filter(e=>!e.paid).length===0&&<Card style={{textAlign:"center",padding:20}}><span style={{fontSize:36}}>🎉</span><p style={{fontSize:14,fontWeight:600,color:"#8a5a6a",margin:"6px 0 0"}}>¡Todo al día!</p></Card>}
          {sorted.map((e,i)=>{
            const dd=getDue(e,calM,calY);const d=daysUntil(dd.day,dd.month,dd.year);const cat=CATS[e.category]||CATS.otro;const urg=!e.paid&&d>=0&&d<=3;
            return <Card key={e.id} style={{marginBottom:8,padding:"12px 16px",opacity:e.paid?.5:1,borderLeft:`4px solid ${urg?"#e06070":cat.color}`,animation:`slideRight .3s ${i*.05}s ease both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontSize:13,fontWeight:700,textDecoration:e.paid?"line-through":"none"}}>{cat.icon} {e.name}</span>
                  <p style={{margin:"2px 0 0",fontSize:15,fontWeight:700,color:"#8a5a6a",fontFamily:"'Playfair Display',serif"}}>{fmt(e.amount)}</p>
                  <p style={{margin:0,fontSize:10,color:urg?"#e06070":"#c0a0b0",fontWeight:urg?700:500}}>
                    {e.paid?"✓ Pagado":d<0?`Venció hace ${Math.abs(d)} días`:d===0?"¡Vence HOY!":`Día ${dd.day} · en ${d} días`}
                  </p>
                </div>
                <button onClick={()=>togglePaid(e.id)} style={{width:40,height:40,borderRadius:14,border:e.paid?"none":"2px solid #e8d0dc",flexShrink:0,background:e.paid?"linear-gradient(135deg,#a0d4a0,#80c080)":"#fff",color:e.paid?"#fff":"#c0a0b0",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{e.paid?"✓":"○"}</button>
              </div>
            </Card>;
          })}
        </div>
      )}

      {view==="income"&&(
        <div style={{padding:"12px 14px",animation:"fadeUp .35s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#8a5a6a"}}>Ingresos</h3>
            <button onClick={()=>{setFormErr("");setShowAddInc(true);}} style={{padding:"7px 14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#f0a6c0,#d4a0dc)",color:"#fff",fontFamily:"'Quicksand',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Agregar</button>
          </div>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:16,marginBottom:14}}>
            <button onClick={()=>chgMonth(-1)} style={{background:"none",border:"none",fontSize:20,color:"#c47a9a",cursor:"pointer",fontWeight:700}}>‹</button>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#8a5a6a"}}>{MN[calM]} {calY}</span>
            <button onClick={()=>chgMonth(1)} style={{background:"none",border:"none",fontSize:20,color:"#c47a9a",cursor:"pointer",fontWeight:700}}>›</button>
          </div>
          <Card style={{marginBottom:14,textAlign:"center"}}>
            <p style={{margin:0,fontSize:10,color:"#b0a0a8",fontWeight:700,textTransform:"uppercase"}}>TOTAL DEL MES</p>
            <p style={{margin:"4px 0 0",fontSize:28,fontWeight:800,color:"#6a9a5a",fontFamily:"'Playfair Display',serif"}}>{fmt(totInc)}</p>
            <p style={{margin:"2px 0 0",fontSize:11,color:"#c0a0b0"}}>{mInc.length} registros · ~{fmt(mInc.length>0?Math.round(totInc/mInc.length):0)}/día</p>
          </Card>
          {mInc.length===0&&<Card style={{textAlign:"center",padding:20}}><span style={{fontSize:32}}>📭</span><p style={{margin:"8px 0 0",fontSize:13,color:"#b0a0a8",fontWeight:600}}>Sin registros este mes</p></Card>}
          {mInc.slice().reverse().map((inc,i)=>(
            <Card key={inc.id} style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 16px",animation:`slideRight .3s ${i*.05}s ease both`}}>
              <div>
                <p style={{margin:0,fontSize:13,fontWeight:600}}>{inc.note}</p>
                <p style={{margin:0,fontSize:10,color:"#c0a0b0"}}>{new Date(inc.date).toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"})}</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontWeight:700,color:"#6a9a5a",fontSize:15}}>+{fmt(inc.amount)}</span>
                <button onClick={()=>setConfirmData({title:"🗑️",message:"¿Eliminar este ingreso?",onConfirm:()=>{setIncomes(p=>p.filter(x=>x.id!==inc.id));setConfirmData(null);}})} style={{background:"none",border:"none",fontSize:14,color:"#d4a0a0",cursor:"pointer"}}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {view==="expenses"&&(
        <div style={{padding:"12px 14px",animation:"fadeUp .35s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#8a5a6a"}}>Gastos y pagos</h3>
            <button onClick={()=>{resetF();setShowAddExp(true);}} style={{padding:"7px 14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#f0a6c0,#d4a0dc)",color:"#fff",fontFamily:"'Quicksand',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Nuevo</button>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            <Pill active={filterCat==="all"} onClick={()=>setFilterCat("all")} small>Todos</Pill>
            {Object.entries(CATS).map(([k,v])=><Pill key={k} active={filterCat===k} onClick={()=>setFilterCat(k)} color={v.color} small>{v.icon}</Pill>)}
          </div>
          {sorted.length===0&&<Card style={{textAlign:"center",padding:20}}><span style={{fontSize:32}}>✨</span><p style={{margin:"8px 0 0",fontSize:13,color:"#b0a0a8",fontWeight:600}}>No hay gastos en esta categoría</p></Card>}
          {sorted.map((e,i)=>{
            const dd=getDue(e,calM,calY);const d=daysUntil(dd.day,dd.month,dd.year);const cat=CATS[e.category]||CATS.otro;const urg=!e.paid&&d>=0&&d<=3;
            return <Card key={e.id} style={{marginBottom:9,padding:"12px 16px",opacity:e.paid?.5:1,borderLeft:`4px solid ${urg?"#e06070":cat.color}`,animation:`slideRight .3s ${i*.04}s ease both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,cursor:"pointer"}} onClick={()=>openEdit(e)}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                    <span style={{fontSize:14}}>{cat.icon}</span>
                    <span style={{fontSize:13,fontWeight:700,textDecoration:e.paid?"line-through":"none"}}>{e.name}</span>
                    <span style={{fontSize:9,padding:"2px 7px",borderRadius:7,background:cat.color+"30",color:"#6a4a5a",fontWeight:600}}>{FREQ[e.frequency]}</span>
                  </div>
                  <p style={{margin:0,fontSize:17,fontWeight:700,color:"#8a5a6a",fontFamily:"'Playfair Display',serif"}}>{fmt(e.amount)}</p>
                  <p style={{margin:"1px 0 0",fontSize:10,color:urg?"#e06070":"#c0a0b0",fontWeight:urg?700:500}}>
                    {e.paid?"✓ Pagado":d<0?`Venció hace ${Math.abs(d)} días`:d===0?"¡Vence HOY!":`Día ${dd.day}${dd.month!==calM?" de "+MN[dd.month]:""} · en ${d} días`}
                  </p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
                  <button onClick={()=>togglePaid(e.id)} style={{width:38,height:38,borderRadius:12,border:e.paid?"none":"2px solid #e8d0dc",background:e.paid?"linear-gradient(135deg,#a0d4a0,#80c080)":"#fff",color:e.paid?"#fff":"#c0a0b0",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{e.paid?"✓":"○"}</button>
                  <button onClick={()=>openEdit(e)} style={{background:"none",border:"none",fontSize:11,color:"#c0a0b0",cursor:"pointer",fontFamily:"'Quicksand',sans-serif",fontWeight:600}}>Editar</button>
                </div>
              </div>
            </Card>;
          })}
        </div>
      )}

      {view==="chart"&&(
        <div style={{padding:"12px 14px",animation:"fadeUp .35s ease"}}>
          <h3 style={{fontSize:16,fontWeight:700,color:"#8a5a6a",margin:"0 0 12px"}}>📊 Resumen de {MN[calM]}</h3>
          <Card style={{marginBottom:14}}>
            <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"#8a5a6a",textTransform:"uppercase",letterSpacing:.5}}>Gastos por categoría</p>
            <BarChart expenses={actExp}/>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <Card style={{textAlign:"center",background:"linear-gradient(135deg,#f0fae8,#e8f4e0)"}}>
              <span style={{fontSize:22}}>💚</span>
              <p style={{margin:"4px 0 0",fontSize:17,fontWeight:800,color:"#6a9a5a",fontFamily:"'Playfair Display',serif"}}>{fmt(totPaid)}</p>
              <p style={{margin:0,fontSize:10,color:"#8aaa7a",fontWeight:600}}>Ya pagaste</p>
            </Card>
            <Card style={{textAlign:"center",background:"linear-gradient(135deg,#fef0f2,#fce8ec)"}}>
              <span style={{fontSize:22}}>🔴</span>
              <p style={{margin:"4px 0 0",fontSize:17,fontWeight:800,color:"#c47a6a",fontFamily:"'Playfair Display',serif"}}>{fmt(totUnpaid)}</p>
              <p style={{margin:0,fontSize:10,color:"#c09090",fontWeight:600}}>Te falta</p>
            </Card>
          </div>
          <Card style={{textAlign:"center",marginBottom:14}}>
            <span style={{fontSize:30}}>{pct===100?"🏆":pct>=75?"🌟":pct>=50?"💪":pct>=25?"🌱":"🫧"}</span>
            <p style={{margin:"6px 0 2px",fontSize:16,fontWeight:700,color:"#8a5a6a"}}>
              {pct===100?"¡Mes completado! Eres increíble 🎉":pct>=75?"¡Ya casi! Un último empujón":pct>=50?"¡Vas por la mitad! Sigue así":pct>=25?"Buen comienzo, ¡tú puedes!":"¡Empecemos con todo!"}
            </p>
            <p style={{margin:0,fontSize:12,color:"#c0a0b0"}}>{streak} de {actExp.length} pagos realizados</p>
            <div style={{marginTop:10,height:12,borderRadius:6,background:"#f8eff4",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:6,background:"linear-gradient(90deg,#f0a6c0,#d4a0dc,#a0d4a0)",width:`${pct}%`,transition:"width .8s cubic-bezier(.4,0,.2,1)",backgroundSize:"200% 100%",animation:"shimmer 3s infinite linear"}}/>
            </div>
          </Card>
          {/* Income vs Expenses overview */}
          <Card>
            <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#8a5a6a",textTransform:"uppercase",letterSpacing:.5}}>Ingresos vs Gastos</p>
            <div style={{display:"flex",alignItems:"flex-end",gap:12,height:80}}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{background:"linear-gradient(180deg,#a0d4a0,#80c080)",borderRadius:"8px 8px 0 0",height:`${allTot>0?Math.max((totInc/Math.max(totInc,allTot))*70,8):8}px`,transition:"height .6s ease",marginBottom:4}}/>
                <span style={{fontSize:10,fontWeight:700,color:"#6a9a5a"}}>Ingresos</span>
                <p style={{margin:0,fontSize:12,fontWeight:700,color:"#5a3a4a"}}>{fmtShort(totInc)}</p>
              </div>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{background:"linear-gradient(180deg,#f0a6c0,#d4a0dc)",borderRadius:"8px 8px 0 0",height:`${allTot>0?Math.max((allTot/Math.max(totInc,allTot))*70,8):8}px`,transition:"height .6s ease",marginBottom:4}}/>
                <span style={{fontSize:10,fontWeight:700,color:"#c47a9a"}}>Gastos</span>
                <p style={{margin:0,fontSize:12,fontWeight:700,color:"#5a3a4a"}}>{fmtShort(allTot)}</p>
              </div>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{background:totInc>=allTot?"linear-gradient(180deg,#b8e0b8,#90c890)":"linear-gradient(180deg,#f0c0c0,#d4a0a0)",borderRadius:"8px 8px 0 0",height:`${Math.max(Math.abs(totInc-allTot)/Math.max(totInc,allTot,1)*70,8)}px`,transition:"height .6s ease",marginBottom:4}}/>
                <span style={{fontSize:10,fontWeight:700,color:totInc>=allTot?"#6a9a5a":"#c47a6a"}}>{totInc>=allTot?"Sobra":"Falta"}</span>
                <p style={{margin:0,fontSize:12,fontWeight:700,color:"#5a3a4a"}}>{fmtShort(Math.abs(totInc-allTot))}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      <Modal open={showAddInc} onClose={()=>{setShowAddInc(false);setFormErr("");}}>
        <div style={{textAlign:"center",marginBottom:12}}><span style={{fontSize:36}}>💵</span></div>
        {formErr&&<p style={{margin:"0 0 10px",fontSize:12,color:"#e06060",fontWeight:600,textAlign:"center",animation:"wobble .3s ease"}}>{formErr}</p>}
        <Field label="Monto en COP">
          <input type="number" inputMode="numeric" value={incAmt} onChange={e=>setIncAmt(e.target.value)} placeholder="Ej: 250000" style={iS} autoFocus/>
        </Field>
        <Field label="Nota (opcional)">
          <input value={incNote} onChange={e=>setIncNote(e.target.value)} placeholder="Tango Live" style={iS}/>
        </Field>
        <button onClick={addIncome} style={{...bP,opacity:incAmt?"1":".6"}}>Agregar ingreso ✨</button>
      </Modal>

      <Modal open={showAddExp||editExp!==null} onClose={()=>{setShowAddExp(false);setEditExp(null);resetF();}}>
        <div style={{textAlign:"center",marginBottom:8}}><span style={{fontSize:32}}>{editExp?"✏️":"📋"}</span></div>
        {formErr&&<p style={{margin:"0 0 10px",fontSize:12,color:"#e06060",fontWeight:600,textAlign:"center",animation:"wobble .3s ease"}}>{formErr}</p>}
        <Field label="Nombre del gasto">
          <input value={expName} onChange={e=>setExpName(e.target.value)} placeholder="Ej: Netflix, Pañales..." style={iS} autoFocus/>
        </Field>
        <Field label="Monto (COP)">
          <input type="number" inputMode="numeric" value={expAmt} onChange={e=>setExpAmt(e.target.value)} placeholder="50000" style={iS}/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <Field label="Día">
            <input type="number" inputMode="numeric" min="1" max="31" value={expDay} onChange={e=>setExpDay(e.target.value)} style={iS}/>
          </Field>
          <Field label="Mes">
            <select value={expMonth} onChange={e=>setExpMonth(e.target.value)} style={{...iS,appearance:"auto"}}>
              <option value="">Todos</option>
              {MN.map((m,i)=><option key={i} value={i}>{m.slice(0,3)}</option>)}
            </select>
          </Field>
          <Field label="Año">
            <select value={expYear} onChange={e=>setExpYear(e.target.value)} style={{...iS,appearance:"auto"}}>
              <option value="">Todos</option>
              {[2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Frecuencia">
          <div style={{display:"flex",gap:6}}>
            {Object.entries(FREQ).map(([k,v])=><Pill key={k} active={expFreq===k} onClick={()=>setExpFreq(k)} small>{v}</Pill>)}
          </div>
        </Field>
        <Field label="Categoría">
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {Object.entries(CATS).map(([k,v])=><Pill key={k} active={expCat===k} onClick={()=>setExpCat(k)} color={v.color} small>{v.icon} {v.label}</Pill>)}
          </div>
        </Field>
        <button onClick={editExp?updateExpense:addExpense} style={{...bP,marginBottom:editExp?10:0,opacity:(expName&&expAmt)?"1":".6"}}>
          {editExp?"Guardar cambios":"Agregar gasto"} ✨
        </button>
        {editExp&&<button onClick={()=>requestDelete(editExp.id)} style={{...bP,background:"#fff",color:"#d46060",border:"1.5px solid #f0c0c0",boxShadow:"none"}}>Eliminar gasto 🗑️</button>}
      </Modal>
    </div>
  );
}

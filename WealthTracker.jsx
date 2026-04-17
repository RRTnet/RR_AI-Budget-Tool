import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

// ── Colour palette ────────────────────────────────────────────────
const G = {
  bg:       "#0a0c10",
  surface:  "#111318",
  card:     "#161a22",
  border:   "#1e2430",
  gold:     "#c9a84c",
  goldSoft: "#e8c97a",
  goldFade: "rgba(201,168,76,0.12)",
  green:    "#22c55e",
  red:      "#ef4444",
  blue:     "#3b82f6",
  muted:    "#4a5568",
  text:     "#e2e8f0",
  textSoft: "#94a3b8",
};

// ── Seed data ─────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const initIncome = [
  { id:1, label:"Salary",       amount:8500, category:"salary",    date:"2025-03-01" },
  { id:2, label:"Freelance",    amount:1200, category:"freelance", date:"2025-03-10" },
  { id:3, label:"Investments",  amount:430,  category:"invest",    date:"2025-03-15" },
];
const initExpenses = [
  { id:1, label:"Rent",         amount:1800, category:"housing",   date:"2025-03-01" },
  { id:2, label:"Groceries",    amount:420,  category:"food",      date:"2025-03-05" },
  { id:3, label:"Electricity",  amount:95,   category:"utilities", date:"2025-03-06" },
  { id:4, label:"Netflix",      amount:18,   category:"entertain", date:"2025-03-08" },
  { id:5, label:"Gym",          amount:50,   category:"health",    date:"2025-03-10" },
  { id:6, label:"Car Fuel",     amount:120,  category:"transport", date:"2025-03-12" },
  { id:7, label:"Dining Out",   amount:210,  category:"food",      date:"2025-03-18" },
  { id:8, label:"Clothes",      amount:180,  category:"shopping",  date:"2025-03-20" },
];

const wealthHistory = [
  { month:"Sep", savings:2100, expenses:2800, income:9800 },
  { month:"Oct", savings:2500, expenses:2600, income:10100 },
  { month:"Nov", savings:3200, expenses:2400, income:9900 },
  { month:"Dec", savings:2800, expenses:3100, income:10300 },
  { month:"Jan", savings:3500, expenses:2700, income:10130 },
  { month:"Feb", savings:4100, expenses:2600, income:10200 },
  { month:"Mar", savings:8130, expenses:2893, income:10130, current:true },
];

const goalData = [
  { name:"Emergency Fund",   target:20000, saved:12400, color:"#c9a84c" },
  { name:"Dream Vacation",   target:8000,  saved:3200,  color:"#3b82f6" },
  { name:"Investment Fund",  target:50000, saved:18750, color:"#22c55e" },
  { name:"New Car",          target:30000, saved:6000,  color:"#a855f7" },
];

const EXPENSE_CATS = {
  housing:"🏠",food:"🍽️",utilities:"⚡",entertain:"🎬",
  health:"💪",transport:"🚗",shopping:"🛍️",other:"📦"
};
const INCOME_CATS  = { salary:"💼", freelance:"💻", invest:"📈", other:"💰" };

// ── Helpers ───────────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const pct  = (a,b) => b ? Math.round((a/b)*100) : 0;
const uid  = () => Date.now() + Math.random();

// ── Tiny components ───────────────────────────────────────────────
const Divider = () => <div style={{height:1,background:G.border,margin:"16px 0"}} />;

const Badge = ({label,color}) => (
  <span style={{
    fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,
    background:`${color}20`,color,border:`1px solid ${color}40`,
  }}>{label}</span>
);

const Stat = ({label,value,sub,accent=G.gold,big}) => (
  <div style={{display:"flex",flexDirection:"column",gap:4}}>
    <span style={{fontSize:12,color:G.textSoft,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</span>
    <span style={{fontSize:big?36:22,fontWeight:700,color:accent,fontFamily:"'Playfair Display',serif"}}>{value}</span>
    {sub && <span style={{fontSize:12,color:G.textSoft}}>{sub}</span>}
  </div>
);

const Card = ({children,style={}}) => (
  <div style={{
    background:G.card,border:`1px solid ${G.border}`,borderRadius:16,
    padding:24,...style
  }}>{children}</div>
);

const NavBtn = ({label,icon,active,onClick}) => (
  <button onClick={onClick} style={{
    display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:10,
    border:"none",cursor:"pointer",width:"100%",textAlign:"left",
    background: active ? G.goldFade : "transparent",
    color: active ? G.gold : G.textSoft,
    fontWeight: active ? 600 : 400,fontSize:14,
    borderLeft: active ? `2px solid ${G.gold}` : "2px solid transparent",
    transition:"all 0.2s",
  }}><span style={{fontSize:18}}>{icon}</span>{label}</button>
);

// Custom tooltip
const CustomTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:10,padding:"10px 14px"}}>
      <p style={{color:G.textSoft,fontSize:12,marginBottom:4}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color,fontSize:13,fontWeight:600}}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── VIEWS ─────────────────────────────────────────────────────────

// Dashboard
function Dashboard({income,expenses}) {
  const totalIncome   = income.reduce((s,i)=>s+i.amount,0);
  const totalExpenses = expenses.reduce((s,i)=>s+i.amount,0);
  const savings       = totalIncome - totalExpenses;
  const savingsRate   = pct(savings,totalIncome);
  const wealthScore   = Math.min(100, Math.round(savingsRate * 1.8));

  const pieData = Object.entries(
    expenses.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc},{})
  ).map(([k,v])=>({name:k,value:v}));

  const PIE_COLORS = [G.gold,"#3b82f6","#22c55e","#a855f7","#ef4444","#f97316","#06b6d4","#ec4899"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      {/* Hero stats */}
      <div style={{
        background:`linear-gradient(135deg,#1a1505 0%,#161a22 60%,#0a0c10 100%)`,
        border:`1px solid ${G.border}`,borderRadius:20,padding:32,
        position:"relative",overflow:"hidden"
      }}>
        <div style={{
          position:"absolute",top:-60,right:-60,width:200,height:200,
          borderRadius:"50%",background:`radial-gradient(circle,${G.gold}15,transparent 70%)`,
          pointerEvents:"none"
        }}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:24}}>
          <div>
            <p style={{color:G.textSoft,fontSize:13,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>
              Monthly Net Worth Growth
            </p>
            <p style={{
              fontSize:52,fontWeight:700,color:G.goldSoft,
              fontFamily:"'Playfair Display',serif",margin:0,lineHeight:1
            }}>{fmt(savings)}</p>
            <p style={{color:G.green,fontSize:14,marginTop:8}}>
              ↑ {savingsRate}% savings rate · You're building wealth! 🏆
            </p>
          </div>
          <div style={{display:"flex",gap:32,flexWrap:"wrap"}}>
            <Stat label="Total Income"   value={fmt(totalIncome)}   accent={G.green} />
            <Stat label="Total Spending" value={fmt(totalExpenses)} accent={G.red} />
            <Stat label="Wealth Score"   value={`${wealthScore}/100`} accent={G.gold}
              sub={wealthScore>70?"Excellent 🌟":wealthScore>50?"Good 👍":"Needs Work"} />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <Card>
          <h3 style={{color:G.text,marginBottom:4,fontSize:15,fontWeight:600}}>6-Month Wealth Trajectory</h3>
          <p style={{color:G.textSoft,fontSize:12,marginBottom:20}}>Income · Expenses · Savings</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={wealthHistory}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G.green} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={G.green} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G.gold}  stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={G.gold}  stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={G.border}/>
              <XAxis dataKey="month" stroke={G.muted} fontSize={11}/>
              <YAxis stroke={G.muted} fontSize={11} tickFormatter={v=>`$${v/1000}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="income"   stroke={G.green} fill="url(#gInc)" name="Income"   strokeWidth={2}/>
              <Area type="monotone" dataKey="savings"  stroke={G.gold}  fill="url(#gSav)" name="Savings"  strokeWidth={2}/>
              <Area type="monotone" dataKey="expenses" stroke={G.red}   fill="none"       name="Expenses" strokeWidth={2} strokeDasharray="4 2"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{color:G.text,marginBottom:4,fontSize:15,fontWeight:600}}>Spending Breakdown</h3>
          <p style={{color:G.textSoft,fontSize:12,marginBottom:12}}>This month by category</p>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={pieData} cx={70} cy={70} innerRadius={45} outerRadius={70}
                  dataKey="value" paddingAngle={2}>
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
              {pieData.map((d,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                    <span style={{color:G.textSoft,fontSize:12,textTransform:"capitalize"}}>{d.name}</span>
                  </div>
                  <span style={{color:G.text,fontSize:12,fontWeight:600}}>{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Wealth Goals */}
      <Card>
        <h3 style={{color:G.text,marginBottom:4,fontSize:15,fontWeight:600}}>🎯 Wealth Goals Progress</h3>
        <p style={{color:G.textSoft,fontSize:12,marginBottom:20}}>Track your path to financial independence</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
          {goalData.map((g,i)=>{
            const p = pct(g.saved,g.target);
            return (
              <div key={i} style={{background:G.surface,borderRadius:12,padding:16,border:`1px solid ${G.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{color:G.text,fontSize:13,fontWeight:600}}>{g.name}</span>
                  <span style={{color:g.color,fontSize:13,fontWeight:700}}>{p}%</span>
                </div>
                <div style={{background:G.border,borderRadius:99,height:6,marginBottom:8}}>
                  <div style={{width:`${p}%`,background:g.color,height:"100%",borderRadius:99,
                    boxShadow:`0 0 8px ${g.color}60`,transition:"width 0.5s"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:G.textSoft,fontSize:11}}>{fmt(g.saved)} saved</span>
                  <span style={{color:G.textSoft,fontSize:11}}>Target: {fmt(g.target)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// Income View
function IncomeView({income,setIncome}) {
  const [form,setForm] = useState({label:"",amount:"",category:"salary",date:""});
  const [showForm,setShowForm] = useState(false);

  const add = () => {
    if(!form.label||!form.amount) return;
    setIncome(p=>[...p,{...form,id:uid(),amount:parseFloat(form.amount)}]);
    setForm({label:"",amount:"",category:"salary",date:""});
    setShowForm(false);
  };
  const remove = (id) => setIncome(p=>p.filter(i=>i.id!==id));

  const total = income.reduce((s,i)=>s+i.amount,0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{color:G.text,margin:0,fontSize:20,fontFamily:"'Playfair Display',serif"}}>Income Streams</h2>
          <p style={{color:G.textSoft,fontSize:13,margin:"4px 0 0"}}>Total this month: <span style={{color:G.green,fontWeight:700}}>{fmt(total)}</span></p>
        </div>
        <button onClick={()=>setShowForm(p=>!p)} style={{
          background:G.gold,color:"#000",border:"none",borderRadius:10,
          padding:"10px 20px",fontWeight:700,cursor:"pointer",fontSize:14
        }}>+ Add Income</button>
      </div>

      {showForm && (
        <Card style={{borderColor:G.gold+"40"}}>
          <h3 style={{color:G.gold,margin:"0 0 16px",fontSize:14,fontWeight:600}}>New Income Entry</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[
              {key:"label",ph:"Description (e.g. Salary)"},
              {key:"amount",ph:"Amount ($)",type:"number"},
              {key:"date",ph:"Date",type:"date"},
            ].map(f=>(
              <input key={f.key} type={f.type||"text"} placeholder={f.ph}
                value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:8,
                  padding:"10px 14px",color:G.text,fontSize:13,outline:"none"}}/>
            ))}
            <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
              style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:8,
                padding:"10px 14px",color:G.text,fontSize:13}}>
              {Object.entries(INCOME_CATS).map(([k,v])=>(
                <option key={k} value={k}>{v} {k.charAt(0).toUpperCase()+k.slice(1)}</option>
              ))}
            </select>
          </div>
          <div style={{display:"flex",gap:10,marginTop:12}}>
            <button onClick={add} style={{background:G.gold,color:"#000",border:"none",borderRadius:8,
              padding:"10px 24px",fontWeight:700,cursor:"pointer"}}>Save</button>
            <button onClick={()=>setShowForm(false)} style={{background:"transparent",color:G.textSoft,
              border:`1px solid ${G.border}`,borderRadius:8,padding:"10px 24px",cursor:"pointer"}}>Cancel</button>
          </div>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {income.map(i=>(
          <div key={i.id} style={{
            background:G.card,border:`1px solid ${G.border}`,borderRadius:12,
            padding:"14px 20px",display:"flex",alignItems:"center",gap:16
          }}>
            <span style={{fontSize:24}}>{INCOME_CATS[i.category]||"💰"}</span>
            <div style={{flex:1}}>
              <p style={{color:G.text,margin:0,fontWeight:600,fontSize:14}}>{i.label}</p>
              <p style={{color:G.textSoft,margin:"2px 0 0",fontSize:12}}>{i.category} · {i.date}</p>
            </div>
            <span style={{color:G.green,fontWeight:700,fontSize:16}}>{fmt(i.amount)}</span>
            <button onClick={()=>remove(i.id)} style={{
              background:"transparent",border:"none",color:G.muted,cursor:"pointer",
              fontSize:16,padding:"4px 8px"
            }}>✕</button>
          </div>
        ))}
      </div>

      <Card>
        <h3 style={{color:G.text,margin:"0 0 16px",fontSize:14,fontWeight:600}}>Income by Category</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={Object.entries(income.reduce((a,i)=>{
            a[i.category]=(a[i.category]||0)+i.amount;return a;},{})).map(([k,v])=>({name:k,amount:v}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={G.border}/>
            <XAxis dataKey="name" stroke={G.muted} fontSize={11}/>
            <YAxis stroke={G.muted} fontSize={11} tickFormatter={v=>`$${v/1000}k`}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="amount" name="Amount" fill={G.green} radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// Expenses View
function ExpensesView({expenses,setExpenses}) {
  const [form,setForm] = useState({label:"",amount:"",category:"food",date:""});
  const [showForm,setShowForm] = useState(false);
  const [filter,setFilter] = useState("all");

  const add = () => {
    if(!form.label||!form.amount) return;
    setExpenses(p=>[...p,{...form,id:uid(),amount:parseFloat(form.amount)}]);
    setForm({label:"",amount:"",category:"food",date:""});
    setShowForm(false);
  };
  const remove = (id) => setExpenses(p=>p.filter(e=>e.id!==id));

  const total   = expenses.reduce((s,e)=>s+e.amount,0);
  const visible = filter==="all" ? expenses : expenses.filter(e=>e.category===filter);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{color:G.text,margin:0,fontSize:20,fontFamily:"'Playfair Display',serif"}}>Expenses</h2>
          <p style={{color:G.textSoft,fontSize:13,margin:"4px 0 0"}}>Total: <span style={{color:G.red,fontWeight:700}}>{fmt(total)}</span></p>
        </div>
        <button onClick={()=>setShowForm(p=>!p)} style={{
          background:"#ef444420",color:G.red,border:`1px solid #ef444440`,
          borderRadius:10,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontSize:14
        }}>+ Add Expense</button>
      </div>

      {/* Category filter */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {["all",...Object.keys(EXPENSE_CATS)].map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{
            padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===c?G.gold:G.border}`,
            background: filter===c ? G.goldFade : "transparent",
            color: filter===c ? G.gold : G.textSoft,cursor:"pointer",fontSize:12,fontWeight:filter===c?600:400
          }}>{c==="all"?"All":EXPENSE_CATS[c]+" "+c}</button>
        ))}
      </div>

      {showForm && (
        <Card style={{borderColor:"#ef444440"}}>
          <h3 style={{color:G.red,margin:"0 0 16px",fontSize:14,fontWeight:600}}>New Expense</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{key:"label",ph:"Description"},{key:"amount",ph:"Amount ($)",type:"number"},{key:"date",ph:"Date",type:"date"}]
              .map(f=>(
              <input key={f.key} type={f.type||"text"} placeholder={f.ph}
                value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:8,
                  padding:"10px 14px",color:G.text,fontSize:13,outline:"none"}}/>
            ))}
            <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
              style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:8,
                padding:"10px 14px",color:G.text,fontSize:13}}>
              {Object.entries(EXPENSE_CATS).map(([k,v])=>(
                <option key={k} value={k}>{v} {k.charAt(0).toUpperCase()+k.slice(1)}</option>
              ))}
            </select>
          </div>
          <div style={{display:"flex",gap:10,marginTop:12}}>
            <button onClick={add} style={{background:G.red,color:"#fff",border:"none",borderRadius:8,
              padding:"10px 24px",fontWeight:700,cursor:"pointer"}}>Save</button>
            <button onClick={()=>setShowForm(false)} style={{background:"transparent",color:G.textSoft,
              border:`1px solid ${G.border}`,borderRadius:8,padding:"10px 24px",cursor:"pointer"}}>Cancel</button>
          </div>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {visible.map(e=>(
          <div key={e.id} style={{
            background:G.card,border:`1px solid ${G.border}`,borderRadius:12,
            padding:"14px 20px",display:"flex",alignItems:"center",gap:16
          }}>
            <span style={{fontSize:24}}>{EXPENSE_CATS[e.category]||"📦"}</span>
            <div style={{flex:1}}>
              <p style={{color:G.text,margin:0,fontWeight:600,fontSize:14}}>{e.label}</p>
              <p style={{color:G.textSoft,margin:"2px 0 0",fontSize:12}}>{e.category} · {e.date}</p>
            </div>
            <span style={{color:G.red,fontWeight:700,fontSize:16}}>{fmt(e.amount)}</span>
            <button onClick={()=>remove(e.id)} style={{
              background:"transparent",border:"none",color:G.muted,cursor:"pointer",fontSize:16,padding:"4px 8px"
            }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Summary View
function SummaryView({income,expenses}) {
  const totalIncome   = income.reduce((s,i)=>s+i.amount,0);
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
  const savings       = totalIncome - totalExpenses;
  const rate          = pct(savings,totalIncome);

  const projected = Array.from({length:12},(_,i)=>({
    month: MONTHS[i],
    wealth: Math.round(savings * (i+1) * 1.06**(i/12)),
  }));

  const tips = [
    {icon:"🎯",msg:`Your savings rate is ${rate}%. Aim for 20%+ to build wealth fast.`},
    {icon:"📈",msg:`Invest ${fmt(savings*0.5)} of your savings monthly for compound growth.`},
    {icon:"✂️",msg:`Your top expense is ${expenses.sort((a,b)=>b.amount-a.amount)[0]?.label}. Review it.`},
    {icon:"🏦",msg:`Emergency fund target: ${fmt(totalExpenses*6)}. Keep building!`},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <h2 style={{color:G.text,margin:0,fontSize:20,fontFamily:"'Playfair Display',serif"}}>Monthly Summary & Forecast</h2>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
        {[
          {label:"Total Income",  val:fmt(totalIncome),  color:G.green, icon:"💵"},
          {label:"Total Expenses",val:fmt(totalExpenses), color:G.red,   icon:"💸"},
          {label:"Net Savings",   val:fmt(savings),       color:G.gold,  icon:"🏆"},
        ].map((c,i)=>(
          <Card key={i} style={{textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>{c.icon}</div>
            <p style={{color:G.textSoft,fontSize:12,margin:"0 0 4px"}}>{c.label}</p>
            <p style={{color:c.color,fontSize:24,fontWeight:700,margin:0,fontFamily:"'Playfair Display',serif"}}>{c.val}</p>
          </Card>
        ))}
      </div>

      {/* Savings rate bar */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{color:G.text,fontWeight:600}}>Savings Rate</span>
          <span style={{color:G.gold,fontWeight:700}}>{rate}%</span>
        </div>
        <div style={{background:G.border,borderRadius:99,height:10}}>
          <div style={{width:`${Math.min(rate,100)}%`,background:`linear-gradient(90deg,${G.gold},${G.green})`,
            height:"100%",borderRadius:99,boxShadow:`0 0 12px ${G.gold}50`,transition:"width 0.5s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
          <span style={{color:G.textSoft,fontSize:11}}>0%</span>
          <span style={{color:G.textSoft,fontSize:11}}>Excellent: 30%+</span>
          <span style={{color:G.textSoft,fontSize:11}}>100%</span>
        </div>
      </Card>

      {/* 12-month wealth projection */}
      <Card>
        <h3 style={{color:G.text,margin:"0 0 4px",fontSize:15,fontWeight:600}}>💰 12-Month Wealth Projection</h3>
        <p style={{color:G.textSoft,fontSize:12,marginBottom:20}}>At current savings rate with 6% annual investment return</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={projected}>
            <defs>
              <linearGradient id="gWealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={G.gold} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={G.gold} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={G.border}/>
            <XAxis dataKey="month" stroke={G.muted} fontSize={11}/>
            <YAxis stroke={G.muted} fontSize={11} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="wealth" name="Projected Wealth"
              stroke={G.gold} fill="url(#gWealth)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* AI Tips */}
      <Card>
        <h3 style={{color:G.gold,margin:"0 0 16px",fontSize:14,fontWeight:600}}>🤖 Financial Insights</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {tips.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"12px 16px",
              background:G.surface,borderRadius:10,border:`1px solid ${G.border}`}}>
              <span style={{fontSize:20}}>{t.icon}</span>
              <p style={{color:G.textSoft,margin:0,fontSize:13,lineHeight:1.5}}>{t.msg}</p>
            </div>
          ))}
        </div>
        <p style={{color:G.muted,fontSize:11,marginTop:12,textAlign:"center"}}>
          🚀 Step 5: Connect to your local gpt-oss:120b on DGX Spark for personalized AI advice
        </p>
      </Card>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function WealthTracker() {
  const [view,setView]         = useState("dashboard");
  const [income,setIncome]     = useState(initIncome);
  const [expenses,setExpenses] = useState(initExpenses);

  const nav = [
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"income",   icon:"💵",label:"Income"},
    {id:"expenses", icon:"💸",label:"Expenses"},
    {id:"summary",  icon:"🏆",label:"Summary & Goals"},
  ];

  const totalIncome   = income.reduce((s,i)=>s+i.amount,0);
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
  const savings       = totalIncome - totalExpenses;

  return (
    <div style={{minHeight:"100vh",background:G.bg,fontFamily:"'DM Sans',sans-serif",display:"flex"}}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${G.bg}; }
        ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 3px; }
        input::placeholder { color: ${G.muted}; }
        input, select { color-scheme: dark; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width:240,background:G.surface,borderRight:`1px solid ${G.border}`,
        display:"flex",flexDirection:"column",padding:24,gap:8,flexShrink:0,minHeight:"100vh"
      }}>
        {/* Logo */}
        <div style={{marginBottom:24}}>
          <p style={{
            fontSize:22,fontWeight:700,color:G.gold,
            fontFamily:"'Playfair Display',serif",margin:0
          }}>💎 WealthTracker</p>
          <p style={{color:G.textSoft,fontSize:11,margin:"2px 0 0",letterSpacing:"0.1em"}}>
            PERSONAL FINANCE OS
          </p>
        </div>

        {nav.map(n=>(
          <NavBtn key={n.id} {...n} active={view===n.id} onClick={()=>setView(n.id)}/>
        ))}

        <div style={{flex:1}}/>
        <Divider/>

        {/* Quick stats in sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            {label:"Income",  val:fmt(totalIncome),   color:G.green},
            {label:"Expenses",val:fmt(totalExpenses),  color:G.red},
            {label:"Savings", val:fmt(savings),        color:G.gold},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{color:G.textSoft,fontSize:12}}>{s.label}</span>
              <span style={{color:s.color,fontSize:12,fontWeight:700}}>{s.val}</span>
            </div>
          ))}
        </div>

        <div style={{marginTop:16,padding:"10px 12px",background:G.goldFade,
          borderRadius:10,border:`1px solid ${G.gold}30`}}>
          <p style={{color:G.gold,fontSize:11,fontWeight:600,margin:"0 0 2px"}}>DGX Spark Ready</p>
          <p style={{color:G.textSoft,fontSize:10}}>AI advisor powered by gpt-oss:120b</p>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,padding:32,overflowY:"auto",maxHeight:"100vh"}}>
        {view==="dashboard" && <Dashboard income={income} expenses={expenses}/>}
        {view==="income"    && <IncomeView income={income} setIncome={setIncome}/>}
        {view==="expenses"  && <ExpensesView expenses={expenses} setExpenses={setExpenses}/>}
        {view==="summary"   && <SummaryView income={income} expenses={expenses}/>}
      </div>
    </div>
  );
}

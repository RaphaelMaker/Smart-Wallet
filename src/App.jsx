import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://xyzykxhrimhwqnnyjecw.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enlreGhyaW1od3FubnlqZWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDQ3NDEsImV4cCI6MjA5Mjk4MDc0MX0.PGAxWpm7jRBiJN1-moR5ndTcGKLpsxqCT9tnc2OpV6U";
const GRUPO_ID      = "smart-wallet-casal";
const supabase      = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── CATEGORIAS ───────────────────────────────────────────────────────────────
const CATS     = ["Alimentação","Delivery","Transporte","Streaming","Assinaturas","Saúde","Moradia","Educação","Lazer","Vestuário","Renda","Outros"];
const CAT_ICON = { Alimentação:"🍽️",Delivery:"🛵",Transporte:"🚗",Assinaturas:"📱",Streaming:"🎬",Saúde:"💊",Educação:"📚",Lazer:"🎮",Moradia:"🏠",Vestuário:"👕",Renda:"💰",Outros:"💸" };
const RULES    = {
  Delivery:    ["ifood","rappi","uber eats","james"],
  Transporte:  ["uber","99pop","cabify","metro","gasolina","posto"],
  Streaming:   ["netflix","spotify","disney","hbo","prime","deezer"],
  Assinaturas: ["adobe","microsoft","icloud","notion","github"],
  Alimentação: ["supermercado","mercado","padaria","extra","carrefour","pão de açúcar"],
  Saúde:       ["farmácia","drogaria","hospital","médico","dentista","academia","smart fit"],
  Moradia:     ["aluguel","condomínio","luz","água","internet","gás","enel","sabesp"],
  Educação:    ["escola","faculdade","curso","udemy","coursera","alura"],
  Lazer:       ["cinema","bar","restaurante","steam","playstation","show"],
  Vestuário:   ["zara","renner","c&a","nike","adidas","shein"],
  Renda:       ["salário","freelance","pix recebido","transferência recebida"],
};
const autoCat = d => { const l=d.toLowerCase(); for (const [c,ws] of Object.entries(RULES)) if (ws.some(w=>l.includes(w))) return c; return "Outros"; };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt     = v  => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const fmtD    = d  => new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
const today   = () => new Date().toISOString().split("T")[0];
const isMob   = () => window.innerWidth < 768;

// ─── CSS GLOBAL ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080b12; font-family: 'Sora', sans-serif; color: #e2e8f0; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e2535; border-radius: 4px; }
  input, select, button, textarea { font-family: 'Sora', sans-serif; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
  @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:.4; } }
  @keyframes bounce   { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
  @keyframes shimmer  { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  .fade-up { animation: fadeUp .35s ease both; }
`;

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:      "#080b12",
  surface: "#0f1520",
  card:    "#131926",
  border:  "#1a2235",
  accent:  "#22d3ee",
  green:   "#4ade80",
  red:     "#f87171",
  amber:   "#fbbf24",
  purple:  "#a78bfa",
  muted:   "#4a5568",
  dim:     "#2d3748",
  text:    "#e2e8f0",
  sub:     "#64748b",
};

// ─── BASE UI ──────────────────────────────────────────────────────────────────
const card = (extra={}) => ({
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  ...extra,
});

const Field = ({label, ...p}) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{color:C.sub,fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",display:"block",marginBottom:7}}>{label}</label>}
    <input {...p} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 14px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",...p.style}}
      onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
  </div>
);

const Drop = ({label,options,...p}) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{color:C.sub,fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",display:"block",marginBottom:7}}>{label}</label>}
    <select {...p} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 14px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box"}}>
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  </div>
);

const Btn = ({children,variant="primary",size="md",...p}) => {
  const bg  = {primary:`linear-gradient(135deg,${C.accent},#3b82f6)`,ghost:`${C.surface}`,danger:`#f8717115`}[variant];
  const col = {primary:"#000",ghost:C.sub,danger:C.red}[variant];
  const bd  = {primary:"none",ghost:`1px solid ${C.border}`,danger:`1px solid ${C.red}40`}[variant];
  const pad = size==="sm" ? "8px 14px" : "12px 20px";
  const fs  = size==="sm" ? 13 : 14;
  return (
    <button {...p} style={{padding:pad,borderRadius:11,border:bd,background:bg,color:col,fontWeight:600,fontSize:fs,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"opacity .15s",...p.style}}
      onMouseEnter={e=>e.currentTarget.style.opacity=".85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
      {children}
    </button>
  );
};

function Modal({title,onClose,children,width=440}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",animation:"fadeUp .25s ease"}}>
        <div style={{width:36,height:4,borderRadius:4,background:C.dim,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{color:C.text,fontSize:16,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({onLogin}) {
  const [nome,setNome]   = useState("");
  const [pin,setPin]     = useState("");
  const [modo,setModo]   = useState("login"); // login | cadastro
  const [erro,setErro]   = useState("");
  const [load,setLoad]   = useState(false);

  const entrar = async e => {
    e.preventDefault();
    if (!nome.trim()||!pin.trim()) return;
    setErro(""); setLoad(true);
    try {
      if (modo==="cadastro") {
        // Cria usuário
        const {data:exist} = await supabase.from("usuarios").select("id").eq("grupo_id",GRUPO_ID).eq("nome",nome.trim()).single();
        if (exist) { setErro("Esse nome já está em uso. Escolha outro."); setLoad(false); return; }
        const {error} = await supabase.from("usuarios").insert({grupo_id:GRUPO_ID,nome:nome.trim(),pin:pin.trim(),cor:["#22d3ee","#a78bfa","#4ade80","#fbbf24","#f87171"][Math.floor(Math.random()*5)]});
        if (error) throw error;
      } else {
        // Login
        const {data,error} = await supabase.from("usuarios").select("*").eq("grupo_id",GRUPO_ID).eq("nome",nome.trim()).eq("pin",pin.trim()).single();
        if (error||!data) { setErro("Nome ou PIN incorretos."); setLoad(false); return; }
      }
      localStorage.setItem("sw_nome",nome.trim());
      localStorage.setItem("sw_pin",pin.trim());
      onLogin(nome.trim());
    } catch(e) {
      setErro("Erro de conexão. Verifique o Supabase.");
    } finally { setLoad(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{GLOBAL_CSS}</style>
      {/* Logo */}
      <div style={{marginBottom:40,textAlign:"center"}} className="fade-up">
        <div style={{width:64,height:64,borderRadius:20,background:`linear-gradient(135deg,${C.accent},#3b82f6)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:800,color:"#000",margin:"0 auto 16px",boxShadow:`0 0 40px ${C.accent}40`}}>W</div>
        <h1 style={{fontSize:26,fontWeight:800,color:C.text,letterSpacing:"-0.5px"}}>Smart Wallet</h1>
        <p style={{color:C.sub,fontSize:14,marginTop:4}}>Finanças do casal em tempo real</p>
      </div>

      <div style={{...card({padding:28}),width:"100%",maxWidth:380}} className="fade-up">
        {/* Tabs */}
        <div style={{display:"flex",background:C.surface,borderRadius:12,padding:4,marginBottom:24}}>
          {["login","cadastro"].map(m=>(
            <button key={m} onClick={()=>{setModo(m);setErro("");}} style={{flex:1,padding:"10px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:modo===m?C.card:"transparent",color:modo===m?C.text:C.muted,transition:"all .2s"}}>
              {m==="login"?"Entrar":"Criar conta"}
            </button>
          ))}
        </div>

        {erro && <div style={{background:"#f8717115",border:"1px solid #f8717140",borderRadius:10,padding:"10px 14px",color:C.red,fontSize:13,marginBottom:16}}>{erro}</div>}

        <form onSubmit={entrar}>
          <Field label="Seu nome" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Raphael" required/>
          <Field label="PIN (4 dígitos)" type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="••••" maxLength={6} required/>
          {modo==="cadastro" && <p style={{color:C.sub,fontSize:12,marginTop:-8,marginBottom:14,lineHeight:1.5}}>Crie um PIN para entrar depois. Compartilhe o app com sua parceira — ela cria a conta dela com o PIN dela.</p>}
          <Btn type="submit" style={{width:"100%",justifyContent:"center",padding:14,fontSize:15,marginTop:4}} disabled={load}>
            {load?"Aguarde...":(modo==="login"?"Entrar →":"Criar conta →")}
          </Btn>
        </form>
      </div>

      <p style={{color:C.muted,fontSize:12,marginTop:20,textAlign:"center",maxWidth:300,lineHeight:1.6}}>
        Cada pessoa cria sua conta com seu nome e PIN. Os dados financeiros são compartilhados entre todos do grupo.
      </p>
    </div>
  );
}

// ─── HOOK DADOS ───────────────────────────────────────────────────────────────
function useData(nomeAtual) {
  const [txs,setTxs]       = useState([]);
  const [perfil,setPerfil] = useState(null);
  const [contas,setContas] = useState([]);
  const [orc,setOrc]       = useState({});
  const [users,setUsers]   = useState([]);
  const [online,setOnline] = useState([]);
  const [loading,setLoad]  = useState(true);

  useEffect(()=>{
    if (!nomeAtual) return;
    load();

    // Realtime transações
    const ch = supabase.channel("sw-realtime")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"transacoes",filter:`grupo_id=eq.${GRUPO_ID}`},
        p=>setTxs(prev=>[p.new,...prev]))
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"transacoes",filter:`grupo_id=eq.${GRUPO_ID}`},
        p=>setTxs(prev=>prev.map(t=>t.id===p.new.id?p.new:t)))
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"transacoes",filter:`grupo_id=eq.${GRUPO_ID}`},
        p=>setTxs(prev=>prev.filter(t=>t.id!==p.old.id)))
      .subscribe();

    // Presença
    const pres = supabase.channel("sw-presence")
      .on("presence",{event:"sync"},()=>{
        const st=pres.presenceState();
        setOnline(Object.values(st).flat().map(u=>u.nome));
      })
      .subscribe(async s=>{ if(s==="SUBSCRIBED") await pres.track({nome:nomeAtual}); });

    return ()=>{ supabase.removeChannel(ch); supabase.removeChannel(pres); };
  },[nomeAtual]);

  const load = async () => {
    setLoad(true);
    const [t,p,c,o,u] = await Promise.all([
      supabase.from("transacoes").select("*").eq("grupo_id",GRUPO_ID).order("data",{ascending:false}).limit(300),
      supabase.from("perfis").select("*").eq("grupo_id",GRUPO_ID).single(),
      supabase.from("contas").select("*").eq("grupo_id",GRUPO_ID),
      supabase.from("orcamentos").select("*").eq("grupo_id",GRUPO_ID),
      supabase.from("usuarios").select("nome,cor").eq("grupo_id",GRUPO_ID),
    ]);
    if(t.data)  setTxs(t.data);
    if(p.data)  setPerfil(p.data);
    if(c.data)  setContas(c.data);
    if(u.data)  setUsers(u.data);
    if(o.data){ const obj={}; o.data.forEach(x=>obj[x.categoria]=x.limite); setOrc(obj); }
    setLoad(false);
  };

  const addTx = async tx => {
    const {data} = await supabase.from("transacoes").insert({...tx,grupo_id:GRUPO_ID,autor:nomeAtual}).select().single();
    return data;
  };
  const updTx = async tx => { await supabase.from("transacoes").update(tx).eq("id",tx.id); };
  const delTx = async id  => { await supabase.from("transacoes").delete().eq("id",id); };
  const addCt = async c   => { const {data}=await supabase.from("contas").insert({...c,grupo_id:GRUPO_ID}).select().single(); setContas(p=>[...p,data]); };
  const delCt = async id  => { await supabase.from("contas").delete().eq("id",id); setContas(p=>p.filter(c=>c.id!==id)); };
  const saveOrc=async(cat,lim)=>{ await supabase.from("orcamentos").upsert({grupo_id:GRUPO_ID,categoria:cat,limite:lim},{onConflict:"grupo_id,categoria"}); setOrc(p=>({...p,[cat]:lim})); };
  const savePf =async d   => { await supabase.from("perfis").update(d).eq("grupo_id",GRUPO_ID); setPerfil(p=>({...p,...d})); };
  const impTxs =async novas=>{ const rows=novas.map(t=>({...t,grupo_id:GRUPO_ID,autor:nomeAtual})); const {data}=await supabase.from("transacoes").insert(rows).select(); if(data) setTxs(p=>[...data,...p]); };

  return {txs,perfil,contas,orc,users,online,loading,addTx,updTx,delTx,addCt,delCt,saveOrc,savePf,impTxs,reload:load};
}

// ─── BOTTOM NAV (mobile) ──────────────────────────────────────────────────────
function BottomNav({active,setActive,nomeAtual,cor}) {
  const items=[
    {id:"dashboard",icon:"◈",label:"Início"},
    {id:"transactions",icon:"⇄",label:"Lançar"},
    {id:"budgets",icon:"◎",label:"Limites"},
    {id:"settings",icon:"◌",label:"Config"},
  ];
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,8px)"}}>
      {items.map(it=>(
        <button key={it.id} onClick={()=>setActive(it.id)} style={{flex:1,padding:"10px 0 6px",border:"none",background:"none",color:active===it.id?C.accent:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <span style={{fontSize:20}}>{it.icon}</span>
          <span style={{fontSize:10,fontWeight:active===it.id?700:400}}>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── HEADER MOBILE ────────────────────────────────────────────────────────────
function Header({title,nomeAtual,online,users,cor,onAdd}) {
  const userObj = users.find(u=>u.nome===nomeAtual);
  const userCor = userObj?.cor || C.accent;
  return (
    <div style={{position:"sticky",top:0,background:`${C.bg}ee`,backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.border}`,padding:"14px 20px",zIndex:50,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <h1 style={{fontSize:18,fontWeight:700,color:C.text}}>{title}</h1>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
          {online.map(n=>{
            const u=users.find(x=>x.nome===n);
            return <div key={n} title={n} style={{width:18,height:18,borderRadius:"50%",background:u?.cor||C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#000",border:`2px solid ${C.bg}`,boxShadow:`0 0 8px ${u?.cor||C.accent}60`}}>{n[0]}</div>;
          })}
          {online.length>0&&<span style={{color:C.sub,fontSize:11}}>{online.length===1?"1 online":`${online.length} online`}</span>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {onAdd && <Btn size="sm" onClick={onAdd} style={{borderRadius:30}}>+ Novo</Btn>}
        <div style={{width:34,height:34,borderRadius:"50%",background:userCor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#000"}}>{nomeAtual[0]}</div>
      </div>
    </div>
  );
}

// ─── FORM TRANSAÇÃO ───────────────────────────────────────────────────────────
function TxForm({inicial,contas,onSave,onClose}) {
  const [form,setForm]=useState({
    data:    inicial?.data||today(),
    valor:   inicial?Math.abs(inicial.valor).toFixed(2):"",
    tipo:    inicial?(inicial.valor<0?"gasto":"receita"):"gasto",
    descricao: inicial?.descricao||"",
    categoria: inicial?.categoria||"Outros",
    conta_id:  inicial?.conta_id||contas[0]?.id||null,
  });
  const set=k=>e=>{const v=e.target.value;setForm(f=>{const n={...f,[k]:v};if(k==="descricao")n.categoria=autoCat(v);return n;});};
  const submit=async e=>{
    e.preventDefault();
    if(!form.descricao.trim()||!form.valor)return;
    await onSave({...form,valor:parseFloat(form.valor)*(form.tipo==="gasto"?-1:1)});
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {["gasto","receita"].map(t=>(
          <button key={t} type="button" onClick={()=>setForm(f=>({...f,tipo:t}))} style={{padding:"14px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:600,fontSize:14,background:form.tipo===t?(t==="gasto"?"#f8717120":"#4ade8020"):`${C.surface}`,color:form.tipo===t?(t==="gasto"?C.red:C.green):C.muted,transition:"all .15s"}}>
            {t==="gasto"?"💸 Gasto":"💰 Receita"}
          </button>
        ))}
      </div>
      <Field label="Descrição" value={form.descricao} onChange={set("descricao")} placeholder="Ex: iFood, Salário, Uber..." required/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Field label="Valor (R$)" type="number" min="0" step="0.01" value={form.valor} onChange={set("valor")} placeholder="0,00" required/>
        <Field label="Data" type="date" value={form.data} onChange={set("data")} required/>
      </div>
      <Drop label="Categoria" value={form.categoria} onChange={set("categoria")} options={CATS.map(c=>({value:c,label:`${CAT_ICON[c]} ${c}`}))}/>
      {contas.length>0&&<Drop label="Conta" value={form.conta_id} onChange={set("conta_id")} options={contas.map(c=>({value:c.id,label:c.nome}))}/>}
      <Btn type="submit" style={{width:"100%",justifyContent:"center",padding:14,fontSize:15,marginTop:4}}>
        {inicial?"Salvar alterações":"Adicionar"}
      </Btn>
    </form>
  );
}

// ─── IMPORT CSV ───────────────────────────────────────────────────────────────
function ImportCSV({contas,onImport,onClose}) {
  const [step,setStep]=useState(1);
  const [rows,setRows]=useState([]);
  const [hdrs,setHdrs]=useState([]);
  const [map,setMap]  =useState({data:"",valor:"",descricao:""});
  const [cid,setCid]  =useState(contas[0]?.id||null);
  const [prev,setPrev]=useState([]);
  const [tot,setTot]  =useState(0);
  const [load,setLoad]=useState(false);
  const ref=useRef();

  const parse=t=>{const ls=t.trim().split(/\r?\n/);const sep=ls[0].includes(";")?";":",";const h=ls[0].split(sep).map(x=>x.trim().replace(/^"|"$/g,""));const d=ls.slice(1).filter(l=>l.trim()).map(l=>{const c=l.split(sep).map(x=>x.trim().replace(/^"|"$/g,""));const o={};h.forEach((hh,i)=>o[hh]=c[i]||"");return o;});return{h,d};};
  const onFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const{h,d}=parse(ev.target.result);setHdrs(h);setRows(d);const a={data:"",valor:"",descricao:""};h.forEach(hh=>{const l=hh.toLowerCase();if(/data|date|dt/.test(l))a.data=hh;if(/valor|value|amount/.test(l))a.valor=hh;if(/desc|hist|memo/.test(l))a.descricao=hh;});setMap(a);setStep(2);};r.readAsText(f,"utf-8");};
  const genPrev=()=>{if(!map.data||!map.valor||!map.descricao){alert("Mapeie as 3 colunas.");return;}setPrev(rows.slice(0,5).map((r,i)=>{const v=(r[map.valor]||"0").replace("R$","").replace(".","").replace(",",".").trim();return{id:i,data:r[map.data],valor:parseFloat(v)||0,descricao:r[map.descricao],categoria:autoCat(r[map.descricao])};}));setStep(3);};
  const confirm=async()=>{setLoad(true);const novas=rows.map((r)=>{const v=(r[map.valor]||"0").replace("R$","").replace(".","").replace(",",".").trim();return{data:r[map.data]||today(),valor:parseFloat(v)||0,descricao:r[map.descricao]||"Importado",categoria:autoCat(r[map.descricao]||""),conta_id:cid};}).filter(t=>t.descricao&&t.valor!==0);setTot(novas.length);await onImport(novas);setLoad(false);setStep(4);};

  return(
    <div>
      <div style={{display:"flex",gap:4,marginBottom:20}}>
        {["Upload","Mapear","Preview","✅"].map((s,i)=>(
          <div key={s} style={{flex:1,textAlign:"center"}}>
            <div style={{height:3,borderRadius:3,background:step>i?C.accent:C.border,marginBottom:4}}/>
            <span style={{fontSize:10,color:step>i?C.accent:C.muted,fontWeight:600}}>{s}</span>
          </div>
        ))}
      </div>

      {step===1&&<div>
        <div style={{border:`2px dashed ${C.border}`,borderRadius:14,padding:32,textAlign:"center",cursor:"pointer",background:C.surface}} onClick={()=>ref.current.click()}>
          <div style={{fontSize:40,marginBottom:10}}>📂</div>
          <p style={{color:C.accent,fontWeight:600,fontSize:15,margin:"0 0 4px"}}>Selecionar arquivo CSV</p>
          <p style={{color:C.muted,fontSize:13}}>Do seu banco ou app financeiro</p>
        </div>
        <input ref={ref} type="file" accept=".csv,.txt" onChange={onFile} style={{display:"none"}}/>
        <div style={{...card({padding:14,marginTop:12})}}>
          {[["Nubank","App → Perfil → Exportar"],["Itaú","Internet banking → Extrato → CSV"],["Bradesco","App → Extrato → Exportar"],["Inter","App → Extrato → Compartilhar"]].map(([b,i])=>(
            <div key={b} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.accent,fontSize:12,fontWeight:600,minWidth:65}}>{b}</span>
              <span style={{color:C.muted,fontSize:12}}>{i}</span>
            </div>
          ))}
        </div>
      </div>}

      {step===2&&<div>
        <p style={{color:C.sub,fontSize:13,marginBottom:16}}><strong style={{color:C.text}}>{rows.length} linhas</strong> encontradas. Mapeie:</p>
        {[["data","📅 Data"],["valor","💰 Valor"],["descricao","📝 Descrição"]].map(([k,l])=>(
          <div key={k} style={{marginBottom:12}}>
            <label style={{color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",display:"block",marginBottom:6}}>{l} *</label>
            <select value={map[k]} onChange={e=>setMap(m=>({...m,[k]:e.target.value}))} style={{width:"100%",background:C.surface,border:`1px solid ${map[k]?C.accent+"60":C.red+"60"}`,borderRadius:11,padding:"12px 14px",color:C.text,fontSize:14,outline:"none"}}>
              <option value="">— selecione —</option>
              {hdrs.map(h=><option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
        {contas.length>0&&<Drop label="💳 Importar para conta" value={cid} onChange={e=>setCid(e.target.value)} options={contas.map(c=>({value:c.id,label:c.nome}))}/>}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <Btn onClick={genPrev} style={{flex:1,justifyContent:"center"}}>Ver preview →</Btn>
          <Btn variant="ghost" onClick={()=>setStep(1)}>Voltar</Btn>
        </div>
      </div>}

      {step===3&&<div>
        <p style={{color:C.sub,fontSize:13,marginBottom:12}}>Preview de <strong style={{color:C.text}}>{rows.length}</strong> transações:</p>
        <div style={{...card({overflow:"hidden",marginBottom:14})}}>
          {prev.map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",padding:"12px 14px",borderBottom:i<prev.length-1?`1px solid ${C.border}`:"none",gap:10}}>
              <span style={{fontSize:18}}>{CAT_ICON[t.categoria]||"💸"}</span>
              <div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.descricao}</div><div style={{color:C.muted,fontSize:11}}>{t.data} • {t.categoria}</div></div>
              <span style={{color:t.valor<0?C.red:C.green,fontSize:13,fontWeight:700}}>{fmt(t.valor)}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={confirm} style={{flex:1,justifyContent:"center"}} disabled={load}>{load?"Importando...":"✅ Importar tudo"}</Btn>
          <Btn variant="ghost" onClick={()=>setStep(2)}>Ajustar</Btn>
        </div>
      </div>}

      {step===4&&<div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:52,marginBottom:12}}>🎉</div>
        <h3 style={{color:C.green,fontSize:20,fontWeight:700,margin:"0 0 8px"}}>{tot} importadas!</h3>
        <p style={{color:C.muted,fontSize:13,marginBottom:20}}>Visíveis para os dois em tempo real.</p>
        <Btn onClick={onClose} style={{minWidth:140,justifyContent:"center"}}>Ver transações</Btn>
      </div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({db,nomeAtual,online,users}) {
  const {txs,perfil,contas,orc}=db;
  const mes=new Date().getMonth()+1,ano=new Date().getFullYear();
  const txMes=txs.filter(t=>{const d=new Date(t.data+"T12:00:00");return d.getMonth()+1===mes&&d.getFullYear()===ano;});
  const gastos  =txMes.filter(t=>t.valor<0).reduce((s,t)=>s+Math.abs(t.valor),0);
  const receitas=txMes.filter(t=>t.valor>0).reduce((s,t)=>s+t.valor,0);
  const saldo   =contas.reduce((s,c)=>s+c.saldo,0);
  const porCat  ={};txMes.filter(t=>t.valor<0).forEach(t=>{porCat[t.categoria]=(porCat[t.categoria]||0)+Math.abs(t.valor);});
  const top5    =Object.entries(porCat).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // por pessoa
  const porPessoa={};txMes.filter(t=>t.valor<0).forEach(t=>{porPessoa[t.autor]=(porPessoa[t.autor]||0)+Math.abs(t.valor);});

  // alertas
  const alertas=[];
  const dias=new Date().getDate();
  if(dias>0){const proj=(gastos/dias)*30;if(proj>gastos)alertas.push({icon:"🔮",color:C.purple,title:"Projeção",desc:`Tendência: ${fmt(proj)} este mês`});}
  Object.entries(porCat).forEach(([c,v])=>{if(orc[c]&&v>orc[c])alertas.push({icon:"⚠️",color:C.amber,title:c,desc:`${fmt(v)} de ${fmt(orc[c])} — ultrapassou!`});});

  const lastTxs=txs.slice(0,5);

  return (
    <div style={{paddingBottom:80}}>
      <Header title="Dashboard" nomeAtual={nomeAtual} online={online} users={users}/>
      <div style={{padding:"16px 16px 0"}}>

        {/* Saldo */}
        <div style={{background:`linear-gradient(135deg,#0f2027,#203a43,#2c5364)`,borderRadius:20,padding:"24px 20px",marginBottom:16,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`${C.accent}15`}}/>
          <p style={{color:`${C.accent}cc`,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Saldo total</p>
          <p style={{fontSize:34,fontWeight:800,color:C.text,letterSpacing:"-1px"}}>{fmt(saldo)}</p>
          <div style={{display:"flex",gap:20,marginTop:16}}>
            <div><p style={{color:`${C.red}cc`,fontSize:11,marginBottom:2}}>Gastos</p><p style={{color:C.red,fontWeight:700,fontSize:16}}>{fmt(gastos)}</p></div>
            <div style={{width:1,background:C.border}}/> 
            <div><p style={{color:`${C.green}cc`,fontSize:11,marginBottom:2}}>Receitas</p><p style={{color:C.green,fontWeight:700,fontSize:16}}>{fmt(receitas)}</p></div>
          </div>
        </div>

        {/* Gastos por pessoa */}
        {Object.keys(porPessoa).length>0&&(
          <div style={{...card({padding:16,marginBottom:16})}}>
            <p style={{color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>👥 Quem gastou mais</p>
            {Object.entries(porPessoa).sort((a,b)=>b[1]-a[1]).map(([autor,val])=>{
              const u=users.find(x=>x.nome===autor);const pct=gastos>0?((val/gastos)*100).toFixed(0):0;
              return(
                <div key={autor} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:u?.cor||C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#000",flexShrink:0}}>{autor[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.text,fontSize:13,fontWeight:500}}>{autor}{autor===nomeAtual?" (você)":""}</span><span style={{color:C.red,fontSize:13,fontWeight:700}}>{fmt(val)}</span></div>
                    <div style={{background:C.surface,borderRadius:4,height:5,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:u?.cor||C.accent,borderRadius:4}}/></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Alertas */}
        {alertas.length>0&&(
          <div style={{marginBottom:16}}>
            {alertas.map((a,i)=>(
              <div key={i} style={{...card({padding:"12px 14px",marginBottom:8,borderColor:`${a.color}30`,display:"flex",gap:10,alignItems:"center"})}}>
                <span style={{fontSize:20}}>{a.icon}</span>
                <div><p style={{color:C.text,fontSize:13,fontWeight:600,marginBottom:2}}>{a.title}</p><p style={{color:C.muted,fontSize:12}}>{a.desc}</p></div>
              </div>
            ))}
          </div>
        )}

        {/* Top categorias */}
        {top5.length>0&&(
          <div style={{...card({padding:16,marginBottom:16})}}>
            <p style={{color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>📊 Maiores gastos</p>
            {top5.map(([cat,val])=>(
              <div key={cat} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{color:C.text,fontSize:13}}>{CAT_ICON[cat]} {cat}</span>
                  <span style={{color:C.muted,fontSize:13,fontWeight:600}}>{fmt(val)}</span>
                </div>
                <div style={{background:C.surface,borderRadius:4,height:5,overflow:"hidden"}}><div style={{width:`${(val/top5[0][1])*100}%`,height:"100%",background:`linear-gradient(90deg,${C.accent},#3b82f6)`,borderRadius:4}}/></div>
              </div>
            ))}
          </div>
        )}

        {/* Últimas transações */}
        {lastTxs.length>0&&(
          <div style={{...card({overflow:"hidden",marginBottom:16})}}>
            <p style={{color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,padding:"14px 14px 10px"}}>🕐 Últimos lançamentos</p>
            {lastTxs.map((t,i)=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderTop:`1px solid ${C.border}`,gap:10}}>
                <span style={{fontSize:20,flexShrink:0}}>{CAT_ICON[t.categoria]||"💸"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:C.text,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.descricao}</p>
                  <p style={{color:C.muted,fontSize:11,marginTop:1}}>{t.autor} • {fmtD(t.data)}</p>
                </div>
                <span style={{color:t.valor<0?C.red:C.green,fontSize:14,fontWeight:700,flexShrink:0}}>{t.valor>0?"+":""}{fmt(t.valor)}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
function Transactions({db,nomeAtual,online,users}) {
  const {txs,contas,addTx,updTx,delTx,impTxs}=db;
  const [modal,setModal]=useState(null);
  const [csv,setCSV]    =useState(false);
  const [busca,setBusca]=useState("");
  const [cat,setCat]    =useState("Todas");
  const [del,setDel]    =useState(null);

  const fil=txs.filter(t=>(!busca||t.descricao.toLowerCase().includes(busca.toLowerCase()))&&(cat==="Todas"||t.categoria===cat));
  const grupos={};
  fil.forEach(t=>{
    const d=new Date(t.data+"T12:00:00"),hj=new Date(),on=new Date(Date.now()-86400000);
    const l=d.toDateString()===hj.toDateString()?"Hoje":d.toDateString()===on.toDateString()?"Ontem":fmtD(t.data);
    if(!grupos[l])grupos[l]=[];grupos[l].push(t);
  });

  return(
    <div style={{paddingBottom:80}}>
      <Header title="Transações" nomeAtual={nomeAtual} online={online} users={users} onAdd={()=>setModal("add")}/>
      <div style={{padding:"12px 16px 0"}}>

        {/* Busca */}
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar transação..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",color:C.text,fontSize:14,outline:"none",marginBottom:12,boxSizing:"border-box"}}/>

        {/* Filtro categorias scroll horizontal */}
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:8,scrollbarWidth:"none"}}>
          {["Todas",...CATS].map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{flexShrink:0,padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:500,background:cat===c?C.accent:C.card,color:cat===c?"#000":C.muted,whiteSpace:"nowrap"}}>
              {c==="Todas"?"Todas":(CAT_ICON[c]||"")+" "+c}
            </button>
          ))}
        </div>

        <Btn variant="ghost" onClick={()=>setCSV(true)} style={{width:"100%",justifyContent:"center",marginBottom:14}}>📂 Importar extrato CSV</Btn>

        {/* Lista */}
        {Object.entries(grupos).map(([label,ts])=>(
          <div key={label} style={{marginBottom:16}}>
            <p style={{color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8,paddingLeft:4}}>{label}</p>
            <div style={{...card({overflow:"hidden"})}}>
              {ts.map((t,idx)=>{
                const u=users.find(x=>x.nome===t.autor);
                return(
                  <div key={t.id} style={{display:"flex",alignItems:"center",padding:"13px 14px",borderBottom:idx<ts.length-1?`1px solid ${C.border}`:"none",gap:10}}>
                    <div style={{width:42,height:42,borderRadius:13,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{CAT_ICON[t.categoria]||"💸"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{color:C.text,fontSize:14,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.descricao}</p>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                        <span style={{color:C.muted,fontSize:11}}>{t.categoria}</span>
                        {t.autor&&<><span style={{color:C.dim,fontSize:11}}>•</span><div style={{width:12,height:12,borderRadius:"50%",background:u?.cor||C.accent,display:"inline-block"}}/><span style={{color:C.muted,fontSize:11}}>{t.autor}</span></>}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <p style={{color:t.valor>0?C.green:C.red,fontSize:14,fontWeight:700}}>{t.valor>0?"+":""}{fmt(t.valor)}</p>
                      <p style={{color:C.muted,fontSize:11}}>{fmtD(t.data)}</p>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:4,marginLeft:4}}>
                      <button onClick={()=>setModal(t)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:2}}>✏️</button>
                      <button onClick={()=>setDel(t.id)} style={{background:"none",border:"none",color:C.red+"80",cursor:"pointer",fontSize:16,padding:2}}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {fil.length===0&&<div style={{textAlign:"center",padding:"48px 0"}}><div style={{fontSize:48,marginBottom:12}}>📭</div><p style={{color:C.muted,fontSize:14}}>Nenhuma transação encontrada.</p></div>}
      </div>

      {modal&&<Modal title={modal==="add"?"➕ Nova Transação":"✏️ Editar"} onClose={()=>setModal(null)}><TxForm inicial={modal!=="add"?modal:null} contas={contas} onSave={async f=>{if(f.id)await updTx(f);else await addTx(f);}} onClose={()=>setModal(null)}/></Modal>}
      {csv&&<Modal title="📂 Importar CSV" onClose={()=>setCSV(false)} width={500}><ImportCSV contas={contas} onImport={impTxs} onClose={()=>setCSV(false)}/></Modal>}
      {del&&<Modal title="Excluir?" onClose={()=>setDel(null)} width={320}><p style={{color:C.muted,fontSize:14,marginBottom:20}}>Tem certeza que deseja excluir esta transação?</p><div style={{display:"flex",gap:10}}><Btn variant="danger" onClick={async()=>{await delTx(del);setDel(null);}} style={{flex:1,justifyContent:"center"}}>Excluir</Btn><Btn variant="ghost" onClick={()=>setDel(null)} style={{flex:1,justifyContent:"center"}}>Cancelar</Btn></div></Modal>}
    </div>
  );
}

// ─── BUDGETS ──────────────────────────────────────────────────────────────────
function Budgets({db,nomeAtual,online,users}) {
  const {txs,orc,saveOrc}=db;
  const [edit,setEdit]=useState(null);
  const [lim,setLim]  =useState("");
  const mes=new Date().getMonth()+1,ano=new Date().getFullYear();
  const gm={};txs.filter(t=>{const d=new Date(t.data+"T12:00:00");return d.getMonth()+1===mes&&d.getFullYear()===ano&&t.valor<0;}).forEach(t=>{gm[t.categoria]=(gm[t.categoria]||0)+Math.abs(t.valor);});

  return(
    <div style={{paddingBottom:80}}>
      <Header title="Orçamentos" nomeAtual={nomeAtual} online={online} users={users}/>
      <div style={{padding:"16px 16px 0"}}>
        <p style={{color:C.muted,fontSize:13,marginBottom:16}}>Toque em uma categoria para definir o limite mensal do casal.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {CATS.filter(c=>c!=="Renda").map(cat=>{
            const limit=orc[cat]||0,spent=gm[cat]||0,pct=limit>0?Math.min((spent/limit)*100,100):0,over=limit>0&&spent>limit;
            const color=over?C.red:pct>80?C.amber:C.green;
            return(
              <button key={cat} onClick={()=>{setEdit(cat);setLim(limit||"");}} style={{...card({padding:"16px",textAlign:"left",cursor:"pointer",width:"100%",border:`1px solid ${over?C.red+"40":C.border}`})}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent+"60"} onMouseLeave={e=>e.currentTarget.style.borderColor=over?C.red+"40":C.border}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:limit>0?10:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22}}>{CAT_ICON[cat]||"💸"}</span>
                    <span style={{color:C.text,fontSize:15,fontWeight:600}}>{cat}</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {over&&<span style={{background:`${C.red}20`,color:C.red,fontSize:10,padding:"3px 8px",borderRadius:20,fontWeight:700,display:"block",marginBottom:2}}>EXCEDIDO</span>}
                    {!limit&&<span style={{color:C.muted,fontSize:12}}>✏️ definir</span>}
                    {limit>0&&<span style={{color:color,fontSize:14,fontWeight:700}}>{fmt(spent)}<span style={{color:C.muted,fontSize:12,fontWeight:400}}> / {fmt(limit)}</span></span>}
                  </div>
                </div>
                {limit>0&&<div style={{background:C.surface,borderRadius:5,height:6,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:5,transition:"width .5s"}}/></div>}
              </button>
            );
          })}
        </div>
      </div>
      {edit&&<Modal title={`${CAT_ICON[edit]||"💸"} ${edit}`} onClose={()=>setEdit(null)} width={340}>
        <p style={{color:C.muted,fontSize:13,marginBottom:16}}>Gasto atual do casal: <strong style={{color:C.red}}>{fmt(gm[edit]||0)}</strong></p>
        <Field label="Limite mensal (R$)" type="number" min="0" step="10" value={lim} onChange={e=>setLim(e.target.value)} placeholder="Ex: 500" autoFocus/>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn onClick={async()=>{await saveOrc(edit,parseFloat(lim));setEdit(null);}} style={{flex:1,justifyContent:"center"}}>Salvar</Btn>
          <Btn variant="ghost" onClick={()=>setEdit(null)}>Cancelar</Btn>
        </div>
      </Modal>}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({db,nomeAtual,online,users,onLogout}) {
  const {perfil,contas,savePf,addCt,delCt}=db;
  const [pf,setPf]=useState(perfil||{});
  const [saved,setSaved]=useState(false);
  const [nc,setNC]=useState({nome:"",tipo:"corrente",saldo:"",cor:"#22d3ee"});
  const [add,setAdd]=useState(false);
  useEffect(()=>{if(perfil)setPf(perfil);},[perfil]);

  const salvar=async()=>{await savePf({renda_mensal:parseFloat(pf.renda_mensal)||0,meta_economia:parseFloat(pf.meta_economia)||0});setSaved(true);setTimeout(()=>setSaved(false),2000);};

  return(
    <div style={{paddingBottom:80}}>
      <Header title="Configurações" nomeAtual={nomeAtual} online={online} users={users}/>
      <div style={{padding:"16px 16px 0"}}>

        {/* Membros do grupo */}
        <div style={{...card({padding:16,marginBottom:14})}}>
          <p style={{color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>👥 Membros do grupo</p>
          {users.map(u=>(
            <div key={u.nome} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:u.cor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#000"}}>{u.nome[0]}</div>
              <div style={{flex:1}}>
                <p style={{color:C.text,fontSize:14,fontWeight:600}}>{u.nome}{u.nome===nomeAtual?" (você)":""}</p>
                <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                  {online.includes(u.nome)&&<><div style={{width:7,height:7,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/><span style={{color:C.green,fontSize:11}}>online agora</span></>}
                  {!online.includes(u.nome)&&<span style={{color:C.muted,fontSize:11}}>offline</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compartilhar */}
        <div style={{...card({padding:16,marginBottom:14})}}>
          <p style={{color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🔗 Convidar parceiro(a)</p>
          <p style={{color:C.muted,fontSize:13,marginBottom:12,lineHeight:1.5}}>Envie este link. Ao abrir, ela/ele cria a conta com o nome e PIN dela/dele.</p>
          <div style={{background:C.surface,borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:C.accent,fontSize:12,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{window.location.href}</span>
            <button onClick={()=>navigator.clipboard.writeText(window.location.href).then(()=>alert("Link copiado!"))} style={{background:C.border,border:"none",color:C.text,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,flexShrink:0}}>Copiar</button>
          </div>
        </div>

        {/* Perfil financeiro */}
        <div style={{...card({padding:16,marginBottom:14})}}>
          <p style={{color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>💰 Perfil financeiro do casal</p>
          <Field label="Renda mensal combinada (R$)" type="number" value={pf.renda_mensal||""} onChange={e=>setPf(p=>({...p,renda_mensal:e.target.value}))}/>
          <Field label="Meta de economia (R$)" type="number" value={pf.meta_economia||""} onChange={e=>setPf(p=>({...p,meta_economia:e.target.value}))}/>
          <Btn onClick={salvar} style={{width:"100%",justifyContent:"center"}}>{saved?"✅ Salvo!":"Salvar"}</Btn>
        </div>

        {/* Contas */}
        <div style={{...card({padding:16,marginBottom:14})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{color:C.sub,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>🏦 Contas bancárias</p>
            <Btn size="sm" onClick={()=>setAdd(true)}>+ Adicionar</Btn>
          </div>
          {contas.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:c.cor||C.accent,flexShrink:0}}/>
              <div style={{flex:1}}><p style={{color:C.text,fontSize:13,fontWeight:600}}>{c.nome}</p><p style={{color:C.muted,fontSize:11}}>{c.tipo}</p></div>
              <p style={{color:C.green,fontSize:13,fontWeight:700}}>{fmt(c.saldo)}</p>
              <button onClick={()=>delCt(c.id)} style={{background:"none",border:"none",color:C.red+"80",cursor:"pointer",fontSize:18}}>🗑️</button>
            </div>
          ))}
          {add&&<div style={{background:C.surface,borderRadius:12,padding:14,marginTop:12}}>
            <Field label="Nome do banco" value={nc.nome} onChange={e=>setNC(c=>({...c,nome:e.target.value}))} placeholder="Nubank"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Drop label="Tipo" value={nc.tipo} onChange={e=>setNC(c=>({...c,tipo:e.target.value}))} options={["corrente","poupanca","credito","investimento"]}/>
              <Field label="Saldo (R$)" type="number" value={nc.saldo} onChange={e=>setNC(c=>({...c,saldo:e.target.value}))} placeholder="0"/>
            </div>
            <div style={{display:"flex",gap:10}}><Btn onClick={async()=>{if(!nc.nome||!nc.saldo)return;await addCt({...nc,saldo:parseFloat(nc.saldo)});setNC({nome:"",tipo:"corrente",saldo:"",cor:"#22d3ee"});setAdd(false);}} style={{flex:1,justifyContent:"center"}}>Adicionar</Btn><Btn variant="ghost" onClick={()=>setAdd(false)}>Cancelar</Btn></div>
          </div>}
        </div>

        {/* Logout */}
        <Btn variant="danger" onClick={onLogout} style={{width:"100%",justifyContent:"center",marginBottom:16}}>
          Sair da conta
        </Btn>

      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active,setActive]     = useState("dashboard");
  const [nomeAtual,setNome]    = useState(()=>localStorage.getItem("sw_nome")||"");
  const db                     = useData(nomeAtual);

  const handleLogin  = nome => setNome(nome);
  const handleLogout = ()   => { localStorage.removeItem("sw_nome"); localStorage.removeItem("sw_pin"); setNome(""); };

  // Verifica credenciais salvas ao abrir
  useEffect(()=>{
    const nome=localStorage.getItem("sw_nome");
    const pin =localStorage.getItem("sw_pin");
    if (!nome||!pin) return;
    supabase.from("usuarios").select("id").eq("grupo_id",GRUPO_ID).eq("nome",nome).eq("pin",pin).single()
      .then(({data})=>{ if (!data) handleLogout(); });
  },[]);

  if (!nomeAtual) return <Login onLogin={handleLogin}/>;

  if (SUPABASE_URL.includes("SEU-PROJETO")) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif",padding:20}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{...card({padding:28,maxWidth:360,width:"100%",borderColor:C.amber+"40"})}}>
        <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>⚙️</div>
        <h2 style={{color:C.text,fontSize:17,fontWeight:700,textAlign:"center",margin:"0 0 10px"}}>Configure o Supabase</h2>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:16,textAlign:"center"}}>Abra o <strong style={{color:C.accent}}>App.jsx</strong> e substitua as variáveis <code style={{color:C.amber}}>VITE_SUPABASE_URL</code> e <code style={{color:C.amber}}>VITE_SUPABASE_ANON</code> pelas suas credenciais do Supabase.</p>
        <div style={{background:C.surface,borderRadius:10,padding:12,fontSize:12,color:C.muted,lineHeight:2}}>
          {["1. Crie conta em supabase.com","2. Novo projeto → Settings → API","3. Cole URL e anon key no App.jsx","4. Rode setup.sql no SQL Editor","5. npm run dev"].map((s,i)=><div key={i}>{s}</div>)}
        </div>
      </div>
    </div>
  );

  if (db.loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${C.accent},#3b82f6)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#000"}}>W</div>
      <div style={{display:"flex",gap:6}}>{[0,.15,.3].map((d,i)=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:C.accent,animation:`bounce 1.2s ${d}s ease-in-out infinite`}}/>)}</div>
      <p style={{color:C.muted,fontSize:13}}>Sincronizando dados...</p>
    </div>
  );

  const pages = {
    dashboard:    <Dashboard    db={db} nomeAtual={nomeAtual} online={db.online} users={db.users}/>,
    transactions: <Transactions db={db} nomeAtual={nomeAtual} online={db.online} users={db.users}/>,
    budgets:      <Budgets      db={db} nomeAtual={nomeAtual} online={db.online} users={db.users}/>,
    settings:     <Settings     db={db} nomeAtual={nomeAtual} online={db.online} users={db.users} onLogout={handleLogout}/>,
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      {pages[active]}
      <BottomNav active={active} setActive={setActive} nomeAtual={nomeAtual}/>
    </div>
  );
}

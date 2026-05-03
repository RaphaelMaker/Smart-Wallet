import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// Cole aqui as suas credenciais do Supabase (passo 2 do guia)
const SUPABASE_URL    = "https://xyzykxhrimhwqnnyjecw.supabase.co";
const SUPABASE_ANON   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enlreGhyaW1od3FubnlqZWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDQ3NDEsImV4cCI6MjA5Mjk4MDc0MX0.PGAxWpm7jRBiJN1-moR5ndTcGKLpsxqCT9tnc2OpV6U";
const GRUPO_ID        = "casal-01"; // ID fixo do grupo — ambos usam o mesmo

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const CATEGORIAS = ["Alimentação","Delivery","Transporte","Streaming","Assinaturas","Saúde","Moradia","Educação","Lazer","Vestuário","Renda","Outros"];
const CAT_ICONS  = { Alimentação:"🍽️",Delivery:"🛵",Transporte:"🚗",Assinaturas:"📱",Streaming:"🎬",Saúde:"💊",Educação:"📚",Lazer:"🎮",Moradia:"🏠",Vestuário:"👕",Renda:"💰",Outros:"💸" };
const CAT_RULES  = {
  Delivery:    ["ifood","rappi","uber eats","james"],
  Transporte:  ["uber","99pop","cabify","metro","gasolina","combustível","posto"],
  Streaming:   ["netflix","spotify","disney","hbo","apple tv","prime","deezer"],
  Assinaturas: ["adobe","microsoft","google one","icloud","notion","github"],
  Alimentação: ["supermercado","mercado","padaria","extra","carrefour","pão de açúcar"],
  Saúde:       ["farmácia","drogaria","hospital","clínica","médico","dentista","academia","smart fit"],
  Moradia:     ["aluguel","condomínio","luz","água","internet","gás","enel","sabesp"],
  Educação:    ["escola","faculdade","curso","udemy","coursera","alura"],
  Lazer:       ["cinema","bar","restaurante","steam","playstation","show"],
  Vestuário:   ["zara","renner","c&a","nike","adidas","shein"],
  Renda:       ["salário","freelance","pix recebido","transferência recebida"],
};

function autoCat(desc) {
  const d = desc.toLowerCase();
  for (const [cat, words] of Object.entries(CAT_RULES))
    if (words.some(w => d.includes(w))) return cat;
  return "Outros";
}

const fmt     = v  => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const fmtDate = d  => new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
const today   = () => new Date().toISOString().split("T")[0];

// ─── BASE UI ──────────────────────────────────────────────────────────────────
const Input = ({label,...p}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{color:"#64748b",fontSize:12,fontWeight:600,display:"block",marginBottom:6}}>{label}</label>}
    <input {...p} style={{width:"100%",background:"#0f1117",border:"1px solid #1e2030",borderRadius:10,padding:"11px 14px",color:"#e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",...p.style}}/>
  </div>
);

const Sel = ({label,options,...p}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{color:"#64748b",fontSize:12,fontWeight:600,display:"block",marginBottom:6}}>{label}</label>}
    <select {...p} style={{width:"100%",background:"#0f1117",border:"1px solid #1e2030",borderRadius:10,padding:"11px 14px",color:"#e2e8f0",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}>
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  </div>
);

const Btn = ({children,variant="primary",...p}) => {
  const s={primary:{background:"linear-gradient(135deg,#6ee7b7,#3b82f6)",color:"#000",border:"none"},secondary:{background:"#1e2030",color:"#94a3b8",border:"none"},danger:{background:"#ef444415",color:"#ef4444",border:"1px solid #ef444430"}}[variant];
  return <button {...p} style={{padding:"10px 18px",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",...s,...p.style}}>{children}</button>;
};

function Modal({title,onClose,children,width=440}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:20,padding:28,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{color:"#e2e8f0",fontSize:17,fontWeight:700,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#64748b",fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── TELA DE SETUP (primeira vez) ─────────────────────────────────────────────
function Setup({onDone}) {
  const [nome, setNome] = useState("");
  const [renda, setRenda] = useState("");
  const [parceiro, setParceiro] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const criar = async e => {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true); setErro("");
    try {
      // Cria ou atualiza perfil do grupo
      const { error } = await supabase.from("perfis").upsert({
        grupo_id: GRUPO_ID,
        nomes: [nome.trim(), parceiro.trim()].filter(Boolean),
        renda_mensal: parseFloat(renda)||0,
        meta_economia: 0,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: "grupo_id" });
      if (error) throw error;
      localStorage.setItem("smart_nome", nome.trim());
      onDone();
    } catch(e) {
      setErro("Erro ao salvar. Verifique suas credenciais do Supabase no App.jsx.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:"#0a0c13",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:20,padding:36,width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#6ee7b7,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#000",margin:"0 auto 16px"}}>P</div>
          <h1 style={{color:"#e2e8f0",fontSize:22,fontWeight:700,margin:"0 0 6px"}}>Smart Wallet</h1>
          <p style={{color:"#64748b",fontSize:13,margin:0}}>Configure o app para o casal</p>
        </div>
        {erro && <div style={{background:"#ef444420",border:"1px solid #ef444440",borderRadius:10,padding:"10px 14px",color:"#f87171",fontSize:13,marginBottom:16}}>{erro}</div>}
        <form onSubmit={criar}>
          <Input label="Seu nome" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Raphael" required/>
          <Input label="Nome do(a) parceiro(a)" value={parceiro} onChange={e=>setParceiro(e.target.value)} placeholder="Ex: Ana"/>
          <Input label="Renda mensal combinada (R$)" type="number" value={renda} onChange={e=>setRenda(e.target.value)} placeholder="Ex: 12000"/>
          <Btn type="submit" style={{width:"100%",padding:14,fontSize:15,marginTop:4}} disabled={loading}>
            {loading ? "Configurando..." : "Começar →"}
          </Btn>
        </form>
        <p style={{color:"#475569",fontSize:11,textAlign:"center",marginTop:16,lineHeight:1.5}}>
          Compartilhe o link do app com seu(sua) parceiro(a) — vocês verão os mesmos dados em tempo real.
        </p>
      </div>
    </div>
  );
}

// ─── HOOK: dados em tempo real ────────────────────────────────────────────────
function useData() {
  const [transacoes, setTx]   = useState([]);
  const [perfil,     setPerfil]= useState(null);
  const [contas,     setContas]= useState([]);
  const [orcamentos, setOrc]  = useState({});
  const [loading,    setLoad] = useState(true);
  const [online,     setOnline]= useState([]);

  useEffect(() => {
    carregarTudo();

    // Realtime — transações
    const txSub = supabase.channel("transacoes-realtime")
      .on("postgres_changes",{event:"*",schema:"public",table:"transacoes",filter:`grupo_id=eq.${GRUPO_ID}`},
        payload => {
          if (payload.eventType==="INSERT") setTx(p=>[payload.new,...p].sort((a,b)=>b.data.localeCompare(a.data)));
          if (payload.eventType==="UPDATE") setTx(p=>p.map(t=>t.id===payload.new.id?payload.new:t));
          if (payload.eventType==="DELETE") setTx(p=>p.filter(t=>t.id!==payload.old.id));
        })
      .subscribe();

    // Presença — quem está online
    const nome = localStorage.getItem("smart_nome")||"Usuário";
    const presence = supabase.channel("presenca")
      .on("presence",{event:"sync"},()=>{
        const state = presence.presenceState();
        setOnline(Object.values(state).flat().map(u=>u.nome));
      })
      .subscribe(async s=>{ if(s==="SUBSCRIBED") await presence.track({nome}); });

    return () => { supabase.removeChannel(txSub); supabase.removeChannel(presence); };
  }, []);

  const carregarTudo = async () => {
    setLoad(true);
    const [txRes, pfRes, ctRes, orcRes] = await Promise.all([
      supabase.from("transacoes").select("*").eq("grupo_id",GRUPO_ID).order("data",{ascending:false}),
      supabase.from("perfis").select("*").eq("grupo_id",GRUPO_ID).single(),
      supabase.from("contas").select("*").eq("grupo_id",GRUPO_ID).order("id"),
      supabase.from("orcamentos").select("*").eq("grupo_id",GRUPO_ID),
    ]);
    if (txRes.data)  setTx(txRes.data);
    if (pfRes.data)  setPerfil(pfRes.data);
    if (ctRes.data)  setContas(ctRes.data);
    if (orcRes.data) {
      const obj={};
      orcRes.data.forEach(o=>obj[o.categoria]=o.limite);
      setOrc(obj);
    }
    setLoad(false);
  };

  // CRUD transações
  const addTx = async tx => {
    const {data} = await supabase.from("transacoes").insert({...tx,grupo_id:GRUPO_ID,autor:localStorage.getItem("smart_nome")||"?"}).select().single();
    return data;
  };
  const updateTx = async tx => {
    await supabase.from("transacoes").update(tx).eq("id",tx.id);
  };
  const deleteTx = async id => {
    await supabase.from("transacoes").delete().eq("id",id);
  };

  // CRUD contas
  const addConta = async c => {
    const {data} = await supabase.from("contas").insert({...c,grupo_id:GRUPO_ID}).select().single();
    setContas(p=>[...p,data]);
  };
  const delConta = async id => {
    await supabase.from("contas").delete().eq("id",id);
    setContas(p=>p.filter(c=>c.id!==id));
  };

  // Salvar orçamento
  const saveOrc = async (categoria,limite) => {
    await supabase.from("orcamentos").upsert({grupo_id:GRUPO_ID,categoria,limite},{onConflict:"grupo_id,categoria"});
    setOrc(p=>({...p,[categoria]:limite}));
  };

  // Salvar perfil
  const savePerfil = async dados => {
    await supabase.from("perfis").update(dados).eq("grupo_id",GRUPO_ID);
    setPerfil(p=>({...p,...dados}));
  };

  // Import CSV em lote
  const importTxs = async novas => {
    const rows = novas.map(t=>({...t,grupo_id:GRUPO_ID,autor:localStorage.getItem("smart_nome")||"?"}));
    const {data} = await supabase.from("transacoes").insert(rows).select();
    setTx(p=>[...(data||[]),...p].sort((a,b)=>b.data.localeCompare(a.data)));
  };

  return {transacoes,perfil,contas,orcamentos,loading,online,addTx,updateTx,deleteTx,addConta,delConta,saveOrc,savePerfil,importTxs,recarregar:carregarTudo};
}

// ─── FORM TRANSAÇÃO ───────────────────────────────────────────────────────────
function TxForm({inicial,contas,onSave,onClose}) {
  const [form,setForm]=useState({data:inicial?.data||today(),valor:inicial?Math.abs(inicial.valor).toFixed(2):"",tipo:inicial?(inicial.valor<0?"gasto":"receita"):"gasto",descricao:inicial?.descricao||"",categoria:inicial?.categoria||"Outros",conta_id:inicial?.conta_id||contas[0]?.id||null});
  const set=k=>e=>{const v=e.target.value;setForm(f=>{const n={...f,[k]:v};if(k==="descricao")n.categoria=autoCat(v);return n;});};
  const submit=async e=>{
    e.preventDefault();
    if (!form.descricao.trim()||!form.valor) return;
    const valor=parseFloat(form.valor)*(form.tipo==="gasto"?-1:1);
    await onSave({...form,valor});
    onClose();
  };
  return (
    <form onSubmit={submit}>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {["gasto","receita"].map(t=>(
          <button key={t} type="button" onClick={()=>setForm(f=>({...f,tipo:t}))} style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit",background:form.tipo===t?(t==="gasto"?"#ef444420":"#6ee7b720"):"#0f1117",color:form.tipo===t?(t==="gasto"?"#ef4444":"#6ee7b7"):"#475569"}}>
            {t==="gasto"?"💸 Gasto":"💰 Receita"}
          </button>
        ))}
      </div>
      <Input label="Descrição" value={form.descricao} onChange={set("descricao")} placeholder="Ex: iFood, Salário..." required/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="Valor (R$)" type="number" min="0" step="0.01" value={form.valor} onChange={set("valor")} placeholder="0,00" required/>
        <Input label="Data" type="date" value={form.data} onChange={set("data")} required/>
      </div>
      <Sel label="Categoria" value={form.categoria} onChange={set("categoria")} options={CATEGORIAS.map(c=>({value:c,label:`${CAT_ICONS[c]} ${c}`}))}/>
      {contas.length>0&&<Sel label="Conta" value={form.conta_id} onChange={set("conta_id")} options={contas.map(c=>({value:c.id,label:c.nome}))}/>}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <Btn type="submit" style={{flex:1}}>{inicial?"Salvar":"Adicionar"}</Btn>
        <Btn variant="secondary" type="button" onClick={onClose}>Cancelar</Btn>
      </div>
    </form>
  );
}

// ─── IMPORT CSV ───────────────────────────────────────────────────────────────
function ImportCSV({contas,onImport,onClose}) {
  const [step,setStep]=useState(1);
  const [rows,setRows]=useState([]);
  const [hdrs,setHdrs]=useState([]);
  const [map,setMap]=useState({data:"",valor:"",descricao:""});
  const [contaId,setCid]=useState(contas[0]?.id||null);
  const [prev,setPrev]=useState([]);
  const [total,setTotal]=useState(0);
  const [loading,setLoad]=useState(false);
  const ref=useRef();

  const parseCSV=text=>{
    const lines=text.trim().split(/\r?\n/);
    const sep=lines[0].includes(";")?";":",";
    const h=lines[0].split(sep).map(x=>x.trim().replace(/^"|"$/g,""));
    const d=lines.slice(1).filter(l=>l.trim()).map(l=>{const c=l.split(sep).map(x=>x.trim().replace(/^"|"$/g,""));const o={};h.forEach((hh,i)=>o[hh]=c[i]||"");return o;});
    return {h,d};
  };

  const onFile=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      const {h,d}=parseCSV(ev.target.result);
      setHdrs(h);setRows(d);
      const a={data:"",valor:"",descricao:""};
      h.forEach(hh=>{const l=hh.toLowerCase();if(/data|date|dt/.test(l))a.data=hh;if(/valor|value|amount|quantia/.test(l))a.valor=hh;if(/desc|hist|memo|lançamento/.test(l))a.descricao=hh;});
      setMap(a);setStep(2);
    };
    r.readAsText(f,"utf-8");
  };

  const gerarPrev=()=>{
    if(!map.data||!map.valor||!map.descricao){alert("Mapeie as 3 colunas.");return;}
    setPrev(rows.slice(0,5).map((r,i)=>{const v=(r[map.valor]||"0").replace("R$","").replace(".","").replace(",",".").trim();return {id:i,data:r[map.data],valor:parseFloat(v)||0,descricao:r[map.descricao],categoria:autoCat(r[map.descricao])};}));

    setStep(3);
  };

  const confirmar=async()=>{
    setLoad(true);
    const novas=rows.map((r,i)=>{const v=(r[map.valor]||"0").replace("R$","").replace(".","").replace(",",".").trim();return {data:r[map.data]||today(),valor:parseFloat(v)||0,descricao:r[map.descricao]||"Importado",categoria:autoCat(r[map.descricao]||""),conta_id:contaId};}).filter(t=>t.descricao&&t.valor!==0);
    setTotal(novas.length);
    await onImport(novas);
    setLoad(false);setStep(4);
  };

  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:22}}>
        {["Upload","Mapear","Preview","Pronto"].map((s,i)=>(
          <div key={s} style={{flex:1,textAlign:"center"}}>
            <div style={{height:3,borderRadius:3,background:step>i?"#6ee7b7":"#1e2030",marginBottom:4}}/>
            <span style={{fontSize:10,color:step>i?"#6ee7b7":"#475569",fontWeight:600}}>{s}</span>
          </div>
        ))}
      </div>

      {step===1&&<div>
        <p style={{color:"#94a3b8",fontSize:13,marginBottom:14,lineHeight:1.6}}>Exporte o extrato do banco em CSV e faça upload aqui.</p>
        <div style={{border:"2px dashed #1e2030",borderRadius:14,padding:32,textAlign:"center",cursor:"pointer",background:"#0f1117"}} onClick={()=>ref.current.click()}>
          <div style={{fontSize:36,marginBottom:8}}>📂</div>
          <p style={{color:"#6ee7b7",fontWeight:600,fontSize:14,margin:"0 0 4px"}}>Selecionar arquivo CSV</p>
          <p style={{color:"#475569",fontSize:12,margin:0}}>Vírgula ou ponto-e-vírgula</p>
        </div>
        <input ref={ref} type="file" accept=".csv,.txt" onChange={onFile} style={{display:"none"}}/>
        <div style={{background:"#0f1117",borderRadius:10,padding:12,marginTop:12}}>
          {[["Nubank","App → Perfil → Exportar transações"],["Itaú","Internet banking → Extrato → Exportar CSV"],["Bradesco","App → Extrato → Exportar"],["Inter","App → Extrato → Compartilhar → CSV"]].map(([b,i])=>(
            <div key={b} style={{display:"flex",gap:8,marginBottom:4}}><span style={{color:"#6ee7b7",fontSize:12,fontWeight:600,minWidth:70}}>{b}</span><span style={{color:"#64748b",fontSize:12}}>{i}</span></div>
          ))}
        </div>
      </div>}

      {step===2&&<div>
        <p style={{color:"#94a3b8",fontSize:13,marginBottom:14}}><strong style={{color:"#e2e8f0"}}>{rows.length} linhas</strong> encontradas. Mapeie as colunas:</p>
        {[["data","📅 Data"],["valor","💰 Valor"],["descricao","📝 Descrição"]].map(([k,l])=>(
          <div key={k} style={{marginBottom:12}}>
            <label style={{color:"#64748b",fontSize:12,fontWeight:600,display:"block",marginBottom:6}}>{l} <span style={{color:"#ef4444"}}>*</span></label>
            <select value={map[k]} onChange={e=>setMap(m=>({...m,[k]:e.target.value}))} style={{width:"100%",background:"#0f1117",border:`1px solid ${map[k]?"#6ee7b740":"#ef444440"}`,borderRadius:10,padding:"10px 14px",color:"#e2e8f0",fontSize:14,outline:"none",fontFamily:"inherit"}}>
              <option value="">— selecione —</option>
              {hdrs.map(h=><option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
        {contas.length>0&&<Sel label="💳 Importar para conta" value={contaId} onChange={e=>setCid(e.target.value)} options={contas.map(c=>({value:c.id,label:c.nome}))}/>}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <Btn onClick={gerarPrev} style={{flex:1}}>Ver preview →</Btn>
          <Btn variant="secondary" onClick={()=>setStep(1)}>Voltar</Btn>
        </div>
      </div>}

      {step===3&&<div>
        <p style={{color:"#94a3b8",fontSize:13,marginBottom:12}}>Preview — <strong style={{color:"#e2e8f0"}}>{rows.length}</strong> transações serão importadas:</p>
        <div style={{background:"#0f1117",borderRadius:12,overflow:"hidden",marginBottom:14}}>
          {prev.map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:i<prev.length-1?"1px solid #1e2030":"none",gap:10}}>
              <span style={{fontSize:16}}>{CAT_ICONS[t.categoria]||"💸"}</span>
              <div style={{flex:1,minWidth:0}}><div style={{color:"#e2e8f0",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.descricao}</div><div style={{color:"#475569",fontSize:11}}>{t.data} • {t.categoria}</div></div>
              <span style={{color:t.valor<0?"#f87171":"#6ee7b7",fontSize:13,fontWeight:700}}>{fmt(t.valor)}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={confirmar} style={{flex:1}} disabled={loading}>{loading?"Importando...":"✅ Importar tudo"}</Btn>
          <Btn variant="secondary" onClick={()=>setStep(2)}>Ajustar</Btn>
        </div>
      </div>}

      {step===4&&<div style={{textAlign:"center",padding:"16px 0"}}>
        <div style={{fontSize:52,marginBottom:12}}>🎉</div>
        <h3 style={{color:"#6ee7b7",fontSize:20,fontWeight:700,margin:"0 0 8px"}}>{total} transações importadas!</h3>
        <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Categorizadas e salvas para o casal em tempo real.</p>
        <Btn onClick={onClose}>Ver transações</Btn>
      </div>}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({active,setActive,online,nomeAtual}) {
  const items=[{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"transactions",icon:"⇄",label:"Transações"},{id:"budgets",icon:"◎",label:"Orçamentos"},{id:"settings",icon:"◌",label:"Configurações"}];
  return (
    <aside style={{width:220,minHeight:"100vh",background:"#0f1117",display:"flex",flexDirection:"column",padding:"28px 0",position:"fixed",left:0,top:0,bottom:0,borderRight:"1px solid #1e2030",zIndex:10}}>
      <div style={{padding:"0 20px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6ee7b7,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#000"}}>P</div>
          <div><div style={{color:"#fff",fontWeight:700,fontSize:15}}>Smart Wallet</div><div style={{color:"#4ade80",fontSize:11}}>Casal</div></div>
        </div>
      </div>

      {/* Quem está online */}
      {online.length>0&&(
        <div style={{margin:"0 12px 16px",background:"#0f1117",borderRadius:10,padding:"10px 12px"}}>
          <div style={{color:"#64748b",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Online agora</div>
          {online.map(n=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#6ee7b7",boxShadow:"0 0 6px #6ee7b7"}}/>
              <span style={{color:"#94a3b8",fontSize:12}}>{n}{n===nomeAtual?" (você)":""}</span>
            </div>
          ))}
        </div>
      )}

      <nav style={{flex:1}}>
        {items.map(it=>(
          <button key={it.id} onClick={()=>setActive(it.id)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 20px",border:"none",background:active===it.id?"#1e2030":"transparent",color:active===it.id?"#6ee7b7":"#64748b",cursor:"pointer",borderLeft:active===it.id?"3px solid #6ee7b7":"3px solid transparent",fontSize:14,fontWeight:active===it.id?600:400,fontFamily:"inherit"}}>
            <span style={{fontSize:17}}>{it.icon}</span>{it.label}
          </button>
        ))}
      </nav>

      <div style={{padding:"16px 20px",borderTop:"1px solid #1e2030"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#818cf8,#6ee7b7)",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontWeight:700,fontSize:12}}>{nomeAtual?.[0]||"U"}</div>
          <div><div style={{color:"#e2e8f0",fontSize:13,fontWeight:600}}>{nomeAtual||"Usuário"}</div><div style={{color:"#475569",fontSize:11}}>Conta compartilhada</div></div>
        </div>
      </div>
    </aside>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({db}) {
  const {transacoes,perfil,contas,orcamentos,online}=db;
  if (!perfil) return <div style={{padding:40,color:"#64748b"}}>Carregando...</div>;
  const mes=new Date().getMonth()+1,ano=new Date().getFullYear();
  const txMes=transacoes.filter(t=>{const d=new Date(t.data+"T12:00:00");return d.getMonth()+1===mes&&d.getFullYear()===ano;});
  const gastos=txMes.filter(t=>t.valor<0).reduce((s,t)=>s+Math.abs(t.valor),0);
  const receitas=txMes.filter(t=>t.valor>0).reduce((s,t)=>s+t.valor,0);
  const saldo=contas.reduce((s,c)=>s+c.saldo,0);
  const porCat={};
  txMes.filter(t=>t.valor<0).forEach(t=>{porCat[t.categoria]=(porCat[t.categoria]||0)+Math.abs(t.valor);});
  const top=Object.entries(porCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxC=top[0]?.[1]||1;

  // Últimas transações de cada pessoa
  const porAutor={};
  txMes.forEach(t=>{if(!porAutor[t.autor])porAutor[t.autor]=0;if(t.valor<0)porAutor[t.autor]+=Math.abs(t.valor);});

  const alertas=[];
  const dias=new Date().getDate();
  if(dias>0){const proj=(gastos/dias)*30;alertas.push({agent:"Galileu",icon:"🔮",type:"info",title:"Projeção mensal",desc:`No ritmo atual: ${fmt(proj)} de gastos este mês.`});}
  Object.entries(porCat).forEach(([c,v])=>{if(orcamentos[c]&&v>orcamentos[c])alertas.push({agent:"Albert",icon:"🔍",type:"danger",title:`Limite de ${c} ultrapassado`,desc:`${fmt(v)} gastos de ${fmt(orcamentos[c])} de limite.`});});

  return (
    <div style={{padding:"28px 36px"}}>
      <div style={{marginBottom:24}}>
        <h1 style={{color:"#e2e8f0",fontSize:22,fontWeight:700,margin:0}}>Dashboard do Casal 💑</h1>
        <p style={{color:"#64748b",margin:"6px 0 0",fontSize:13}}>{new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})} • {(perfil.nomes||[]).join(" & ")}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        {[{label:"Saldo Total",value:fmt(saldo),icon:"💰",color:"#6ee7b7"},{label:"Gastos do mês",value:fmt(gastos),icon:"📉",color:"#f87171"},{label:"Receitas",value:fmt(receitas),icon:"📈",color:"#818cf8"},{label:"Meta economia",value:fmt(perfil.meta_economia||0),icon:"🎯",color:"#f59e0b"}].map(c=>(
          <div key={c.label} style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:14,padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:"#64748b",fontSize:12}}>{c.label}</span><span style={{fontSize:17}}>{c.icon}</span></div>
            <div style={{color:c.color,fontSize:20,fontWeight:700}}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Gastos por pessoa */}
      {Object.keys(porAutor).length>0&&(
        <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:14,padding:18,marginBottom:20}}>
          <h2 style={{color:"#94a3b8",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>👥 Gastos por pessoa este mês</h2>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {Object.entries(porAutor).map(([autor,val])=>(
              <div key={autor} style={{flex:1,minWidth:140,background:"#0f1117",borderRadius:12,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#818cf8,#6ee7b7)",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontWeight:700,fontSize:12}}>{autor[0]}</div>
                  <span style={{color:"#e2e8f0",fontSize:13,fontWeight:600}}>{autor}</span>
                </div>
                <div style={{color:"#f87171",fontSize:18,fontWeight:700}}>{fmt(val)}</div>
                <div style={{color:"#475569",fontSize:11,marginTop:2}}>{((val/gastos)*100||0).toFixed(0)}% do total</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div>
          <h2 style={{color:"#94a3b8",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>⚡ Alertas</h2>
          {alertas.length===0?(
            <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:12,padding:18,textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>✅</div><p style={{color:"#6ee7b7",fontSize:13,fontWeight:600,margin:0}}>Tudo sob controle!</p></div>
          ):alertas.map((a,i)=>{const c={warning:"#f59e0b",danger:"#ef4444",info:"#3b82f6"}[a.type];return(
            <div key={i} style={{background:"#1a1d2e",border:`1px solid ${c}30`,borderRadius:12,padding:"12px 14px",display:"flex",gap:10,marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:9,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{a.icon}</div>
              <div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}><span style={{color:"#e2e8f0",fontSize:12,fontWeight:600}}>{a.title}</span><span style={{background:`${c}20`,color:c,fontSize:10,padding:"1px 6px",borderRadius:20,fontWeight:600}}>{a.agent}</span></div><p style={{color:"#94a3b8",fontSize:11,margin:0,lineHeight:1.4}}>{a.desc}</p></div>
            </div>
          );})}
        </div>
        <div>
          <h2 style={{color:"#94a3b8",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>📊 Por categoria</h2>
          <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:14,padding:18}}>
            {top.length===0?<p style={{color:"#475569",fontSize:13,textAlign:"center",margin:0}}>Nenhum gasto este mês.</p>:top.map(([cat,val])=>(
              <div key={cat} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:"#e2e8f0",fontSize:12}}>{CAT_ICONS[cat]} {cat}</span><span style={{color:"#94a3b8",fontSize:12,fontWeight:600}}>{fmt(val)}</span></div>
                <div style={{background:"#0f1117",borderRadius:4,height:5,overflow:"hidden"}}><div style={{width:`${(val/maxC)*100}%`,height:"100%",background:"linear-gradient(90deg,#6ee7b7,#3b82f6)",borderRadius:4}}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
function Transactions({db}) {
  const {transacoes,contas,addTx,updateTx,deleteTx,importTxs}=db;
  const [modal,setModal]=useState(null);
  const [csv,setCSV]=useState(false);
  const [busca,setBusca]=useState("");
  const [cat,setCat]=useState("Todas");
  const [del,setDel]=useState(null);
  const [saving,setSaving]=useState(false);

  const txF=transacoes.filter(t=>(!busca||t.descricao.toLowerCase().includes(busca.toLowerCase()))&&(cat==="Todas"||t.categoria===cat));
  const grupos={};
  txF.forEach(t=>{
    const d=new Date(t.data+"T12:00:00"),hj=new Date(),on=new Date(Date.now()-86400000);
    const l=d.toDateString()===hj.toDateString()?"Hoje":d.toDateString()===on.toDateString()?"Ontem":fmtDate(t.data);
    if(!grupos[l])grupos[l]=[];grupos[l].push(t);
  });

  const salvar=async form=>{
    setSaving(true);
    if(form.id) await updateTx(form); else await addTx(form);
    setSaving(false); setModal(null);
  };

  return (
    <div style={{padding:"28px 36px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h1 style={{color:"#e2e8f0",fontSize:22,fontWeight:700,margin:"0 0 3px"}}>Transações</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>{transacoes.length} registros</p></div>
        <div style={{display:"flex",gap:10}}>
          <Btn variant="secondary" onClick={()=>setCSV(true)}>📂 Importar CSV</Btn>
          <Btn onClick={()=>setModal("add")}>+ Nova</Btn>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar..." style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:10,padding:"8px 14px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",width:180}}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["Todas",...CATEGORIAS].map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"6px 10px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:500,fontFamily:"inherit",background:cat===c?"#6ee7b7":"#1a1d2e",color:cat===c?"#000":"#94a3b8"}}>
              {c==="Todas"?"Todas":(CAT_ICONS[c]||"")+" "+c}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(grupos).map(([label,txs])=>(
        <div key={label} style={{marginBottom:20}}>
          <div style={{color:"#64748b",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{label}</div>
          <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:13,overflow:"hidden"}}>
            {txs.map((t,idx)=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",padding:"13px 18px",gap:12,borderBottom:idx<txs.length-1?"1px solid #1e2030":"none"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1e2030"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:38,height:38,borderRadius:11,background:"#0f1117",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{CAT_ICONS[t.categoria]||"💸"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:"#e2e8f0",fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.descricao}</div>
                  <div style={{color:"#475569",fontSize:11,marginTop:1}}>{t.categoria} {t.autor&&<span style={{color:"#374151"}}>• {t.autor}</span>}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{color:t.valor>0?"#6ee7b7":"#f87171",fontSize:14,fontWeight:700}}>{t.valor>0?"+":""}{fmt(t.valor)}</div>
                  <div style={{color:"#475569",fontSize:11}}>{fmtDate(t.data)}</div>
                </div>
                <div style={{display:"flex",gap:5,marginLeft:6}}>
                  <button onClick={()=>setModal(t)} style={{background:"#1e2030",border:"none",color:"#6ee7b7",borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11}}>✏️</button>
                  <button onClick={()=>setDel(t.id)} style={{background:"#ef444415",border:"none",color:"#ef4444",borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11}}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal&&<Modal title={modal==="add"?"➕ Nova Transação":"✏️ Editar"} onClose={()=>setModal(null)}><TxForm inicial={modal!=="add"?modal:null} contas={contas} onSave={salvar} onClose={()=>setModal(null)}/></Modal>}
      {csv&&<Modal title="📂 Importar CSV" onClose={()=>setCSV(false)} width={500}><ImportCSV contas={contas} onImport={importTxs} onClose={()=>setCSV(false)}/></Modal>}
      {del&&<Modal title="Excluir transação?" onClose={()=>setDel(null)} width={340}><p style={{color:"#94a3b8",fontSize:13,marginBottom:18}}>Esta ação não pode ser desfeita.</p><div style={{display:"flex",gap:10}}><Btn variant="danger" onClick={async()=>{await deleteTx(del);setDel(null);}} style={{flex:1}}>Excluir</Btn><Btn variant="secondary" onClick={()=>setDel(null)} style={{flex:1}}>Cancelar</Btn></div></Modal>}
    </div>
  );
}

// ─── BUDGETS ──────────────────────────────────────────────────────────────────
function Budgets({db}) {
  const {transacoes,orcamentos,saveOrc}=db;
  const [edit,setEdit]=useState(null);
  const [lim,setLim]=useState("");
  const mes=new Date().getMonth()+1,ano=new Date().getFullYear();
  const gm={};
  transacoes.filter(t=>{const d=new Date(t.data+"T12:00:00");return d.getMonth()+1===mes&&d.getFullYear()===ano&&t.valor<0;}).forEach(t=>{gm[t.categoria]=(gm[t.categoria]||0)+Math.abs(t.valor);});

  return (
    <div style={{padding:"28px 36px"}}>
      <div style={{marginBottom:22}}><h1 style={{color:"#e2e8f0",fontSize:22,fontWeight:700,margin:"0 0 4px"}}>Orçamentos</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>Clique em uma categoria para editar o limite</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
        {CATEGORIAS.filter(c=>c!=="Renda").map(cat=>{
          const limit=orcamentos[cat]||0,spent=gm[cat]||0,pct=limit>0?Math.min((spent/limit)*100,100):0,over=limit>0&&spent>limit;
          const color=over?"#ef4444":pct>80?"#f59e0b":"#6ee7b7";
          return (
            <div key={cat} onClick={()=>{setEdit(cat);setLim(limit||"");}} style={{background:"#1a1d2e",border:`1px solid ${over?"#ef444330":"#1e2030"}`,borderRadius:14,padding:18,cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#6ee7b740"} onMouseLeave={e=>e.currentTarget.style.borderColor=over?"#ef444330":"#1e2030"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:19}}>{CAT_ICONS[cat]||"💸"}</span><span style={{color:"#e2e8f0",fontSize:13,fontWeight:600}}>{cat}</span></div>
                {over&&<span style={{background:"#ef444420",color:"#ef4444",fontSize:10,padding:"2px 7px",borderRadius:20,fontWeight:700}}>EXCEDIDO</span>}
                {!limit&&<span style={{color:"#475569",fontSize:11}}>✏️ definir</span>}
              </div>
              {limit>0&&<div style={{background:"#0f1117",borderRadius:5,height:7,overflow:"hidden",marginBottom:8}}><div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:5}}/></div>}
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:color,fontSize:13,fontWeight:700}}>{fmt(spent)}</span><span style={{color:"#475569",fontSize:12}}>{limit>0?`de ${fmt(limit)}`:""}</span></div>
            </div>
          );
        })}
      </div>
      {edit&&<Modal title={`${CAT_ICONS[edit]||"💸"} ${edit}`} onClose={()=>setEdit(null)} width={340}>
        <p style={{color:"#64748b",fontSize:13,marginBottom:14}}>Gasto atual: <strong style={{color:"#f87171"}}>{fmt(gm[edit]||0)}</strong></p>
        <Input label="Limite mensal (R$)" type="number" min="0" step="10" value={lim} onChange={e=>setLim(e.target.value)} autoFocus/>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn onClick={async()=>{await saveOrc(edit,parseFloat(lim));setEdit(null);}} style={{flex:1}}>Salvar</Btn>
          <Btn variant="secondary" onClick={()=>setEdit(null)}>Cancelar</Btn>
        </div>
      </Modal>}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({db}) {
  const {perfil,contas,savePerfil,addConta,delConta}=db;
  const [pf,setPf]=useState(perfil||{});
  const [saved,setSaved]=useState(false);
  const [novaC,setNC]=useState({nome:"",tipo:"corrente",saldo:"",cor:"#6ee7b7"});
  const [add,setAdd]=useState(false);
  useEffect(()=>{if(perfil)setPf(perfil);},[perfil]);

  const salvar=async()=>{await savePerfil({nomes:pf.nomes,renda_mensal:parseFloat(pf.renda_mensal)||0,meta_economia:parseFloat(pf.meta_economia)||0});setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const adicionar=async()=>{if(!novaC.nome||!novaC.saldo)return;await addConta({...novaC,saldo:parseFloat(novaC.saldo)});setNC({nome:"",tipo:"corrente",saldo:"",cor:"#6ee7b7"});setAdd(false);};

  return (
    <div style={{padding:"28px 36px"}}>
      <h1 style={{color:"#e2e8f0",fontSize:22,fontWeight:700,margin:"0 0 24px"}}>Configurações</h1>

      <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:14,padding:"18px 22px",marginBottom:14}}>
        <h2 style={{color:"#e2e8f0",fontSize:14,fontWeight:700,margin:"0 0 16px"}}>👤 Perfil do Casal</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Renda mensal combinada (R$)" type="number" value={pf.renda_mensal||""} onChange={e=>setPf(p=>({...p,renda_mensal:e.target.value}))}/>
          <Input label="Meta de economia (R$)" type="number" value={pf.meta_economia||""} onChange={e=>setPf(p=>({...p,meta_economia:e.target.value}))}/>
        </div>
        <Btn onClick={salvar}>{saved?"✅ Salvo!":"Salvar"}</Btn>
      </div>

      <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:14,padding:"18px 22px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{color:"#e2e8f0",fontSize:14,fontWeight:700,margin:0}}>🏦 Contas</h2>
          <Btn onClick={()=>setAdd(true)}>+ Adicionar</Btn>
        </div>
        {contas.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #1e2030"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:c.cor||"#6ee7b7",flexShrink:0}}/>
            <div style={{flex:1}}><div style={{color:"#e2e8f0",fontSize:13,fontWeight:600}}>{c.nome}</div><div style={{color:"#475569",fontSize:11}}>{c.tipo}</div></div>
            <div style={{color:"#6ee7b7",fontSize:13,fontWeight:700}}>{fmt(c.saldo)}</div>
            <button onClick={()=>delConta(c.id)} style={{background:"#ef444415",border:"none",color:"#ef4444",borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:11}}>🗑️</button>
          </div>
        ))}
        {add&&<div style={{background:"#0f1117",borderRadius:11,padding:14,marginTop:12}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10}}>
            <Input label="Banco" value={novaC.nome} onChange={e=>setNC(c=>({...c,nome:e.target.value}))} placeholder="Nubank"/>
            <Sel label="Tipo" value={novaC.tipo} onChange={e=>setNC(c=>({...c,tipo:e.target.value}))} options={["corrente","poupanca","credito","investimento"]}/>
            <Input label="Saldo (R$)" type="number" value={novaC.saldo} onChange={e=>setNC(c=>({...c,saldo:e.target.value}))} placeholder="0"/>
          </div>
          <div style={{display:"flex",gap:10}}><Btn onClick={adicionar}>Adicionar</Btn><Btn variant="secondary" onClick={()=>setAdd(false)}>Cancelar</Btn></div>
        </div>}
      </div>

      <div style={{background:"#1a1d2e",border:"1px solid #1e2030",borderRadius:14,padding:"18px 22px"}}>
        <h2 style={{color:"#e2e8f0",fontSize:14,fontWeight:700,margin:"0 0 8px"}}>🔗 Compartilhamento</h2>
        <p style={{color:"#64748b",fontSize:13,margin:"0 0 12px"}}>Envie o link do app para seu(sua) parceiro(a). Ao abrir, ela/ele verá e editará os mesmos dados.</p>
        <div style={{background:"#0f1117",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:"#6ee7b7",fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{window.location.href}</span>
          <button onClick={()=>navigator.clipboard.writeText(window.location.href)} style={{background:"#1e2030",border:"none",color:"#94a3b8",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"inherit",flexShrink:0}}>Copiar</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{minHeight:"100vh",background:"#0a0c13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:48,height:48,borderRadius:13,background:"linear-gradient(135deg,#6ee7b7,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"#000"}}>P</div>
      <div style={{display:"flex",gap:6}}>{[0,.15,.3].map((d,i)=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:"#6ee7b7",animation:"bounce 1.2s ease-in-out infinite",animationDelay:`${d}s`}}/>)}</div>
      <p style={{color:"#475569",fontSize:13}}>Sincronizando com a nuvem...</p>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active,setActive]=useState("dashboard");
  const [setup,setSetup]=useState(false);
  const nomeAtual=localStorage.getItem("smart_nome")||"";
  const db=useData();

  useEffect(()=>{
    if (!db.loading&&!db.perfil) setSetup(true);
  },[db.loading,db.perfil]);

  if (SUPABASE_URL.includes("SEU-PROJETO")) return (
    <div style={{minHeight:"100vh",background:"#0a0c13",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{background:"#1a1d2e",border:"1px solid #f59e0b40",borderRadius:18,padding:32,maxWidth:500,width:"100%"}}>
        <div style={{fontSize:36,marginBottom:12,textAlign:"center"}}>⚙️</div>
        <h2 style={{color:"#e2e8f0",fontSize:18,fontWeight:700,textAlign:"center",margin:"0 0 12px"}}>Configure o Supabase</h2>
        <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.7,marginBottom:16}}>Para rodar com dados na nuvem (compartilhado entre vocês dois), siga o guia <strong style={{color:"#6ee7b7"}}>SUPABASE_SETUP.md</strong> que foi gerado junto com este arquivo. Depois cole suas credenciais no topo do App.jsx.</p>
        <div style={{background:"#0f1117",borderRadius:10,padding:14,fontSize:12,color:"#64748b",lineHeight:1.8}}>
          <div>1. Crie conta gratuita em <span style={{color:"#6ee7b7"}}>supabase.com</span></div>
          <div>2. Crie um projeto</div>
          <div>3. Cole SUPABASE_URL e SUPABASE_ANON no App.jsx</div>
          <div>4. Rode o SQL do arquivo setup.sql no Supabase</div>
          <div>5. Compartilhe o link com seu(sua) parceiro(a)</div>
        </div>
      </div>
    </div>
  );

  if (db.loading) return <Loading/>;
  if (setup)      return <Setup onDone={()=>{setSetup(false);db.recarregar();}}/>;

  const pages={dashboard:Dashboard,transactions:Transactions,budgets:Budgets,settings:Settings};
  const Page=pages[active];

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#0a0c13",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <Sidebar active={active} setActive={setActive} online={db.online} nomeAtual={nomeAtual}/>
      <main style={{marginLeft:220,flex:1,overflowY:"auto",minHeight:"100vh"}}>
        <Page db={db}/>
      </main>
    </div>
  );
}

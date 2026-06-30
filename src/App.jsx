import { useState, useMemo, useRef, useCallback } from "react";

const C = {
  bg:"#f5f4f0", card:"#ffffff", border:"rgba(0,0,0,0.08)", borderS:"rgba(0,0,0,0.14)",
  txt:"#1a1916", muted:"#706e68", hint:"#a09e98",
  accent:"#2563eb", accentB:"#e6f0fb",
  success:"#15803d", successB:"#dcfce7",
  danger:"#b91c1c", dangerB:"#fee2e2",
  warn:"#92400e", warnB:"#fef3c7",
  amber:"#d97706", purple:"#7c3aed", teal:"#0f766e",
};
const R = { sm:8, md:12, lg:16 };

function fmt(n) { if(!n&&n!==0) return "—"; return new Intl.NumberFormat("vi-VN").format(n)+"đ"; }
function fmtM(n) {
  if(!n&&n!==0) return "0đ";
  const abs=Math.abs(n), sign=n<0?"-":"";
  if(abs>=1e9) return sign+(abs/1e9).toFixed(1).replace(".0","")+" tỷ";
  if(abs>=1e6) return sign+(abs/1e6).toFixed(0)+" tr";
  if(abs>=1e3) return sign+(abs/1e3).toFixed(0)+"k";
  return sign+abs;
}
function today(){ return new Date().toISOString().slice(0,10); }

// File helpers
function fileToDataURL(file){ return new Promise(res=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(file); }); }
function isPDF(dataUrl){ return dataUrl&&dataUrl.startsWith("data:application/pdf"); }
function isImage(dataUrl){ return dataUrl&&dataUrl.startsWith("data:image"); }
function getFileName(f){ return f?.name||"file"; }

const SEED_PROJECTS = [
  { id:"p1", name:"Biệt thự Thảo Điền", client:"Anh Minh Tuấn", phone:"0901234567", address:"Thảo Điền, Q2", type:"Nội thất cao cấp", status:"active", contractValue:850000000, startDate:"2026-04-01", endDate:"2026-09-30", note:"Phong cách Japandi, gỗ óc chó", contractFile:null, contractFileName:"" },
  { id:"p2", name:"VP Công ty FintechX", client:"Chị Lan Anh", phone:"0912345678", address:"Cầu Giấy, Hà Nội", type:"Thi công hoàn thiện", status:"active", contractValue:420000000, startDate:"2026-05-15", endDate:"2026-08-15", note:"Thiết kế mở, màu xanh dương", contractFile:null, contractFileName:"" },
  { id:"p3", name:"Căn hộ Vinhomes", client:"Anh Hùng", phone:"0923456789", address:"Bình Thạnh, HCM", type:"Decor & Nội thất", status:"done", contractValue:180000000, startDate:"2026-01-10", endDate:"2026-03-30", note:"Hoàn thành đúng tiến độ", contractFile:null, contractFileName:"" },
];
const SEED_RECEIPTS = [
  { id:"r1", projectId:"p1", date:"2026-04-10", amount:255000000, note:"Thu đợt 1 – 30% hợp đồng", attachments:[] },
  { id:"r2", projectId:"p1", date:"2026-06-01", amount:255000000, note:"Thu đợt 2 – 30% tiến độ", attachments:[] },
  { id:"r3", projectId:"p2", date:"2026-05-20", amount:126000000, note:"Thu đợt 1 – 30% hợp đồng", attachments:[] },
  { id:"r4", projectId:"p3", date:"2026-01-15", amount:54000000, note:"Thu đợt 1 – 30%", attachments:[] },
  { id:"r5", projectId:"p3", date:"2026-02-20", amount:90000000, note:"Thu đợt 2 – 50%", attachments:[] },
  { id:"r6", projectId:"p3", date:"2026-04-05", amount:36000000, note:"Thu quyết toán", attachments:[] },
];
const SEED_EXPENSES = [
  { id:"e1", projectId:"p1", date:"2026-04-15", category:"Vật tư", amount:85000000, vendorId:"v1", note:"Gỗ óc chó nhập khẩu", paid:true },
  { id:"e2", projectId:"p1", date:"2026-04-20", category:"Đội thi công", amount:60000000, vendorId:"v2", note:"Đội thợ mộc – T4", paid:true },
  { id:"e3", projectId:"p1", date:"2026-05-15", category:"Vật tư", amount:40000000, vendorId:"v1", note:"Sơn, phụ kiện", paid:false },
  { id:"e4", projectId:"p1", date:"2026-06-10", category:"Đội thi công", amount:60000000, vendorId:"v2", note:"Đội thợ mộc – T5", paid:false },
  { id:"e5", projectId:"p2", date:"2026-05-22", category:"Vật tư", amount:55000000, vendorId:"v3", note:"Vật liệu hoàn thiện", paid:true },
  { id:"e6", projectId:"p2", date:"2026-06-01", category:"Nhân công", amount:35000000, vendorId:"v4", note:"Thợ sơn & thợ điện", paid:true },
  { id:"e7", projectId:"p2", date:"2026-06-15", category:"Máy móc", amount:12000000, vendorId:"v5", note:"Thuê máy cắt, máy khoan", paid:false },
  { id:"e8", projectId:"p3", date:"2026-01-20", category:"Vật tư", amount:45000000, vendorId:"v3", note:"Nội thất & vật liệu", paid:true },
  { id:"e9", projectId:"p3", date:"2026-02-15", category:"Đội thi công", amount:40000000, vendorId:"v2", note:"Đội lắp đặt T2", paid:true },
  { id:"e10", projectId:"p3", date:"2026-03-10", category:"Chi phí khác", amount:8000000, vendorId:null, note:"Vận chuyển & phát sinh", paid:true },
];
const SEED_VENDORS = [
  { id:"v1", name:"Gỗ Trường Phát", type:"supplier", phone:"0934567890", category:"Vật tư – Gỗ", note:"NCC gỗ nhập khẩu uy tín" },
  { id:"v2", name:"Đội thợ anh Bình", type:"team", phone:"0945678901", category:"Đội thi công", note:"Thợ mộc & lắp đặt nội thất" },
  { id:"v3", name:"Vật Liệu Xây Dựng Hoà Bình", type:"supplier", phone:"0956789012", category:"Vật tư – Xây dựng", note:"Cung cấp vật liệu hoàn thiện" },
  { id:"v4", name:"Đội thợ anh Tuấn", type:"team", phone:"0967890123", category:"Nhân công", note:"Thợ điện, sơn, ốp lát" },
  { id:"v5", name:"Cho thuê máy Minh Phát", type:"supplier", phone:"0978901234", category:"Máy móc", note:"Thuê máy móc thi công" },
];

const EXPENSE_CATS = ["Vật tư","Đội thi công","Nhân công","Máy móc","Chi Phí MKT","Chi Phí VP","Chi phí khác"];
const PROJECT_TYPES = ["Nội thất cao cấp","Thi công hoàn thiện","Decor & Nội thất","Cải tạo","Thiết kế & Thi công"];
const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
const CHART_COLORS = [C.accent, C.success, C.amber, C.purple, C.teal, C.danger];

// ── UI atoms ──────────────────────────────────────────────────────────────────
const card = (x={}) => ({ background:C.card, borderRadius:R.md, border:`1px solid ${C.border}`, ...x });
const inp = { width:"100%", padding:"9px 12px", borderRadius:R.sm, border:`1.5px solid ${C.border}`, fontSize:13, background:"#fafaf8", boxSizing:"border-box", color:C.txt, outline:"none" };
const btn = (bg=C.accent, color="#fff") => ({ padding:"9px 18px", borderRadius:R.sm, border:"none", background:bg, color, fontWeight:600, cursor:"pointer", fontSize:13 });
const badge = (bg,color) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:bg, color, whiteSpace:"nowrap" });
const Tag = ({label,bg,color}) => <span style={badge(bg,color)}>{label}</span>;

function StatusBadge({status}){
  if(status==="active") return <Tag label="Đang thi công" bg={C.accentB} color={C.accent}/>;
  if(status==="done")   return <Tag label="Hoàn thành" bg={C.successB} color={C.success}/>;
  return <Tag label="Chờ khởi công" bg={C.warnB} color={C.warn}/>;
}
function MiniBar({pct,color}){
  return <div style={{height:6,borderRadius:4,background:"#eee",overflow:"hidden",marginTop:4}}><div style={{height:"100%",width:`${Math.min(100,pct||0)}%`,background:color,borderRadius:4,transition:"width .4s"}}/></div>;
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, height=140, showLegend=true }){
  const max = Math.max(...data.flatMap(d=>[d.inc||0,d.exp||0]), 1);
  return (
    <div>
      {showLegend && (
        <div style={{display:"flex",gap:16,marginBottom:10}}>
          {[{label:"Thu",color:C.success},{label:"Chi",color:C.danger}].map(l=>(
            <span key={l.label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}>
              <span style={{width:8,height:8,borderRadius:2,background:l.color,display:"inline-block"}}/>{l.label}
            </span>
          ))}
        </div>
      )}
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height}}>
        {data.map((d,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,height:"100%"}}>
            <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:2,width:"100%"}}>
              <div title={fmt(d.inc)} style={{flex:1,background:C.success,borderRadius:"3px 3px 0 0",height:`${((d.inc||0)/max)*100}%`,minHeight:d.inc?2:0,transition:"height .4s"}}/>
              <div title={fmt(d.exp)} style={{flex:1,background:C.danger, borderRadius:"3px 3px 0 0",height:`${((d.exp||0)/max)*100}%`,minHeight:d.exp?2:0,transition:"height .4s"}}/>
            </div>
            <span style={{fontSize:9,color:C.muted,marginTop:2}}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Line Chart ────────────────────────────────────────────────────────────────
function LineChart({ points, color=C.accent, height=100, label="Số dư" }){
  if(!points||points.length<2) return null;
  const vals = points.map(p=>p.y);
  const min = Math.min(...vals), max = Math.max(...vals,min+1);
  const W=500, H=height-24;
  const px = (i) => (i/(points.length-1))*W;
  const py = (v) => H - ((v-min)/(max-min))*(H-8)+4;
  const polyline = points.map((p,i)=>`${px(i)},${py(p.y)}`).join(" ");
  const area = `M ${px(0)},${H+4} ${points.map((p,i)=>`L ${px(i)},${py(p.y)}`).join(" ")} L ${px(points.length-1)},${H+4} Z`;
  const zeroY = min < 0 ? py(0) : null;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{width:"100%",height}} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${color.replace("#","")})`}/>
      {zeroY && <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke={C.danger} strokeWidth={1} strokeDasharray="4 3" opacity={0.5}/>}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round"/>
      {points.map((p,i)=>(
        <g key={i}>
          <circle cx={px(i)} cy={py(p.y)} r={4} fill={p.y<0?C.danger:color} stroke="#fff" strokeWidth={1.5}/>
          <text x={px(i)} y={height-2} textAnchor="middle" fontSize={9} fill={C.muted}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, size=130 }){
  const total = segments.reduce((s,x)=>s+x.value,0);
  if(!total) return <div style={{width:size,height:size,borderRadius:"50%",background:"#eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.muted}}>Chưa có</div>;
  const cx=size/2, cy=size/2, r=size*0.38, ir=size*0.24;
  let angle=-90;
  const paths = segments.map(seg=>{
    const pct=seg.value/total, sweep=pct*360;
    const s={x:cx+r*Math.cos(angle*Math.PI/180),y:cy+r*Math.sin(angle*Math.PI/180)};
    const e={x:cx+r*Math.cos((angle+sweep)*Math.PI/180),y:cy+r*Math.sin((angle+sweep)*Math.PI/180)};
    const si={x:cx+ir*Math.cos(angle*Math.PI/180),y:cy+ir*Math.sin(angle*Math.PI/180)};
    const ei={x:cx+ir*Math.cos((angle+sweep)*Math.PI/180),y:cy+ir*Math.sin((angle+sweep)*Math.PI/180)};
    const large=sweep>180?1:0;
    const d=`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${ir} ${ir} 0 ${large} 0 ${si.x} ${si.y} Z`;
    angle+=sweep;
    return {...seg,d,pct};
  });
  return (
    <svg width={size} height={size}>
      {paths.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.9}/>)}
      <text x={cx} y={cy-6} textAnchor="middle" fontSize={10} fill={C.muted}>Tổng</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize={12} fontWeight="700" fill={C.txt}>{fmtM(total)}</text>
    </svg>
  );
}

// ── File upload zone ──────────────────────────────────────────────────────────
function FileUploadZone({ label, accept, multiple=false, onFiles, files=[] }){
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const handle = async (fileList) => {
    const arr = Array.from(fileList);
    const results = await Promise.all(arr.map(async f=>({ name:f.name, size:f.size, dataUrl: await fileToDataURL(f) })));
    onFiles(results);
  };
  return (
    <div>
      <div
        onClick={()=>ref.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true);}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files);}}
        style={{border:`1.5px dashed ${drag?C.accent:C.borderS}`,borderRadius:R.sm,padding:"14px 16px",textAlign:"center",cursor:"pointer",background:drag?C.accentB:"#fafaf8",transition:"all .2s"}}>
        <div style={{fontSize:20,marginBottom:4}}>📎</div>
        <div style={{fontSize:12,color:C.muted}}>{label}</div>
        <div style={{fontSize:11,color:C.hint,marginTop:2}}>Kéo thả hoặc nhấn để chọn</div>
        <input ref={ref} type="file" accept={accept} multiple={multiple} style={{display:"none"}} onChange={e=>handle(e.target.files)}/>
      </div>
      {files.length>0 && (
        <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
          {files.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:C.accentB,borderRadius:R.sm,padding:"6px 10px"}}>
              <span style={{fontSize:16}}>{isPDF(f.dataUrl)?"📄":isImage(f.dataUrl)?"🖼":"📎"}</span>
              <span style={{flex:1,fontSize:12,color:C.accent,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
              <span style={{fontSize:11,color:C.muted}}>{(f.size/1024).toFixed(0)}KB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── File viewer ───────────────────────────────────────────────────────────────
function FileViewer({ files=[], onRemove }){
  const [preview, setPreview] = useState(null);
  if(!files||files.length===0) return null;
  return (
    <div style={{marginTop:8}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {files.map((f,i)=>(
          <div key={i} style={{position:"relative",display:"inline-flex",alignItems:"center",gap:6,background:C.accentB,border:`1px solid ${C.border}`,borderRadius:R.sm,padding:"5px 10px",cursor:"pointer"}} onClick={()=>setPreview(f)}>
            <span style={{fontSize:14}}>{isPDF(f.dataUrl)?"📄":isImage(f.dataUrl)?"🖼":"📎"}</span>
            <span style={{fontSize:12,color:C.accent,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
            {onRemove && (
              <span onClick={e=>{e.stopPropagation();onRemove(i);}} style={{fontSize:14,color:C.muted,cursor:"pointer",marginLeft:4}}>×</span>
            )}
          </div>
        ))}
      </div>
      {preview && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setPreview(null)}>
          <div style={{background:C.card,borderRadius:R.lg,padding:20,maxWidth:700,width:"100%",maxHeight:"90vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontWeight:600,fontSize:14}}>{preview.name}</span>
              <div style={{display:"flex",gap:8}}>
                <a href={preview.dataUrl} download={preview.name} style={{...btn(C.accentB,C.accent),textDecoration:"none",fontSize:12,padding:"6px 12px"}}>⬇ Tải xuống</a>
                <button onClick={()=>setPreview(null)} style={{...btn("#f1f0ec",C.txt),padding:"6px 12px",fontSize:12}}>Đóng</button>
              </div>
            </div>
            {isImage(preview.dataUrl) && <img src={preview.dataUrl} alt={preview.name} style={{width:"100%",borderRadius:R.sm}}/>}
            {isPDF(preview.dataUrl) && <iframe src={preview.dataUrl} style={{width:"100%",height:500,border:"none",borderRadius:R.sm}} title={preview.name}/>}
            {!isImage(preview.dataUrl)&&!isPDF(preview.dataUrl) && <div style={{padding:32,textAlign:"center",color:C.muted}}>Không thể xem trước. Nhấn Tải xuống để mở file.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({title,onClose,children,wide=false}){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:16}}>
      <div style={{...card(),width:"100%",maxWidth:wide?700:520,maxHeight:"92vh",overflowY:"auto",padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600}}>{title}</h3>
          <button onClick={onClose} style={{border:"none",background:"none",fontSize:22,cursor:"pointer",color:C.muted}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({label,children,span2=false}){
  return (
    <div style={{marginBottom:12,gridColumn:span2?"1/-1":undefined}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:4,fontWeight:500}}>{label}</div>
      {children}
    </div>
  );
}

function SectionHead({title,action}){
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{margin:0,fontSize:16,fontWeight:600,color:C.txt}}>{title}</h2>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]   = useState("dashboard");
  const [projects,setProjects] = useState(SEED_PROJECTS);
  const [receipts,setReceipts] = useState(SEED_RECEIPTS);
  const [expenses,setExpenses] = useState(SEED_EXPENSES);
  const [vendors,setVendors]   = useState(SEED_VENDORS);
  const [selProjId,setSelProjId] = useState(null);
  const [selMonth,setSelMonth] = useState(null);
  const [modal,setModal] = useState(null);
  const [editItem,setEditItem] = useState(null);

  // ── derived ────────────────────────────────────────────────────────────────
  const totalContract = projects.reduce((s,p)=>s+p.contractValue,0);
  const totalReceived = receipts.reduce((s,r)=>s+r.amount,0);
  const totalExpense  = expenses.reduce((s,e)=>s+e.amount,0);
  const totalUnpaid   = expenses.filter(e=>!e.paid).reduce((s,e)=>s+e.amount,0);
  const netFlow       = totalReceived - totalExpense;
  const pendingRecv   = totalContract - totalReceived;

  const monthlyData = useMemo(()=>Array.from({length:12},(_,i)=>{
    const m=String(i+1).padStart(2,"0");
    const inc=receipts.filter(r=>r.date.slice(5,7)===m&&r.date.startsWith("2026")).reduce((s,r)=>s+r.amount,0);
    const exp=expenses.filter(e=>e.date.slice(5,7)===m&&e.date.startsWith("2026")).reduce((s,e)=>s+e.amount,0);
    return {label:MONTHS[i],inc,exp,net:inc-exp};
  }),[receipts,expenses]);

  const forecastMonths = useMemo(()=>{
    const with3=monthlyData.filter(m=>m.inc>0||m.exp>0).slice(-3);
    const avgInc=with3.length?with3.reduce((s,m)=>s+m.inc,0)/with3.length:0;
    const avgExp=with3.length?with3.reduce((s,m)=>s+m.exp,0)/with3.length:0;
    let running=netFlow;
    return ["T7","T8","T9","T10","T11","T12"].map(label=>{
      running+=avgInc-avgExp;
      return {label,balance:running,inc:avgInc,exp:avgExp};
    });
  },[monthlyData,netFlow]);

  function projectStats(pid){
    const p=projects.find(x=>x.id===pid);
    const recv=receipts.filter(r=>r.projectId===pid).reduce((s,r)=>s+r.amount,0);
    const exp =expenses.filter(e=>e.projectId===pid).reduce((s,e)=>s+e.amount,0);
    return {recv,exp,net:recv-exp,remaining:(p?.contractValue||0)-recv};
  }
  function vendorDebt(vid){ return expenses.filter(e=>e.vendorId===vid&&!e.paid).reduce((s,e)=>s+e.amount,0); }

  // ── forms ─────────────────────────────────────────────────────────────────
  const blankP = {name:"",client:"",phone:"",address:"",type:PROJECT_TYPES[0],status:"active",contractValue:"",startDate:today(),endDate:"",note:"",contractFile:null,contractFileName:""};
  const blankR = {projectId:"",date:today(),amount:"",note:"",attachments:[]};
  const blankE = {projectId:"",date:today(),category:EXPENSE_CATS[0],amount:"",vendorId:"",note:"",paid:false};
  const blankV = {name:"",type:"supplier",phone:"",category:"Vật tư",note:""};

  const [pForm,setPForm] = useState(blankP);
  const [rForm,setRForm] = useState(blankR);
  const [eForm,setEForm] = useState(blankE);
  const [vForm,setVForm] = useState(blankV);
  const [newContractFiles,setNewContractFiles] = useState([]);

  function saveProject(){
    if(!pForm.name||!pForm.contractValue) return;
    const cf = newContractFiles.length>0 ? newContractFiles[0] : (pForm.contractFile||null);
    const obj={...pForm,contractValue:parseFloat(pForm.contractValue),id:editItem?.id||"p"+Date.now(),contractFile:cf,contractFileName:cf?.name||""};
    setProjects(prev=>editItem?prev.map(p=>p.id===editItem.id?obj:p):[obj,...prev]);
    setModal(null);setEditItem(null);setPForm(blankP);setNewContractFiles([]);
  }
  function saveReceipt(){
    if(!rForm.projectId||!rForm.amount) return;
    if(editItem&&editItem._type==="income"){
      setReceipts(prev=>prev.map(r=>r.id===editItem.id?{...rForm,amount:parseFloat(rForm.amount),id:editItem.id,_type:undefined}:r));
    } else {
      setReceipts(prev=>[{...rForm,amount:parseFloat(rForm.amount),id:"r"+Date.now()},...prev]);
    }
    setModal(null);setRForm(blankR);setEditItem(null);
  }
  function saveExpense(){
    if(!eForm.projectId||!eForm.amount) return;
    if(editItem&&editItem._type==="expense"){
      setExpenses(prev=>prev.map(e=>e.id===editItem.id?{...eForm,amount:parseFloat(eForm.amount),id:editItem.id,_type:undefined}:e));
    } else {
      setExpenses(prev=>[{...eForm,amount:parseFloat(eForm.amount),id:"e"+Date.now()},...prev]);
    }
    setModal(null);setEForm(blankE);setEditItem(null);
  }
  function saveVendor(){
    if(!vForm.name) return;
    setVendors(prev=>[{...vForm,id:"v"+Date.now()},...prev]);
    setModal(null);setVForm(blankV);
  }

  const activeProj = projects.find(p=>p.id===selProjId);

  const TABS=[
    {id:"dashboard",label:"📊 Tổng quan"},
    {id:"projects", label:"🏗 Công trình"},
    {id:"cashflow", label:"💰 Thu/Chi"},
    {id:"debt",     label:"⚠️ Công nợ"},
    {id:"report",   label:"📈 Dòng tiền"},
  ];

  // expense breakdown by category for donut
  const expByCat = useMemo(()=>{
    const map={};
    expenses.forEach(e=>{map[e.category]=(map[e.category]||0)+e.amount;});
    return Object.entries(map).map(([name,value],i)=>({name,value,color:CHART_COLORS[i%CHART_COLORS.length]}));
  },[expenses]);

  // receipt breakdown by project for donut
  const recByProj = useMemo(()=>{
    return projects.map((p,i)=>{
      const v=receipts.filter(r=>r.projectId===p.id).reduce((s,r)=>s+r.amount,0);
      return {name:p.name,value:v,color:CHART_COLORS[i%CHART_COLORS.length]};
    }).filter(x=>x.value>0);
  },[projects,receipts]);

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",background:C.bg,minHeight:"100vh",color:C.txt}}>
      {/* Header */}
      <div style={{background:"#1a1916",padding:"0 20px"}}>
        <div style={{maxWidth:980,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0 0"}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:"#fff",letterSpacing:-0.3}}>🏛 BuildFlow</div>
              <div style={{fontSize:11,color:"#888",marginTop:1}}>Quản lý dòng tiền thi công & nội thất</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"#888"}}>Số dư ròng</div>
              <div style={{fontSize:20,fontWeight:700,color:netFlow>=0?"#4ade80":"#f87171"}}>{fmtM(netFlow)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:2,marginTop:12,flexWrap:"wrap"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setSelProjId(null);setSelMonth(null);}}
                style={{padding:"9px 14px",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:tab===t.id?C.bg:"transparent",color:tab===t.id?C.txt:"#aaa",borderRadius:"8px 8px 0 0",transition:"all .15s"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:980,margin:"0 auto",padding:"24px 16px"}}>

        {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
        {tab==="dashboard" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {/* KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
              {[
                {label:"Tổng hợp đồng",val:totalContract,color:C.accent},
                {label:"Đã thu",val:totalReceived,color:C.success},
                {label:"Còn thu",val:pendingRecv,color:C.amber},
                {label:"Tổng chi",val:totalExpense,color:C.danger},
                {label:"Nợ NCC chưa TT",val:totalUnpaid,color:C.purple},
              ].map(k=>(
                <div key={k.label} style={card({padding:"14px 16px"})}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{k.label}</div>
                  <div style={{fontSize:20,fontWeight:700,color:k.color}}>{fmtM(k.val)}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {/* Bar chart */}
              <div style={card({padding:20})}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Thu/Chi theo tháng 2026</div>
                <BarChart data={monthlyData.slice(0,6)} height={130}/>
              </div>
              {/* Line chart: net cumulative */}
              <div style={card({padding:20})}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Số dư tích lũy 2026</div>
                <LineChart
                  points={monthlyData.slice(0,6).reduce((acc,m,i)=>{
                    const prev=acc.length?acc[acc.length-1].y:0;
                    acc.push({label:m.label,y:prev+m.net});
                    return acc;
                  },[])}
                  color={C.accent} height={130}
                />
              </div>
            </div>

            {/* Donuts row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={card({padding:20})}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Cơ cấu chi phí</div>
                <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                  <DonutChart segments={expByCat} size={120}/>
                  <div style={{flex:1}}>
                    {expByCat.map((c,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:c.color,display:"inline-block",flexShrink:0}}/>
                        <span style={{fontSize:11,color:C.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                        <span style={{fontSize:11,fontWeight:600}}>{fmtM(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={card({padding:20})}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Doanh thu theo công trình</div>
                <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                  <DonutChart segments={recByProj} size={120}/>
                  <div style={{flex:1}}>
                    {recByProj.map((c,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:c.color,display:"inline-block",flexShrink:0}}/>
                        <span style={{fontSize:11,color:C.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                        <span style={{fontSize:11,fontWeight:600}}>{fmtM(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Active projects */}
            <div style={card({padding:20})}>
              <SectionHead title="Công trình đang thi công" action={
                <button style={btn(C.accentB,C.accent)} onClick={()=>setTab("projects")}>Xem tất cả →</button>
              }/>
              {projects.filter(p=>p.status==="active").map(p=>{
                const st=projectStats(p.id);
                const pct=p.contractValue?(st.recv/p.contractValue*100):0;
                return (
                  <div key={p.id} onClick={()=>{setSelProjId(p.id);setTab("projects");}}
                    style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14}}>{p.name}</div>
                        <div style={{fontSize:12,color:C.muted,marginTop:2}}>{p.client} · {p.type}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                        <div style={{fontSize:13,fontWeight:600}}>{fmtM(p.contractValue)}</div>
                        <div style={{fontSize:11,color:C.muted}}>Thu: {fmtM(st.recv)}</div>
                      </div>
                    </div>
                    <MiniBar pct={pct} color={C.accent}/>
                    <div style={{fontSize:11,color:C.muted,marginTop:3}}>{pct.toFixed(0)}% đã thu · Chi: {fmtM(st.exp)} · Tồn: {fmtM(st.net)}</div>
                  </div>
                );
              })}
            </div>

            {totalUnpaid>0 && (
              <div style={{background:C.warnB,border:`1px solid #fcd34d`,borderRadius:R.md,padding:"14px 18px",display:"flex",gap:12}}>
                <span style={{fontSize:20}}>⚠️</span>
                <div>
                  <div style={{fontWeight:600,color:C.warn,fontSize:14}}>Còn {fmtM(totalUnpaid)} chưa thanh toán NCC/đội thi công</div>
                  <div style={{fontSize:12,color:C.warn,marginTop:2}}>Vào tab Công nợ để xử lý.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROJECTS LIST ─────────────────────────────────────────────── */}
        {tab==="projects" && !activeProj && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <SectionHead title={`Công trình (${projects.length})`} action={
              <button style={btn()} onClick={()=>{setEditItem(null);setPForm(blankP);setNewContractFiles([]);setModal("project");}}>+ Thêm công trình</button>
            }/>
            {projects.map(p=>{
              const st=projectStats(p.id);
              const pct=p.contractValue?(st.recv/p.contractValue*100):0;
              return (
                <div key={p.id} style={card({padding:18,cursor:"pointer"})} onClick={()=>setSelProjId(p.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,fontSize:15}}>{p.name}</span>
                        <StatusBadge status={p.status}/>
                        <Tag label={p.type} bg="#f1f0ec" color={C.muted}/>
                        {p.contractFile && <Tag label="📄 HĐ đính kèm" bg={C.accentB} color={C.accent}/>}
                      </div>
                      <div style={{fontSize:12,color:C.muted,marginTop:4}}>👤 {p.client} · 📞 {p.phone}</div>
                      <div style={{fontSize:12,color:C.muted}}>📍 {p.address} · {p.startDate} → {p.endDate}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:17,fontWeight:700,color:C.accent}}>{fmtM(p.contractValue)}</div>
                      <div style={{fontSize:12,color:C.muted}}>Hợp đồng</div>
                    </div>
                  </div>
                  <div style={{marginTop:14,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                    {[{label:"Đã thu",val:st.recv,color:C.success},{label:"Đã chi",val:st.exp,color:C.danger},{label:"Còn thu HĐ",val:st.remaining,color:C.amber}].map(s=>(
                      <div key={s.label} style={{background:C.bg,borderRadius:8,padding:"8px 12px"}}>
                        <div style={{fontSize:10,color:C.muted}}>{s.label}</div>
                        <div style={{fontSize:13,fontWeight:700,color:s.color}}>{fmtM(s.val)}</div>
                      </div>
                    ))}
                  </div>
                  <MiniBar pct={pct} color={C.success}/>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>{pct.toFixed(0)}% đã thu</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PROJECT DETAIL ────────────────────────────────────────────── */}
        {tab==="projects" && activeProj && (()=>{
          const p=activeProj;
          const st=projectStats(p.id);
          const pRec=receipts.filter(r=>r.projectId===p.id);
          const pExp=expenses.filter(e=>e.projectId===p.id);
          return (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <button style={{...btn("#f1f0ec",C.txt),alignSelf:"flex-start"}} onClick={()=>setSelProjId(null)}>← Quay lại</button>
              <div style={card({padding:20})}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <h2 style={{margin:0,fontSize:18,fontWeight:700}}>{p.name}</h2>
                      <StatusBadge status={p.status}/>
                    </div>
                    <div style={{fontSize:13,color:C.muted,marginTop:6}}>👤 {p.client} · 📞 {p.phone}</div>
                    <div style={{fontSize:13,color:C.muted}}>📍 {p.address}</div>
                    <div style={{fontSize:13,color:C.muted}}>📅 {p.startDate} → {p.endDate}</div>
                    {p.note && <div style={{fontSize:12,color:C.muted,marginTop:4,fontStyle:"italic"}}>💬 {p.note}</div>}
                    {/* Contract file */}
                    {p.contractFile && (
                      <div style={{marginTop:10}}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:4,fontWeight:500}}>📄 File hợp đồng</div>
                        <FileViewer files={[p.contractFile]}/>
                      </div>
                    )}
                  </div>
                  <button style={btn(C.accentB,C.accent)} onClick={()=>{
                    setEditItem(p);
                    setPForm({...p,contractValue:String(p.contractValue)});
                    setNewContractFiles([]);
                    setModal("project");
                  }}>Sửa</button>
                </div>
                <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
                  {[
                    {label:"Giá trị HĐ",val:p.contractValue,color:C.accent},
                    {label:"Đã thu",val:st.recv,color:C.success},
                    {label:"Còn thu",val:st.remaining,color:C.amber},
                    {label:"Đã chi",val:st.exp,color:C.danger},
                    {label:"Lợi nhuận tạm",val:st.net,color:st.net>=0?C.success:C.danger},
                  ].map(s=>(
                    <div key={s.label} style={{background:C.bg,borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:11,color:C.muted}}>{s.label}</div>
                      <div style={{fontSize:15,fontWeight:700,color:s.color}}>{fmtM(s.val)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipts */}
              <div style={card({padding:20})}>
                <SectionHead title="Thu tiền khách hàng" action={
                  <button style={btn(C.successB,C.success)} onClick={()=>{setRForm(f=>({...f,projectId:p.id}));setModal("receipt");}}>+ Ghi thu</button>
                }/>
                {pRec.length===0 ? <div style={{color:C.hint,fontSize:13}}>Chưa có khoản thu nào.</div> :
                  pRec.map(r=>(
                    <div key={r.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                        <div><span style={{color:C.muted}}>{r.date}</span> · {r.note}</div>
                        <span style={{fontWeight:700,color:C.success,flexShrink:0,marginLeft:12}}>+{fmtM(r.amount)}</span>
                      </div>
                      {r.attachments&&r.attachments.length>0 && (
                        <div style={{marginTop:6}}>
                          <span style={{fontSize:11,color:C.muted}}>Chứng từ: </span>
                          <FileViewer files={r.attachments} onRemove={(i)=>{
                            setReceipts(prev=>prev.map(x=>x.id===r.id?{...x,attachments:x.attachments.filter((_,j)=>j!==i)}:x));
                          }}/>
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>

              {/* Expenses */}
              <div style={card({padding:20})}>
                <SectionHead title="Chi phí công trình" action={
                  <button style={btn("#fee2e2",C.danger)} onClick={()=>{setEForm(f=>({...f,projectId:p.id}));setModal("expense");}}>+ Ghi chi</button>
                }/>
                {pExp.length===0 ? <div style={{color:C.hint,fontSize:13}}>Chưa có khoản chi nào.</div> :
                  pExp.map(e=>{
                    const v=vendors.find(x=>x.id===e.vendorId);
                    return (
                      <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}>
                        <div>
                          <span style={{color:C.muted}}>{e.date}</span> · <strong>{e.category}</strong>
                          {v&&<span style={{color:C.muted}}> · {v.name}</span>}
                          <div style={{fontSize:11,color:C.muted}}>{e.note}</div>
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,marginLeft:12}}>
                          <span style={{fontWeight:700,color:C.danger}}>-{fmtM(e.amount)}</span>
                          {e.paid
                            ? <Tag label="Đã TT" bg={C.successB} color={C.success}/>
                            : <button onClick={()=>setExpenses(prev=>prev.map(x=>x.id===e.id?{...x,paid:true}:x))} style={{...btn(C.warnB,C.warn),padding:"3px 8px",fontSize:11}}>Thanh toán</button>
                          }
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          );
        })()}

        {/* ── CASHFLOW ──────────────────────────────────────────────────── */}
        {tab==="cashflow" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
              <button style={btn(C.successB,C.success)} onClick={()=>{setEditItem(null);setRForm(blankR);setModal("receipt");}}>+ Ghi thu</button>
              <button style={btn("#fee2e2",C.danger)} onClick={()=>{setEditItem(null);setEForm(blankE);setModal("expense");}}>+ Ghi chi</button>
            </div>
            {[...receipts.map(r=>({...r,_type:"income"})),...expenses.map(e=>({...e,_type:"expense"}))]
              .sort((a,b)=>b.date.localeCompare(a.date))
              .map(tx=>{
                const proj=projects.find(p=>p.id===tx.projectId);
                const vendor=vendors.find(v=>v.id===tx.vendorId);
                return (
                  <div key={tx.id} style={card({padding:"14px 18px"})}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                      <div style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0}}>
                        <div style={{width:36,height:36,borderRadius:10,background:tx._type==="income"?C.successB:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                          {tx._type==="income"?"💵":"🧾"}
                        </div>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600}}>{tx.note}</div>
                          <div style={{fontSize:11,color:C.muted}}>
                            {proj?.name} · {tx.date}
                            {vendor&&` · ${vendor.name}`}
                            {tx.category&&` · ${tx.category}`}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontWeight:700,fontSize:14,color:tx._type==="income"?C.success:C.danger}}>
                            {tx._type==="income"?"+":"-"}{fmtM(tx.amount)}
                          </div>
                          {tx._type==="expense"&&(tx.paid?<Tag label="Đã TT" bg={C.successB} color={C.success}/>:<Tag label="Chưa TT" bg={C.warnB} color={C.warn}/>)}
                        </div>
                        <button title="Sửa" onClick={()=>{
                          setEditItem(tx);
                          if(tx._type==="income"){
                            setRForm({projectId:tx.projectId,date:tx.date,amount:String(tx.amount),note:tx.note,attachments:tx.attachments||[]});
                            setModal("receipt");
                          } else {
                            setEForm({projectId:tx.projectId,date:tx.date,category:tx.category,amount:String(tx.amount),vendorId:tx.vendorId||"",note:tx.note,paid:tx.paid});
                            setModal("expense");
                          }
                        }} style={{width:30,height:30,borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
                        <button title="Xoá" onClick={()=>{
                          if(!window.confirm("Xoá giao dịch này?")) return;
                          if(tx._type==="income") setReceipts(prev=>prev.filter(r=>r.id!==tx.id));
                          else setExpenses(prev=>prev.filter(e=>e.id!==tx.id));
                        }} style={{width:30,height:30,borderRadius:8,border:"1px solid #fecaca",background:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑</button>
                      </div>
                    </div>
                    {tx.attachments&&tx.attachments.length>0 && (
                      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(0,0,0,0.08)"}}>
                        <FileViewer files={tx.attachments}/>
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>
        )}

        {/* ── DEBT ──────────────────────────────────────────────────────── */}
        {tab==="debt" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <SectionHead title="Công nợ NCC & Đội thi công" action={
              <button style={btn()} onClick={()=>setModal("vendor")}>+ Thêm NCC/Đội</button>
            }/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
              {[
                {label:"Tổng nợ chưa TT",val:totalUnpaid,color:C.danger},
                {label:"NCC/Đội có nợ",val:vendors.filter(v=>vendorDebt(v.id)>0).length,color:C.amber,unit:" đơn vị"},
                {label:"Đã thanh toán",val:expenses.filter(e=>e.paid).reduce((s,e)=>s+e.amount,0),color:C.success},
              ].map(s=>(
                <div key={s.label} style={card({padding:"14px 16px"})}>
                  <div style={{fontSize:11,color:C.muted}}>{s.label}</div>
                  <div style={{fontSize:18,fontWeight:700,color:s.color,marginTop:2}}>{s.unit?s.val+s.unit:fmtM(s.val)}</div>
                </div>
              ))}
            </div>
            {vendors.map(v=>{
              const debt=vendorDebt(v.id);
              const paid=expenses.filter(e=>e.vendorId===v.id&&e.paid).reduce((s,e)=>s+e.amount,0);
              const txs=expenses.filter(e=>e.vendorId===v.id);
              return (
                <div key={v.id} style={card({padding:18})}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontWeight:600,fontSize:14}}>{v.name}</span>
                        <Tag label={v.type==="team"?"Đội thi công":"Nhà cung cấp"} bg={v.type==="team"?C.accentB:"#f0e6ff"} color={v.type==="team"?C.accent:C.purple}/>
                      </div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>📞 {v.phone} · {v.category}</div>
                      {v.note&&<div style={{fontSize:11,color:C.hint,fontStyle:"italic"}}>{v.note}</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      {debt>0?<div style={{fontSize:16,fontWeight:700,color:C.danger}}>Nợ: {fmtM(debt)}</div>:<Tag label="Không còn nợ" bg={C.successB} color={C.success}/>}
                      <div style={{fontSize:11,color:C.muted,marginTop:2}}>Đã TT: {fmtM(paid)}</div>
                    </div>
                  </div>
                  {txs.length>0&&(
                    <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                      {txs.map(e=>{
                        const proj=projects.find(p=>p.id===e.projectId);
                        return (
                          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",fontSize:12}}>
                            <span style={{color:C.muted}}>{e.date} · {proj?.name} · {e.note}</span>
                            <div style={{display:"flex",gap:8,alignItems:"center"}}>
                              <span style={{fontWeight:600}}>{fmtM(e.amount)}</span>
                              {e.paid?<Tag label="Đã TT" bg={C.successB} color={C.success}/>
                                :<button onClick={()=>setExpenses(prev=>prev.map(x=>x.id===e.id?{...x,paid:true}:x))} style={{...btn(C.warnB,C.warn),padding:"3px 8px",fontSize:11}}>Thanh toán</button>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── REPORT (Dòng tiền) ────────────────────────────────────────── */}
        {tab==="report" && (()=>{
          const mPad = selMonth!==null ? String(selMonth+1).padStart(2,"0") : null;
          const mRec = mPad ? receipts.filter(r=>r.date.slice(5,7)===mPad&&r.date.startsWith("2026")) : [];
          const mExp = mPad ? expenses.filter(e=>e.date.slice(5,7)===mPad&&e.date.startsWith("2026")) : [];
          const mInc = mRec.reduce((s,r)=>s+r.amount,0);
          const mExpSum = mExp.reduce((s,e)=>s+e.amount,0);
          return (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {/* Forecast header */}
            <div style={{...card({padding:20}),background:"#1a1916",border:"none"}}>
              <div style={{color:"#fff",fontWeight:700,fontSize:16,marginBottom:4}}>Dự báo dòng tiền 6 tháng cuối 2026</div>
              <div style={{color:"#aaa",fontSize:13}}>Dựa trên trung bình thu/chi 3 tháng gần nhất</div>
              <div style={{display:"flex",gap:24,marginTop:14,flexWrap:"wrap"}}>
                {[
                  {label:"TB thu/tháng",val:forecastMonths[0]?.inc,color:"#4ade80"},
                  {label:"TB chi/tháng",val:forecastMonths[0]?.exp,color:"#f87171"},
                  {label:"Ròng/tháng",val:(forecastMonths[0]?.inc||0)-(forecastMonths[0]?.exp||0),color:"#60a5fa"},
                ].map(s=>(
                  <div key={s.label}>
                    <div style={{fontSize:11,color:"#888"}}>{s.label}</div>
                    <div style={{fontSize:18,fontWeight:700,color:s.color}}>{fmtM(s.val)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={card({padding:20})}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Thu/Chi thực tế 2026</div>
                <BarChart data={monthlyData} height={140} showLegend={true}/>
              </div>
              <div style={card({padding:20})}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Số dư dự báo (T7–T12)</div>
                <LineChart
                  points={forecastMonths.map(m=>({label:m.label,y:m.balance}))}
                  color={forecastMonths.some(m=>m.balance<0)?C.danger:C.success}
                  height={140}
                />
              </div>
            </div>

            {/* ── MONTHLY REPORT ── */}
            <div style={card({padding:20})}>
              <div style={{fontWeight:600,fontSize:15,marginBottom:14}}>Báo cáo từng tháng — nhấn để xem chi tiết</div>
              {/* Month selector */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
                {MONTHS.map((m,i)=>{
                  const md=monthlyData[i];
                  const active=selMonth===i;
                  const hasData=md.inc>0||md.exp>0;
                  return (
                    <button key={i} onClick={()=>setSelMonth(active?null:i)}
                      style={{padding:"8px 14px",borderRadius:R.sm,border:active?"2px solid "+C.accent:"1px solid rgba(0,0,0,0.1)",
                        background:active?C.accentB:"#fafaf8",color:active?C.accent:hasData?C.txt:C.hint,
                        fontWeight:active?700:400,cursor:"pointer",fontSize:13,transition:"all .15s"}}>
                      {m}
                      {hasData&&<div style={{fontSize:9,marginTop:1,color:active?C.accent:C.muted}}>{fmtM(md.net)}</div>}
                    </button>
                  );
                })}
              </div>

              {/* Monthly detail */}
              {selMonth!==null && (
                <div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.accent}}>
                    Chi tiết tháng {selMonth+1}/2026
                  </div>
                  {/* KPIs */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                    {[
                      {label:"Tổng thu",val:mInc,color:C.success},
                      {label:"Tổng chi",val:mExpSum,color:C.danger},
                      {label:"Dòng tiền ròng",val:mInc-mExpSum,color:(mInc-mExpSum)>=0?C.success:C.danger},
                    ].map(s=>(
                      <div key={s.label} style={{background:C.bg,borderRadius:8,padding:"10px 12px"}}>
                        <div style={{fontSize:11,color:C.muted}}>{s.label}</div>
                        <div style={{fontSize:15,fontWeight:700,color:s.color}}>{fmtM(s.val)}</div>
                      </div>
                    ))}
                  </div>
                  {/* Income list */}
                  {mRec.length>0 && (
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.success,marginBottom:8}}>💵 Khoản thu ({mRec.length})</div>
                      {mRec.map(r=>{
                        const proj=projects.find(p=>p.id===r.projectId);
                        return (
                          <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(0,0,0,0.06)",fontSize:13}}>
                            <div><span style={{color:C.muted}}>{r.date}</span> · {r.note}<div style={{fontSize:11,color:C.muted}}>{proj?.name}</div></div>
                            <span style={{fontWeight:700,color:C.success,flexShrink:0,marginLeft:12}}>+{fmtM(r.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Expense list */}
                  {mExp.length>0 && (
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:C.danger,marginBottom:8}}>🧾 Khoản chi ({mExp.length})</div>
                      {mExp.map(e=>{
                        const proj=projects.find(p=>p.id===e.projectId);
                        const v=vendors.find(x=>x.id===e.vendorId);
                        return (
                          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(0,0,0,0.06)",fontSize:13}}>
                            <div>
                              <span style={{color:C.muted}}>{e.date}</span> · <strong>{e.category}</strong>
                              <div style={{fontSize:11,color:C.muted}}>{proj?.name}{v?` · ${v.name}`:""} · {e.note}</div>
                            </div>
                            <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,marginLeft:12}}>
                              <span style={{fontWeight:700,color:C.danger}}>-{fmtM(e.amount)}</span>
                              {e.paid?<Tag label="Đã TT" bg={C.successB} color={C.success}/>:<Tag label="Chưa TT" bg={C.warnB} color={C.warn}/>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {mRec.length===0&&mExp.length===0&&(
                    <div style={{textAlign:"center",padding:"24px 0",color:C.hint,fontSize:13}}>Không có dữ liệu trong tháng {selMonth+1}</div>
                  )}
                </div>
              )}
            </div>

            {/* Per-project table */}
            <div style={card({padding:20})}>
              <SectionHead title="Hiệu quả từng công trình"/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:"1.5px solid rgba(0,0,0,0.14)"}}>
                      {["Công trình","Giá trị HĐ","Đã thu","Đã chi","Lợi nhuận","Tỷ lệ"].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:11}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p=>{
                      const st=projectStats(p.id);
                      const margin=st.recv?((st.recv-st.exp)/st.recv*100):0;
                      return (
                        <tr key={p.id} style={{borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
                          <td style={{padding:"10px",fontWeight:600}}>{p.name}</td>
                          <td style={{padding:"10px",color:C.accent}}>{fmtM(p.contractValue)}</td>
                          <td style={{padding:"10px",color:C.success}}>{fmtM(st.recv)}</td>
                          <td style={{padding:"10px",color:C.danger}}>{fmtM(st.exp)}</td>
                          <td style={{padding:"10px",fontWeight:700,color:st.net>=0?C.success:C.danger}}>{fmtM(st.net)}</td>
                          <td style={{padding:"10px"}}>
                            <Tag label={`${margin.toFixed(0)}%`} bg={margin>=20?C.successB:margin>0?C.warnB:"#fee2e2"} color={margin>=20?C.success:margin>0?C.warn:C.danger}/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly summary table */}
            <div style={card({padding:20})}>
              <SectionHead title="Tổng hợp dòng tiền 2026"/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:"1.5px solid rgba(0,0,0,0.14)"}}>
                      {["Tháng","Thu","Chi","Ròng","Tích lũy"].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:11}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(()=>{
                      let running=0;
                      return monthlyData.map((m,i)=>{
                        running+=m.net;
                        const active=selMonth===i;
                        return (
                          <tr key={i} onClick={()=>setSelMonth(active?null:i)}
                            style={{borderBottom:"1px solid rgba(0,0,0,0.08)",background:active?C.accentB:i%2===0?"#fafaf8":"#fff",cursor:"pointer"}}>
                            <td style={{padding:"9px 10px",fontWeight:600,color:active?C.accent:C.txt}}>{m.label}</td>
                            <td style={{padding:"9px 10px",color:C.success}}>{m.inc?fmtM(m.inc):"—"}</td>
                            <td style={{padding:"9px 10px",color:C.danger}}>{m.exp?fmtM(m.exp):"—"}</td>
                            <td style={{padding:"9px 10px",fontWeight:600,color:m.net>=0?C.success:C.danger}}>{(m.inc||m.exp)?fmtM(m.net):"—"}</td>
                            <td style={{padding:"9px 10px",fontWeight:600,color:running>=0?C.success:C.danger}}>{(m.inc||m.exp)?fmtM(running):"—"}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {forecastMonths.some(m=>m.balance<0)&&(
              <div style={{background:C.warnB,border:"1px solid #fcd34d",borderRadius:R.md,padding:"14px 18px",display:"flex",gap:12}}>
                <span style={{fontSize:20}}>⚠️</span>
                <div>
                  <div style={{fontWeight:600,color:C.warn}}>Cảnh báo rủi ro dòng tiền âm!</div>
                  <div style={{fontSize:12,color:C.warn,marginTop:2}}>Cần thu hồi công nợ khách hàng hoặc giãn thanh toán NCC.</div>
                </div>
              </div>
            )}
          </div>
          );
        })()}
      </div>

      {/* ── MODAL: PROJECT ─────────────────────────────────────────────── */}
      {modal==="project" && (
        <Modal title={editItem?"Sửa công trình":"Thêm công trình mới"} onClose={()=>{setModal(null);setEditItem(null);}} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Tên công trình *" span2><input style={inp} value={pForm.name} onChange={e=>setPForm(f=>({...f,name:e.target.value}))} placeholder="VD: Biệt thự Thảo Điền"/></Field>
            <Field label="Loại công trình"><select style={inp} value={pForm.type} onChange={e=>setPForm(f=>({...f,type:e.target.value}))}>{PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
            <Field label="Trạng thái"><select style={inp} value={pForm.status} onChange={e=>setPForm(f=>({...f,status:e.target.value}))}><option value="pending">Chờ khởi công</option><option value="active">Đang thi công</option><option value="done">Hoàn thành</option></select></Field>
            <Field label="Tên khách hàng"><input style={inp} value={pForm.client} onChange={e=>setPForm(f=>({...f,client:e.target.value}))} placeholder="Anh/Chị..."/></Field>
            <Field label="Số điện thoại"><input style={inp} value={pForm.phone} onChange={e=>setPForm(f=>({...f,phone:e.target.value}))} placeholder="09xx..."/></Field>
            <Field label="Địa chỉ" span2><input style={inp} value={pForm.address} onChange={e=>setPForm(f=>({...f,address:e.target.value}))} placeholder="Địa chỉ công trình..."/></Field>
            <Field label="Giá trị hợp đồng (đ) *"><input type="number" style={inp} value={pForm.contractValue} onChange={e=>setPForm(f=>({...f,contractValue:e.target.value}))} placeholder="VD: 500000000"/></Field>
            <Field label="Ngày bắt đầu"><input type="date" style={inp} value={pForm.startDate} onChange={e=>setPForm(f=>({...f,startDate:e.target.value}))}/></Field>
            <Field label="Ngày kết thúc dự kiến"><input type="date" style={inp} value={pForm.endDate} onChange={e=>setPForm(f=>({...f,endDate:e.target.value}))}/></Field>
            <Field label="Ghi chú" span2><input style={inp} value={pForm.note} onChange={e=>setPForm(f=>({...f,note:e.target.value}))} placeholder="Phong cách, yêu cầu đặc biệt..."/></Field>
            {/* Contract file */}
            <Field label="📄 Đính kèm file hợp đồng (PDF, DOC, hình ảnh)" span2>
              {pForm.contractFile && newContractFiles.length===0 && (
                <div style={{marginBottom:8}}>
                  <span style={{fontSize:12,color:C.muted}}>File hiện tại: </span>
                  <FileViewer files={[pForm.contractFile]} onRemove={()=>setPForm(f=>({...f,contractFile:null,contractFileName:""}))}/>
                </div>
              )}
              <FileUploadZone
                label="Hợp đồng (PDF, DOC, JPG...)"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple={false}
                files={newContractFiles}
                onFiles={f=>setNewContractFiles(f)}
              />
            </Field>
            <div style={{gridColumn:"1/-1",display:"flex",gap:10}}>
              <button style={btn()} onClick={saveProject}>{editItem?"Lưu thay đổi":"Thêm công trình"}</button>
              <button style={btn("#f1f0ec",C.txt)} onClick={()=>{setModal(null);setEditItem(null);}}>Hủy</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: RECEIPT ─────────────────────────────────────────────── */}
      {modal==="receipt" && (
        <Modal title={editItem&&editItem._type==="income"?"Sửa khoản thu":"Ghi thu tiền khách hàng"} onClose={()=>setModal(null)}>
          <Field label="Công trình *">
            <select style={inp} value={rForm.projectId} onChange={e=>setRForm(f=>({...f,projectId:e.target.value}))}>
              <option value="">-- Chọn công trình --</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Ngày thu"><input type="date" style={inp} value={rForm.date} onChange={e=>setRForm(f=>({...f,date:e.target.value}))}/></Field>
          <Field label="Số tiền (đ) *"><input type="number" style={inp} value={rForm.amount} onChange={e=>setRForm(f=>({...f,amount:e.target.value}))} placeholder="VD: 100000000"/></Field>
          <Field label="Ghi chú"><input style={inp} value={rForm.note} onChange={e=>setRForm(f=>({...f,note:e.target.value}))} placeholder="Thu đợt 1 – 30% hợp đồng..."/></Field>
          {/* Attachments */}
          <Field label="📎 Đính kèm chứng từ (hình ảnh hoặc PDF)">
            <FileUploadZone
              label="Chứng từ thu tiền (ảnh chụp, biên lai, PDF...)"
              accept="image/*,.pdf"
              multiple={true}
              files={rForm.attachments}
              onFiles={newFiles=>setRForm(f=>({...f,attachments:[...(f.attachments||[]),...newFiles]}))}
            />
            {rForm.attachments&&rForm.attachments.length>0 && (
              <FileViewer files={rForm.attachments} onRemove={i=>setRForm(f=>({...f,attachments:f.attachments.filter((_,j)=>j!==i)}))}/>
            )}
          </Field>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button style={btn(C.success)} onClick={saveReceipt}>{editItem&&editItem._type==="income"?"Lưu thay đổi":"Ghi thu"}</button>
            <button style={btn("#f1f0ec",C.txt)} onClick={()=>setModal(null)}>Hủy</button>
          </div>
        </Modal>
      )}

      {/* ── MODAL: EXPENSE ─────────────────────────────────────────────── */}
      {modal==="expense" && (
        <Modal title={editItem&&editItem._type==="expense"?"Sửa khoản chi":"Ghi chi phí"} onClose={()=>setModal(null)}>
          <Field label="Công trình *">
            <select style={inp} value={eForm.projectId} onChange={e=>setEForm(f=>({...f,projectId:e.target.value}))}>
              <option value="">-- Chọn công trình --</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Ngày chi"><input type="date" style={inp} value={eForm.date} onChange={e=>setEForm(f=>({...f,date:e.target.value}))}/></Field>
            <Field label="Danh mục"><select style={inp} value={eForm.category} onChange={e=>setEForm(f=>({...f,category:e.target.value}))}>{EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}</select></Field>
          </div>
          <Field label="Số tiền (đ) *"><input type="number" style={inp} value={eForm.amount} onChange={e=>setEForm(f=>({...f,amount:e.target.value}))} placeholder="VD: 50000000"/></Field>
          <Field label="NCC/Đội thi công">
            <select style={inp} value={eForm.vendorId} onChange={e=>setEForm(f=>({...f,vendorId:e.target.value}))}>
              <option value="">-- Chọn (tuỳ chọn) --</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Ghi chú"><input style={inp} value={eForm.note} onChange={e=>setEForm(f=>({...f,note:e.target.value}))} placeholder="Mô tả khoản chi..."/></Field>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <input type="checkbox" id="paid" checked={eForm.paid} onChange={e=>setEForm(f=>({...f,paid:e.target.checked}))}/>
            <label htmlFor="paid" style={{fontSize:13}}>Đã thanh toán ngay</label>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button style={btn(C.danger)} onClick={saveExpense}>{editItem&&editItem._type==="expense"?"Lưu thay đổi":"Ghi chi"}</button>
            <button style={btn("#f1f0ec",C.txt)} onClick={()=>setModal(null)}>Hủy</button>
          </div>
        </Modal>
      )}

      {/* ── MODAL: VENDOR ──────────────────────────────────────────────── */}
      {modal==="vendor" && (
        <Modal title="Thêm NCC / Đội thi công" onClose={()=>setModal(null)}>
          <Field label="Tên *"><input style={inp} value={vForm.name} onChange={e=>setVForm(f=>({...f,name:e.target.value}))} placeholder="Tên đơn vị hoặc cá nhân"/></Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Loại"><select style={inp} value={vForm.type} onChange={e=>setVForm(f=>({...f,type:e.target.value}))}><option value="supplier">Nhà cung cấp</option><option value="team">Đội thi công</option></select></Field>
            <Field label="Danh mục"><input style={inp} value={vForm.category} onChange={e=>setVForm(f=>({...f,category:e.target.value}))} placeholder="Vật tư, Nhân công..."/></Field>
          </div>
          <Field label="Số điện thoại"><input style={inp} value={vForm.phone} onChange={e=>setVForm(f=>({...f,phone:e.target.value}))} placeholder="09xx..."/></Field>
          <Field label="Ghi chú"><input style={inp} value={vForm.note} onChange={e=>setVForm(f=>({...f,note:e.target.value}))} placeholder="Mô tả ngắn..."/></Field>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button style={btn()} onClick={saveVendor}>Thêm</button>
            <button style={btn("#f1f0ec",C.txt)} onClick={()=>setModal(null)}>Hủy</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

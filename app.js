const KEY='mon_poulailler_vide_v2',today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const def=()=>({cat:[],stock:{d:0,c:0,p:0},ventes:[],dep:[],obj:500000,day:today(),prev:null})
let A=null;try{A=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!A||!A.cat)A=def();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(A))}catch(e){}};
const U={tab:'home',type:'mort'};
const F={d:'Démarrage',c:'Croissance',p:'Ponte / entretien'};
const fmt=n=>Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g,' ')+' FCFA';
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const total=()=>sum(A.cat,c=>c.q),morts=()=>sum(A.cat,c=>c.m);
const conso=k=>sum(A.cat.filter(c=>c.f===k),c=>c.q*c.g)/1000;
const jours=k=>{const d=conso(k);return d?Math.floor(A.stock[k]/d):99};
const V=()=>sum(A.ventes,x=>x.m),D=()=>sum(A.dep,x=>x.m);
const nonVac=c=>Math.max(0,c.q-c.vac-c.tr);
const dec=n=>n.toFixed(1).replace('.',',');
// Le stock baisse chaque jour selon le programme de ration défini pour chaque catégorie.
(function(){const n=Math.min(365,Math.floor((Date.parse(today())-Date.parse(A.day))/864e5));
if(n>0){for(const k of ['d','c','p'])A.stock[k]=Math.max(0,A.stock[k]-conso(k)*n);A.day=today();save();}})();
const tabs=[['home','🏠','Accueil'],['cheptel','🐔','Cheptel'],['aliment','🌾','Aliment'],['sante','💉','Santé'],['argent','💰','Finance'],['rapport','📋','Rapport']];

function alerts(){const a=[];
for(const k of ['d','c','p']){if(!conso(k))continue;const j=jours(k);if(j<=21)a.push([j<=10?'r':'',`Stock ${F[k].toLowerCase()} : ${j<=0?'épuisé':'il reste '+j+' jours'}.`]);}
const nv=sum(A.cat,nonVac);if(nv>0)a.push(['',`${nv} sujets pas encore vaccinés.`]);
if(morts()>0){const mp=morts()/(total()+morts())*100;a.push([mp>8?'r':'',`Mortalité : ${morts()} morts (${dec(mp)} %).`]);}
return a;}
const alertsHtml=()=>alerts().map(x=>`<div class="alert ${x[0]}">${x[1]}</div>`).join('')||'<div class="sub">Rien à signaler.</div>';

function home(){const v=V(),p=Math.min(100,v/A.obj*100),jm=Math.min(...['d','c','p'].filter(k=>conso(k)).map(jours),99);
return `<h1>Mon Élevage Avicole</h1><div class="sub">Tableau de bord</div>
<div class="hero" style="margin-top:12px"><div class="sub">Ventes vers l’objectif du 25 décembre</div><div class="big">${fmt(v)}</div>
<div class="bar"><i style="width:${p}%"></i></div><div class="sub">${p.toFixed(0)} % de ${fmt(A.obj)}</div></div>
<h2>À surveiller</h2>${alertsHtml()}
<h2>En un coup d’œil</h2><div class="grid">
<div class="stat"><span class="sub">🐔 Cheptel</span><b>${total()}</b><span class="sub">volailles</span></div>
<div class="stat"><span class="sub">🌾 Aliment</span><b>${jm} j</b><span class="sub">stock le plus bas</span></div>
<div class="stat"><span class="sub">💉 À vacciner</span><b>${sum(A.cat,nonVac)}</b><span class="sub">${sum(A.cat,c=>c.tr)} en traitement</span></div>
<div class="stat"><span class="sub">💰 Finance</span><b style="color:${V()-D()<0?'var(--red)':'var(--g)'}">${fmt(V()-D())}</b><span class="sub">ventes − dépenses</span></div></div>
${A.prev?'<button class="ghost" id="undo" style="margin-top:16px">↶ Annuler la dernière saisie</button>':''}`;}

function cheptel(){return `<h1>Mon cheptel</h1><div class="sub">${total()} volailles vivantes</div><h2>Par catégorie</h2><div class="card">`+
A.cat.map(c=>`<div class="row"><div><div class="n">${c.e} ${c.n}</div><div class="sub">${c.m?c.m+' mort(s)':'aucune mort'}</div></div><span class="pill p-g" style="font-size:18px">${c.q}</span></div>`).join('')+
`</div><div class="sub">Touchez + pour noter une mort, une naissance, un achat…</div>`;}

function aliment(){const eau=sum(A.cat,c=>c.q*c.g)/1000*2;
return `<h1>Aliment</h1><div class="sub">Le stock baisse chaque jour selon le programme</div><h2>Stock</h2>`+
['d','c','p'].map(k=>{const j=jours(k);return `<div class="card"><div class="row" style="border:0;padding:0"><div><div class="n">${F[k]}</div><div class="sub">${dec(A.stock[k])} kg · ${dec(conso(k))} kg par jour</div></div><span class="pill ${j<=10?'p-r':j<=21?'p-a':'p-g'}">${j>=99?'—':j+' jours'}</span></div></div>`}).join('')+
`<h2>Programme du jour</h2><div class="card">`+
A.cat.map(c=>`<div class="row"><div><div class="n">${c.e} ${c.n}</div><div class="sub">${c.g} g par sujet et par jour</div></div><div style="text-align:right"><b>${(c.q*c.g/1000).toFixed(2).replace('.',',')} kg</b><div><button class="ghost" data-ration-edit="${c.id}" style="margin-top:6px;padding:7px 10px">Modifier la ration</button></div></div></div>`).join('')+
`<div class="row"><div class="n">💧 Eau à prévoir</div><b>${dec(eau)} L</b></div></div>
<div class="sub">Pour changer la ration, touchez le bouton « Modifier la ration » sous la catégorie concernée. Vous pouvez aussi utiliser + puis « Programme de nutrition ». Touchez « Aliment reçu » pour ajouter du stock. Quantités indicatives : ajustez selon l’étiquette du sac et les besoins des volailles.</div>`;}

function sante(){return `<h1>Santé</h1><div class="sub">Vaccinés, à vacciner, en traitement</div><h2>Par catégorie</h2>`+
A.cat.map(c=>{const n=nonVac(c),w=c.q?100/c.q:0;return `<div class="card"><div class="n">${c.e} ${c.n}</div>
<div class="seg"><i style="width:${c.vac*w}%;background:var(--g)"></i><i style="width:${c.tr*w}%;background:var(--red)"></i></div>
<div style="margin-top:8px"><span class="pill p-g">${c.vac} vaccinés</span> <span class="pill p-a">${n} à vacciner</span> <span class="pill p-r">${c.tr} en traitement</span></div></div>`}).join('')+
`<div class="sub">Touchez + puis « Vaccin fait » ou « Traitement » pour mettre à jour.</div>`;}

function argent(){const b=V()-D(),li=a=>a.slice().reverse().map(x=>`<div class="row"><span>${x.l}</span><b>${fmt(x.m)}</b></div>`).join('')||'<div class="sub">Aucune saisie.</div>';
const by=A.dep.reduce((o,x)=>(o[x.l]=(o[x.l]||0)+x.m,o),{});
return `<h1>Finance</h1><div class="sub">Ventes, dépenses, bénéfice</div>
<div class="grid" style="margin-top:12px"><div class="stat"><span class="sub">Ventes</span><b style="color:var(--g)">${fmt(V())}</b></div><div class="stat"><span class="sub">Dépenses</span><b style="color:var(--red)">${fmt(D())}</b></div></div>
<div class="card" style="margin-top:10px"><div class="sub">Bénéfice</div><div class="big" style="color:${b<0?'var(--red)':'var(--g)'}">${fmt(b)}</div></div>
<h2>Ventes</h2><div class="card">${li(A.ventes)}</div>
<h2>Dépenses par type</h2><div class="card">${Object.entries(by).map(([k,m])=>`<div class="row"><span>${k} <span class="sub">${Math.round(D()?m/D()*100:0)} %</span></span><b>${fmt(m)}</b></div>`).join('')||'<div class="sub">Aucune dépense.</div>'}</div>
<h2>Dernières dépenses</h2><div class="card">${li(A.dep)}</div>`;}

function repText(){return `RAPPORT GÉNÉRAL – Mon Élevage Avicole (${today()})
Cheptel : ${total()} volailles (${A.cat.map(c=>c.q+' '+c.n.toLowerCase()).join(', ')})
Mortalité : ${morts()} morts
Aliment : démarrage ${dec(A.stock.d)} kg, croissance ${dec(A.stock.c)} kg, ponte ${dec(A.stock.p)} kg
Santé : ${sum(A.cat,c=>c.vac)} vaccinés, ${sum(A.cat,nonVac)} à vacciner, ${sum(A.cat,c=>c.tr)} en traitement
Ventes : ${fmt(V())}
Dépenses : ${fmt(D())}
Bénéfice : ${fmt(V()-D())}
Objectif ${fmt(A.obj)} : ${(V()/A.obj*100).toFixed(0)} %`;}

function rapport(){const t=repText();
return `<h1>Rapport général</h1><div class="sub">Résumé de l’élevage</div><h2>À surveiller</h2>${alertsHtml()}
<h2>Résumé</h2><div class="card rep">${t}</div>
<a class="ghost" style="background:var(--g);color:#fff;border:0" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(t)}">Partager par WhatsApp</a>
<button class="ghost" id="copy">Copier le rapport</button>
<button class="ghost" id="reset" style="color:var(--red);margin-top:28px">Tout remettre à zéro</button>`;}

function render(){const m={home,cheptel,aliment,sante,argent,rapport};
document.getElementById('app').innerHTML=m[U.tab]();
document.getElementById('nav').innerHTML=tabs.map(t=>`<button class="${U.tab===t[0]?'on':''}" data-t="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join('');
const $=id=>document.getElementById(id);
if($('copy'))$('copy').onclick=()=>{try{navigator.clipboard.writeText(repText()).then(()=>$('copy').textContent='Copié ✓')}catch(e){$('copy').textContent='Copie impossible'}};
if($('undo'))$('undo').onclick=()=>{A=JSON.parse(A.prev);save();render();};
if($('reset'))$('reset').onclick=()=>{if(confirm('Effacer toutes les données ?')){A=def();save();render();}};
$('app').querySelectorAll('[data-ration-edit]').forEach(b=>b.onclick=()=>{U.type='ration';U.rationEdit=b.dataset.rationEdit;form();document.getElementById('sheet').classList.add('open');});
scrollTo(0,0);}
document.getElementById('nav').onclick=e=>{const b=e.target.closest('button');if(b){U.tab=b.dataset.t;render();}};

const TYPES=[['catadd','Créer une catégorie'],['ration','Programme de nutrition'],['mort','Mort'],['entree','Naissance ou achat'],['vente','Vente'],['dep','Dépense'],['feed','Aliment reçu'],['stockset','Corriger le stock'],['sortie','Sortie / perte'],['vac','Vaccin fait'],['trait','Traitement']];
function form(){const t=U.type;
const cats=A.cat.map(c=>[c.id,c.n]);
const O={catadd:[['new','Nouvelle catégorie']],ration:cats,mort:cats,entree:cats,vac:cats,trait:cats,vente:['Œufs','Poulets','Pintades','Autre'].map(x=>[x,x]),dep:['Aliment','Médicaments','Matériel','Transport','Main-d’œuvre','Autre'].map(x=>[x,x]),feed:[['d','Démarrage'],['c','Croissance'],['p','Ponte / entretien']],stockset:[['d','Démarrage'],['c','Croissance'],['p','Ponte / entretien']],sortie:[['d','Démarrage'],['c','Croissance'],['p','Ponte / entretien']]};
const L={catadd:['Nom de la catégorie','Nombre initial de volailles'],ration:['Catégorie','Ration par volaille et par jour (grammes)'],mort:['Catégorie','Nombre de morts'],entree:['Catégorie','Nombre ajouté'],vente:['Type de vente','Montant (FCFA)'],dep:['Type de dépense','Montant (FCFA)'],feed:['Aliment reçu','Quantité (kg)'],stockset:['Type d’aliment à corriger','Nouveau stock réel (kg)'],sortie:['Type d’aliment concerné','Quantité sortie / perdue (kg)'],vac:['Catégorie','Nombre vaccinés (en plus)'],trait:['Catégorie','Nombre en traitement (0 si guéris)']};
const noCat=['ration','mort','entree','vac','trait'].includes(t)&&!A.cat.length;
document.getElementById('form').innerHTML=`<h2 style="margin-top:0">${t==='ration'?'Modifier la ration':'Nouvelle saisie'}</h2>
<label>Que voulez-vous noter ?</label><select id="ft">${TYPES.map(x=>`<option value="${x[0]}" ${x[0]===t?'selected':''}>${x[1]}</option>`).join('')}</select>
${t==='catadd'?`<label>${L[t][0]}</label><input id="fcat" type="text" maxlength="50" placeholder="Ex. Poulets de chair">`:`<label>${L[t][0]}</label><select id="f1">${(O[t]||[]).map(x=>`<option value="${x[0]}" ${(t==='ration'&&U.rationEdit===x[0])?'selected':''}>${x[1]}</option>`).join('')}</select>`}
<label>${L[t][1]}</label><input id="f2" type="number" inputmode="decimal" min="0" step="${['feed','ration','stockset','sortie'].includes(t)?'0.1':'1'}" value="${t==='ration'?(A.cat.find(c=>c.id===(U.rationEdit||A.cat[0]?.id))?.g??''):''}" placeholder="${['feed','stockset','sortie'].includes(t)?'Ex. 25':t==='ration'?'Ex. 120':t==='dep'||t==='vente'?'Ex. 15000':'0'}">
${noCat?`<div class="alert">Crée d’abord une catégorie de volailles avant d’enregistrer cette opération.</div>`:''}
<button class="ok" id="save">Enregistrer</button><button class="ghost" id="cancel">Annuler</button>`;
document.getElementById('ft').onchange=e=>{U.type=e.target.value;U.rationEdit=null;form();};
if(t==='ration'&&document.getElementById('f1'))document.getElementById('f1').onchange=e=>{U.rationEdit=e.target.value;form();};
document.getElementById('cancel').onclick=close;
document.getElementById('save').onclick=()=>{
const raw=document.getElementById('f2').value;
const v=Number(String(raw).trim().replace(',', '.')),s=document.getElementById('f1')?.value;
if(t==='catadd'){
 const name=(document.getElementById('fcat').value||'').trim();
 if(!name){document.getElementById('fcat').focus();return;}
 if(raw===''||!Number.isFinite(v)||v<0||!Number.isInteger(v)){document.getElementById('f2').focus();return;}
 if(A.cat.some(c=>c.n.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Cette catégorie existe déjà.');return;}
 const snap=JSON.stringify({...A,prev:null});
 const id='cat_'+Date.now().toString(36);
 A.cat.push({id,n:name,e:'🐔',q:v,g:50,vac:0,tr:0,f:'c',m:0});
 A.prev=snap;save();close();render();return;
}
if(!Number.isFinite(v)||raw===''||v<0||(!['trait','feed','ration','stockset','sortie'].includes(t)&&!Number.isInteger(v))||(!['trait','stockset'].includes(t)&&v===0)){document.getElementById('f2').focus();return;}
const snap=JSON.stringify({...A,prev:null}),c=A.cat.find(x=>x.id===s);
if(['ration','mort','entree','vac','trait'].includes(t)&&!c){alert('Créez d’abord une catégorie de volailles.');return;}
if(t==='ration'){c.g=v;}
else if(t==='mort'){const n=Math.min(v,c.q);c.q-=n;c.m+=n;c.tr=Math.min(c.tr,c.q);c.vac=Math.min(c.vac,c.q-c.tr);}
else if(t==='entree')c.q+=v;
else if(t==='vac')c.vac=Math.min(c.q-c.tr,c.vac+v);
else if(t==='trait'){c.tr=Math.min(c.q,v);c.vac=Math.min(c.vac,c.q-c.tr);}
else if(t==='feed')A.stock[s]+=v;
else if(t==='stockset')A.stock[s]=v;
else if(t==='sortie'){if(v>A.stock[s]){alert(`Sortie impossible : le stock ${F[s]} disponible est de ${dec(A.stock[s])} kg.`);return;}A.stock[s]=Math.max(0,A.stock[s]-v);}
else if(t==='vente')A.ventes.push({l:s,m:v,date:today()});
else A.dep.push({l:s,m:v,date:today()});
A.prev=snap;save();close();render();};}
function close(){document.getElementById('sheet').classList.remove('open');}
document.getElementById('fab').onclick=()=>{U.type='mort';U.rationEdit=null;form();document.getElementById('sheet').classList.add('open');};
document.getElementById('sheet').onclick=e=>{if(e.target.id==='sheet')close();};
render();
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

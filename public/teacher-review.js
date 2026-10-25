/* أركان — اعتماد المعلم للإجابات المقالية + لوحة «مستواي» لكل معيار */
(function(){
'use strict';
var G=function(n){ var a=window.__ark; return a?a[n]:undefined; };
var css=document.createElement('style');
css.textContent='.rvbox{margin-top:10px;padding:10px 12px;border:1.5px dashed var(--teal,#0B7C82);border-radius:12px;font:600 15px/1.7 var(--ui,Tajawal,sans-serif)}'
+'.rvbtn{border:2px solid var(--teal,#0B7C82);background:transparent;color:inherit;border-radius:99px;padding:6px 14px;font:700 15px var(--ui,Tajawal,sans-serif);cursor:pointer}'
+'.rvbtn:disabled{opacity:.6}.rvbox.pend{border-style:solid;border-color:var(--gold,#E3A90F)}.rvbox.rej{border-color:var(--coral,#C9442A)}.rvbox.ok{border-color:var(--ok,#1D7A55)}'
+'#mvOv{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:16px}'
+'#mvBx{background:var(--paper,#EFF7F4);color:inherit;max-width:760px;width:100%;border-radius:18px;padding:18px 16px 22px;font-family:var(--ui,Tajawal,sans-serif);box-shadow:0 20px 50px rgba(0,0,0,.4)}'
+'#mvBx h2{margin:0 0 4px;font:400 26px var(--display,Lalezar,sans-serif)}#mvBx .sub{opacity:.75;font-size:14px;margin-bottom:12px}'
+'.mvg{margin:14px 0 6px;font-weight:800;font-size:16px;color:var(--teal,#0B7C82)}'
+'.mvr{display:grid;grid-template-columns:34px 1fr auto;gap:4px 10px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(128,128,128,.25)}'
+'.mvn{width:30px;height:30px;border-radius:50%;background:var(--teal,#0B7C82);color:#fff;display:grid;place-items:center;font-weight:800;font-size:14px}'
+'.mvt{font-weight:700;font-size:15px;line-height:1.5}.mvbar{grid-column:2/4;height:9px;border-radius:9px;background:rgba(128,128,128,.25);overflow:hidden}'
+'.mvbar i{display:block;height:100%;border-radius:9px}.mvb{font-weight:800;font-size:13px;padding:3px 10px;border-radius:99px;color:#fff;white-space:nowrap}'
+'.mvl{grid-column:2/4;font-size:13px;opacity:.85}.mvx{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.mvsum{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.mvsum span{padding:4px 12px;border-radius:99px;font-weight:700;font-size:14px;color:#fff}';
document.head.appendChild(css);

/* ---------- حالة الأجهزة ---------- */
function st(){ var S=G('S'); if(!S) return null; if(!S.dev){ S.dev=Array.from(crypto.getRandomValues(new Uint8Array(12))).map(function(x){return (x%36).toString(36);}).join('')+Date.now().toString(36); } if(!S.rev) S.rev={}; return S; }
function sv(){ try{ G('save')(); }catch(e){} }
function code(){ try{ return localStorage.getItem('arkan-unlock-v1')||''; }catch(e){ return ''; } }
function esc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ---------- زر الطالب ---------- */
function boxHtml(id){
  var S=st(); if(!S) return ''; var r=S.rev[id];
  if(!r) return '<div class="rvbox" data-rvwrap="'+id+'">رأيتَ أن إجابتك صحيحة وإن اختلفت عن النموذج؟ <button type="button" class="rvbtn" data-rvreq="'+id+'">🧑‍🏫 اطلب اعتماد المعلم</button></div>';
  if(r.st==='pending') return '<div class="rvbox pend" data-rvwrap="'+id+'">⏳ أُرسلت إجابتك إلى المعلم، وستُحتسب صحيحة تلقائيًا إن اعتمدها.</div>';
  if(r.st==='rejected') return '<div class="rvbox rej" data-rvwrap="'+id+'">🧑‍🏫 راجع المعلم إجابتك ولم يعتمدها.'+(r.note?' <b>ملاحظته:</b> '+esc(r.note):'')+'</div>';
  return '';
}
window.ArkReview={btn:boxHtml};
function setBox(id){ var w=document.querySelector('[data-rvwrap="'+id+'"]'); if(w) w.outerHTML=boxHtml(id)||''; }

async function request(btn){
  var S=st(), id=btn.dataset.rvreq, ITEMREG=G('ITEMREG'); var reg=ITEMREG&&ITEMREG[id], card=document.getElementById('it-'+id);
  if(!S||!reg||!card) return;
  if(!S.sname){ var n=prompt('اكتب اسمك وشعبتك ليراها المعلم (مثال: أحمد علي – 12/3)'); if(!n||!n.trim()) return; S.sname=n.trim().slice(0,60); sv(); }
  var qs=G('qsPayload')(reg.it,card);
  if(!G('hasAnswer')(qs)){ alert('اكتب إجابتك أولًا.'); return; }
  var g=S.ai[id]||{}; btn.disabled=true; btn.textContent='جارٍ الإرسال…';
  var plain=G('plain'), LV=G('LV'), lvOf=G('lvOf'), shortTitle=G('shortTitle');
  var body={dev:S.dev,name:S.sname,id:id,std:shortTitle(reg.s.title),level:LV[lvOf(reg.it)-1].name,quote:G('quoteText')(reg.it),model:plain(reg.it.ans),qs:qs,
    ai:{verdict:g.verdict,score:g.score,why:g.why,missing:g.missing}};
  try{
    var r=await fetch('/api/review',{method:'POST',headers:{'content-type':'application/json','x-book-code':encodeURIComponent(code())},body:JSON.stringify(body)});
    var j=await r.json().catch(function(){return {};});
    if(!r.ok){ btn.disabled=false; btn.textContent='🧑‍🏫 اطلب اعتماد المعلم'; alert(j.error==='not_configured'?'خدمة اعتماد المعلم غير مفعّلة بعد.':j.error==='forbidden'?'أعد فتح الكتاب بالكود ثم حاول.':'تعذّر الإرسال الآن، حاول لاحقًا.'); return; }
    S.rev[id]={st:j.status==='approved'?'approved':'pending',ts:Date.now()}; sv(); setBox(id); schedule();
  }catch(e){ btn.disabled=false; btn.textContent='🧑‍🏫 اطلب اعتماد المعلم'; alert('تعذّر الاتصال بالخادم، تحقق من الإنترنت.'); }
}

/* ---------- متابعة قرار المعلم ---------- */
var timer=null;
function pendingIds(){ var S=st(); return S?Object.keys(S.rev).filter(function(k){return S.rev[k].st==='pending';}):[]; }
function schedule(){ if(timer||!pendingIds().length) return; timer=setInterval(poll,60000); setTimeout(poll,4000); }
async function poll(){
  var S=st(); if(!S) return; var ids=pendingIds(); if(!ids.length){ clearInterval(timer); timer=null; return; }
  try{
    var r=await fetch('/api/review?dev='+encodeURIComponent(S.dev)+'&ids='+ids.join(','),{headers:{'x-book-code':encodeURIComponent(code())}});
    if(!r.ok) return; var j=await r.json(), changed=false, okN=0;
    Object.keys(j.decisions||{}).forEach(function(id){
      var d=j.decisions[id]; if(!S.rev[id]||S.rev[id].st!=='pending') return;
      if(d.st==='approved'){
        S.rev[id]={st:'approved',ts:Date.now()};
        var old=S.ai[id]||{};
        S.ai[id]=Object.assign({},old,{verdict:'correct',accepted:true,teacher:true,score:1,why:'اعتمد المعلم إجابتك واحتسبها صحيحة.'+(d.note?' ملاحظة المعلم: '+d.note:''),missing:'',ts:Date.now()});
        S.done[id]=1; changed=true; okN++;
      } else if(d.st==='rejected'){ S.rev[id]={st:'rejected',note:d.note||'',ts:Date.now()}; changed=true; }
    });
    if(changed){ sv();
      var cur=G('cur'), y=window.scrollY;
      try{ if(typeof cur==='number'&&G('SECS')[cur]&&G('SECS')[cur].type!=='test'){ G('renderSection')(cur); window.scrollTo(0,y); } G('renderToc')(); G('renderMeter')(); }catch(e){}
      try{ if(okN) G('showToast')('<span>✓ اعتمد المعلم '+(okN>1?okN+' من إجاباتك':'إحدى إجاباتك')+' واحتُسبت صحيحة.</span><span class="tacts2"><button type="button" class="tx" data-toast-x>حسنًا</button></span>'); }catch(e){}
    }
  }catch(e){}
}
document.addEventListener('visibilitychange',function(){ if(!document.hidden) poll(); });

/* ---------- لوحة المستوى ---------- */
var BANDS=[{k:0,t:'لم يبدأ',c:'#7a8a8e'},{k:1,t:'يحتاج دعمًا',c:'#C9442A'},{k:2,t:'متوسط',c:'#D98E04'},{k:3,t:'متمكّن',c:'#1D7A55'},{k:4,t:'متقن',c:'#0B7C82'}];
function band(p,started){ if(!started) return BANDS[0]; return p>=90?BANDS[4]:p>=70?BANDS[3]:p>=40?BANDS[2]:BANDS[1]; }
function calc(s){
  var S=G('S'), its=s.items||[], W=0,D=0, lv={1:[0,0],2:[0,0],3:[0,0]};
  its.forEach(function(it){ var l=it.lv||2, id=s.idx+'-'+it._k, w=l; W+=w; lv[l][1]++; if(S.done[id]){ D+=w; lv[l][0]++; } });
  var p=W?Math.round(D*100/W):0; var started=D>0; return {p:p,b:band(p,started),lv:lv,total:its.length,done:lv[1][0]+lv[2][0]+lv[3][0],started:started};
}
function rowHtml(s,label){ var c=calc(s); if(!c.total) return '';
  var name=G('shortTitle')(s.title);
  return '<div class="mvr"><span class="mvn">'+esc(label)+'</span><span class="mvt">'+esc(name)+'</span><span class="mvb" style="background:'+c.b.c+'">'+c.b.t+' · '+c.p+'%</span>'
   +'<span class="mvbar"><i style="width:'+c.p+'%;background:'+c.b.c+'"></i></span>'
   +'<span class="mvl">🌱 '+c.lv[1][0]+'/'+c.lv[1][1]+' &nbsp; 🌿 '+c.lv[2][0]+'/'+c.lv[2][1]+' &nbsp; 🌳 '+c.lv[3][0]+'/'+c.lv[3][1]+'</span></div>';
}
function report(){
  var SECS=G('SECS'), S=G('S'), std=SECS.filter(function(s){return s.pi===0&&s.type==='std'&&s.num!=null;}), nar=SECS.filter(function(s){return s.type==='std'&&s.num==null&&s.items&&s.items.length;});
  return {std:std,nar:nar};
}
function openBoard(){
  var R=report(), S=G('S'), cnt={0:0,1:0,2:0,3:0,4:0}, all=R.std.concat(R.nar), weakest=null;
  all.forEach(function(s){ var c=calc(s); if(!c.total) return; var k=c.b.k; cnt[k]++; if(c.started&&c.p<70&&(!weakest||c.p<weakest.p)) weakest={p:c.p,s:s}; });
  var first=all.find(function(s){ return calc(s).total && !calc(s).started; });
  var h='<h2>📊 مستواي في كل معيار</h2><div class="sub">يُحسب المستوى من أسئلتك المنجزة، ويزن الأسئلة المتقدمة أكثر (🌱×١ · 🌿×٢ · 🌳×٣). تُحتسب الإجابات التي اعتمدها المعلم أيضًا.'+(S.sname?' &nbsp;|&nbsp; '+esc(S.sname):'')+'</div>';
  h+='<div class="mvsum">'+BANDS.map(function(b){ return '<span style="background:'+b.c+'">'+b.t+': '+cnt[b.k]+'</span>'; }).join('')+'</div>';
  var tip=weakest?('الأولى بالمراجعة الآن: <b>'+esc(G('shortTitle')(weakest.s.title))+'</b> ('+weakest.p+'%).'):(first?('ابدأ بـ: <b>'+esc(G('shortTitle')(first.title))+'</b>.'):'ما شاء الله، لا يوجد معيار متأخر!');
  h+='<div class="sub" style="opacity:1">💡 '+tip+'</div>';
  h+='<div class="mvg">معايير القراءة</div>'+R.std.map(function(s){ return rowHtml(s,s.num); }).join('');
  if(R.nar.length) h+='<div class="mvg">دروس السرد</div>'+R.nar.map(function(s){ return rowHtml(s,'س'+s.lesson); }).join('');
  h+='<div class="mvx"><button type="button" class="rvbtn" id="mvCopy">📋 نسخ التقرير</button><button type="button" class="rvbtn" id="mvClose">إغلاق</button></div>';
  var ov=document.createElement('div'); ov.id='mvOv'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.innerHTML='<div id="mvBx">'+h+'</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){ if(e.target===ov||e.target.id==='mvClose') ov.remove();
    if(e.target.id==='mvCopy'){ var lines=['تقرير مستواي – أركان التفاعلي'+(S.sname?' – '+S.sname:'')];
      all.forEach(function(s){ var c=calc(s); if(c.total) lines.push((s.num!=null?'المعيار '+s.num:'السرد '+s.lesson)+' ('+G('shortTitle')(s.title)+'): '+c.b.t+' '+c.p+'%'); });
      var t=lines.join('\n'); (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){ e.target.textContent='✓ تم النسخ'; }).catch(function(){ prompt('انسخ التقرير:',t); }); } });
}
function addBtn(){
  if(document.getElementById('mvBtn')) return; var ai=document.getElementById('aiBtn'); if(!ai||!ai.parentNode) return;
  var b=document.createElement('button'); b.className='tbtn'; b.id='mvBtn'; b.type='button'; b.setAttribute('aria-label','مستواي في المعايير'); b.innerHTML='<span aria-hidden="true">📊</span><span class="lbl">مستواي</span>';
  ai.parentNode.insertBefore(b,ai); b.addEventListener('click',openBoard);
}
document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('[data-rvreq]'); if(b) request(b); });
var tries=0, iv=setInterval(function(){ tries++; addBtn(); if(st()&&G('SECS')&&G('SECS').length){ schedule(); } if(document.getElementById('mvBtn')||tries>60) clearInterval(iv); },500);
})();

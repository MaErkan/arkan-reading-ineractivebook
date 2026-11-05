(function(){
var p=(location.pathname.split('/').pop()||'').replace('.html','');
var hifz=/m=hifz/.test(location.search);
var S=[['kitab','القراءة'],['writing','الكتابة'],['tadribat','الاختبارات'],['qawaid','القواعد'],['qadaya','القضايا'],['hifz','الحفظ']];
var books={'qawaid-ilmi':1,'qawaid-adabi':1,'qadaya-ilmi':1,'qadaya-adabi':1};
var F='font-family:Reem Kufi,serif;';
function stuName(){try{var u=JSON.parse(localStorage.getItem('arkan_user_v3')||'{}');return (u&&u.name)?String(u.name).trim():'';}catch(e){return '';}}
function stuLine(){var n=stuName();if(!n)return '';var sc='';try{var u=JSON.parse(localStorage.getItem('arkan_user_v3')||'{}');sc=u.school||'';}catch(e){}return n+(sc?' · '+sc:'');}
window.arkanStuName=stuName;window.arkanStuLine=stuLine;
var BR=[['qiraa','القراءة والمفردات',13],['kitaba','الكتابة',12],['qawaid','الكلمة والجملة',8],['qadaya','القضايا الأدبية',4],['hifz','الحفظ',3]];
var K={kitab:'qiraa',writing:'kitaba',qawaid:'qawaid','qawaid-ilmi':'qawaid','qawaid-adabi':'qawaid',qadaya:'qadaya','qadaya-ilmi':'qadaya','qadaya-adabi':'qadaya',tashih:'hifz',hifz:'hifz','hifz-ilmi':'hifz','hifz-adabi':'hifz',tasmee:'hifz',tadribat:''};
function lv(pc){return pc==null?'لم يُقَس بعد':pc>=85?'متقدم':pc>=60?'متوسط':'تأسيسي';}
var COL={'لم يُقَس بعد':'#7d8a8c','تأسيسي':'#c0462f','متوسط':'#d08a12','متقدم':'#1e7a4f','متميّز':'#1e7a4f'};
var LVL=[{n:1,name:'التأسيسي',ic:'🌱',c:'#c0462f'},{n:2,name:'المتوسط',ic:'🌿',c:'#d08a12'},{n:3,name:'المتقدم',ic:'🌳',c:'#1e7a4f'}];
function examBr(){var E={},o={};try{E=JSON.parse(localStorage.getItem('arkan_exam_br')||'{}');}catch(e){}
 Object.keys(E).forEach(function(x){var r=E[x]||{};Object.keys(r).forEach(function(k){var v=r[k];if(!v||!v.ans)return;var t=o[k]||(o[k]={got:0,ans:0,ex:0});t.got+=+v.got||0;t.ans+=+v.ans||0;t.ex++;});});return o;}
window.arkanExamBranches=examBr;
function data(){var a={};try{a=JSON.parse(localStorage.getItem('arkan_scores40')||'{}');}catch(e){}var X=examBr();
 return BR.map(function(b){var r=a[b[0]];var pc=(r&&r.max)?Math.round(100*r.got/r.max):null;var x=X[b[0]];var epc=(x&&x.ans)?Math.round(100*x.got/x.ans):null;var src=pc!=null?'الفرع':'الاختبارات';if(pc==null)pc=epc;return{k:b[0],n:b[1],m:b[2],pc:pc,epc:epc,src:src,g:pc==null?0:Math.round(pc*b[2]/100)};});}
function ebookLevels(){
  var S={};try{S=JSON.parse(localStorage.getItem('arkan-ebook-v1')||'{}');}catch(e){}
  var tests=S.tests||{}, out=[];
  for(var L=1;L<=3;L++){
    var sum=0,n=0;
    Object.keys(tests).forEach(function(k){
      if(k.slice(-2)!==('@'+L)) return;
      var r=tests[k]; if(!r||r.best==null) return;
      sum+=(+r.best)||0; n++;
    });
    out.push({L:L,name:LVL[L-1].name,ic:LVL[L-1].ic,c:LVL[L-1].c,pc:n?Math.round(sum/n):null,taken:n});
  }
  return out;
}
var cur=null,D=null;
function levelBar(){
 if(!(p in K))return null;D=data();cur=null;D.forEach(function(d){if(d.k===K[p])cur=d;});
 var wrap=document.createElement('section');wrap.className='arkan-level';wrap.setAttribute('aria-label','قياس المستوى');
 wrap.style.cssText='direction:rtl;background:#F7F3EA;border-bottom:1px solid #e3d6b4;color:#12343B;'+F+'font-size:14px';
 var showLv=(p==='kitab'||p==='tadribat'||K[p]==='qiraa');
 var levels=ebookLevels();
 var lvRows=levels.map(function(x){
   var lab=x.pc==null?'لم يُقَس بعد':(x.pc+'%');
   var band=x.pc==null?'لم يُقَس بعد':lv(x.pc);
   return '<div style="padding:8px 10px;border-radius:10px;margin-top:6px;background:#fff;border:1px solid #e3d6b4">'
     +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
     +'<b style="color:#0B4F53">'+x.ic+' '+x.name+'</b>'
     +'<span style="padding:1px 10px;border-radius:999px;background:'+(x.pc==null?COL['لم يُقَس بعد']:x.c)+';color:#fff;font-size:12px">'+lab+'</span></div>'
     +'<div style="height:7px;background:#e9e0c9;border-radius:999px;overflow:hidden;margin-top:6px"><span style="display:block;height:100%;width:'+(x.pc||0)+'%;background:'+x.c+'"></span></div>'
     +'<div style="font-size:12px;color:#6b6250;margin-top:3px">'+(x.taken?('أُنجز '+x.taken+' اختبارًا في هذا المستوى منفردًا'):'لم يُقَس هذا المستوى بعد')+'</div></div>';
 }).join('');
 var brRows=D.filter(function(d){return !cur||d.k===cur.k;}).map(function(d){var L=lv(d.pc),on=cur&&d.k===cur.k;return '<div style="padding:8px 10px;border-radius:10px;margin-top:6px;'+(on?'background:#fff;border:1px solid #d4a94a':'')+'"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="color:#0B4F53">'+d.n+'</b><span style="padding:1px 10px;border-radius:999px;background:'+COL[L]+';color:#fff;font-size:12px">'+L+' · '+(d.pc==null?0:d.pc)+'%</span></div><div style="height:7px;background:#e9e0c9;border-radius:999px;overflow:hidden;margin-top:6px"><span style="display:block;height:100%;width:'+(d.pc||0)+'%;background:linear-gradient(90deg,#0B7C82,#d4a94a)"></span></div><div style="font-size:12px;color:#6b6250;margin-top:3px">'+d.g+' من '+d.m+' درجة</div></div>';}).join('');
 var avg=0,an=0;levels.forEach(function(x){if(x.pc!=null){avg+=x.pc;an++;}});
 var headPc=an?Math.round(avg/an):(cur&&cur.pc!=null?cur.pc:0);
 var head=showLv?('المستويات: '+(an?headPc+'% متوسط القياسات':'لم تُقَس بعد')):(cur?(cur.n+': '+lv(cur.pc)+(cur.pc==null?'':' · '+cur.g+' من '+cur.m)):'العام');
 var sn=stuName();var snTag=sn?(' — '+sn):'';
 var title=showLv?'مستواي في كل مستوى (منفردًا)'+(snTag):(cur?'مستواي في '+cur.n+snTag:'مستواي في كل فرع'+snTag);
 var note=showLv
  ?'يُقاس كل مستوى بانفراد: التأسيسي ثم المتوسط ثم المتقدم. نسبة كل مستوى من اختباراته فقط، ولا تُخلط مع مستوى آخر.'
  :'يُحسب المستوى من الاختبارات المنجزة في كل فرع (من ٤٠). في القراءة والاختبارات يظهر قياس منفصل لكل مستوى.';
 var body=showLv?lvRows:(brRows+(K[p]==='qiraa'||!cur?'':'') );
 if(p==='tadribat'){body=lvRows+'<div style="margin-top:10px"><b style="color:#0B4F53">درجاتي في الاختبارات حسب الفرع (كل فرع منفصل)</b>'+D.map(function(d){var L=lv(d.epc);return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 10px;margin-top:5px;background:#fff;border:1px solid #e3d6b4;border-radius:10px"><b style="color:#0B4F53">'+d.n+'</b><span style="padding:1px 10px;border-radius:999px;background:'+COL[L]+';color:#fff;font-size:12px">'+(d.epc==null?'لم يُقَس بعد':L+' · '+d.epc+'% · '+Math.round(d.epc*d.m/100)+' من '+d.m)+'</span></div>';}).join('')+'</div>';}
 else if(showLv && cur) body=lvRows+'<div style="margin-top:10px;font-size:12px;color:#6b6250">درجة الفرع من ٤٠: '+(cur.g)+' من '+cur.m+'</div>';
 wrap.innerHTML='<details><summary style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;padding:7px 12px"><b style="white-space:nowrap">📊 مستواي</b>'+(sn?'<span style="padding:2px 10px;border-radius:999px;background:#0B4F53;color:#f0d58f;font-size:12px;max-width:42vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">👤 '+sn+'</span>':'')+'<span style="flex:1;height:8px;background:#e9e0c9;border-radius:999px;overflow:hidden"><span style="display:block;height:100%;width:'+headPc+'%;background:linear-gradient(90deg,#0B7C82,#d4a94a)"></span></span><span style="white-space:nowrap;font-size:13px">'+head+' ▾</span></summary><div style="padding:4px 14px 14px"><h3 style="margin:4px 0;color:#0B4F53;font-size:20px">📊 '+title+'</h3><p style="margin:0 0 8px;font-family:Amiri,serif;color:#5b6b6e;font-size:15px">'+note+'</p>'+body+'</div></details>';
 return wrap;}
window.arkanLevelRefresh=function(){var o=document.querySelector('.arkan-level');if(!o)return;var op=o.querySelector('details');op=op&&op.open;var n=levelBar();if(n){if(op)n.querySelector('details').open=true;o.replaceWith(n);}};
function add(){
 var top=document.createElement('div');top.className='arkan-topbar';top.style.cssText='position:relative;z-index:50';
 if(p!=='kitab'&&p!=='tadribat'){
 var n=document.createElement('nav');n.setAttribute('aria-label','الفروع');
 n.style.cssText='display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:6px 10px;background:#0B4F53;border-bottom:2px solid #d4a94a;'+F+'direction:rtl';
 S.forEach(function(s){var cur=(s[0].split('?')[0]===p)&&(p!=='tashih'||hifz);var a=document.createElement('a');a.href='./'+s[0].replace('?','.html?').replace(/^([a-z]+)$/,'$1.html');a.textContent=s[1];
  a.style.cssText='color:'+(cur?'#0B4F53':'#f0d58f')+';background:'+(cur?'#d4a94a':'transparent')+';border:1px solid #d4a94a;border-radius:999px;padding:2px 11px;font-size:13px;text-decoration:none';n.appendChild(a);});
 top.appendChild(n);}
 var lb=levelBar();if(lb)top.appendChild(lb);
 if(top.children.length)document.body.insertBefore(top,document.body.firstChild);
 if(p==='')return;
 var back=['/?home=1','🏠 العودة إلى البداية'];
 if(document.querySelector('a.arkan-back'))return;
 var x=document.createElement('a');x.className='arkan-back';x.href=back[0];x.textContent=back[1];x.style.cssText='position:fixed;bottom:14px;left:12px;z-index:99999;background:#0B4F53;color:#f0d58f;border:2px solid #d4a94a;border-radius:999px;padding:10px 16px;'+F+'font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.28);';document.body.appendChild(x);
 var xb=document.createElement('a');xb.className='arkan-back-branches';xb.href='./branches.html';xb.textContent='→ رجوع للفروع';xb.style.cssText='position:fixed;bottom:14px;right:12px;z-index:99999;background:#d4a94a;color:#0B4F53;border:2px solid #0B4F53;border-radius:999px;padding:10px 16px;'+F+'font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.28);';document.body.appendChild(xb);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();

/* arkan clear-answers (v121) */
(function(){
var p=(location.pathname.split('/').pop()||'').replace('.html','');
var C={
 'qawaid-ilmi':{keys:['arkan_g_sci','arkan_g_sci_lv'],br:'qawaid'},
 'qawaid-adabi':{keys:['arkan_g_lit','arkan_g_lit_lv'],br:'qawaid'},
 'qadaya-ilmi':{keys:['arkan-qadaya-sci-v2'],br:'qadaya'},
 'qadaya-adabi':{keys:['arkan-qadaya-lit-v2'],br:'qadaya'},
 'kitab':{ebook:1,keys:['arkan-reinforce'],br:'qiraa'},
 'tadribat':{ebook:1,keys:['arkan-reinforce'],br:''},
 'writing':{prefix:'arkan-writing-v1',br:'kitaba'}
};
var c=C[p];if(!c)return;
function clear(){
 try{(c.keys||[]).forEach(function(k){localStorage.removeItem(k);});
 if(c.prefix){for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf(c.prefix)===0)localStorage.removeItem(k);}}
 if(c.ebook){var s=JSON.parse(localStorage.getItem('arkan-ebook-v1')||'null');if(s){s.done={};s.txt={};s.ai={};s.perf={streak:0,miss:0};localStorage.setItem('arkan-ebook-v1',JSON.stringify(s));}}
 if(c.br){var a=JSON.parse(localStorage.getItem('arkan_scores40')||'{}');delete a[c.br];localStorage.setItem('arkan_scores40',JSON.stringify(a));}
 }catch(e){}
 try{window.arkanLevelRefresh&&window.arkanLevelRefresh();}catch(e){}
 location.reload();
}
function add(){
 if(document.querySelector('.arkan-clear'))return;
 var w=document.createElement('div');w.className='arkan-clear';
 w.style.cssText='direction:rtl;text-align:center;padding:22px 12px 70px;font-family:Reem Kufi,serif';
 w.innerHTML='<button type="button" style="background:#c0462f;color:#fff;border:0;border-radius:999px;padding:11px 26px;font:inherit;font-size:16px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.15)">🔄 مسح الإجابات وإعادة المحاولة</button><div style="font-size:13px;color:#7d8a8c;margin-top:6px">تُمسح إجاباتك المحفوظة في هذه الصفحة لتبدأ من جديد.</div>';
 w.querySelector('button').onclick=function(){if(confirm('هل تريد مسح جميع إجاباتك في هذه الصفحة وإعادة المحاولة؟'))clear();};
 document.body.appendChild(w);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();

/* arkan prev-next top (v122) */
(function(){
var p=(location.pathname.split('/').pop()||'').replace('.html','');
if(p===''||p==='index')return;
var F='font-family:Reem Kufi,serif;';
var parent=({'qawaid-ilmi':'./qawaid.html','qawaid-adabi':'./qawaid.html','qadaya-ilmi':'./qadaya.html','qadaya-adabi':'./qadaya.html'})[p]
  || (['kitab','writing','tadribat','qawaid','qadaya','hifz','tasmee'].indexOf(p)>=0?'./branches.html':'./');
var hubs=['kitab','writing','tadribat','qawaid','qadaya','hifz'];
function hubHref(k){return './'+k+'.html';}
function findBtn(re){
  var ux=document.querySelector('#uxTools [data-ux="'+(re.test('التالي')?'next':'previous')+'"]');
  if(ux&&!ux.disabled&&!ux.hidden)return ux;
  var nav=document.querySelectorAll('.nav button, .card .nav button');
  for(var i=0;i<nav.length;i++){if(re.test(nav[i].textContent||''))return nav[i];}
  return null;
}
function hubStep(dir){
  var i=hubs.indexOf(p==='tasmee'||p==='hifz-ilmi'||p==='hifz-adabi'?'hifz':p);
  if(i<0)return null;
  var j=i+dir;if(j<0||j>=hubs.length)return null;
  return hubHref(hubs[j]);
}
function goPrev(){
  var b=findBtn(/السابق/);if(b){b.click();return;}
  if(history.length>1){history.back();return;}
  location.href=parent;
}
function goNext(){
  var b=findBtn(/التالي/);if(b){b.click();return;}
  var h=hubStep(1);if(h){location.href=h;return;}
  try{history.forward();}catch(e){}
}
function add(){
  if(document.querySelector('.arkan-pn'))return;
  var bar=document.createElement('nav');
  bar.className='arkan-pn';
  bar.setAttribute('aria-label','تنقّل الصفحات');
  bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:100000;display:flex;gap:8px;justify-content:space-between;align-items:center;padding:8px 12px;background:#0B4F53;border-bottom:2px solid #d4a94a;direction:rtl;box-shadow:0 2px 10px rgba(0,0,0,.18);'+F;try{var pad=(parseInt(getComputedStyle(document.body).paddingTop)||0);document.body.style.paddingTop='56px';}catch(e){}
  var prev=document.createElement('button');prev.type='button';prev.textContent='→ الصفحة السابقة';
  var next=document.createElement('button');next.type='button';next.textContent='الصفحة التالية ←';
  [prev,next].forEach(function(b){
    b.style.cssText='background:#d4a94a;color:#0B4F53;border:0;border-radius:999px;padding:7px 14px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;min-height:40px';
  });
  prev.onclick=goPrev;next.onclick=goNext;
  var home=document.createElement('a');
  home.href='/?home=1';
  home.className='arkan-pn-home';
  home.textContent='🏠 الصفحة الرئيسية';
  home.setAttribute('aria-label','العودة إلى صفحة البداية');
  home.style.cssText='background:#f0d58f;color:#0B4F53;border:1px solid #d4a94a;border-radius:999px;padding:7px 16px;font:inherit;font-size:14px;font-weight:700;text-decoration:none;min-height:40px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap';
  var who=document.createElement('div');
  who.className='arkan-pn-who';
  var sn2=(window.arkanStuLine?window.arkanStuLine():'');
  who.textContent=sn2?('👤 '+sn2):'👤 طالب غير مسجّل';
  who.title=sn2||'سجّل اسمك من صفحة البداية';
  who.style.cssText='flex:1;text-align:center;color:#f0d58f;font-size:13px;font-weight:700;padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0';
  bar.style.flexWrap='wrap';
  bar.appendChild(prev);bar.appendChild(who);bar.appendChild(home);bar.appendChild(next);
  var top=document.querySelector('.arkan-topbar');
  if(top)top.insertBefore(bar,top.firstChild);
  else document.body.insertBefore(bar,document.body.firstChild);
  prev.title='العودة للصفحة السابقة';
  next.title='الانتقال للصفحة التالية';
  home.title='العودة إلى صفحة البداية';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();

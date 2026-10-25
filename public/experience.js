/* Navigation helpers use existing source routes; never modify question data. */
(()=>{'use strict';
const $=s=>document.querySelector(s),toc=$('#toc'),main=$('#main');if(!toc||!main)return;
const normal=s=>s.replace(/[ًٌٍَُِّْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').trim().toLowerCase();
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
let query='',last=read('arkan-ux-last')||'',scheduled=false;
const links=()=>Array.from(toc.querySelectorAll('a[data-i]'));
function search(){const q=normal(query);let n=0;links().forEach(a=>{const show=!q||normal(a.textContent).includes(q);a.hidden=!show;if(show)n++});
toc.querySelectorAll('.toc-part').forEach(h=>{let a=h.nextElementSibling,show=false;while(a&&!a.classList.contains('toc-part')){if(a.matches('a')&&!a.hidden)show=true;a=a.nextElementSibling}h.hidden=!!q&&!show});
const empty=$('#uxEmpty');if(empty)empty.hidden=n>0;const status=$('#uxSearchStatus');if(status)status.textContent=q?`${n} نتيجة في الفهرس`:'اختر درسًا لبدء القراءة';}
function refresh(){scheduled=false;if(!links().length)return;
 if(!$('#uxSearch')){const box=document.createElement('div');box.className='ux-search';box.id='uxSearch';box.innerHTML='<label for="uxSearchInput">فهرس الكتاب</label><input id="uxSearchInput" type="search" placeholder="ابحث عن درس أو اختبار…" autocomplete="off"><p id="uxSearchStatus" aria-live="polite"></p>';toc.prepend(box);box.querySelector('input').value=query;box.querySelector('input').addEventListener('input',e=>{query=e.target.value;search()});}
 if(!$('#uxEmpty')){const empty=document.createElement('p');empty.id='uxEmpty';empty.className='ux-empty';empty.textContent='مفيش نتائج. جرّب كلمة تانية أو امسح البحث.';empty.hidden=true;toc.append(empty)}
 search();const active=links().find(a=>a.hash===location.hash);links().forEach(a=>{if(a===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 if(active){last=active.hash;write('arkan-ux-last',last)}
 if(!$('#uxTools')){const nav=document.createElement('nav');nav.id='uxTools';nav.className='ux-tools';nav.setAttribute('aria-label','أدوات القراءة');nav.innerHTML='<span class="ux-location"></span><button type="button" data-ux="home">الرئيسية</button><button type="button" data-ux="previous">السابق</button><button type="button" data-ux="next">التالي</button><button type="button" data-ux="focus" aria-pressed="false">وضع التركيز</button>';main.prepend(nav)}
 const nav=$('#uxTools'),all=links(),i=all.indexOf(active);nav.querySelector('.ux-location').textContent=active?(active.querySelector('.t')?.textContent||active.textContent):'مكتبتك التعليمية · الصف الثاني عشر';
 ['previous','next'].forEach((k,j)=>{const b=nav.querySelector(`[data-ux="${k}"]`);b.hidden=!active;b.disabled=j?i===all.length-1:i<=0});
 nav.querySelector('[data-ux="focus"]').setAttribute('aria-pressed',String(document.body.classList.contains('ux-focus')));
 if(!active&&last&&!$('#uxResume')&&main.querySelector('.home')){const target=all.find(a=>a.hash===last);if(target){const b=document.createElement('button');b.type='button';b.id='uxResume';b.className='ux-resume';b.textContent='متابعة آخر درس: '+(target.querySelector('.t')?.textContent||target.textContent);b.onclick=()=>{location.hash=last};nav.after(b)}}
}
// Observe structural renders only; avoid reacting to our own attributes/text.
const observer=new MutationObserver(records=>{if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&!n.id?.startsWith('ux')))){if(!scheduled){scheduled=true;requestAnimationFrame(refresh)}}});
observer.observe(main,{childList:true});observer.observe(toc,{childList:true});
document.addEventListener('click',e=>{const b=e.target.closest('[data-ux]');if(!b)return;const action=b.dataset.ux,all=links(),i=all.findIndex(a=>a.hash===location.hash);if(action==='home')location.hash='';if(action==='previous'&&i>0)location.hash=all[i-1].hash;if(action==='next'&&i>=0&&i<all.length-1)location.hash=all[i+1].hash;if(action==='focus'){document.body.classList.toggle('ux-focus');b.setAttribute('aria-pressed',String(document.body.classList.contains('ux-focus')))}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('ux-focus')){document.body.classList.remove('ux-focus');$('#uxTools [data-ux="focus"]')?.setAttribute('aria-pressed','false')}});
window.addEventListener('hashchange',()=>requestAnimationFrame(refresh));
const skip=document.createElement('a');skip.className='ux-skip';skip.href='#main';skip.textContent='انتقل إلى محتوى الكتاب';skip.onclick=e=>{e.preventDefault();main.tabIndex=-1;main.focus();main.scrollIntoView()};document.body.prepend(skip);
const input=$('#lkI');if(input){input.setAttribute('aria-describedby','lkE');input.setAttribute('autocapitalize','characters');const label=document.createElement('label');label.className='ux-lock-label';label.htmlFor='lkI';label.textContent='كود فتح الكتاب';input.before(label);const meta=document.createElement('p');meta.className='ux-lock-meta';meta.textContent='الصف الثاني عشر · إعداد محمد أركان';$('#lkF')?.append(meta);$('#lkE')?.setAttribute('role','alert')}
refresh();
})();

(()=>{const script=document.createElement('script');script.src='tutor-ui.js?v=openrouter-1';script.defer=true;document.head.append(script)})();

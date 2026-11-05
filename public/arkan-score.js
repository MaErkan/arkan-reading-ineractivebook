/* توزيع درجة أركان من ٤٠ على الفروع — مصدر واحد تستخدمه كل الصفحات */
window.ARKAN_SPLIT=[
 {k:'qiraa',n:'القراءة والمفردات',m:13,re:/قراء|فهم|نص|قصة|القص|شعر|قصيد|أدب|بلاغ|تذوق|معجم|مفرد/},
 {k:'kitaba',n:'الكتابة',m:12,re:/كتاب|تعبير|مقال|إنشاء|خطاب|رسالة/},
 {k:'qawaid',n:'الكلمة والجملة (القواعد)',m:8,re:/قواعد|نحو|صرف|إعراب|إملاء/},
 {k:'qadaya',n:'القضايا الأدبية',m:4,re:/قضي|قضايا|نقد|فكر/},
 {k:'hifz',n:'الحفظ',m:3,re:/حفظ|محفوظ|استظهار/}
];
window.arkanBranchOf=function(t){t=String(t||'');for(var i=1;i<ARKAN_SPLIT.length;i++)if(ARKAN_SPLIT[i].re.test(t))return ARKAN_SPLIT[i].k;return 'qiraa';};
window.arkanSplitHtml=function(){return '<div class="ark40"><b>توزيع الدرجة (من ٤٠)</b><div class="ark40g">'+ARKAN_SPLIT.filter(function(b){return b.k!=='qadaya'&&b.k!=='hifz'}).map(function(b){return '<span>'+b.n+'<i>'+b.m+'</i></span>'}).join('')+'<span>الحفظ والقضايا الأدبية<i>7</i></span>'+'</div></div>';};
window.arkanSaveBranch=function(k,got,max){try{var a=JSON.parse(localStorage.getItem('arkan_scores40')||'{}');a[k]={got:got,max:max,ts:Date.now()};localStorage.setItem('arkan_scores40',JSON.stringify(a));}catch(e){}};

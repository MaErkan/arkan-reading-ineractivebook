/* Browser installation stays under the reader's control. */
(() => {
  'use strict';
  const standalone = window.matchMedia('(display-mode: standalone)');
  let pendingInstall = null;
  const buttons = [];
  const dialog = document.createElement('dialog');
  dialog.dir = 'rtl';
  dialog.setAttribute('aria-labelledby', 'install-title');
  dialog.style.cssText = 'max-width:min(440px,90vw);border:2px solid #0B7C82;border-radius:20px;padding:24px;background:var(--card,#fff);color:var(--ink,#12343A);font-family:inherit;line-height:1.8';
  dialog.innerHTML = '<h2 id="install-title">إضافة أيقونة أركان</h2><p>على الكمبيوتر: افتح الموقع في Chrome أو Edge، ثم اختر «تثبيت التطبيق» من شريط العنوان أو قائمة المتصفح. إذا ظهر خيار إنشاء اختصار، يمكنك اختياره وإضافته إلى سطح المكتب.</p><p>على iPhone أو iPad: افتح الموقع في Safari، واضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».</p><p>على Android: من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p><form method="dialog"><button type="submit">إغلاق</button></form>';
  document.body.append(dialog);
  function sync() {
    buttons.forEach(button => { button.hidden = standalone.matches || navigator.standalone === true; });
  }
  async function install() {
    if (!pendingInstall) { dialog.showModal(); return; }
    const prompt = pendingInstall;
    pendingInstall = null;
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === 'accepted') buttons.forEach(button => { button.hidden = true; });
    } catch { dialog.showModal(); }
  }
  [document.querySelector('.bar-in'), document.querySelector('#lkF')].forEach(container => {
    if (!container) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tbtn';
    button.textContent = 'تثبيت أركان';
    button.setAttribute('aria-label', 'تثبيت أركان وإضافة أيقونته إلى سطح المكتب أو الشاشة الرئيسية');
    button.addEventListener('click', install);
    container.append(button);
    buttons.push(button);
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingInstall = event;
    sync();
  });
  window.addEventListener('appinstalled', () => {
    pendingInstall = null;
    buttons.forEach(button => { button.hidden = true; });
    if (dialog.open) dialog.close();
  });
  standalone.addEventListener('change', sync);
  sync();
})();

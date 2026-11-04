/* Tab 0 "Lý thuyết nền": chèn vào thanh tab của mỗi buổi, không đụng tới mã tính toán của trang */
(function () {
  var sec = document.getElementById('lt-intro'); if (!sec) return;
  var list = document.querySelector('nav.tabs .tablist') || document.querySelector('.modes[role=tablist]'); if (!list) return;
  var modeStyle = list.classList.contains('modes');
  var tabSel = modeStyle ? '.mode-tab' : '.tab';
  var main = modeStyle ? document.getElementById('app') : document.querySelector('main');
  var extra = [document.getElementById('toggleCtl'), document.getElementById('side-toggle')].filter(Boolean);
  var key = 'xlths-lt-' + (location.pathname.split('/').pop() || 'index');
  var b = document.createElement('button');
  b.type = 'button'; b.className = modeStyle ? 'mode-tab' : 'tab'; b.id = 'tb-nen';
  b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'lt-intro');
  b.innerHTML = modeStyle ? '<b>0</b> Lý thuyết<span class="long"> nền</span>' : '<span class="no">0</span>Lý thuyết nền';
  list.insertBefore(b, list.firstChild);
  function tabs() { return list.querySelectorAll(tabSel); }
  function open(scroll) {
    [].forEach.call(tabs(), function (t) { t.setAttribute('aria-selected', t === b ? 'true' : 'false'); });
    sec.hidden = false; if (main) main.classList.add('lt-off');
    extra.forEach(function (e) { e.classList.add('lt-x'); });
    document.body.classList.add('lt-on');
    try { localStorage.setItem(key, '1'); } catch (e) {}
    if (b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (scroll !== false) window.scrollTo(0, 0);
  }
  function close() {
    if (sec.hidden) return;
    sec.hidden = true; b.setAttribute('aria-selected', 'false');
    if (main) main.classList.remove('lt-off');
    extra.forEach(function (e) { e.classList.remove('lt-x'); });
    document.body.classList.remove('lt-on');
    if ((location.hash || '') === '#ly-thuyet') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 40);
  }
  b.addEventListener('click', function () { open(); });
  // bấm tab khác: hiện lại phần mềm TRƯỚC khi trang vẽ (pha capture)
  list.addEventListener('click', function (e) { var t = e.target.closest(tabSel); if (t && t !== b) close(); }, true);
  // nút "Mở tab …" trong phần lý thuyết
  sec.addEventListener('click', function (e) {
    var g = e.target.closest('[data-open]'); if (!g) return;
    var k = g.getAttribute('data-open');
    var t = document.getElementById('tb-' + k) || document.getElementById('mt-' + k);
    if (t) { t.click(); window.scrollTo(0, 0); }
  });
  addEventListener('hashchange', function () { if (location.hash === '#ly-thuyet') open(); });
  var seen = null; try { seen = localStorage.getItem(key); } catch (e) {}
  var h = location.hash || '';
  if (h === '#ly-thuyet' || (!h && !seen)) open(false);
})();

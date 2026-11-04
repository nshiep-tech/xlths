/* Báo hiệu vùng cuộn ngang: làm mờ mép còn nội dung, thêm dòng "Vuốt ngang để xem hết" */
(function () {
  var SEL = '.diag, .chain, .tbl-wrap, .tbl-scroll, .scrollx, nav.tabs .tablist, .modes[role=tablist]';
  var NOHINT = 'tablist';
  function upd(el) {
    var more = el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 0;
    el.classList.toggle('x-more', more);
    el.classList.toggle('x-scrolled', el.scrollLeft > 4);
    el.classList.toggle('x-end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    if (el.getAttribute('role') === NOHINT || el.classList.contains(NOHINT)) return;
    var h = el.nextElementSibling;
    if (h && h.classList.contains('x-hint')) { h.hidden = !more; }
    else if (more) { h = document.createElement('div'); h.className = 'x-hint'; h.textContent = 'Vuốt ngang để xem hết ↔'; el.parentNode.insertBefore(h, el.nextSibling); }
  }
  var t; function all() { clearTimeout(t); t = setTimeout(function () { [].forEach.call(document.querySelectorAll(SEL), upd); }, 120); }
  document.addEventListener('scroll', function (e) { var el = e.target; if (el && el.matches && el.matches(SEL)) upd(el); }, true);
  addEventListener('resize', all); addEventListener('load', all);
  document.addEventListener('click', all, true); document.addEventListener('input', all, true);
  try { new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) { var n = m[i].target; if (n.classList && n.classList.contains('x-hint')) continue; all(); return; } }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  all();
})();

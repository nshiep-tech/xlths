// Đếm lượt truy cập bằng GoatCounter (miễn phí, không dùng cookie).
// Bảng thống kê chi tiết: https://nshiep-xlths.goatcounter.com
(function () {
  var CODE = 'nshiep-xlths';
  var base = 'https://' + CODE + '.goatcounter.com';
  // Không đếm khi mở thử từ tệp trong máy hoặc máy chủ thử nghiệm.
  if (location.protocol === 'file:' || /^(localhost|127\.|192\.168\.)/.test(location.hostname)) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', base + '/count');
  document.head.appendChild(s);

  // Trang chủ: hiện số lượt truy cập (cần bật "Allow adding visitor counts" trong cài đặt GoatCounter).
  var box = document.getElementById('visits');
  if (!box || !window.fetch) return;
  var dir = location.pathname.replace(/[^\/]*$/, '');
  function get(path) {
    return fetch(base + '/counter/' + path + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.count ? String(j.count).trim() : null; })
      .catch(function () { return null; });
  }
  Promise.all([get('TOTAL'), get(dir + 'day-tin-hieu.html'), get(dir + 'tich-chap.html')]).then(function (v) {
    if (!v[0]) return;
    document.getElementById('v-total').textContent = v[0];
    document.getElementById('v-b1').textContent = v[1] || '0';
    document.getElementById('v-b2').textContent = v[2] || '0';
    box.hidden = false;
  });
})();

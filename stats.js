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
  box.hidden = false;
  var dir = location.pathname.replace(/[^\/]*$/, '');
  function get(path) {
    return fetch(base + '/counter/' + path + '.json', { cache: 'no-store' })
      .then(function (r) {
        if (r.status === 404) return '0';            // chưa có lượt nào được ghi
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json().then(function (j) { return j && j.count ? String(j.count).trim() : '0'; });
      });
  }
  Promise.all([get('TOTAL'), get(dir + 'day-tin-hieu.html'), get(dir + 'tich-chap.html')]).then(function (v) {
    document.getElementById('v-total').textContent = v[0];
    document.getElementById('v-b1').textContent = v[1];
    document.getElementById('v-b2').textContent = v[2];
  }).catch(function () {
    document.getElementById('v-note').textContent = 'Chưa tải được số lượt: cần có mạng, hoặc trình chặn quảng cáo đang chặn goatcounter.com.';
  });
})();

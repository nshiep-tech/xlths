# DSP Lab – Phòng thí nghiệm Xử lý tín hiệu số

Nền tảng học tập và thực hành học phần **Xử lý tín hiệu số** bằng các công cụ mô phỏng tương tác.
Giảng viên: **NGUYỄN SỸ HIỆP** – Trường Đại học Công nghệ Thông tin và Truyền thông, Đại học Thái Nguyên.

Trang web: https://nshiep-tech.github.io/xlths/

## Cấu trúc

| Tệp | Nội dung |
|---|---|
| `index.html` | Trang chủ: hero (mô phỏng bộ lọc trung bình trượt tính trực tiếp), phần mềm mô phỏng, bài học theo chương, tài liệu tra cứu |
| `day-tin-hieu.html` | Buổi 1 – Tín hiệu rời rạc (lấy mẫu, lượng tử hóa, dãy cơ bản, phép toán) |
| `tich-chap.html` | Buổi 2 – Tích chập, phương trình sai phân, bài tập tính chất hệ |
| `bien-doi-z.html` | Buổi 3 – Biến đổi Z, ROC, cực – không, Z ngược |
| `he-thong-z.html` | Buổi 4 – Hàm truyền, sơ đồ khối, ghép hệ, Z một phía, ổn định, MATLAB |
| `fourier.html` | Buổi 5 – Biến đổi Fourier rời rạc (DTFT), phổ biên độ/pha, điều kiện tồn tại, tính chất, Parseval |
| `dap-ung-tan-so.html` | Buổi 6 – Đáp ứng tần số H(e^jω), đánh giá hình học từ cực – không, freqz |
| `bo-loc-ly-tuong.html` | Buổi 7 – Bộ lọc lý tưởng, phương trình sai phân, cấu trúc DF1/DF2/nối tiếp/song song |
| `thiet-ke-fir.html` | Buổi 8 – Thiết kế FIR: phương pháp cửa sổ, chọn cửa sổ, Gibbs, lấy mẫu tần số, cấu trúc pha tuyến tính |
| `thiet-ke-iir.html` | Buổi 9 – Thiết kế IIR: ánh xạ s→z, bất biến xung, song tuyến, Butterworth, Chebyshev |
| `assets/theme.css` | Hệ thiết kế chung: design tokens, typography, navigation, cards, simulation panels, charts, breakpoints |
| `assets/zcore.js` | Hàm dùng chung cho Buổi 3, 4 (số phức, nghiệm đa thức, Z ngược, vẽ đồ thị) |
| `assets/lab.css` | Bố cục chung cho phần mềm Buổi 5–9 |
| `assets/fcore.js` | Lõi tính toán Buổi 5–9: DTFT, freqz, lọc, cửa sổ, FIR, Butterworth/Chebyshev (đã đối chiếu với scipy), vẽ đồ thị, sơ đồ khối |
| `assets/intro.js` | Tab 0 "Lý thuyết nền" của mỗi buổi: mục tiêu, kiến thức cần nhớ, khái niệm cốt lõi kèm ví dụ, mạch bài học, lỗi hay gặp, tự kiểm tra (nội dung nằm trong khối `<!--LT-->` của từng trang; liên kết `#ly-thuyet`) |
| `fonts/` | Inter (giao diện) và JetBrains Mono (số liệu), tự lưu trữ để chạy offline |
| `sw.js`, `manifest.webmanifest` | Cài như ứng dụng và chạy offline (tăng `VERSION` mỗi lần cập nhật) |

Liên kết sâu tới từng chức năng: `he-thong-z.html#sd`, `bien-doi-z.html#pz`, `tich-chap.html#ptsp`, `day-tin-hieu.html#tuongtu`…

## Thêm bài học hoặc công cụ mới
1. Tạo trang mới, nạp `fonts/fonts.css` và `assets/theme.css` (sau CSS riêng của trang), dùng thanh `<header class="sitebar tools">` như các trang hiện có.
2. Trong `index.html`: thêm `href` cho buổi tương ứng trong mảng `L`, thêm thẻ vào mảng `T` (phần mềm) – số liệu thống kê và tiến độ tự cập nhật.
3. Thêm tệp vào `ASSETS` trong `sw.js` và tăng `VERSION`.

# Phase 9 — Đợt 47, luồng C4: TTS calibration vòng 2 + phương sai + xác minh bridge bằng trình duyệt

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary
vào repo (WAV đo ở `/tmp/tts47c4/`, ngoài repo), KHÔNG stage bởi luồng
này (parent gộp). Chỉ sửa file text trong `~/workspace/repo-1`.

LƯU Ý VỀ LƯỢT CHẠY: lượt chạy đầu của luồng này bị daemon restart giết
giữa chừng, không có báo cáo cuối. Kiểm tra đĩa cho thấy tiến trình đo
gốc (`drive.py`, pid 2384, chạy từ 07:05) VẪN SỐNG và đã đo xong M3/M4/M5/L3
trước khi restart, rồi tiếp tục L4 sau đó — lượt này TÁI SỬ DỤNG các mẫu
đó sau khi xác minh lại từng WAV bằng header (khớp 100%), thay vì đo
lại. Một driver trùng lặp do lượt này khởi động nhầm đã bị kill ngay
(pid 8531) để tránh tranh CPU và trùng mẫu. File `round47-baseline.txt`
là file rỗng 0 byte (chỉ là mốc thời gian), không chứa danh sách file.

Đóng nợ đợt 46 B3 §6.1–6.4: (1) medium/long hiệu chuẩn YẾU (mẫu mới
n = 2); (2) 19/25 giọng chưa đo + text nhiều số/tên riêng/dấu câu dày
chưa đo; (3) phương sai giữa các lần chạy mới quan sát 1 cặp (~14%);
(4) bridge expose X-TTS-* mới xác minh bằng curl, chưa bằng trình duyệt
ở origin :5173.

## 1. Mẫu đo thật mới: 8 mẫu độc lập qua tts.py trực tiếp (không qua bridge)

Chạy `server/tts/tts.py` bằng `server/tts/.venv2` (model VieNeu-TTS
v3 Turbo đã cache). Độ dài lấy từ header WAV (module `wave`) — mọi mẫu
đều cross-check khớp từng mili-giây. Thời gian nạp model KHÔNG tính vào
độ dài. WAV đo ở `/tmp/tts47c4/` + bảng JSON `/tmp/tts47c4/results.jsonl`
(ngoài repo). Tốc độ tổng hợp (synthSec) ghi để tham khảo, không dùng
cho hiệu chuẩn.

| Mẫu | Text | Giọng | Độ dài thật | Tốc độ | Chế độ |
| --- | --- | --- | --- | --- | --- |
| C4-M3 | 178 ký tự, ngày/giờ + số phiên bản/lỗi/% (xem lib) | Minh Đức | 19,99 s | 8,90 | số dày (13,5% chữ số) |
| C4-M4 | 169 ký tự, tên riêng HN/Đà Lạt/Sa Pa/Phú Quốc/TPHCM | Thùy Dung | 9,36 s | 18,06 | tên riêng |
| C4-M5 | 190 ký tự, nhiều "?", "!", "…", "—" | Thái Sơn | 11,68 s | 16,27 | dấu câu dày |
| C4-L3 | 304 ký tự, số liệu 25 giọng/1043 file/174 LUT/12000 video… | Ngọc Trân | 33,11 s | 9,18 | số dày (14,5% chữ số) |
| C4-L4 | 328 ký tự, tên riêng HN/Đà Lạt/TPHCM/Đà Nẵng… | Phạm Tuyên | 19,08 s | 17,19 | tên riêng |
| C4-L5 | 296 ký tự, nhiều "?", "!", "…", "100%" | Xuân Vĩnh | 16,04 s | 18,45 | dấu câu dày |
| C4-S4 | "Bản 2.4.1 sửa 128 lỗi, nhanh hơn 45%!" (37) | Quốc Tuấn | 4,56 s | 8,11 | số dày (21,6% chữ số) |
| C4-VS5 | "Bắt đầu thôi!" (13) | Adam | 0,96 s | 13,54 | thường |

Text đầy đủ của M3/M4/M5/L3/L4/L5/S4/VS5 nằm trong `TTS_SAMPLES_47C4`
(test đếm lại ký tự từ text, không tin mù số chars).

### Phát hiện: text nhiều số là một chế độ riêng, chậm gấp đôi

- 3 mẫu số-dày đọc ở 8,11 / 8,90 / 9,18 ký tự/giây — chậm GẤP ĐÔI
  so với text thường cùng tầng (~17–19). Hiệu ứng xuyên tầng (short,
  medium, long đều chậm như nhau) và nhất quán (3 mẫu chụm trong
  ±7% quanh 9,0).
- Tên riêng (M4 18,06; L4 17,19) và dấu câu dày (M5 16,27; L5 18,45)
  đọc ở tốc độ BÌNH THƯỜNG — chỉ có SỐ mới làm chậm. Giả thuyết hợp
  lý (chưa chứng minh): model đọc từng chữ số/thành phần số thành
  tiếng ("hai nghìn không trăm hai mươi sáu", "hai chấm bốn chấm
  một") nên số lượng âm tiết thực tế gấp nhiều lần số ký tự.
- Gộp chung số-dày vào một hệ số sẽ phá cả hai phía: medium gộp tất
  cả cho [0,77×, 1,68×], long [0,79×, 1,73×] — khoảng rộng tới mức
  hậu tố toast vô dụng, mà tâm vẫn lệch cho text thường. Vì vậy C4
  TÁCH chế độ (xem §2), không gộp mù.

## 2. Bảng hiệu chuẩn C4 (`ttsEstimate47C4.ts`, KHÔNG sửa file A3/B3)

File A3/B3 giữ nguyên vẹn (hồi quy A3 10/10, B3 7/7). C4 là lớp mới
chồng lên B3. Quy tắc giữ từ B3: một tầng chỉ `calibrated: true` khi
có ≥3 mẫu ĐỘC LẬP của tầng đó; các lần chạy lặp phương sai KHÔNG
tính vào n. Hệ số trung tâm = tốc độ gộp; khoảng = biên quan sát làm
tròn RA NGOÀI tới 4 chữ số; KHÔNG phải khoảng tin cậy thống kê.

### 2.1 Chế độ normal (text thường — mẫu số-dày loại ra)

| Tầng | n normal (mới C4) | Hệ số gộp (ký tự/giây) | Khoảng C4 | So với B3 |
| --- | --- | --- | --- | --- |
| veryShort (<20) | 6 (1) | 70/5,12 = 13,6719 | [0,8203×, 1,1932×] | gần như giữ nguyên (13,7019) |
| short (20–79) | 5 (0) | 244/13,76 = 17,7326 | [0,8395×, 1,2719×] | giữ nguyên (S4 số-dày loại ra) |
| medium (80–199) | 5 (3) | 771/43,60 = 17,6835 | [0,9183×, 1,0871×] | HẾT YẾU: 18,2624 → 17,6835; khoảng hẹp lại |
| long (≥200) | 5 (3) | 1547/83,12 = 18,6116 | [0,9271×, 1,0827×] | HẾT YẾU: 19,2292 → 18,6116; khoảng hẹp lại |

Medium/long nay đủ n = 5 với mẫu mới C4 n = 3 mỗi tầng — hết "hiệu
chuẩn yếu" theo nghĩa số lượng. Lưu ý: khoảng normal HẸP HƠN B3
(medium [0,92×, 1,09×] so với [0,95×, 1,10×]) vì mẫu M4/M5 mới nằm
gọn trong dải cũ; khoảng hẹp này vẫn chỉ là biên quan sát của 5 điểm.

### 2.2 Chế độ numberDense (text nhiều số — một hệ số chung mọi tầng)

- Hệ số gộp: 519 ký tự / 57,66 s = **9,0010 ký tự/giây** (n = 3:
  M3/L3/S4).
- Khoảng: **[0,9803×, 1,1094×]** (biên quan sát của 3 điểm).
- Bộ phát hiện: tỉ lệ ký tự chữ số (0–9) trên tổng ký tự ≥ 0,05.
  Ngưỡng TẠM THỜI: mẫu thường cao nhất chỉ 1,0% chữ số (L5, nhờ
  "100%"), mẫu số-dày thấp nhất 13,5% — ngưỡng 5% nằm trong khoảng
  trống 1,0% → 13,5%, chưa có mẫu nào ở gần ngưỡng để khóa chặt.
  Test chỉ khóa hành vi phát hiện trên các mẫu đã đo + đúng điểm
  ngưỡng 5% (1/20 → dày, 1/21 → thường), không khóa ngưỡng như chân lý.
- Ghi chú trung thực: numberDense là HIỆU CHUẨN YẾU (n = 3, gộp
  xuyên tầng, ngưỡng tạm thời). Text số-dày mới hoàn toàn có thể rơi
  ngoài khoảng [0,98×, 1,11×] — đặc biệt text toàn số (số điện thoại,
  mã số, ngày tháng dày đặc) chưa đo mẫu nào.

### 2.3 TtsButton chưa chuyển sang C4 — quyết định của parent

`TtsButton.tsx` hiện vẫn dùng helper B3 (`ttsDoneSuffixRange46B3`).
Luồng này KHÔNG tự đổi vì: (a) test B3 khóa nối UI vào helper B3 —
đổi component sẽ làm hồi quy B3 7/7 vỡ (test đó phải cập nhật cùng);
(b) component này vừa bị sửa lúc 08:14 bởi luồng round-47 khác
(mtime mới hơn mốc baseline), tránh xung đột ghi song song. Helper
C4 (`ttsDoneSuffixRange47C4`, cùng chữ ký) đã sẵn sàng; chuyển đổi là
1 import + 1 lời gọi + cập nhật assertion nối UI trong test B3. Hậu
tố toast sẽ đổi ví dụ: text 184 ký tự thường "(≈9.6–11.0s)" (B3) →
"(≈9.6–11.3s)" (C4); text số-dày 178 ký tự "(≈9.6–11.0s)" (B3, SAI
lệch xa) → "(≈19.4–21.9s)" (C4, đúng chế độ).

## 3. Phương sai giữa các lần chạy (đo lặp hệ thống)

### 3.1 Câu ngắn "Chào bạn!" (Trúc Ly) — 6 lần đo, HOÀN THÀNH

| Lần đo | Qua | Độ dài |
| --- | --- | --- |
| B3 trực tiếp (đợt 46) | tts.py | 0,56 s |
| B3 qua bridge (đợt 46) | bridge + curl | 0,64 s |
| C4-VS-a | tts.py | 0,56 s |
| C4-VS-b | tts.py | 0,64 s |
| C4-VS-c | tts.py | 0,56 s |
| C4 xác minh trình duyệt | bridge + browser :5173 | 0,56 s |

6 lần đo chỉ ra đúng 2 giá trị: 0,56 s ×4, 0,64 s ×2. Trung bình
0,5867 s; lệch cực đại +9,1% / −4,6%; (max−min)/mean = 13,6%.
Quan sát thêm: MỌI độ dài WAV đo được trong cả đợt 46+47 đều là bội
số của 0,08 s (0,56 = 7×0,08; 0,64 = 8×0,08; 0,96; 2,16; 19,99 ≈
249,9×0,08…) — độ dài bị lượng tử hóa theo khung 0,08 s (nhiều khả
năng là frame hop của codec/model). Hệ quả: ở câu ngắn, MỘT bước
lượng tử đã là ~14% — phương sai 13,6% quan sát được CÓ THỂ chỉ là
lượng tử hóa, không phải dao động thực của model. Chưa tách được hai
nguồn này; khoảng veryShort [0,82×, 1,19×] vẫn chứa cả hai giá trị
nên toast không bị ảnh hưởng thực tế.

### 3.2 Câu dài (text B3-L1, 317 ký tự, Hải Đăng) — 3 lần chạy, HOÀN THÀNH

| Lần đo | Qua | Độ dài |
| --- | --- | --- |
| B3-L1 gốc (đợt 46) | tts.py | 17,04 s |
| C4-VL-a | tts.py | 16,79 s |
| C4-VL-b | tts.py | 16,52 s |
| C4-VL-c | tts.py | 16,74 s |

3 lần chạy C4: trung bình 16,68 s, (max−min)/mean = 1,6%. Cộng lần
đo gốc B3-L1: 4 lần đo chụm trong 16,52–17,04 s (spread 3,1%, lệch
cực đại 1,6% so với trung bình 16,77 s). Cả 3 lần chạy C4 đều nằm
trong khoảng long normal C4 [15,35 s, 17,95 s] cho câu 317 ký tự
(test khóa điều này).

So sánh hai tầng: phương sai câu ngắn 13,6% vs câu dài 1,6–3,1% —
chênh lệch đúng hướng của giả thuyết lượng tử hóa 0,08 s (một bước
lượng tử là ~14% ở 0,56 s nhưng chỉ ~0,5% ở 16,7 s). Kết luận trung
thực: chưa tách được dao động model thật khỏi lượng tử hóa, nhưng
phương sai THỰC (sau khi trừ lượng tử) có vẻ nhỏ (cỡ 1–3% ở câu dài);
khoảng hiệu chuẩn các tầng (±8–27%) bao phủ thoải mái mức dao động này.

## 4. Bridge expose X-TTS-*: ĐÃ XÁC MINH BẰNG TRÌNH DUYỆT THẬT — 7/7

Nợ B3 §6.4 ĐÃ ĐÓNG. Giàn đo: Chromium headed thật (cache
ms-playwright chromium-1248) dưới Xvfb, điều khiển qua CDP; page là
APP VCut THẬT do vite serve ở `http://127.0.0.1:5173/` (không phải
page harness tối giản) — fetch chạy trong context app thật, origin
đúng 127.0.0.1:5173, đúng đường TtsButton dùng. Script
`/tmp/tts47c4/tts-headed-47c4.mjs` (scratch, ngoài repo).

Lỗi harness do lượt trước để lại: class CDP không chuyển tiếp event
`Network.*` (chỉ xử lý message có `id`) nên `netLog` rỗng và check
preflight báo FAIL giả. Lượt này đã vá (chuyển tiếp event không `id`
tới `onNetwork`) và chạy lại: **7/7 PASS**, kết quả
`/tmp/tts47c4/browser-result.json`:

- app-mount: app thật mount (#root có con) — PASS.
- origin: `http://127.0.0.1:5173` — PASS.
- preflight-browser: trình duyệt TỰ gửi OPTIONS tới `/api/tts`,
  bridge đáp 204 — thấy trong CDP Network (req OPTIONS 2210.084,
  resp 204) — PASS.
- post-expose-indirect: 3 header không-safelist của route `/api/tts`
  (Duration/Chars/Voice) đều đọc được từ JS trong page — chứng minh
  expose list của bridge chứa chúng (bản thân header
  `Access-Control-Expose-Headers` KHÔNG đọc được từ JS theo thiết kế
  trình duyệt — không phải lỗi) — PASS.
- post-headers: POST → 200, 53804 bytes, RIFF, `X-TTS-Duration:
  0.56`, `Chars: 9`, `Voice: Tr%C3%BAc%20Ly` — PASS. Lưu ý đính
  chính B3: `X-TTS-Chunks`/`X-TTS-Cloned` = null trên `/api/tts` là
  ĐÚNG (route này không set 2 header đó — chỉ `/api/tts/clone` mới
  có; đọc source bridge); B3 ghi "expose đủ X-TTS-*" theo danh sách
  expose trong CORS mà không phân biệt theo route.
- post-duration-match-wav: header 0,56 s vs WAV parse trong chính
  response 0,560 s (sr=48000) — PASS.
- voices: GET `/api/tts/voices` → 200, 25 giọng — PASS.

Điểm kèm theo: lần POST qua trình duyệt này cho "Chào bạn!" = 0,56 s,
trùng với đo trực tiếp — giá trị này được tính vào bảng phương sai
§3.1 (lần đo thứ 6).

## 5. Kiểm chứng (số thật)

- Test mới `ttsEstimate47C4.test.ts`: **10/10** — khóa n mẫu + tách chế
  độ, hệ số gộp tính lại (normal từng tầng + số-dày chung), khoảng =
  biên quan sát chứa mọi mẫu, phát hiện số-dày chậm gấp đôi + bộ phát
  hiện tỉ lệ chữ số, phương sai câu ngắn 6 lần đo + câu dài 3 lần chạy,
  hậu tố toast 3 nhánh + ví dụ số-dày, ranh giới tầng A3.
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate45A3.test.ts` **10/10**, `ttsEstimate46B3.test.ts`
  **7/7**, `relinkEdge45A3.test.ts` **12/12**,
  `ttsDuration44Z3.test.ts` **9/9** (không sửa file A3/B3/Z3 nào).
- `tsc --noEmit` trong `apps/web`: **sạch, 0 lỗi** (kể cả lỗi TS5097
  ở `seek.ts` từ đợt trước cũng đã hết — do luồng khác sửa tsconfig,
  không phải luồng này).
- `vite build`: **pass** (built in 31,53 s; chỉ cảnh báo chunk >500 kB
  có sẵn, không liên quan luồng này).

## 6. Nợ mở còn lại (trung thực)

1. numberDense hiệu chuẩn YẾU (n = 3 xuyên tầng, ngưỡng 5% tạm thời)
   — cần thêm mẫu số-dày, nhất là text toàn số và text ở gần ngưỡng
   (tỉ lệ chữ số 2–13%) để khóa ngưỡng và khoảng.
2. 11/25 giọng preset chưa đo: Thiền Tâm Đức, Thanh Bình, Ngọc Linh,
   Đoan Trang, Thục Đoan, Minh Triết, Mỹ Duyên, Quỳnh Anh, Đức Trí,
   Kim Thanh, Adam bựa. (Đã đo 14/25: 6 giọng B3 + 8 giọng C4 mới.)
   Tốc độ giọng chưa đo có thể lệch ngoài khoảng C4.
3. Phương sai câu dài đã đo xong (VL-a/b/c: spread 1,6%); câu ngắn
   13,6% nhiều khả năng chỉ là lượng tử hóa 0,08 s, chưa tách được
   khỏi dao động model thật — nhưng khoảng hiệu chuẩn bao phủ thoải
   mái cả hai.
4. TtsButton vẫn dùng helper B3 — chưa chuyển sang C4 (xem §2.3);
   hậu tố toast cho text số-dày vẫn sai lệch xa cho tới khi chuyển.
5. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xác minh
   trình duyệt mới chỉ Chromium headed trên VM).
6. Bridge/vite đang chạy là tiến trình thủ công (bridge từ 07:06,
   vite từ 07:06); VM restart thì tắt và cần khởi động lại — expose
   chỉ có tác dụng khi bridge đang chạy bản code hiện tại.
7. Rủi ro NFC/NFD và hoa/thường ở relink (A3 §3.2) vẫn là giả thuyết,
   ngoài phạm vi luồng này.

## 7. File đã đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Thêm:

1. `apps/web/src/lib/ttsEstimate47C4.ts` — bảng hiệu chuẩn C4 (tầng
   normal + chế độ numberDense) + helper hậu tố toast + bảng phương
   sai chạy lặp.
2. `apps/web/src/lib/ttsEstimate47C4.test.ts` — test mới 10/10.
3. `docs/PHASE9_ROUND47_C4_TTS_LIMITS.md` — chính tài liệu này.

Đổi: (không có — chưa đụng TtsButton, xem §2.3.)

Không đổi: `ttsEstimate45A3.ts`, `ttsEstimate46B3.ts`,
`ttsDuration44Z3.ts`, mọi file test A3/B3/Z3, `tsconfig.json`,
bridge, mọi file luồng khác. File WAV đo (`/tmp/tts47c4/*.wav`),
kết quả đo (`/tmp/tts47c4/results.jsonl`), script drive
(`/tmp/tts47c4/drive.py`, `drive2.py`), script browser
(`/tmp/tts47c4/tts-headed-47c4.mjs`), kết quả browser
(`/tmp/tts47c4/browser-result.json`), bundle test (`/tmp/*.mjs`),
log bridge/vite (`/tmp/tts47c4/*.log`) nằm ngoài repo, không stage.

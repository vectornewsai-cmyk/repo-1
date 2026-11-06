# Phase 9 — Đợt 45, luồng A3: TTS estimation phân tầng + relink biên

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary,
KHÔNG dist vào batch. Luồng chỉ tạo/sửa file hậu tố 45A3 + tài liệu này:
KHÔNG sửa `store.ts`, `preview.tsx`, `tsconfig.json`, bridge, `relink.ts`,
hay file của luồng khác. `ttsEstimate45A3.ts` CHƯA nối vào `TtsButton`
(cố tình — việc nối UI để luồng sau làm, tránh xung đột đợt 45).

Đóng nợ đợt 44 §4 (mục relink/TTS): ước lượng TTS Z3 chỉ hiệu chuẩn
1 giọng, 3 mẫu; bridge expose `X-TTS-*` chỉ có tác dụng sau restart;
Safari/Firefox/máy thật chưa đo.

## 1. Bộ ước lượng phân tầng mới (`ttsEstimate45A3.ts`)

### 1.1. Thiết kế

- Đếm ký tự theo code point (như Z3), chia 4 tầng theo độ dài:
  veryShort <20, short 20–79, medium 80–199, long ≥200 ký tự. Ranh giới
  được chọn để 3 mẫu Z3 (29/114/227 ký tự) rơi vào 3 tầng khác nhau.
- API: `estimateTtsDurationRange45A3(text)` → `{ tier, chars,
  charsPerSec, calibrated, seconds, minSec, maxSec }` (null khi text
  rỗng, không bịa số); `estimateTtsDurationSec45A3` (điểm trung tâm,
  tương thích chữ ký Z3); `ttsEstimateRangeSuffix45A3` →
  ` (≈9.0–12.0s)` (định dạng cho UI tương lai, chưa nối).
- Điểm trung tâm mọi tầng đều dùng hằng Z3 18,4 ký tự/giây.

### 1.2. Hệ số nào đo thật, hệ số nào chưa hiệu chuẩn (đọc kỹ)

| Tầng | Hệ số trung tâm | Hiệu chuẩn riêng? | Khoảng | Cơ sở của khoảng |
| --- | --- | --- | --- | --- |
| veryShort (<20) | 18,4 (Z3 gộp) | KHÔNG (n = 1, xem §2) | [0,8×, 1,8×] | Phòng thủ, KHÔNG phải sai số đo |
| short (20–79) | 18,4 (Z3 gộp) | KHÔNG | [0,9×, 1,4×] | Chứa tỉ lệ thật/ước lượng 1,32 của mẫu Z3 29 ký tự |
| medium (80–199) | 18,4 (Z3 gộp) | KHÔNG | [0,9×, 1,2×] | Chứa tỉ lệ 0,955 của mẫu Z3 114 ký tự |
| long (≥200) | 18,4 (Z3 gộp) | KHÔNG | [0,9×, 1,2×] | Chứa tỉ lệ 0,979 của mẫu Z3 227 ký tự |

KHÔNG có hệ số riêng theo tầng nào được bịa ra: cờ `calibrated` của
cả 4 tầng đều `false`, test khóa điều này. Khoảng KHÔNG phải khoảng
tin cậy thống kê (3 mẫu Z3 + 2 mẫu mới thì không đủ tính) — nó là
khoảng phòng thủ được chọn sao cho chứa được sai số đã quan sát.
Ngưỡng tự đặt trong code: một tầng chỉ được gắn `calibrated: true`
khi có ≥3 mẫu đo riêng của tầng đó (không tính mẫu gộp Z3).

## 2. Hai mẫu đo thật mới trong luồng này (không qua bridge)

Bridge KHÔNG chạy sẵn trên VM lúc đo (curl `127.0.0.1:8787` →
connection refused), nên luồng đo trực tiếp bằng `tts.py` qua
`server/tts/.venv2` (model VieNeu-TTS v3 Turbo đã cache sẵn). Độ dài
lấy từ header WAV (module `wave`) và cross-check bằng `ffprobe` —
khớp từng mili-giây. Số đo under-load (các luồng đợt 45 chạy song
song); thời gian nạp model KHÔNG tính vào độ dài (chỉ đo WAV header).

| Mẫu | Text | Giọng | Độ dài thật | Tốc độ suy ra | Tỉ lệ thật/ước lượng (18,4) | Trong khoảng tầng? |
| --- | --- | --- | --- | --- | --- | --- |
| Rất ngắn | "Xin chào!" (9 ký tự) | Hải Đăng | 0,720 s | 12,5 ký tự/giây | 1,47 | CÓ — veryShort [0,39 s, 0,88 s] |
| Giọng khác | Câu 71 ký tự "VCut Studio chạy hoàn toàn trên máy của bạn, không cần máy chủ đám mây." | Trúc Ly | 3,920 s | 18,1 ký tự/giây | 1,02 | CÓ — short [3,47 s, 5,40 s] |

Cách dùng trung thực: hai mẫu được KHÓA BẰNG TEST (nằm trong khoảng),
KHÔNG dùng để đổi hệ số — mỗi trường hợp chỉ n = 1. Mẫu rất ngắn xác
nhận hướng lệch lên ở câu ngắn (1,47×, gần biên trên 1,8×) nhưng một
mẫu không đủ để đặt hệ số 12,5 cho cả tầng (quãng nghỉ cố định chiếm
tỉ trọng khác nhau giữa câu 9 và câu 19 ký tự). Mẫu Trúc Ly chỉ ghi
nhận "điểm này không lệch", KHÔNG chứng minh "giọng khác cũng giống
Hải Đăng". File WAV đo nằm ở `/tmp/tts45a3/` (ngoài repo, không stage).

## 3. Kiểm tra relink ở biên (logic thuần, KHÔNG sửa `store.ts`)

Test `relinkEdge45A3.test.ts` chỉ dùng `findMissingAssets` /
`relinkAsset` trong `relink.ts`. Kết quả: KHÔNG tìm thấy bug thật nào
trong các biên đã test — quét và relink nhất quán ở mọi biên:

- Tên trùng: 2 clip cùng src → quét count 2, relink đổi cả 2, input
  không mutate; video + image cùng chuỗi src đều đổi (khóa theo src).
- Ký tự đặc biệt: "clip (1).mp4" (kiểu dedup của store), tiếng Việt có
  dấu, nháy đơn/kép, ngoặc vuông + `#`, emoji, nhiều khoảng trắng —
  đều relink đúng (khớp chuỗi chính xác).
- "File nhỏ" ở tầng thuần: tên 1 ký tự, tên không đuôi, tên chỉ có
  đuôi đều relink đúng — tầng thuần KHÔNG có khái niệm kích thước
  (không trường size trong spec); kích thước chỉ có ý nghĩa ở tầng
  store/probe, ngoài phạm vi test này (không suy diễn).
- Biên ngữ nghĩa: old==new → 0 và giữ ref spec (Z3 đã xử lý ở
  `relinkMedia`); oldSrc rỗng → 0; subSpec dùng lại ở 2 nhánh anh em
  → cả hai nhánh đều đổi, không coi là vòng lặp.
- KHÔNG có guard va chạm ở tầng thuần: relink sang tên đã tồn tại thì
  2 clip cùng trỏ 1 src — guard nằm ở tầng store (vòng rename
  ` (1)` trong `relinkMedia`), test khóa đúng hành vi này để không ai
  tưởng tầng thuần đã chặn va chạm.

### 3.1. Đính chính: giả thuyết bug nested ban đầu là SAI

Giả thuyết đầu luồng: nested clip vừa mang src vừa chứa lá con cùng
src → quét đếm 2 nhưng relink chỉ đổi 1. Test chạy thật đã bác bỏ:
`srcOf` chỉ nhận kind video/audio/image/sticker nên trường src của
clip kind "nested" bị CẢ quét lẫn relink bỏ qua một cách nhất quán
(quét đếm 1 = lá con, relink đổi đúng lá con). Trường src trên nested
là dữ liệu chết, không gây kẹt panel — không phải bug, không sửa.
Test đã được sửa lại để khóa đúng hành vi này thay vì khóa giả thuyết.

### 3.2. Quan sát chưa chứng minh qua UI (không claim là bug)

- NFC vs NFD: tên chỉ khác dạng chuẩn hóa Unicode (đã verify byte
  trong test: `caf` + U+00E9 + `.mp4` (NFC) vs `cafe` + U+0301 + `.mp4`
  (NFD)) → relink trả 0
  vì khớp chuỗi chính xác, không normalize ngầm. Rủi ro thực tế trên
  macOS (hệ file trả tên NFD, project lưu NFC) là GIẢ THUYẾT — chưa
  có bằng chứng UI, cần click-test trên máy macOS thật trước khi gọi
  là bug hay sửa (normalize ở tầng store, ngoài phạm vi luồng này).
- Phân biệt hoa/thường và khoảng trắng thừa: khớp chính xác, không
  normalize — cùng lưu ý như trên đối với hệ file không phân biệt hoa
  thường.

## 4. Kiểm chứng (số thật)

- Test mới `ttsEstimate45A3.test.ts` (esbuild bundle `--format=esm`,
  chạy từ repo root): **10/10** — gồm khóa Z3 (3 mẫu nằm trong khoảng
  tầng), khóa "mọi tầng 18,4 + calibrated false", ranh giới 20/80/200,
  biên rỗng/1 ký tự/5000 ký tự/code point, và 2 mẫu mới §2.
- Test mới `relinkEdge45A3.test.ts` (esbuild bundle `--format=esm`):
  **12/12**.
- Hồi quy: `ttsDuration44Z3.test.ts` chạy lại bằng esbuild: **9/9**
  (không sửa file Z3 nào).
- `tsc --noEmit` trong `apps/web`: sau khi sửa 1 lỗi TS2367 của chính
  test này (so sánh literal NFC/NFD → khai kiểu `string` tường minh),
  KHÔNG còn lỗi nào thuộc file 45A3. Các lỗi còn lại thuộc file của
  luồng song song khác (vd `pause45A2`, `reverseBadge45A6`) — không
  đụng vào. Lưu ý cho parent khi gộp: theo tiền lệ các đợt trước, 2
  file test mới cần thêm vào `exclude` của `apps/web/tsconfig.json`
  (luồng này bị cấm sửa tsconfig nên để parent làm ở bước gộp).
- `vite build` KHÔNG chạy lại trong luồng này (lib mới là pure, không
  nối UI; parent kiểm chứng gộp như đợt 44).

## 5. Nợ mở còn lại (trung thực)

1. Tầng veryShort vẫn chỉ có n = 1 mẫu thật (9 ký tự); cần thêm mẫu
   <20 ký tự (nhiều giọng, nhiều độ dài 5–19 ký tự) mới đặt được hệ số
   riêng — hiện khoảng [0,8×, 1,8×] vẫn là phỏng đoán phòng thủ.
2. Giọng khác mới chỉ có n = 1 (Trúc Ly, 71 ký tự); chưa đo giọng
   khác ở câu rất ngắn/dài, chưa đo text nhiều số/tên riêng/dấu câu
   dày — các trường hợp này có thể lệch ngoài khoảng hiện tại.
3. `ttsEstimate45A3` CHƯA nối vào `TtsButton` (cố tình, do quy tắc
   file đợt 45): toast hiện tại vẫn dùng hậu tố điểm Z3. Luồng sau nối
   UI cần quyết định định dạng hiển thị khoảng và test lại toast.
4. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM, Chromium
   không liên quan trực tiếp vì đo qua tts.py, nhưng đường toast thật
   qua browser thì chưa).
5. Bridge expose `X-TTS-*` vẫn chỉ có tác dụng sau restart bridge
   (nợ Z3 còn lại, không thuộc phạm vi sửa của luồng này — bridge
   không hề được sửa ở đây; lúc đo bridge còn không chạy).
6. Rủi ro NFC/NFD và hoa/thường ở §3.2 vẫn là giả thuyết, cần máy
   thật/macOS để chứng minh hoặc bác bỏ trước khi sửa.
7. Mọi số timing/độ dài trong luồng này đều under-load (đợt 45 chạy
   song song); độ dài WAV thì không phụ thuộc tải, nhưng không được
   dùng làm baseline tốc độ tổng hợp.

## 6. File đã đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Thêm:

1. `apps/web/src/lib/ttsEstimate45A3.ts` — bộ ước lượng phân tầng.
2. `apps/web/src/lib/ttsEstimate45A3.test.ts` — test mới 10/10.
3. `apps/web/src/lib/relinkEdge45A3.test.ts` — test biên relink 12/12.
4. `docs/PHASE9_ROUND45_A3_TTS_LIMITS.md` — chính tài liệu này.

Không đổi: `store.ts`, `preview.tsx`, `tsconfig.json`, bridge,
`relink.ts`, `ttsDuration44Z3.ts`, mọi file i18n, mọi file luồng khác.
File WAV đo và bundle test `/tmp/*.mjs` nằm ngoài repo, không stage.

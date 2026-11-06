# Phase 9 — Đợt 46, luồng B3: TTS calibration + nối vào TtsButton

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary
vào repo (WAV đo ở `/tmp/tts46b3/`, ngoài repo), KHÔNG stage bởi luồng
này (parent gộp). Chỉ sửa file text trong `~/workspace/repo-1`.

Đóng nợ đợt 45 A3 §5: (1) tầng veryShort mới n = 1, giọng khác mới
n = 1; (2) lib A3 chưa nối vào TtsButton; (3) bridge expose `X-TTS-*`
chỉ có tác dụng sau restart (chưa từng kiểm tra bằng bridge chạy thật).

## 1. Mẫu đo thật mới: 11 mẫu qua tts.py trực tiếp (không qua bridge)

Chạy `server/tts/tts.py` bằng `server/tts/.venv2` (model VieNeu-TTS
v3 Turbo đã cache). Độ dài lấy từ header WAV (module `wave`) và
cross-check bằng `ffprobe` — khớp từng mili-giây ở cả 11 mẫu. Thời
gian nạp model KHÔNG tính vào độ dài (chỉ đo WAV header). Số đo
không phụ thuộc tải (độ dài WAV), nhưng xem §5 về phương sai giữa
các lần chạy.

| Mẫu | Text (ký tự = code point) | Giọng | Độ dài thật | Tốc độ suy ra | Tỉ lệ thật/ước 18,4 | Trong khoảng A3 cũ? |
| --- | --- | --- | --- | --- | --- | --- |
| VS1 | "Chào bạn!" (9) | Trúc Ly | 0,560 s | 16,07 | 1,145 | CÓ — veryShort [0,8×, 1,8×] |
| VS2 | "Bắt đầu nào!" (12) | Hải Đăng | 0,960 s | 12,50 | 1,472 | CÓ |
| VS3 | "VCut thật nhanh." (16) | Thiện Minh | 0,960 s | 16,67 | 1,104 | CÓ |
| VS4 | "Ừ, hay đấy!" (11) | Mai Anh | 0,960 s | 11,46 | 1,606 | CÓ |
| S1 | "Video này dựng hoàn toàn trên máy của bạn." (42) | Hải Đăng | 2,160 s | 19,44 | 0,946 | CÓ — short [0,9×, 1,4×] |
| S2 | "Nhấn nút phát để xem trước bản dựng ngay bây giờ." (49) | Trúc Ly | 2,320 s | 21,12 | 0,871 | KHÔNG — dưới cận 0,9× |
| S3 | "Giọng đọc này chạy local, không cần mạng hay máy chủ." (53) | Quang Sơn | 3,280 s | 16,16 | 1,139 | CÓ |
| M1 | 140 ký tự, 2 câu về VCut local (xem lib) | Thiện Minh | 8,400 s | 16,67 | 1,104 | CÓ — medium [0,9×, 1,2×] |
| M2 | 158 ký tự, câu về nút đọc thành tiếng (xem lib) | Ngọc Huyền | 8,240 s | 19,17 | 0,960 | CÓ |
| L1 | 317 ký tự, 3 câu về tốc độ câu dài (xem lib) | Hải Đăng | 17,040 s | 18,60 | 0,989 | CÓ — long [0,9×, 1,2×] |
| L2 | 379 ký tự, đoạn dựng video buổi sáng (xem lib) | Trúc Ly | 18,880 s | 20,07 | 0,917 | CÓ |

Text đầy đủ của M1/M2/L1/L2 nằm trong `TTS_SAMPLES_46B3` (test đếm
lại ký tự từ text, không tin mù số chars). File WAV đo ở
`/tmp/tts46b3/` + bảng JSON `/tmp/tts46b3/results.jsonl` (ngoài repo).

### Phát hiện: khoảng phòng thủ A3 của tầng short bị thủng ở dưới

Mẫu S2 (49 ký tự, Trúc Ly, 2,32 s) có tỉ lệ thật/ước lượng 18,4 là
0,871 — dưới cận dưới 0,9× của tầng short A3. Tức giọng đọc nhanh ở
câu ngắn-vừa có thể nhanh hơn cả biên phòng thủ A3. Đây là bằng
chứng thật đầu tiên cho thấy khoảng A3 không chứa được mọi trường
hợp (10/11 mẫu mới còn lại đều nằm trong khoảng A3 cũ). Bảng B3 sửa
điểm này: short [0,8395×, 1,2720×] chứa được S2 và mọi mẫu đã đo.

## 2. Bảng hiệu chuẩn B3 (`ttsEstimate46B3.ts`, KHÔNG sửa file A3)

File A3 được giữ nguyên vẹn (hồi quy A3 vẫn 10/10) — B3 là lớp mới
chồng lên A3, ghi đè hệ số/khoảng bằng số đo riêng theo tầng. Quy
tắc giữ từ A3: một tầng chỉ gắn `calibrated: true` khi có ≥3 mẫu đo
thật RIÊNG của tầng đó; "mẫu" = một lần đo thật rơi vào tầng (Z3 +
A3 + B3 cộng dồn), hằng gộp Z3 18,4 KHÔNG được tính là mẫu. Hệ số
trung tâm = tốc độ gộp (tổng ký tự / tổng giây). Khoảng = biên quan
sát (tỉ lệ thật/ước nhỏ nhất và lớn nhất theo hệ số gộp mới), làm
tròn RA NGOÀI tới 4 chữ số thập phân (min xuống, max lên) để mọi
mẫu đều nằm trong khoảng dù có làm tròn. Khoảng này KHÔNG phải
khoảng tin cậy thống kê.

| Tầng | n tổng (mới B3) | Hệ số gộp (ký tự/giây) | Khoảng B3 | calibrated |
| --- | --- | --- | --- | --- |
| veryShort (<20) | 5 (4) | 57/4,16 = 13,7019 | [0,8221×, 1,1959×] | true |
| short (20–79) | 5 (3) | 244/13,76 = 17,7326 | [0,8395×, 1,2720×] | true |
| medium (80–199) | 3 (2) | 412/22,56 = 18,2624 | [0,9483×, 1,0958×] | true (YẾU) |
| long (≥200) | 3 (2) | 923/48,00 = 19,2292 | [0,9579×, 1,0337×] | true (YẾU) |

CẢNH BÁO ĐỌC SỐ: medium/long chỉ vừa đủ n = 3 nhờ tính cả 1 mẫu Z3
cũ mỗi tầng (114 ký tự / 227 ký tự, giọng Hải Đăng); mẫu MỚI mỗi
tầng chỉ n = 2. Khoảng hẹp của hai tầng này chỉ là biên quan sát
của đúng 3 điểm — mẫu tương lai hoàn toàn có thể rơi ngoài. Test
khóa cả n tổng lẫn n mới để không ai đọc nhầm thành "đo nhiều".
Giọng đo: Hải Đăng, Trúc Ly, Thiện Minh, Mai Anh, Quang Sơn,
Ngọc Huyền (6/25 giọng preset) — 19 giọng còn lại chưa đo, tốc độ
giọng chưa đo có thể lệch ngoài khoảng.

## 3. Nối vào TtsButton thật sự

`TtsButton.tsx` nay import + gọi `ttsDoneSuffixRange46B3` từ lib B3
(không còn import helper Z3, không hardcode hệ số nào trong
component — test đọc source component và khóa cả ba điều này).
Hành vi toast done mới:
- Header `X-TTS-Duration` đọc được → ` (12.3s)` (số đo thật);
- Header thiếu/không hợp lệ → khoảng B3 ` (≈a–bs)` theo tầng của
  text (thay cho điểm 18,4 gộp của Z3);
- Text rỗng → bỏ hậu tố, không bịa số.
Ví dụ khóa bằng test: "Xin chào!" (9 ký tự) → ` (≈0.5–0.8s)`;
184 ký tự → ` (≈9.6–11.0s)`.

## 4. Bridge expose X-TTS-* sau restart: CÓ, ĐÃ XÁC MINH BẰNG BRIDGE CHẠY THẬT

Trạng thái đầu luồng: bridge KHÔNG chạy (curl `127.0.0.1:8787` →
connection refused). Luồng khởi động lại bridge local bằng
`TTS_PYTHON=server/tts/.venv2/bin/python node server/bridge/src/index.js
--port 8787` (log `/tmp/tts46b3_bridge.log`; bridge vẫn đang chạy
lúc viết tài liệu này). Kết quả kiểm tra thật:
- Preflight OPTIONS (Origin `http://127.0.0.1:5173`) → 204, header
  `Access-Control-Expose-Headers: Accept-Ranges,Content-Range,
  X-TTS-Duration,X-TTS-Chars,X-TTS-Voice,X-TTS-Chunks,X-TTS-Cloned`
  (đủ cả 5 header `X-TTS-*`).
- POST `/api/tts` thật (text "Chào bạn!", giọng Trúc Ly) → 200,
  header `X-TTS-Duration: 0.64`, `X-TTS-Chars: 9`, `X-TTS-Voice:
  Tr%C3%BAc%20Ly`, kèm `Access-Control-Expose-Headers` liệt kê đủ
  `X-TTS-*` trên chính response đó.
Kết luận: nợ Z3/A3 về expose header ĐÃ ĐÓNG ở phía bridge đang chạy
— trình duyệt ở origin vite sẽ đọc được `X-TTS-Duration`, nên toast
done sẽ dùng số đo thật thay vì khoảng ước lượng khi chạy qua
bridge này. Lưu ý: bridge chỉ expose khi chạy bản code hiện tại
(dòng `exposedHeaders` trong `server/bridge/src/index.js`); bridge
cũ chưa restart vẫn lọc header như trước — không còn là nợ code mà
là nợ vận hành (ai chạy bridge cũ thì restart lại).

### Quan sát kèm theo (không phải bug bridge)

Cùng text "Chào bạn!" + giọng Trúc Ly: đo trực tiếp qua tts.py cho
0,560 s, đo qua bridge cho 0,640 s (cả hai đều verify bằng header
WAV + ffprobe). Argv bridge gọi tts.py là đồng nhất (`--text`,
`--voice`, `--out`, cùng venv python) nên chênh lệch 0,08 s (14%)
này là phương sai giữa các lần chạy của model (suy luận không hoàn
toàn xác định), KHÔNG phải bridge xử lý khác. Hệ quả trung thực:
mỗi mẫu trong §1 chỉ là MỘT lần chạy — độ dài "thật" của cùng một
câu có thể dao động ~10% giữa các lần chạy, nhất là câu ngắn. May
mắn: 0,64 s vẫn nằm trong khoảng B3 veryShort [0,54 s, 0,79 s] cho
câu 9 ký tự, nên khoảng B3 chịu được mức dao động này ở điểm kiểm
tra duy nhất đó — nhưng chưa có đo lặp hệ thống để khẳng định chung.

## 5. Kiểm chứng (số thật)

- Test mới `ttsEstimate46B3.test.ts` (esbuild bundle `--format=esm`,
  chạy từ repo root, `REPO_ROOT=$PWD`): **7/7** — gồm khóa hệ số
  gộp tính lại từ bảng mẫu, khóa khoảng = biên quan sát chứa mọi
  mẫu, khóa phát hiện S2 ngoài khoảng A3, khóa hậu tố 3 nhánh, và
  khóa nối UI bằng cách đọc source `TtsButton.tsx`.
- Hồi quy: `ttsEstimate45A3.test.ts` **10/10**,
  `relinkEdge45A3.test.ts` **12/12**, `ttsDuration44Z3.test.ts` **9/9**
  (không sửa file A3/Z3 nào).
- `tsc --noEmit` trong `apps/web`: KHÔNG có lỗi nào thuộc file B3
  hay `TtsButton.tsx`. Lỗi duy nhất toàn dự án là
  `src/lib/seek.ts(25,37)` TS5097 — file của luồng khác, không đụng
  vào. Vì tsc đã sạch với cả file test mới (không cần exclude),
  luồng này KHÔNG sửa `tsconfig.json` (khác tiền lệ A3: A3 bị cấm
  sửa tsconfig nên để parent làm; ở đây không cần nên không sửa).
- `vite build`: **pass** (built in 5,96 s; chỉ cảnh báo chunk >500 kB
  có sẵn, không liên quan luồng này).

## 6. Nợ mở còn lại (trung thực)

1. medium/long hiệu chuẩn YẾU (n = 3 nhờ 1 mẫu Z3 cũ, mẫu mới chỉ
   n = 2 mỗi tầng) — cần thêm mẫu medium/long trước khi tin khoảng
   hẹp [0,95×, 1,10×] / [0,96×, 1,03×] như khoảng an toàn.
2. 19/25 giọng preset chưa đo; text nhiều số/tên riêng/dấu câu dày
   chưa đo — các trường hợp này có thể lệch ngoài khoảng B3.
3. Phương sai giữa các lần chạy (~14% ở câu 9 ký tự, §4) mới chỉ
   quan sát 1 cặp — chưa đo lặp hệ thống (cùng text/giọng chạy 3–5
   lần) để tách phương sai model khỏi lệch theo tầng/giọng.
4. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; đường
   toast thật qua browser chưa chạy — bridge expose mới chỉ xác
   minh bằng curl, chưa bằng trình duyệt thật ở origin :5173).
5. Bridge đang chạy là tiến trình thủ công từ luồng này (log
   `/tmp/tts46b3_bridge.log`); nếu VM restart thì bridge tắt và cần
   khởi động lại — expose chỉ có tác dụng khi bridge đang chạy bản
   code hiện tại.
6. Rủi ro NFC/NFD và hoa/thường ở relink (A3 §3.2) vẫn là giả thuyết,
   ngoài phạm vi luồng này.

## 7. File đã đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Thêm:

1. `apps/web/src/lib/ttsEstimate46B3.ts` — bảng hiệu chuẩn B3 + helper
   hậu tố toast (lib TtsButton dùng).
2. `apps/web/src/lib/ttsEstimate46B3.test.ts` — test mới 7/7.
3. `docs/PHASE9_ROUND46_B3_TTS_LIMITS.md` — chính tài liệu này.

Đổi:

4. `apps/web/src/components/TtsButton.tsx` — nối helper B3 (import +
   gọi + comment), không đổi logic nào khác.

Không đổi: `ttsEstimate45A3.ts`, `ttsDuration44Z3.ts`, mọi file test
A3/Z3, `tsconfig.json`, bridge, mọi file luồng khác. File WAV đo
(`/tmp/tts46b3/*.wav`), kết quả đo (`/tmp/tts46b3/results.jsonl`),
bundle test (`/tmp/*.mjs`), log bridge (`/tmp/tts46b3_bridge.log`)
nằm ngoài repo, không stage.

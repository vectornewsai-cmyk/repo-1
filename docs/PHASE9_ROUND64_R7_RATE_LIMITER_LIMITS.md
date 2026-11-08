# PHASE 9 — ĐỢT 64, LUỒNG R7: RATE LIMITER SLIDING-WINDOW — LIMITS

Ngày: 2026-11-08. Luồng R7, xử lý nợ "Rate-limiter Map bucket quirk" từ đợt 63 R5.
KHÔNG push (stage batch chờ user nhắn "push đi" từ main chat), KHÔNG release/tag.

## 0. Đính chính tiền đề (đọc kỹ trước khi tin brief)

Brief luồng ghi "R5 ghi nhận quirk ở rate limiter dùng Map bucket nhưng
chưa sửa — đọc §8 LIMITS R5". Kiểm chứng trên file thật
`docs/PHASE9_ROUND63_R5_SERVER_LITERALS_LIMITS.md`:

- **§8 của R5 KHÔNG ghi quirk rate limiter nào chưa sửa.** §8 chỉ có 6
  mục (sub-validator, MCP/CLI validate, `job.note` chưa có UI, workflow
  403, desktop preload literal, release gate).
- Quirk Map bucket duy nhất R5 ghi nhận nằm ở **§4 — và R5 ĐÃ SỬA**:
  global + per-route dùng chung 1 bucket theo IP → 1 request đếm 2 lần.
  Code lúc R7 bắt đầu đã có key `${scope}:${ip}` + test e2e khóa số học
  mới (bridge B, general=4: #3/#4 200, #5 429) — R7 chạy lại suite vẫn
  xanh, không cần sửa lại.
- Vì vậy R7 **không bịa quirk theo brief** mà audit lại toàn bộ
  implementation Map bucket còn lại và tìm được **2 quirk thật, đo được
  bằng bridge thật trước khi sửa** (§1–§2). Cả 2 đều nằm trong cùng file
  `server/bridge/src/index.js` (hàm `rateLimit` + parse env) mà brief
  đã chỉ đúng chỗ.

## 1. Quirk A — fixed-window boundary burst (quirk chính)

**Hành vi sai:** bucket `{count, resetAt}` (fixed window 60s, neo vào
request đầu tiên) cho phép tới **2×max request trong một cửa sổ trượt
60s**. Kịch bản với `BRIDGE_RATE_GENERAL=4` (bridge thật, đo
2026-11-08, script tái hiện `/tmp/repro-rate64.cjs` — không stage):

| Bước | Thời điểm | Kết quả (trước sửa) |
|---|---|---|
| health poll #1 (neo cửa sổ) | t≈0s | 200 (Remaining=3) |
| health #2, #3, #4 | t≈58,6–58,8s | 200, 200, 200 (Remaining=0) |
| health #5 | t≈58,8s | 429, Retry-After=1 |
| health #6, #7, #8, #9 (sau reset) | t≈61,3–61,5s | **200, 200, 200, 200** |

Cửa sổ trượt (t≈1,3s → 61,3s) chứa #2–#4 + #6–#9 = **7 request được
chấp nhận, chính sách chỉ cho 4**. Lỗi này không phải lý thuyết: chạy
diagnose 2 lần, lần 1 tái hiện đúng 7/60s; lần 2 (chạy lại script cũ
chưa neo đúng thời điểm poll đầu) cho kết quả khác — đã ghi vào §6.

**Hậu quả thực tế:** với render budget 20/phút, kẻ gọi có thể nhồi
40 render trong vài giây quanh biên cửa sổ; health poll của web UI cũng
có thể vô tình lọt qua khe này khi nhiều tab cùng poll.

**Cách sửa:** sliding-window — bucket Map giữ nguyên key
`${scope}:${ip}` (ngữ nghĩa tách scope của R5 không đổi) nhưng giá trị
đổi từ `{count, resetAt}` thành **danh sách mốc thời gian (ms) của các
request đã được chấp nhận** trong cửa sổ trượt `(now−windowMs, now]`;
request chỉ qua khi số mốc < max. Module mới
`server/bridge/src/rateLimit.js` (`createRateLimiter`, test được bằng
fake clock mà không khởi động bridge). `Retry-After` nay = thời gian tới
khi mốc cũ nhất hết hạn (slot đầu tiên mở ra), luôn ≥ 1s.

**Số đo sau sửa (cùng script, bridge thật):** #6 → 200 (đúng 1 slot do
mốc t≈0 hết hạn), #7–#9 → 429; admitted trong cửa sổ trượt 60s = **4
(đúng chính sách, trước sửa là 7)**. Số học e2e cũ của R5 không đổi
(trong một cửa sổ: 4 qua, #5 429).

## 2. Quirk B — env rate sai (NaN) tắt limiter lặng lẽ

**Hành vi sai:** `parseInt(process.env.BRIDGE_RATE_GENERAL || "120",
10)` — nếu env là `"abc"` thì `parseInt` = NaN, điều kiện `count >
NaN` luôn false → **limiter chết hẳn, không báo gì**, header
`X-RateLimit-Limit: "NaN"`. Tương tự `BRIDGE_RATE_RENDER`. Đo thật
trước sửa: `BRIDGE_RATE_GENERAL=abc`, 130 request health sau poll đầu
→ **130×200, 0×429** (đúng ra với mặc định 120 phải là ~119×200 +
11×429).

**Cách sửa:** `parseRateLimitInt(raw, fallback)` trong `rateLimit.js` —
chỉ nhận số nguyên > 0, còn lại (NaN/0/âm/rỗng/thiếu) rơi về mặc định;
`index.js` in cảnh báo lúc khởi động khi env đặt mà không hợp lệ:
`⚠️ BRIDGE_RATE_GENERAL="abc" không hợp lệ — dùng mặc định 120.`
Áp dụng cho cả 3 biến: `BRIDGE_RATE_GENERAL`,
`BRIDGE_RATE_RENDER`, và biến mới `BRIDGE_RATE_WINDOW_MS` (mặc định
60000ms; thêm để test e2e chạy biên trong ~4s thay vì chờ 60s).

**Số đo sau sửa (cùng script):** 130 request → **119×200 + 11×429**,
đúng mặc định 120 (poll đầu chiếm 1 slot).

## 3. Tính chất khác của implementation mới (khóa bằng test)

- **Request bị 429 KHÔNG ghi mốc** → không giữ cửa sổ đầy vĩnh viễn,
  không làm mảng bucket phình: hammer 100 lần sau khi hết budget, bucket
  vẫn chỉ ≤ max mốc (test [6]).
- **Không rò rỉ bucket:** mốc hết hạn bị cắt ngay trong lúc xử lý
  request; sweep định kỳ (mỗi `windowMs`) xóa bucket rỗng; `prune()`
  sau khi hết hạn → `Map.size === 0` (test [7]).
- **Không chặn nhầm request hợp lệ:** request cách nhau 20s với max=4/
  60s đều qua (test [4]); đúng max thì qua, quá 1 thì 429 (test [2]).
- **Bucket tách scope (R5) giữ nguyên:** render hết budget thì general
  và silence vẫn qua; IP khác có bucket riêng (test [5]).
- **Không đổi gì khác:** message 429 giữ nguyên từng byte
  (`Quá nhiều request — thử lại sau ${retryAfter}s.`, code
  `RATE_LIMITED`, `errorParams.retryAfter` vẫn qua `normalizeParams`
  như cũ → chuỗi `"60"`); header `X-RateLimit-Limit` /
  `X-RateLimit-Remaining` / `Retry-After` giữ nguyên tên; mọi call-site
  `rateLimit(max, scope)` trong `index.js` không đổi (12 chỗ).
- **Chi phí:** mỗi request cắt tối đa `max` mốc đầu mảng (O(max),
  max mặc định 120 general / 20 render — không đáng kể); bộ nhớ mỗi
  bucket ≤ max mốc.

## 4. i18n

Không cần key mới: không có chuỗi user-facing nào đổi (message 429 giữ
nguyên; cảnh báo env sai chỉ in ra log server). Không sửa `vi.json` /
`en.json`, không tạo fragment.

## 5. Kiểm chứng (số thật, chạy 2026-11-08)

| Test | Kết quả |
|---|---|
| `server/bridge/test/test-rate-limit.cjs` (mới, fake clock) | **58 pass, 0 fail** |
| `server/bridge/test/test-bridge-error-protocol-e2e.cjs` (thêm bridge D + section [9]) | **165 pass, 0 fail** (gốc 153 — +12: 1 health D + 11 assert [9]) |
| `server/bridge/test/test-bridge-error-protocol.cjs` (unit) | **142 pass, 0 fail** (không đổi) |
| `server/render/src/test_validate_codes.js` | **1572 pass, 0 fail** (không đổi) |
| `server/bridge/test/test-error-detail-structured.cjs` | **170 pass, 0 fail** |
| `server/bridge/test/test-error-detail-ui.cjs` | **52 pass, 0 fail** |
| `server/bridge/test/test-error-detail.cjs` | **64 pass, 0 fail** |
| `server/bridge/test/test-jobqueue.cjs` | **52 pass, 0 fail** |
| `node --check` `index.js` + `rateLimit.js` | pass |
| Repro bridge thật trước/sau (§1–§2) | burst 7 → 4 / cửa sổ trượt; NaN env 130×200 → 119×200 + 11×429 |
| tsc | **N/A** — luồng chỉ đụng `server/bridge` (plain JS, không có tsconfig nào cover; không sửa file TS nào) |

**Chạy lần đầu test mới có 1 fail rồi sửa:** assert
`errorParams.retryAfter === 60` (số) — thực tế `normalizeParams`
string hóa thành `"60"` (hành vi cũ, e2e cũng so bằng `String()`).
Sửa test về `"60"`, không sửa code.

## 6. Nợ mở / lưu ý trung thực

1. **Biến động nhỏ ở lần tái hiện thứ 2 (không phải bug sản phẩm):**
   lần chạy repro A đầu tiên với script chưa neo đúng thời điểm poll đầu
   cho #5=200 rồi #6–#9=429 (ngược với lần 1 và lần diagnose có
   instrument). Nghi ngờ là artifact của chính script (cùng port dùng
   lại qua các lần chạy, bridge cũ chưa chết hẳn lúc spawn mới) chứ
   không phải hành vi của limiter — lần chạy diagnose có in
   `X-RateLimit-Remaining` từng request và lần chạy sau sửa đều nhất
   quán với lý thuyết fixed/sliding window. Đã kiểm tra `ps` sau các
   lần chạy: không còn bridge lạ. Nếu ai tái hiện thì dùng port mới mỗi
   lần và đọc header Remaining để neo cửa sổ.
2. **Giới hạn của sliding-window này:** vẫn là giới hạn theo IP socket
   (`trust proxy: false`, local-first) — không chống được client đổi IP
   (vd IPv4 ↔ IPv6-mapped `::ffff:127.0.0.1` được tính là 2 bucket khác
   nhau); không có giới hạn toàn cục (global cap) ngoài per-IP; không
   persist qua restart bridge (Map in-memory, như cũ).
3. **`parseInt` vẫn chấp nhận tiền tố số** (`"4.9"` → 4, `"120abc"` →
   120, như hành vi cũ) — chỉ NaN/0/âm/rỗng mới rơi về mặc định. Chưa
   siết thành "phải là số nguyên thuần" vì không có yêu cầu và để tránh
   đổi hành vi với env đang chạy.
4. **Các `parseInt` env khác trong `index.js` chưa đụng:**
   `BRIDGE_MAX_JOBS`, `BRIDGE_MAX_QUEUE`, `BRIDGE_SPEC_MAX`,
   `BRIDGE_JOB_TTL`, `BRIDGE_MIN_DISK_FREE` vẫn parse thô — NaN ở đó
   có thể gây hành vi lạ riêng (vd `MAX_QUEUE=NaN`); ngoài phạm vi đợt
   này, cần đợt riêng nếu muốn siết hết.
5. **Comment stale trong e2e [6]** (dòng "nó đếm 2 lần vào budget
   general (quirk bucket chung, xem trên)") vẫn còn từ thời R62 — R5
   sửa code nhưng không sửa comment này; R7 để nguyên vì ngoài phạm vi
   (số học assert bên dưới đã là số mới đúng).
6. **`.github/workflows/ci-security.yml` vẫn 403** (nợ cũ, không đổi).
   Release gate giữ nguyên.

## 7. File đổi/thêm (stage batch `phase9-round64-r7-rate-limiter.txt`, 5 file)

Mới (3): `server/bridge/src/rateLimit.js`,
`server/bridge/test/test-rate-limit.cjs`,
`docs/PHASE9_ROUND64_R7_RATE_LIMITER_LIMITS.md`.
Sửa (2): `server/bridge/src/index.js`,
`server/bridge/test/test-bridge-error-protocol-e2e.cjs`.

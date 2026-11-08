# PHASE 9 — ĐỢT 65, LUỒNG S5: RATE LIMITER — GLOBAL CAP + PERSIST + SIẾT ENV — LIMITS

Ngày: 2026-11-08. Luồng S5, xử lý nợ #5 từ đợt 64
(`docs/PHASE9_ROUND64_LIMITS.md` §8.5 + §1/§4 về R7).
KHÔNG push (stage batch chờ user nhắn "push đi" từ main chat), KHÔNG release/tag.

## 0. Tiền đề đã đọc kỹ (đính chính brief)

Brief ghi "đính chính tiền đề ở §8 R5 về quirk Map bucket — đọc kỹ trước khi
đụng code". Đã đọc `docs/PHASE9_ROUND64_R7_RATE_LIMITER_LIMITS.md` §0 +
`docs/PHASE9_ROUND64_LIMITS.md` §1 R7: **không có quirk Map bucket nào chưa
sửa** — R5 đã sửa đếm 2 lần (§4), R7 đã sửa boundary burst (sliding-window)
và env NaN (§1–§2). Nợ thật còn lại sau R7 (R7 §6.2–§6.4): **không global
cap, không persist qua restart, `parseInt` vẫn nhận tiền tố số, các env số
khác chưa siết**. Luồng này xử lý đúng 3 ý đầu của nợ đó trong phạm vi
rate limiter (xem §6 về ý `parseInt` tiền tố — giữ nguyên có chủ ý).

## 1. Global cap — giới hạn tổng toàn cục

**Vấn đề:** limiter cũ chỉ giới hạn theo từng bucket `${scope}:${ip}`.
Một client đổi IP (hoặc nhiều IP/botnet nhỏ cùng hammer) mỗi IP vẫn dưới
120/phút nhưng tổng cộng có thể nhấn chìm bridge — per-IP không chặn được.

**Cách làm** (`server/bridge/src/rateLimit.js`, `createRateLimiter` thêm
`opts.globalMax`): giữ một mảng mốc `globalMarks` — thời điểm của MỌI
request đã chấp nhận, mọi scope + mọi IP. Một request chỉ qua khi **cả hai**
đều còn slot: bucket của nó < max VÀ tổng toàn cục < globalMax. Request bị
chặn bởi global cap không ghi mốc vào bucket của nó (không "đốt" budget
per-IP của IP đó) và không ghi mốc global.

- Mặc định **600 req/cửa sổ** (`BRIDGE_RATE_GLOBAL`, xem §3): gấp 5× budget
  general per-IP (120) — tức 5 IP cùng chạy hết budget vẫn qua; render
  budget 20/IP thì 30 IP render nặng đồng thời mới chạm trần. Với sản phẩm
  local-first 1 user + health poll của web UI, 600/phút (10 req/s sustained)
  là trần chống lạm dụng, không phải trần vận hành thường ngày.
- Header mới khi global cap bật: `X-RateLimit-Global-Remaining` (còn lại
  của trần tổng). Header per-IP cũ không đổi.
- `Retry-After` khi cả hai cùng đầy = min của hai limiter (slot nào mở trước).
- Message 429 **giữ nguyên từng byte** (`Quá nhiều request — thử lại sau
  ${retryAfter}s.`, code `RATE_LIMITED`, `errorParams.retryAfter` qua
  `normalizeParams` như cũ); 12 call-site `rateLimit(max, scope)` trong
  `index.js` không đổi.
- `globalMax = 0` hoặc không đặt = tắt global cap (hành vi cũ).

**Số đo thật (bridge thật, e2e §5):** `GENERAL=1000, GLOBAL=5` → 5 health
qua (per-IP Remaining 999→995, chứng minh per-IP không phải nguyên nhân
chặn), health #6 → 429, `Global-Remaining=0`, `Retry-After=12`.

## 2. Persist trạng thái qua restart

**Cách làm:** trạng thái limiter (mốc từng bucket + mốc global) lưu đĩa dạng
JSON `{version:1, savedAt, windowMs, buckets:{key:[ms...]}, global:[ms...]}`,
ghi tạm + rename (atomic). Nạp lại lúc tạo limiter; mốc đã hết hạn bị loại
lúc lưu VÀ lúc nạp nên không hồi sinh sau restart. Lưu định kỳ mỗi 5s (chỉ
khi có mốc mới — cờ `dirty`) và flush lúc tắt graceful (móc vào `shutdown()`
của `index.js`, trước `service.shutdown()`).

- Đường dẫn mặc định `~/.cache/vcut/rate-limit.json` (theo mẫu
  `gpu-probe.json` đợt 64 R1: `HOME/.cache/vcut`, không có HOME → tmpdir),
  đổi qua `BRIDGE_RATE_PERSIST_PATH`; chu kỳ lưu qua `BRIDGE_RATE_PERSIST_MS`
  (mặc định 5000; 0 = chỉ lưu khi tắt graceful).
- File hỏng / sai định dạng / không đọc được → cảnh báo ra log server, chạy
  tiếp từ trạng thái rỗng (**fail-open có chủ ý**, không crash bridge).
  Lỗi ghi đĩa cũng chỉ cảnh báo, không throw.
- `destroy()` flush một lần cuối rồi mới dọn Map (test cũ vẫn xanh).

**Số đo thật (bridge thật, e2e §5):** bridge A `GLOBAL=5` nhận 5 health →
dừng SIGTERM → file persist ghi đủ 5 mốc global + 1 bucket
`general:::ffff:127.0.0.1` 5 mốc → spawn bridge B cùng file → health đầu
tiên vẫn **429** (budget KHÔNG reset) → đợi hết cửa sổ 12s → health **200**
lại, `Global-Remaining=4`.

**Giới hạn trung thực:** `kill -9`/crash mất tối đa 5s mốc chưa kịp lưu định
kỳ (chỉ flush khi tắt graceful). Persist chỉ cứu restart cùng máy, không
đồng bộ giữa 2 bridge cùng chạy (mỗi instance ghi đè file của nhau — bridge
chạy local 1 instance nên chấp nhận được).

## 3. Siết các số còn lại qua env — bảng đầy đủ

Rà soát toàn bộ hằng số rate-limit còn hardcode trong `rateLimit.js` +
`index.js`. Kết quả:

| Biến env | Mặc định | Trước đây | Ghi chú |
|---|---|---|---|
| `BRIDGE_RATE_GENERAL` | 120 | đã có env (R7) | req/phút/IP, mọi `/api/` |
| `BRIDGE_RATE_RENDER` | 20 | đã có env (R7) | req/phút/IP, route nặng |
| `BRIDGE_RATE_WINDOW_MS` | 60000 | đã có env (R7) | độ dài cửa sổ trượt (ms) |
| `BRIDGE_RATE_GLOBAL` | **600** | **mới (S5)** | trần tổng mọi scope+IP/cửa sổ; 0 = tắt |
| `BRIDGE_RATE_PERSIST_PATH` | `~/.cache/vcut/rate-limit.json` | **mới (S5)** | file JSON lưu trạng thái |
| `BRIDGE_RATE_PERSIST_MS` | **5000** | **mới (S5)** | chu kỳ lưu đĩa (ms); 0 = chỉ lưu khi tắt |
| `BRIDGE_RATE_SWEEP_MS` | = cửa sổ | hardcode = windowMs | **mới (S5)** chu kỳ dọn bucket hết hạn |
| (không env) sàn Retry-After 1s | 1s | hardcode | **giữ hardcode có chủ ý**: một phần của hợp đồng 429, đổi sẽ đổi hành vi client thấy được; ghi rõ trong comment `index.js` |

Tất cả biến số đều qua `parseRateLimitInt` + `warnBadRateEnv` (env sai in
cảnh báo lúc khởi động, rơi về mặc định — mẫu R7). Dòng log khởi động nay
ghi đủ: `hardening: rate-limit 120/phút (render 20/phút), global 600/phút,
persist /home/hatch/.cache/vcut/rate-limit.json, spec ≤10MB`.

**Env đổi số có hiệu lực (đo thật, e2e §5):** bridge C `GLOBAL=3`, file
persist mới → 3×200 rồi health #4 → 429 (không phải 5 của bridge A).

## 4. i18n

Không cần key mới: không có chuỗi user-facing nào đổi (message 429 giữ
nguyên; cảnh báo env sai chỉ in log server; log khởi động thêm chỉ là số).
Không sửa `vi.json` / `en.json`, không tạo fragment i18n.

## 5. Kiểm chứng (số thật, chạy 2026-11-08)

| Test | Kết quả |
|---|---|
| `server/bridge/test/test-rate-limit.cjs` (mở rộng, fake clock) | **108 pass, 0 fail** (gốc 58 — +50: [8] global cap 10, [9] đếm chéo scope + slot mở lại 9, [10] persist round-trip 17, [11] edge case 14) |
| `server/bridge/test/test-rate-limit-global-e2e.cjs` (mới, bridge thật) | **40 pass, 0 fail** — chạy xanh 3 lần liên tiếp (lần 1: 39/40, fail duy nhất là assert của chính test về key IP, đã sửa — xem §6.7) |
| `server/bridge/test/test-bridge-error-protocol-e2e.cjs` (R7, hồi quy) | **165 pass, 0 fail** |
| `server/bridge/test/test-bridge-error-protocol.cjs` (unit) | **142 pass, 0 fail** |
| `server/render/src/test_validate_codes.js` | **1572 pass, 0 fail** |
| `server/bridge/test/test-error-detail-structured.cjs` | **170 pass, 0 fail** |
| `server/bridge/test/test-error-detail-ui.cjs` | **52 pass, 0 fail** |
| `server/bridge/test/test-error-detail.cjs` | **64 pass, 0 fail** |
| `server/bridge/test/test-jobqueue.cjs` | **52 pass, 0 fail** |
| `bash server/bridge/test_hardening.sh` | **16 pass, 0 fail** |
| `node --check` `index.js` + `rateLimit.js` + 2 test mới | pass |
| Bridge thật, default env (không đặt env rate nào) | lên bình thường; health → `X-RateLimit-Limit: 120`, `Remaining: 118`, `Global-Remaining: 598`; SIGTERM → file persist ghi đủ 2 mốc |
| tsc | **N/A** — luồng chỉ đụng `server/bridge` (plain JS, không có tsconfig nào cover; không sửa file TS nào) |

E2E dùng cổng ngẫu nhiên (19587+/19787+/19987+rand200) và chờ bridge lên
bằng TCP connect (không poll `/api/health` để chờ — mỗi poll tốn 1 slot
budget). Toàn bộ persist trong e2e dùng file tmp riêng, không đụng file thật.

## 6. Nợ mở / lưu ý trung thực

1. **`parseInt` vẫn nhận tiền tố số** (`"4.9"` → 4, `"120abc"` → 120 — R7
   §6.3, giữ nguyên có chủ ý): R7 quyết định không siết thành "số nguyên
   thuần" để tránh đổi hành vi với env đang chạy; luồng này cũng không đổi
   (phạm vi là đưa hằng số về env, không đổi ngữ nghĩa parse). Nếu muốn
   siết thì là đợt riêng, kèm cảnh báo rõ ràng cho env đang chạy.
2. **Các `parseInt` env KHÔNG phải rate-limit trong `index.js` chưa đụng:**
   `BRIDGE_MAX_JOBS`, `BRIDGE_MAX_QUEUE`, `BRIDGE_MAX_UPLOAD`,
   `BRIDGE_JOB_TTL`, `BRIDGE_SPEC_MAX`, `BRIDGE_MIN_DISK_FREE` vẫn parse thô
   — NaN ở đó có thể gây hành vi lạ riêng (R7 §6.4 đã ghi, ngoài phạm vi
   đợt này).
3. **IPv4 ↔ IPv6-mapped vẫn 2 bucket khác nhau** (`127.0.0.1` qua socket
   thành `::ffff:127.0.0.1` — R7 §6.2): global cap nay đã chặn được kiểu
   đổi IP để né per-IP, nhưng bucket per-IP vẫn tách; chuẩn hoá IP là việc
   riêng nếu cần.
4. **File persist mặc định dùng chung cho mọi bridge trên máy** (kể cả
   bridge test): test nào spawn bridge mà không đặt
   `BRIDGE_RATE_PERSIST_PATH` riêng sẽ ghi/đọc file thật
   `~/.cache/vcut/rate-limit.json`. Với cửa sổ test ngắn (vd e2e R7 dùng
   2000ms) mốc hết hạn nhanh nên không làm lệch số học; test nào dùng
   cửa sổ 60s + budget nhỏ thì **phải** đặt persist path tmp riêng (e2e
   mới của luồng này đã làm mẫu). File test còn sót đã xoá tay sau các lần
   chạy hồi quy.
5. **`kill -9`/crash mất tối đa 5s mốc** (chỉ flush khi tắt graceful) —
   xem §2. Muốn mất 0 mốc thì phải lưu đồng bộ mỗi request (đắt, không làm).
6. **Va chạm với luồng song song S4 trong lúc chạy:** S4 tạo mới
   `server/bridge/src/gpuProbe.js` (08:43:44) với require sai
   `../render/src/gpuencode` (đúng phải là `../../render/src/gpuencode`)
   + móc vào `index.js:59` → bridge KHÔNG khởi động được trong khoảng
   08:43–08:51. Luồng này KHÔNG sửa file của S4 (đang làm dở); S4 tự sửa
   xong lúc 08:51:50. E2E lần 2 của luồng này (chạy trong khoảng đó) fail
   "bridge không lên" vì lý do đó, không phải do code S5. Để kiểm chứng
   tiếp, luồng này chạy e2e trên **bản copy trong /tmp** (chỉ sửa path trong
   bản copy, không đụng repo) + chạy lại trên cây thật sau khi S4 sửa xong:
   e2e 40/40 xanh 3 lần, hồi quy R7 e2e 165/165 xanh.
7. **Test [9] sửa kỳ vọng sau 1 fail:** bản đầu kỳ vọng sau khi mốc t=0
   hết hạn thì global còn "2 mốc cũ + 1 mới" — sai số học (cả 3 mốc đều ở
   t=0 nên cùng hết hạn). Sửa test về đúng (global còn 1 mốc mới,
   Remaining=2), không sửa code. Tương tự e2e lần 1: assert key bucket
   `general:127.0.0.1` sai (thực tế `general:::ffff:127.0.0.1`) — sửa test,
   không sửa code.
8. `.github/workflows/ci-security.yml` vẫn 403 (nợ cũ, không đổi).
   Release gate giữ nguyên.

## 7. File đổi/thêm (stage batch `phase9-round65-s5-rate-limiter-global-persist.txt`, 6 file)

Mới (2): `server/bridge/test/test-rate-limit-global-e2e.cjs`,
`docs/PHASE9_ROUND65_S5_LIMITS.md`.
Sửa (4): `server/bridge/src/rateLimit.js`,
`server/bridge/src/index.js`,
`server/bridge/test/test-rate-limit.cjs`,
`server/bridge/HARDENING_LIMITS.md`.

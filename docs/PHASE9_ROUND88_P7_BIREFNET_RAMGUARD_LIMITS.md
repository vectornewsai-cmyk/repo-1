# Phase 9 Round 88 — P7: RAM guard cho birefnet-general — LIMITS

Ngày: 11/11/2026 (lượt cron 15:35 +07). Luồng P7 đợt 88. Repo: `vectornewsai-cmyk/repo-1`, branch main.
Nhiệm vụ: nợ N4 đợt 86 — RAM guard cho `birefnet-general` trong gói ship
(xem `docs/PHASE9_ROUND86_N4_BIREFNET_SHIP_LIMITS.md` §5.2).
**KHÔNG push, KHÔNG release/tag, KHÔNG binary vào batch, KHÔNG file workflow, KHÔNG đụng TTS 39.**

## 0. Kết luận ngắn

**RAM guard đã hoạt động thật, đã đo:** khi RAM khả dụng dưới ngưỡng,
`bgremove.py` chặn `birefnet-general` ngay từ đầu (không khởi tạo session,
không load model 973 MB), chuyển sang `u2net` trong cùng tiến trình và job
hoàn tất 17/17 frame — thay vì kiểu cũ: thử birefnet 2–6,5 phút rồi chết
SIGKILL (nghi OOM-kill) mới fallback. Trên VM này lúc chạy thật, guard chặn
ở `avail_mb=1609`, job xong sau **101,0s** (toàn bộ là thời gian u2net) với
đỉnh RSS **1.091 MB**, thay vì 152–529s/job ở các attempt N4 (đã gồm thời
gian chết + fallback).

**Nói rõ điều guard KHÔNG làm:** guard không làm `birefnet-general` chạy
được — **birefnet vẫn 0 lần chạy thành công trong gói** (giữ nguyên từ N4).
Trên VM 8 GB này, RAM khả dụng trong giờ vòng lặp chỉ ~1,4–2,0 GB nên guard
sẽ chặn birefnet gần như luôn trong giờ vòng lặp — đó là hành vi đúng theo
thiết kế (tránh đợi chết), không phải lỗi. Muốn 1 lần birefnet thành công
thật vẫn cần cửa sổ yên với ≥ 6 GB khả dụng ổn định ~7 phút, hoặc máy
nhiều RAM hơn (xem §5).

## 1. Ngưỡng — cách chọn (ghi rõ để đợt sau đối chiếu)

Ngưỡng mặc định: **`DEFAULT_MIN_RAM_MB = 6144` (≈ 6 GB)**, đo theo
`MemAvailable` trong `/proc/meminfo` (đã trừ cache có thể thu hồi — là số
đo đúng cho "còn bao nhiêu RAM thật sự dùng được").

| Thành phần | Số đo / căn cứ |
|---|---|
| Đỉnh RSS birefnet-general đã đo | 2,62 GB (standalone, đã tắt ORT arena) tới 3,81 GB (in-app, spike lúc predict frame đầu) — N4 đợt 86 |
| Electron + bridge trong gói | ~1 GB (N4: vcutRSS ~977 MB lúc bridge healthy) |
| OS + tiến trình khác | ~0,5 GB |
| Biên an toàn | ~0,5–1 GB (MemAvailable dao động mạnh theo tải các luồng khác trong giờ vòng lặp: 0,6–5,5 GB ở N4) |
| **Tổng** | **≈ 5,6–6,3 GB → làm tròn 6 GB** |

Override: `--min-ram-mb N` (CLI) thắng env `BGREMOVE_MIN_RAM_MB`, env thắng
mặc định; `--min-ram-mb 0` hoặc `--no-ram-guard` tắt guard. Giá trị env lỗi
→ mặc định, không crash (có test).

## 2. Thay đổi production

### 2.1 `server/bgremove/bgremove.py`

- `get_mem_available_mb(meminfo_path="/proc/meminfo")` — đọc MemAvailable,
  trả int (MB) hoặc `None` nếu không đọc được (không phải Linux, `/proc`
  không có, parse lỗi).
- `ram_guard_decision(session, avail_mb, min_mb)` — logic thuần, test được
  không cần `/proc`: `"allow"` (không phải birefnet / đủ RAM),
  `"allow-unknown"` (không đo được RAM → cho chạy tiếp + warn, không chặn
  oan), `"fallback"` (birefnet + RAM dưới ngưỡng).
- `resolve_min_ram_mb(args)` — thứ tự ưu tiên CLI > env > mặc định.
- `main()`: guard chạy **trước** `run_once()` (run_once mới import rembg +
  load model, nên guard phải chặn ở đây). Khi chặn:
  - in stderr dòng `RAM_GUARD session=... avail_mb=... min_mb=... -> u2net`
    + marker machine-readable `ram_guard_from=` / `ram_guard_avail_mb=` /
    `ram_guard_min_mb=`, rồi chạy u2net; khi xong in thêm
    `fallback_from=<session gốc>` như đường retry sau lỗi;
  - nếu `--no-fallback` đang bật: exit ngay với thông báo `RAM_GUARD: ...`
    rõ ràng (không chạy session nào, không tạo output).
- Không đổi hành vi u2net; không đổi session mặc định; không đụng đường
  retry sau lỗi (vẫn còn cho trường hợp guard cho qua nhưng RAM tụt giữa
  chừng rồi birefnet chết).

### 2.2 `server/bridge/src/bgremove.js`

- `parseSessionMarkers()` đọc thêm 3 marker `ram_guard_*`.
- `runAttempt()` giữ lại các marker guard trong kết quả.
- `runBgremove()`: khi Python đã guard-fallback trong tiến trình,
  `fallbackReason` nói đúng lý do — *"RAM guard: RAM khả dụng 1405 MB <
  ngưỡng 6144 MB nên không thử birefnet-general (tránh OOM-kill) — đã dùng
  u2net ngay từ đầu"* — thay vì câu cũ "lỗi trong quá trình chạy". Trường
  hợp birefnet chạy rồi lỗi giữa chừng giữ nguyên câu cũ. Bridge chỉ spawn
  Python 1 lần cho đường guard (không retry thừa).

## 3. Kiểm chứng thật (số đo, không claim suông)

Venv: `server/bgremove/.venv` (rembg 2.0.87, ort 1.23.2, đúng
`requirements.txt`). Model: `~/.u2net` (`birefnet-general.onnx`,
`u2net.onnx` đã có sẵn, không tải). Clip: `clip1.mp4` cắt 0,5s
(0,566667s, 17 frame, 1280×720 → 960×540), mode `alpha`, `--temporal 0.4
--feather 1` (đúng tham số bridge truyền). Log + output giữ ở
`~/workspace/tmp-p7-ramguard/` (ngoài repo).

### 3.1 Chạy thật 1 — guard chặn birefnet, u2net hoàn tất (đường ship)

```
$ bgremove.py --input clip05.mp4 --output out-guard.mov --mode alpha \
    --session birefnet-general --temporal 0.4 --feather 1
[bgremove] RAM_GUARD session=birefnet-general avail_mb=1609 min_mb=6144 -> u2net (...)
[bgremove] ram_guard_from=birefnet-general
[bgremove] ram_guard_avail_mb=1609
[bgremove] ram_guard_min_mb=6144
[bgremove] xong: out-guard.mov (17 frames)
[bgremove] session_used=u2net
[bgremove] fallback_from=birefnet-general
wall=101.0s, peak RSS (max child)=1091 MB, exit=0
```

- Dòng `RAM_GUARD` là dòng đầu tiên của stderr; **0 lần** xuất hiện
  `"khởi tạo session 'birefnet"` — birefnet không được thử.
- Output `out-guard.mov` 1.715.896 byte, ffprobe: `png, 960×540, rgba,
  0.566667s` — đúng định dạng MOV alpha nối render worker.
- So sánh: các attempt N4 mất 152–529s/job (gồm 2–6,5 phút thử birefnet
  rồi chết + fallback); guard rút còn 101,0s toàn u2net.

### 3.2 Chạy thật 2 — u2net trực tiếp (hồi quy, guard không can thiệp)

```
$ bgremove.py ... --session u2net ...
[bgremove] xong: out-u2net.mov (17 frames)
[bgremove] session_used=u2net
wall=114.0s, peak RSS (max child)=1197 MB, exit=0
```

- Không có dòng `RAM_GUARD` nào; không `fallback_from`.
- Matte **giống hệt** bản guard (frame 0: alpha mean 17,6 cả hai;
  frame 8: mean 8,4) — guard-fallback cho đúng kết quả u2net, không sai
  lệch. (Alpha thấp là do nội dung clip1 — ít chủ thể tiền cảnh — không
  phải lỗi guard; cả hai đường đều ra cùng một matte.)

### 3.3 Chạy thật 3 — guard + `--no-fallback` (chặn thẳng, không chạy)

```
$ bgremove.py ... --session birefnet-general --no-fallback
RAM_GUARD: không chạy session birefnet-general — RAM khả dụng 1968 MB < ngưỡng 6144 MB.
Chạy lại với --session u2net hoặc tăng RAM khả dụng.
exit=1, wall=0.4s, KHÔNG tạo file output, không load model
```

### 3.4 KHÔNG chạy birefnet thật trong lượt này — đúng chỉ đạo

Theo nhiệm vụ: không thử lại cùng công thức birefnet trong giờ vòng lặp
nếu guard đã chặn. Lần birefnet gần nhất vẫn là N4 (6 lần chết liên tiếp
cùng chữ ký). Không có lần chạy `--no-ram-guard` nào trong lượt này.

## 4. Test suite (unit, không cần model)

| File | Kết quả |
|---|---|
| `server/bgremove/test_bgremove_ramguard.py` (mới, 8 test) | **8/8 pass** |
| `server/bgremove/test_bgremove_fallback.py` | **7/7 pass** |
| `server/bgremove/test_bgremove_smooth.py` | **4/4 pass** |
| `server/bridge/test/test-bgremove-ramguard.cjs` (mới, 15 assert) | **15/15 pass** |
| `server/bridge/test/test-bgremove-fallback.cjs` | **19/19 pass** |
| `python3 -m py_compile bgremove.py` + `node --check src/bgremove.js` | OK |

Nội dung test guard (Python): đọc `/proc/meminfo` giả (đúng/sai/thiếu),
decision fallback/allow/allow-unknown/biên `== ngưỡng`, resolve ngưỡng
(mặc định/CLI/env/`--no-ram-guard`/env lỗi), main() với run_once stub:
guard → chỉ gọi u2net 1 lần + đủ marker; đủ RAM → chạy birefnet; guard +
`--no-fallback` → exit, không gọi session nào; u2net không bị guard.
Test bridge (stub Python): guard marker → chỉ spawn 1 lần, `fallbackReason`
nhắc "RAM guard" + đúng số MB (1405/6144); không marker → không fallback;
parse marker guard.

**Thay đổi hành vi đã phát hiện và sửa trong lượt:** `test_bgremove_fallback.py`
cũ gọi `main()` với ngưỡng mặc định nên trên VM ít RAM bị guard chặn trước
`run_once` (4/7 fail lúc đầu: `calls == ['u2net']` thay vì
`['birefnet-general', 'u2net']`). Đây là hành vi production đúng (guard
pre-empt retry), không phải lỗi guard — đã thêm `--no-ram-guard` vào harness
của file đó (kèm comment) để nó tiếp tục test đường retry-sau-lỗi trong
trường hợp guard đã cho qua; đường guard có test riêng. Sau sửa: 7/7.

## 5. Giới hạn — chưa làm được / chưa test (trung thực)

- **Birefnet-general: vẫn 0 lần chạy thành công trong gói.** Guard chỉ
  tránh trải nghiệm "đợi 5 phút rồi mới có kết quả u2net", không chứng minh
  birefnet chạy được. Nợ Phase 10 "app đóng gói chưa chạy đủ services" vẫn
  còn đúng 1 job này (7/8).
- **Ngưỡng 6 GB là heuristic từ số đo, không phải đảm bảo:** RAM có thể
  tụt sau lúc guard kiểm tra (luồng khác vào việc) nên "cho qua" không đảm
  bảo khỏi OOM — đường retry sau SIGKILL vẫn cần và vẫn còn. Ngược lại,
  ngưỡng có thể chặn oan trên máy mà birefnet vẫn chạy được (vd 5 GB khả
  dụng + tải nhẹ) — user có thể hạ bằng `--min-ram-mb` / env.
- **Chưa test đường bridge thật trong gói AppImage** (bridge → spawn
  `bgremove.py` thật): chỉ test bridge bằng stub Python + chạy Python thật
  ngoài app. Cần 1 lần chạy e2e trong gói để thấy `fallbackReason` RAM
  guard hiện lên UI — để cho luồng ship services sau (đợt này không chạy
  AppImage vì tránh tốn lượt + tải VM).
- **Guard chỉ đọc `/proc/meminfo` (Linux):** trên macOS/Windows,
  `get_mem_available_mb()` trả `None` → `allow-unknown` + warn rồi chạy
  tiếp (không chặn oan, nhưng cũng không bảo vệ). Chưa có nhánh `psutil` /
  `os.freemem` cho non-Linux — cố tình giữ stdlib-only, không thêm dep.
- **Chưa đo lại đỉnh RSS birefnet sau guard** (không chạy birefnet nên
  không có số mới): các số ngưỡng vẫn là số N4 (2,62–3,81 GB).
- Không thêm i18n key nào (thông báo guard là log stderr/server-side, UI
  dùng `fallbackReason` đã có sẵn từ bridge). Không kiểm TTS 39.

## 6. File trong batch (stage chờ push — text only)

| File | Đổi gì |
|---|---|
| `server/bgremove/bgremove.py` (sửa) | RAM guard: `get_mem_available_mb`, `ram_guard_decision`, `resolve_min_ram_mb`, CLI `--min-ram-mb` / `--no-ram-guard`, chặn + marker `ram_guard_*` / `fallback_from=` trong `main()` |
| `server/bgremove/test_bgremove_ramguard.py` (mới) | 8 test unit cho guard |
| `server/bgremove/test_bgremove_fallback.py` (sửa) | Harness thêm `--no-ram-guard` để tiếp tục test đường retry-sau-lỗi (xem §4) |
| `server/bridge/src/bgremove.js` (sửa) | `parseSessionMarkers` đọc marker guard; `fallbackReason` riêng cho RAM guard |
| `server/bridge/test/test-bgremove-ramguard.cjs` (mới) | 15 assert bridge cho guard |
| `docs/PHASE9_ROUND88_P7_BIREFNET_RAMGUARD_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: `~/workspace/tmp-p7-ramguard/` (clip, log, output
`.mov`, frame PNG — giữ ngoài repo để parent đối chiếu), `__pycache__`,
binary, workflow.

## 7. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
cd ~/workspace/repo-1
# Unit (không cần model):
python3 server/bgremove/test_bgremove_ramguard.py   # kỳ vọng 8/8
python3 server/bgremove/test_bgremove_fallback.py   # kỳ vọng 7/7
node server/bridge/test/test-bgremove-ramguard.cjs  # kỳ vọng 15 pass
node server/bridge/test/test-bgremove-fallback.cjs  # kỳ vọng 19 pass
# Chạy thật (venv repo, clip 0,5s — xem §3):
server/bgremove/.venv/bin/python server/bgremove/bgremove.py \
  --input <clip-0.5s> --output <out.mov> --mode alpha \
  --session birefnet-general --temporal 0.4 --feather 1
# Kỳ vọng trên VM ít RAM: RAM_GUARD chặn ngay, u2net 17/17 frame, exit 0.
# Kỳ vọng trên máy ≥ 6 GB RAM khả dụng: guard cho qua, thử birefnet thật.
# Ép ngưỡng để test 2 nhánh mà không đổi máy:
#   --min-ram-mb 999999  -> luôn chặn (fallback u2net)
#   --min-ram-mb 1       -> luôn cho qua (thử birefnet — CHỈ dùng ngoài giờ
#                           vòng lặp / máy đủ RAM, tránh OOM-kill)
```

## 8. Tương tác với luồng khác trong đợt 88

- Chỉ sửa 1 file production Python (`server/bgremove/bgremove.py`) + 1 file
  production JS (`server/bridge/src/bgremove.js`) và test/docs của riêng
  luồng; KHÔNG sửa file của luồng khác.
- Không đụng `.github/workflows/*`, không đụng TTS/Gradio, không đụng
  model/venv. Không build lại AppImage.

# Phase 9 đợt 68 — V5: toast timeout keyframe hiện ngay + chạy lại click-test khi máy yên (đóng nợ U5 §6)

Ngày: 2026-11-08 (UTC) / 2026-11-09 01:45 (+07). Máy: VM Linux 2 vCPU / 8 GB, không GPU.
Trạng thái: **KHÔNG HOÀN THÀNH — click-test bị chặn bởi sự cố môi trường máy-wide
(Chrome SIGTRAP + Xvfb không khởi động được + EPERM ghi file chập chờn). Nợ U5 §6
VẪN MỞ. Số cũ giữ nguyên. Không có code sản phẩm nào đổi trong luồng này.**

## 0. Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Mục 1 — xác minh sửa toast hiện ngay (U5) | ✅ ĐÃ XÁC MINH: sửa U5 còn nguyên trong code, đúng thiết kế; KHÔNG cần sửa thêm (xem §1) |
| tsc web | ✅ 0 lỗi |
| Unit test keyframe (62R4/63R4/64R10/65S6/66T6/67U5 + capThumb) | ✅ 19/19, 13/13, 11/11, 15/15, 9/9, 11/11, 2/2 |
| vite build | ✅ pass (bundle mới `index-Dem_tWHD.js`; sau đó luồng khác build lại thành `index-BUTZkk0z.js` — đã kiểm tra marker trên cả hai) |
| Click-test chạy 1 (headed, 17:50–18:00) | ⚠️ H toast THẤY ở +169,8 s đúng từng ký tự, nhưng baseline loadavg 8,69 → **INCONCLUSIVE**; C/N chưa chạy; đã kill chủ động vì poll kẹt (xem §3) |
| Click-test chạy lại H/C khi máy yên + N | ❌ **KHÔNG CHẠY ĐƯỢC**: Xvfb không lên + Chrome chết SIGTRAP (xem §4) |
| Harness click-test | ✅ đã cứng hoá (poll wall-clock, eval cap 15 s, cổng loadavg, fallback dist-direct, JSON ra stdout) — `~/scratch-round68-v5/clicktest-68v5-toast-timeout.mjs` (578 dòng) |

## 1. Mục 1 — toast hiện ngay: ĐÃ CÓ từ U5, xác minh lại, không sửa thêm

Nhiệm vụ gốc yêu cầu "sửa để toast hiện ngay" — kiểm tra code cho thấy sửa này
**đã được U5 làm xong và vẫn còn nguyên**, không có hồi quy:

- `apps/web/src/lib/reverseWebcodecs.ts:1891` — `subscribeTrialDecodeTimeoutNotes`
  (mẫu `subscribeToasts`); `:1518` — controller gọi
  `notifyTrialDecodeTimeoutNotesChanged()` ngay khi set note mới
  (null → có giá trị / đổi giá trị).
- `apps/web/src/preview.tsx:2693` — effect `[previewLang]` đăng ký subscriber →
  `refreshDecodeAheadUi()` ngay khi note được set; effect cũng gọi
  `refreshDecodeAheadUi()` lúc mount. Logic keyed trong `refreshDecodeAheadUi`
  chống toast trùng (không đổi).
- Chuỗi toast **không hardcode 60000 ms**: template `gop.trial.timeoutNote`
  (`apps/web/src/i18n/vi.json`) dùng `{timeout}` — giá trị thật ở 64,0 MiB là
  **78536 ms** (công thức, dưới trần 90 s). Test 66T6 khóa "60000 ms" chỉ cho
  input tường minh 60000 của hàm note (không phải trần thật); test 67U5 khóa
  "78536 ms" cho trường hợp thật. Không có gì phải cập nhật đồng bộ.
- Bằng chứng U5 còn hiệu lực: click-test N đợt 67 PASS headed (toast tự hiện
  +160,1 s khi loop đã ngủ, appearances = 1). Luồng này KHÔNG chứng minh lại
  được N do Chrome chết (xem §4) — **không claim lại N**.

## 2. Kiểm chứng độc lập (chạy lúc 17:45–17:49 08/11 UTC, máy yên loadavg ~0,3–1,4)

- `tsc --noEmit` (apps/web): **0 lỗi** (~20 s).
- Suite keyframe (esbuild bundle + node, mẫu U5): 62R4 **19/19**, 63R4 **13/13**,
  64R10 **11/11**, 65S6 **15/15**, 66T6 **9/9**, 67U5 **11/11**,
  captureThumb66T6 **2/2**.
- `vite build`: pass (8,04 s), bundle `index-Dem_tWHD.js` (1.540,64 kB).
  Sau đó một luồng đợt 68 khác build lại dist → `index-BUTZkk0z.js`
  (1.503.889 B); đã kiểm tra cả hai bundle đều chứa `9e4`, `Keyframe đầu`,
  `gop.trial.timeoutNote`. Không có file `src/` nào đổi sau lần build 17:49
  ngoài test/i18n (đã rebuild để snapshot khớp src).
- Không có thay đổi code sản phẩm trong luồng này: `reverseWebcodecs.ts`,
  `preview.tsx` giữ nguyên từ U5 (mtime 08/11 14:46–14:49, trước lần build).

## 3. Click-test chạy 1 — headed, 17:50–18:00 (INCONCLUSIVE, đã kill chủ động)

Dùng lại script U5 (chưa cứng hoá), display :214, port 4214, snapshot
`index-Dem_tWHD.js`, fixture `bigkey-64mib-70s.mp4` / `bigkey-64mib.mp4`
(đợt 66, sample0 đúng 67.108.864 B). Log: `~/scratch-round68-v5/clicktest-68v5.log`.

- Import 70 s: OK 11,2 s.
- **[H] baseline loadavg 1-phút = 8,69 trước khi bật tải riêng** (các luồng
  đợt 68 khác đã vào việc giữa lúc máy yên 0,59 lúc 17:45 và lúc bấm ngược
  17:51) — **tiền đề "máy yên" SAI** → H INCONCLUSIVE theo đúng luật đã đặt
  (baseline ≤ 3,0). Toast timeout **THẤY ở +169,8 s**, đúng từng ký tự
  ("... trong 78536 ms — ..."); ngoài cửa sổ 75–165 s (chỉ 4,8 s) vì fetch
  chậm dưới tải. Toast "Bridge không chạy" ở +51,8 s là toast khác, không liên quan.
- **Poll bị kẹt (lỗi harness, đã sửa — xem §5):** poll đếm 360 lần, mỗi lần
  `Runtime.evaluate` chậm ~5 s+ dưới tải (loadavg 12+) nên poll 180 s kéo dài
  >30 phút; encode/hog lượt H vẫn chạy vì `stopLoad()` chưa tới. Đã kill chủ
  động lúc ~18:00 (node + Chrome + Xvfb :214 + 4 hog + 2 encode, dọn tay từng
  PID — lưu ý: `pkill -f "Xvfb :214"` match cả shell của chính mình vì pattern
  nằm trong cmdline; lần sau dùng PID cụ thể hoặc bracket trick `Xvfb :2[1]4`).
  C và N **không chạy** trong lần này.
- Số H lần này (+169,8 s, baseline 8,69) chỉ là **điểm dữ liệu phụ**, không
  thay số U5 (+185,9 s, baseline 22,02) và không tính là pass.

## 4. Chặn chạy lại — sự cố môi trường máy-wide (18:05–18:45)

Ba lần thử chạy lại đều chết sớm; nguyên nhân đã cô lập từng cái:

### 4.1 EPERM ghi file chập chờn (đã biết từ ~01:05 09/11, xem MEMORY)

- `fs.cpSync` / `cp` / `cat` (đường `copy_file_range`) → EPERM; có lúc cả
  `writeFileSync` và `echo >>` cũng EPERM, file tạo ra 0 byte. Python ghi
  buffered "báo OK" nhưng file vẫn 0 byte — **mất dữ liệu lặng lẽ, đừng
  dùng python để ghi file**.
- Trạng thái chập chờn theo phút: EPERM lúc 18:10–18:16, nhả lúc 18:18/18:27,
  bật lại lúc 18:30–18:31. Ghi qua file-tools (muse.write) vẫn được.
- Hậu quả trực tiếp: snapshot copy dist → `dist-snap-68v5` lỗi EPERM
  (lần 18:10; snapshot dở dang, đã xoá). Script V5 đã có fallback:
  phục vụ thẳng `dist` + kiểm tra bundle không đổi trước mỗi lượt.

### 4.2 Xvfb không khởi động được — xkbcomp EPERM

- Triệu chứng: Xvfb :214/:215 chết lặng <1 s, exit 1, không tạo socket,
  không log (stderr ghi ra file cũng EPERM nên log trống).
- Nguyên nhân (bắt được khi chạy foreground, stderr ra pipe):
  `xkbcomp: Cannot close "/var/lib/xkb/server-214.xkm" properly
  (not enough space?)` → `XKB: Failed to compile keymap` →
  `Fatal server error: Failed to activate virtual core keyboard: 2`.
- Loại trừ: `/var/lib/xkb` còn 7,3 GB trống, ghi tay được; xkbcomp chạy
  trực tiếp biên dịch được (11.268 byte ra `/var/lib/xkb/server-214.xkm`,
  exit 0); `-xkbdir` sang scratch cũng lỗi; thử lại 3 lần cách nhau 45 s
  đều exit 1. **Mọi Xvfb trên máy đều chết** (chỉ còn socket mồ côi
  X170/X178/X179/X181/X211/X213/X246, không còn tiến trình Xvfb nào).

### 4.3 Chrome chết SIGTRAP ngay lúc khởi động — không CDP được

- Mọi bản Chromium trên máy đều chết tức thì, exit 133 (SIGTRAP), mọi chế
  độ: `chromium-1254` headed, `--headless=new`, `--single-process`,
  `--no-crashpad`; `chromium-1187`; `chromium_headless_shell-1254`.
- `--remote-debugging-pipe` không có fd → lỗi rõ `Remote debugging pipe
  file descriptors are not open` (exit 13) — nhưng cả khi cấp đủ fd 3/4
  qua pipe CDP như script, Chrome vẫn SIGTRAP trước khi đáp
  (`Target.getTargets` timeout 30 s trong lần chạy foreground 18:42).
- Crashpad của 1187 ghi `write: Operation not permitted (1)` — cùng gốc
  EPERM. **Không còn tiến trình Chrome nào trên máy** (18:44).
- Hệ quả: click-test (headed hay headless) **không thể chạy** cho tới khi
  Chrome khởi động lại được. Phương án headless (`V5_HEADLESS=1`,
  `--headless=new`, bỏ Xvfb) đã chuẩn bị sẵn trong script nhưng vẫn cần
  Chrome sống — cũng chết SIGTRAP nên không cứu được lần này.

### 4.4 Lỗi chạy 2 (18:05) — không phải lỗi môi trường, đã sửa

Lần chạy 2 chết vì runtime dọn process group (quên `nohup`, exec kết thúc
→ node bị kill). Bài học: chạy click-test bằng `nohup` + giữ session sống
bằng `sleep` dài (mẫu chạy 1). Không liên quan tới EPERM/Xvfb.

## 5. Harness đã cứng hoá (để đợt sau dùng lại)

`~/scratch-round68-v5/clicktest-68v5-toast-timeout.mjs` (578 dòng, syntax OK)
— kế thừa U5 + các sửa sau (đã áp dụng, chưa chạy thành công lần nào vì §4):

- **Poll theo wall-clock** (không đếm 360 lần): `while (Date.now() < endAt)`,
  evaluate mẫu timeout **15 s**; ghi `evalCount/evalSlow/evalMaxMs/wallMs`
  vào kết quả để thấy renderer chậm.
- **Cổng loadavg vào verdict**: H chỉ PASS khi baseline ≤ 3,0; C chỉ PASS
  khi loadavg 1-phút tối đa trong poll ≤ 4,0; nhiễu → `verdictKind`
  `INCONCLUSIVE-noisy-*`, không ghi thành pass.
- **Snapshot fallback**: copy thủ công read/write (tránh `copy_file_range`);
  copy lỗi → phục vụ thẳng `dist` + `checkBundleUnchanged()` trước mỗi lượt
  H/C/N (bundle đổi giữa chừng → abort BLOCKER, không lấy số nhiễm).
- **Kết quả không mất**: JSON vừa `writeFileSync` (try/catch) vừa in ra
  stdout giữa `RESULT-JSON-BEGIN/END`; `fail()` dùng `fs.writeSync(2, …)`
  thay cho `console.error` + exit ngay (đã mất message ở chạy 2).
- **Headless dự phòng**: `V5_HEADLESS=1` → `--headless=new`, bỏ Xvfb;
  kết quả lúc đó ghi rõ `headless: true`, **không claim headed**.
- `freshPage`/`importAndAdd`: chờ theo wall-clock (90 s / 240 s / 90 s)
  + evaluate timeout 10 s (trước đây đếm lần × timeout 120 s có thể kéo dài hàng giờ).

## 6. Nợ / giới hạn còn lại

- **Nợ U5 §6 VẪN MỞ**: chạy lại H/C khi máy yên + chạy lại N (toast tự hiện
  khi loop ngủ) — chưa có số mới nào. Số cũ giữ nguyên: N PASS headed đợt 67
  (+160,1 s, appearances = 1); H đợt 67 +185,9 s (nhiễu, loadavg tới 22,02);
  C đợt 67 tiền đề tải sai.
- **Chrome/Xvfb chết máy-wide** là blocker ngoài phạm vi luồng này; đợt sau
  kiểm tra trước khi chạy: `Xvfb :214` lên được + `chrome --dump-dom`
  chạy được; nếu chưa được thì đừng chạy click-test (chỉ tốn lượt).
- Trần worker 90 s / toast 78536 ms / biên tải thấp 28,2 s (U5) không đổi;
  không có gì mới về keyframe trong đợt này.
- `dist/` đã build lại lúc 17:49 (không stage, không push — theo luật
  stage-only). Snapshot `dist-snap-68v5` dở dang đã xoá.
- Lưu ý vận hành: ghi file qua exec chập chờn EPERM (xem §4.1) — mọi file
  của luồng này đều ghi bằng file-tools; đừng dùng `python open('w')`
  (mất dữ liệu lặng lẽ) hay `cp`/`cpSync` (copy_file_range) trong lúc
  EPERM đang bật; `pkill -f` với pattern nằm trong cmdline của chính mình
  sẽ tự kill shell — dùng PID hoặc bracket trick.

## 7. File stage (KHÔNG push)

- `docs/PHASE9_ROUND68_V5_KEYFRAME_TOAST_LIMITS.md` (file này — deliverable
  duy nhất của luồng trong repo; không có code sản phẩm đổi).
- Harness cứng hoá ở `~/scratch-round68-v5/clicktest-68v5-toast-timeout.mjs`
  (ngoài repo, theo mẫu scratch của U5 — không đưa vào batch).
- Log chạy: `~/scratch-round68-v5/clicktest-68v5.log` (chạy 1, H +169,8 s),
  `~/scratch-round68-v5/clicktest-68v5-run2.log` (trống — các lần chạy chết
  sớm, output mất do EPERM; xem §4).

# Đợt 152 T0 — Sửa F-151-T10-2: O8 report JSON ghi theo lượt, không ghi đè

Ngày: 20/11/2026 (T0 mở ~05:37Z, đóng ~05:53Z; boot `18e179e0`). Máy đo: VM này
(CPU-only, WebKitGTK 27.2 qua Xvfb; Chromium qua Playwright).
Phạm vi: sửa 2 script O8 gốc trong repo để mỗi lần chạy ghi report JSON riêng;
kiểm chứng bằng chạy thật O8 2 lần WebKit + 1 lần Chromium trong scratch riêng
`hidden_files/round152-t0/` (KHÔNG dùng cổng/display của T8-152). KHÔNG push,
KHÔNG release/tag, KHÔNG đụng TTS 39 / birefnet, KHÔNG sửa preview.tsx, KHÔNG
sửa driver T8 (driver đợt 151 là artifact lịch sử; T8-152 tự copy driver mới).
Nợ: docs/PHASE9_ROUND151_T8_VITEHARNESS_LIMITS.md §A (O8 WebKit 21/21 ×2 nhưng
chỉ còn 1 file `o8w-clicktest-report.json` trên đĩa — 2 attempt ghi đè nhau).

## 0. Kết luận ngắn — FIX XONG, ĐÃ KIỂM CHỨNG BẰNG CHẠY THẬT

- **Lỗi F-151-T10-2 đã sửa ở gốc:** 2 script O8 nay ghi report theo lượt
  `o8(w)-clicktest-report-<stamp>-<boot8>[-attempt<N>]-pid<PID>.json` — mỗi lần
  chạy một file riêng, không ghi đè. File tên cố định cũ vẫn được ghi thêm làm
  bản "latest" để luồng đọc cũ (T8/T10) không vỡ.
- **Kiểm chứng chạy thật (3 lần, scratch riêng `round152-t0/`):**
  - WebKit attempt1: exit 2 — S0 PASS, S1 FAIL, `page.setInputFiles: Target
    crashed` (chữ ký đợt 142 tái hiện, xem F-152-T0-1). JSON riêng
    `...05-42-38-18e179e0-attempt1-pid10897.json` TỒN TẠI, nội dung đúng
    (2 kết quả: 1 pass / 1 fail + `harnessError`).
  - WebKit attempt2: exit 2 — `timeout chờ project mẫu tự load` (trang lên
    nhưng mẫu không tự load sau ~4 phút, xem F-152-T0-2). JSON riêng
    `...05-43-04-18e179e0-attempt2-pid12951.json` TỒN TẠI, nội dung đúng
    (0 kết quả + `harnessError`). **Hai file JSON WebKit khác nhau đều tồn tại
    sau cả hai lần chạy — lỗi ghi đè đã hết.**
  - Chromium: exit 0 — **21/21 pass, 0 fail, 0 note** (86 s). JSON riêng
    `o8-clicktest-report-2026-11-20T05-47-19-18e179e0-attempt1-pid25492.json`
    + bản latest tên cố định, byte-identical.
- **Ghi đúng kết quả thực tế, không làm tròn:** WebKit đợt này 0/2 lần pass
  (không phải 21/21). Hai lỗi WebKit xảy ra TRƯỚC mọi code ghi report (dòng
  369/540/555 script WebKit) nên không phải do bản sửa này gây ra; bản sửa chỉ
  chạm code ghi report + khai báo hằng. App/proxy phía Chromium vẫn tốt
  (21/21), chứng tỏ trang + fixture không hỏng.
- **Không retry WebKit thêm** sau 2 lần fail: T8-152 đã mở thư mục lúc 05:39Z
  và đang chạy — chạy thêm một trình duyệt WebKit nữa sẽ tranh CPU (VM chỉ
  1,5 CPU chia sẻ) với lượt O8 chính thức của T8. Đường ghi success-path của
  WebKit dùng chung hàm `writeReport()` đã chạy thật ở catch-path WebKit
  (2 lần) + main-path Chromium (21/21) — xem §6 giới hạn.

## 1. Lỗi gốc F-151-T10-2 — cơ chế ghi đè

- Driver O8 của T8 (`hidden_files/round151-t8/o8-driver-151t8.sh`) chạy script
  WebKit bằng **2 process `node` riêng biệt** (attempt1 03:16:53Z, attempt2
  03:17:43Z), cùng `O8W_SCRATCH=$W/o8-webkit`.
- Script WebKit ghi report ở cuối `main()` bằng tên cố định duy nhất
  (dòng 817 bản cũ):
  `writeFileEpermRetry(path.join(SCRATCH, "o8w-clicktest-report.json"), ...)`
  — attempt2 ghi đè attempt1. Khối `catch` (dòng 826) cũng ghi cùng tên cố định.
- Bằng chứng đợt 151: thư mục `round151-t8/o8-webkit/` chỉ có 1 file
  `o8w-clicktest-report.json` (9.933 byte, 03:18Z) cho 2 attempt đều 21/21;
  attempt1 chỉ còn lại trong log text `o8-151t8.log`. Cùng lỗi ở bản Chromium
  (`o8-clicktest-report.json`, dòng 1061/1070 bản cũ) — Chromium mỗi đợt chỉ
  chạy 1 lần nên chưa lộ, nhưng chạy 2 lần cùng scratch sẽ ghi đè y hệt.
- Tên file vite-log đã theo lượt từ trước (`o8w-vite-<stamp>-attemptN.log`,
  `RUN_STAMP` dòng 45 bản cũ) — report JSON là chỗ duy nhất còn tên cố định.

## 2. Bản sửa — 2 file, chỉ chạm code ghi report

Thiết kế: tên file chứa **timestamp (`RUN_STAMP`, ISO tới giây) + boot_id
(8 ký tự đầu, cùng quy ước ngắn của T8) + attempt (env khi driver truyền) +
pid (chống trùng khi 2 lần chạy cùng 1 giây)**. `BOOT_ID` đọc
`/proc/sys/kernel/random/boot_id`, theo đúng mẫu sẵn trong repo
(`probe100b4-frame-parity.mjs` dòng 75). JSON mang thêm khối `run`
(`stamp`/`bootId`/`pid`/`file`) để tự nhận diện lượt chạy ngay cả khi file bị
đổi tên. File tên cố định cũ vẫn ghi thêm (cùng nội dung) làm bản "latest".

### WebKit — `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` (+23 dòng)

- Header: thêm ghi chú đợt 152 T0 / F-151-T10-2 (7 dòng).
- Sau `RUN_STAMP` (giữ nguyên): thêm `BOOT_ID`, `O8_ATTEMPT`
  (`process.env.O8W_ATTEMPT || ""`), `REPORT_FILE`
  (`o8w-clicktest-report-${RUN_STAMP}-${BOOT_ID}${...}-pid${process.pid}.json`)
  và hàm `writeReport(payload)` (ghi `REPORT_FILE` + bản latest tên cố định).
- Cuối `main()`: `log("report JSON theo lượt: ...")` rồi
  `writeReport({ run: { stamp, bootId, pid, file }, results, logLines })`.
- Khối `catch`: `writeReport({ run: {...}, results, logLines, harnessError })`.

### Chromium — `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` (+24 dòng)

- Y hệt WebKit, với tiền tố `o8-clicktest-report-`, env `O8_ATTEMPT`, và
  `RUN_STAMP` mới thêm (bản cũ không có stamp — vite-log của bản này vẫn
  `o8-vite-attemptN.log` mode `"w"`, xem nợ mở §7).
- Cuối `main()`: `writeReport({ run: {...}, precheck: pre, results, logLines })`;
  khối `catch` tương tự (không có `precheck`).

### Cách driver dùng (không sửa driver trong đợt này)

- Driver T8-152 copy từ driver 151: nếu KHÔNG truyền `O8W_ATTEMPT` /
  `O8_ATTEMPT`, tên file vẫn duy nhất nhờ stamp + pid (đoạn `-attempt<N>`
  chỉ vắng mặt). Muốn có đoạn attempt trong tên, driver thêm
  `O8W_ATTEMPT=1` / `=2` (WebKit) và `O8_ATTEMPT=1` (Chromium) — đã kiểm
  chứng ở §4 (tên file đợt này có `-attempt1` / `-attempt2`).
- Luồng đọc cũ không vỡ: file tên cố định vẫn tồn tại trong scratch, nội dung
  = lần chạy mới nhất. Muốn đọc TỪNG lần chạy: glob
  `o8w-clicktest-report-*.json` / `o8-clicktest-report-*.json` trong scratch.

## 3. Cây + md5 — trước / sau (KHÔNG đổi file nào khác)

| File | md5 lúc mở | md5 lúc cuối | Dòng / byte lúc cuối | Đổi? |
|---|---|---|---|---|
| `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs` | `ecbd1b40`86c35a02d727859b849cf09b | `4994b4fc`614e9dba7606237a09696c57 | 860 dòng / 55.496 B (+23 dòng) | Có — §2 |
| `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs` | `8911ad3d`e92a709b6db289786e1b9376 | `c8acd72e`c37213935aca7ea80198d21d | 1.104 dòng / 72.559 B (+24 dòng) | Có — §2 |
| `apps/web/src/preview.tsx` | `530e10a7` (theo T8-151) | không đo lại (không chạm) | — | Không |
| `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` và các script harness khác | — | không chạm | — | Không |

- md5 lúc mở khớp đúng số T8-151 đã ghi (`ecbd1b40`, `8911ad3d`) — cây chưa ai
  sửa trước T0-152. Không xóa logic cũ, chỉ thêm hằng/hàm + đổi 2 điểm ghi
  report mỗi script. Không chạm code TS nên **không chạy tsc / vite build**
  (hai file `.mjs` không nằm trong build TS; `node --check` đã đủ — xem §4).

## 4. Kiểm chứng — chạy thật + đếm độc lập bằng python

Môi trường chạy: boot `18e179e0`, RAM avail 3.264 MB lúc mở, vite lock TRỐNG,
không có vite nào trên 5560/5554. Scratch riêng `hidden_files/round152-t0/`
(`o8-webkit/`, `o8-chromium/`), fixture copy từ `round87-o8/headed/` (nguồn
chuẩn như driver T8). Cổng/display RIÊNG để không tranh với T8-152:
WebKit `O8W_DEV_PORT=5562 O8W_DEBUG_PORT=9660 O8W_DISPLAY=:189`,
Chromium `O8_DEV_PORT=5556 O8_DEBUG_PORT=9662 O8_DISPLAY=:198`, timeout 480
mỗi lần như driver. Log đầy đủ: `round152-t0/o8-152t0.log`.

| # | Lần chạy | Thời gian (Z) | Exit | Kết quả | File JSON theo lượt |
|---|---|---|---|---|---|
| 1 | O8 WebKit attempt1 (`O8W_ATTEMPT=1`) | 05:42:37–05:43:03 (26 s) | 2 | **FAIL** — S0 PASS, S1 FAIL, `page.setInputFiles: Target crashed` | `o8w-clicktest-report-2026-11-20T05-42-38-18e179e0-attempt1-pid10897.json` (1.583 B) |
| 2 | O8 WebKit attempt2 (`O8W_ATTEMPT=2`) | 05:43:03–05:47:18 (4m15s) | 2 | **FAIL** — `timeout chờ project mẫu tự load (3 clip, media bin 2 item) (last=null)` | `o8w-clicktest-report-2026-11-20T05-43-04-18e179e0-attempt2-pid12951.json` (749 B) |
| 3 | O8 Chromium attempt1 (`O8_ATTEMPT=1`) | 05:47:18–05:48:44 (86 s) | 0 | **PASS 21/21, 0 fail, 0 note** | `o8-clicktest-report-2026-11-20T05-47-19-18e179e0-attempt1-pid25492.json` (12.544 B) |

Kiểm độc lập bằng python (đọc lại 3 file JSON theo lượt + 2 file latest):

- Attempt1 WebKit: `run={stamp: 2026-11-20T05-42-38, bootId: 18e179e0,
  pid: 10897, file: <đúng đường dẫn file>}`; `results n=2, ok=1, fail=1` (S0
  PASS "mẫu tự load", S1 FAIL toggle rect); `harnessError="page.setInputFiles:
  Target crashed … waiting for locator('.mediabin input[type='file']')"`.
- Attempt2 WebKit: `run={stamp: 2026-11-20T05-43-04, bootId: 18e179e0,
  pid: 12951, ...}`; `results n=0`; `harnessError="timeout chờ project mẫu tự
  load (3 clip, media bin 2 item) (last=null)"`.
- Chromium: `run={stamp: 2026-11-20T05-47-19, bootId: 18e179e0, pid: 25492,
  ...}`; `results n=21, ok=21, fail=0, note=0`; dòng `KẾT QUẢ CLICK-TEST O8:
  21/21 pass, 0 fail, 0 note` có trong `logLines`.
- `legacy-webkit == attempt2` (md5 bằng nhau — bản latest = lần mới nhất,
  đúng thiết kế); `legacy-chromium == stamped` (md5 bằng nhau);
  `attempt1 != attempt2` (md5 khác nhau) — **hai JSON WebKit cùng tồn tại,
  không ghi đè. Lỗi F-151-T10-2 đã hết.**
- `node --check` cả 2 script sau sửa: OK. Không còn process Xvfb /
  MiniBrowser / vite / chrome sót sau khi chạy xong (ps kiểm 05:48Z: 0).
- Không có test/config nào trong repo chạm tới 2 script này (grep toàn
  `apps/web`: chỉ chính 2 file nhắc tới `clicktest-87o8`; `package.json` và
  `test_integration.sh` không nhắc tới) — O8 chỉ chạy qua driver trong
  hidden_files, nên chạy thật qua driver-mẫu là kiểm chứng đủ; không chạy
  lại toàn bộ `npm test` (không chạm code app/test).

## 5. Sai số mới (F-152-T0-N)

- **F-152-T0-1 — O8 WEBKIT "TARGET CRASHED" Ở S1 TÁI HIỆN (CHỮ KÝ ĐỢT 142):**
  attempt1: vite lên 05:42:40Z, WebKit 27.2 launch 05:42:46Z, S0 PASS 05:43:01Z
  ("mẫu tự load — 3 clip, media [mau-1.png, mau-2.png], project=1280x720"),
  S1 FAIL 05:43:02Z ("không đo được rect checkbox tự tạo proxy"), rồi
  `page.setInputFiles: Target crashed` khi chờ
  `locator('.mediabin input[type='file']')` (dòng 555) → exit 2. Đây đúng là
  chữ ký O8 WebKit FAIL đợt 142 mà T8-143 đã điều tra. Xảy ra trước mọi code
  ghi report — không phải do bản sửa này. T8-152 lưu ý: lượt O8 chính thức
  đợt 152 có thể gặp lại; driver đã có sẵn đường probe S1 + attempt2.
- **F-152-T0-2 — O8 WEBKIT ATTEMPT2 TIMEOUT CHỜ PROJECT MẪU TỰ LOAD:**
  attempt2: vite lên 05:43:07Z, WebKit launch 05:43:09Z, rồi im lặng tới
  timeout 05:47:18Z — `waitFor` ở dòng 369 (gọi từ `main` dòng 540) chờ mẫu
  tự load (3 clip, media bin 2 item) không bao giờ thỏa (`last=null`), 0 kết
  quả nào được ghi. Cùng thao tác S0 đã PASS ở attempt1 chỉ 15 s sau launch,
  nên đây là lần chạy trang lên nhưng mẫu không tự load — KHÔNG kết luận cơ
  chế (có thể renderer wedged họ H3, có thể race seeding mẫu; log không đủ
  phân biệt — không bịa). Cũng xảy ra trước mọi code ghi report.
- **F-152-T0-3 — KHÔNG PHẢI LỖI: 2 lần WebKit fail nhưng fix vẫn chứng minh
  được.** JSON lỗi vẫn là JSON đúng (ghi đúng verdict từng lần chạy, kèm
  `harnessError` đầy đủ). Đường ghi success-path của WebKit dùng chung hàm
  `writeReport()` đã chạy thật ở catch-path WebKit (2 lần) + main-path
  Chromium (21/21) — xem §6.

## 6. Giới hạn — đọc trước khi trích số

1. **Chưa có lần WebKit 21/21 nào chạy bằng script mới** — main-path
   `writeReport()` của bản WebKit chưa thực thi live (2 lần WebKit đều rẽ
   catch-path). Main-path Chromium đã thực thi (21/21) và catch-path WebKit
   đã thực thi (2 lần) — cùng một hàm, cùng 2 lệnh ghi; rủi ro còn lại ở
   điểm gọi main-path WebKit là tối thiểu (object literal khác mỗi trường
   `precheck`), nhưng ghi rõ để T10 không trích "WebKit main-path đã chạy".
   Không retry thêm để tránh tranh CPU với T8-152 (xem §0).
2. **2 lần WebKit fail đợt này KHÔNG phải verdict của đợt 152** — đây là chạy
   kiểm chứng fix của T0 trong scratch riêng, ngoài lượt O8 chính thức của
   T8-152. Chuỗi WebKit FULL PASS (9 sau đợt 151, chờ T10 xác nhận) KHÔNG bị
   2 lần fail này làm đứt — chỉ T8-152 mới phán chuỗi bằng lượt O8 chính thức.
3. **Không chạy tsc / vite build / npm test đầy đủ** — không chạm code TS hay
   code app; `node --check` + chạy thật 3 lần là kiểm chứng đúng phạm vi.
4. **Tên file không có đoạn `-attempt<N>` nếu driver không truyền env** —
   T8-152 copy driver 151 (không truyền `O8W_ATTEMPT`) sẽ được tên dạng
   `o8w-clicktest-report-<stamp>-<boot>-pid<PID>.json` — vẫn duy nhất mỗi lần
   chạy nhờ stamp (giây) + pid. Muốn có attempt trong tên thì thêm env như §2.
5. **Nếu 2 lần chạy khởi động cùng 1 giây trên cùng boot** (chỉ xảy ra khi
   chạy song song, driver chạy nối tiếp nên không): stamp trùng nhau nhưng pid
   khác nhau nên tên vẫn khác nhau — đã thiết kế, chưa cần kiểm live.
6. **Boot_id trong tên file là 8 ký tự đầu của `/proc/sys/kernel/random/boot_id`**
   (vd `18e179e0`), cùng quy ước ngắn T8 dùng trong LIMITS; nếu đọc boot_id
   lỗi (không phải Linux) thì fallback `noboot` — chưa kiểm live trên máy khác.

## 7. Nợ cho đợt sau / cần quyết parent

1. **T8-152 đọc report O8 theo lượt bằng glob** `o8w-clicktest-report-*.json`
   / `o8-clicktest-report-*.json` trong scratch đợt; file tên cố định chỉ còn
   là bản latest (lần mới nhất). T10-152 xác nhận độc lập bằng file theo lượt,
   không chỉ file cố định — nếu không, lỗi F-151-T10-2 có thể tái diễn ở tầng
   đọc (đọc nhầm latest thành attempt1).
2. **WebKit O8 flaky trong cửa sổ đợt 152** (F-152-T0-1/2): 2/2 lần chạy của
   T0 fail trước S2 — T8-152 theo dõi xem lượt chính thức có gặp lại không;
   nếu fail tiếp thì đây là pattern của đợt, không phải nhiễu lẻ.
3. **Vite-log Chromium vẫn ghi đè khi chạy 2 lần cùng scratch**
   (`o8-vite-attemptN.log` mode `"w"`, dòng 685 bản cũ) — ngoài phạm vi
   F-151-T10-2, chưa sửa; ai chạy Chromium 2 lần cùng scratch sẽ mất log vite
   lần 1 (log text driver vẫn giữ đủ). Ghi để đợt sau quyết có sửa không.
4. Mở từ trước, vẫn đứng (không đụng đợt này): G1 chờ user quyết;
   ci-security.yml 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 thử;
   file oversize 6,4 MB chưa quyết số phận; V19 đã nối vào
   `test_integration.sh` (T0-151 xong).

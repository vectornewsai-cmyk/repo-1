# PHASE9 ROUND87 O10 — EPERM: nối nốt 16 điểm ghi còn lại + probe sóng

> Luồng O10, đợt 87 vòng lặp Phase 9 VCut Studio (lượt cron 12:35 +07,
> 11/11/2026; làm việc ~12:45–~13:05 +07, tức 05:45–06:05Z). Nhiệm vụ:
> nối helper retry EPERM vào 126 writeFileSync còn lại theo N8 (đợt 86
> §4.6), theo đúng mẫu N8/M5. KHÔNG push, KHÔNG release/tag, KHÔNG
> binary, KHÔNG workflow, KHÔNG đụng TTS 39.

## 0. Kết quả headline

- **Đã nối helper vào 16 lần gọi ghi** (16 sync, 0 async) trong **13 file**:
  7 script phân tích r86n7 (N7, đợt 86) + 3 script WebKit loop/seek
  (N1/N3, đợt 86) + 1 clicktest N3 + 2 probe retry seek .ts (P2/O3, đợt
  32/33). Toàn bộ là mẫu an toàn 2 đối số, chỉ đổi tên callee + 1 dòng
  import (trừ clicktest đã import sẵn từ N3).
- **Số dòng `writeFileSync` code còn lại: 96 → 82.** Chênh lệch so với
  con số 126 của N8 được giải thích đầy đủ ở §2 (khác phương pháp đếm +
  file mới do các luồng đợt 86/87 thêm vào giữa hai lần đếm).
- **Không còn đường ghi async production nào chưa nối** (`fs.writeFile(`
  còn lại: 0 — ngoài helper nội bộ).
- **Test đều xanh:** helper gốc 22/22, port CJS server 8/8, port
  desktop 11/11; `node --check` 11/11 file .mjs đã nối; strip-types
  `--check` 2/2 file .ts đã nối.
- **Chạy thật qua đường đã nối:** `r86n7-verify3.mjs` exit 0, output
  md5 `0187bf604ea5533e5e5626c9a2a3c9ec` KHỚP đúng bản N7 ghi trước khi
  nối (6.447 byte, parse được); `seek-o3-retry-probe.ts` chạy đủ 120 s,
  exit 0, ghi 499 byte qua helper, parse được (file bằng chứng gốc
  01/11 đã khôi phục nguyên vẹn sau khi chạy — xem §4).
- **Sóng EPERM: KHÔNG gặp trong lượt này** (probe O10 #1–#2, 05:53–
  06:03Z, OK 2/2) — nhưng KHÔNG tuyên bố "đã hết hẳn" (xem §1). **Phát hiện
  mới: probe nền của N8 đã CHẾT sau #5** (03:19:38Z, không có dòng
  `probe end`) — lần thứ 3 liên tiếp probe nền chết không rõ lý do.
  Khoảng mù 03:19Z–05:53Z không có quan sát nào.
- **Không thêm i18n key nào** (không đụng UI/chuỗi hiển thị). Không chạy
  tsc toàn dự án: không sửa code TS production nào (chỉ 2 file .ts
  probe, đã verify bằng strip-types `--check` + chạy thật 120 s); các
  luồng đợt 87 khác đang sửa TS dở nên tsc lúc này sẽ lẫn lỗi của họ.

## 1. Sóng EPERM: probe O10 + bối cảnh

| Mốc (UTC 11/11) | Nguồn | Diễn biến |
|---|---|---|
| 01:21:56Z | Probe M5 #11 (đợt 85) | OK 2/2 — lần cuối trước khi probe CHẾT (không có dòng `probe end`); VM reboot ~02:03Z. |
| 02:39–03:19Z | Probe N8 #1–#5 (đợt 86) | OK 2/2 cả 5 lần. |
| 03:19:38Z | Probe N8 #5 | **Probe N8 DỪNG sau #5, không có dòng `probe end`** — đọc log lúc 05:52Z chỉ có 5 dòng probe + không có tiến trình probe nào còn sống. Đây là lần thứ 3 liên tiếp probe nền chết không rõ lý do (L6 sau #10, M5 sau #11, N8 sau #5). 11/16 lần đo dự kiến của N8 đã mất. |
| 03:19–05:53Z | — | **Khoảng mù, không có quan sát probe nào** (probe N8 chết + chưa có probe mới). |
| 05:53:34Z | Probe O10 #1 | OK 2/2 (5000 + 5000) |
| 06:03:35Z | Probe O10 #2 | OK 2/2 (5000 + 5000) |
| (tiếp) | Probe O10 | Chạy nền bằng setsid + nohup tới 16 lần (~08:33Z); đọc `hidden_files/round87-o10/eperm-probe.log`. |

**Kết luận: không gặp sóng trong lượt này (2/2 probe tới lúc kết sổ),
nhưng đây chỉ là "không gặp trong lúc đo".** Sóng đã tái phát 3 lần
sau các lần "đã hết" trước đây; khoảng mù 03:19Z–05:53Z không có quan
sát; và probe nền chết 3 lần liên tiếp cho thấy cơ chế chạy nền
(setsid + nohup từ phiên spawn) không đáng tin — cần luồng sau xem xét
cách chạy probe bền hơn (vd cron riêng, hoặc ghi probe vào log vòng
lặp chính), thay vì cứ spawn lại rồi mất dữ liệu.

## 2. Kiểm kê: đối chiếu con số 126 của N8

Đếm bằng rg, loại node_modules/dist/release/bundled-server/.venv*/
chrome-userdata/.eperm-probe* (phương pháp đếm code của O10; N8 đếm
rộng hơn — xem ghi chú dưới).

| Thư mục | Đầu lượt O10 (05:53Z) | Cuối lượt (06:00Z) | Đã nối |
|---|---|---|---|
| apps/web/scripts | 43 | 27 | 16 dòng (13 file, xem §3) |
| benchmarks/render | 7 | 3 | 4 dòng (3 file) — đã tính trong 16 trên |
| apps/desktop/src | 25 | 25 | 0 |
| server | 12 | 14 | 0 (+2 dòng mới của O6, xem dưới) |
| mcp-server/src | 1 | 1 | 0 |
| cli/src | 0 | 0 | 0 |
| apps/web/src | 5 | 5 | 0 |
| **Tổng code** | **96** | **82** | **16 dòng** |

Lưu ý: bảng trên gộp apps/web/scripts + benchmarks/render vào 16 dòng
đã nối (7 r86n7 + 3 webkit + 3 clicktest + 2 seek .ts + 1 webkit
loop-wait = 16; phân bổ chi tiết ở §3). Số "server 12 → 14" tăng do
file mới của luồng O6 xuất hiện giữa lượt (xem §4).

**Vì sao 126 (N8) ≠ 96 (O10 đầu lượt) — giải thích đầy đủ, không phải
nối thiếu:**

1. **Khác phương pháp đếm.** N8 đếm rộng: 126 = ~80 dòng code +
   ~30 dòng mẫu code trong `docs/*.md` + 10 dòng bản copy generated
   (`apps/desktop/release-round55-l4/...`) + 6 dòng trong file `.sh`.
   O10 đếm code thuần (96 dòng, không tính docs/release/.sh). Đếm lại
   theo phương pháp N8 lúc 05:53Z: 96 code + 47 docs + ~10 release +
   ~6 .sh ≈ 159 — cao hơn 126 của N8.
2. **File mới do các luồng khác thêm vào giữa 03:10Z (N8 đếm cuối) và
   05:53Z (O10 đếm đầu): +16 dòng code.** r87o7 (3), r87o3 (2),
   webkit_loop_d 86n1 (2), webkit_seek_heldframe2 86n3 (2),
   clicktest-86n3 (3), r86n7-verify2/verify3 (2, tạo sau lúc N8 đếm),
   test_r87_o6 (2, tạo trong lúc O10 làm việc). Đồng thời docs tăng
   30 → 47 dòng do các LIMITS mới của đợt 86/87 (mẫu code trong tài
   liệu, không phải code chạy).
3. **Hiệu số khớp:** 96 − 16 (đã nối) + 2 (O6 mới) = 82 cuối lượt. ✓

### Còn lại 82 dòng code — thành phần (đếm cuối lượt, liệt kê theo file)

- **Đang bị luồng đợt 87 khác sửa dở — BỎ QUA, để parent gộp sau: 7 dòng**
  - `benchmarks/render/bench_round87_o7_mask_track.cjs` (3 dòng):
    mtime 05:47:55Z, luồng O7 tạo/sửa trong lượt này.
  - `server/render/src/test_round87_o3_mask_track_geq.js` (2 dòng):
    mtime 05:51:53Z, luồng O3 sửa trong lượt này.
  - `server/render/test_r87_o6_mask_track_verify.js` (2 dòng, mới xuất
    hiện 05:54:46Z trong lúc O10 làm việc): CJS (`require("fs")`), luồng
    O6 đang sửa. Nối sau sẽ dùng port CJS
    `require("../eperm-retry.cjs")` (từ `server/render/`).
- **Helper nội bộ: 4 dòng** — chính `writeFileSync` bên trong
  `eperm-retry.mjs` (1) / `eperm-retry.cjs` (1) / `epermRetry.js` (1) +
  1 dòng comment nhắc tên trong `eperm-retry.mjs:8` (grep đếm vào,
  không phải code). Điểm gốc mà helper bọc lại, đương nhiên không tự
  nối vào chính nó.
- **Launcher sinh code con: 22 dòng** — 5 file `measure-*-launcher.mjs`
  (`fs.writeFileSync` nằm trong string/template sinh script con; nối
  vào sẽ làm code con gọi helper mà không import → gãy). Bỏ qua có lý
  do, như N8.
- **Test fake-fs / fixture cố tình: 22 dòng** — `server/eperm-retry.
  test.cjs` (4, fake fsImpl) + `test_round83_k8_eperm_retry.mjs` (4,
  fake fsImpl) + `epermRetry.test.cjs` (4, fake fsImpl) +
  `outputQA.js:216` (1, fixture cắt nửa file cố tình) +
  `gpuencode.js:422` (1, ghi "{json hỏng" cố tình trong self-test) +
  `test-qa-failpath.js` (2, fixture fail-path) +
  `freeze-dist.test.mjs` (6: 5 dòng ghi fixture tmp thật + 1 dòng
  trong template literal `MUTATOR` sinh script con — file có template
  nên loại cả file theo luật N8).
- **Test ghi fixture thật vào tmp (tiền lệ M5/N8: để lại, chạy lại
  được): 27 dòng** — `modelDownloader.test.cjs` (7),
  `electronOrphanCleanup.test.cjs` (4), `bundledRuntime.test.cjs` (3),
  `bridgePidfile.test.cjs` (2), `serviceManager.test.cjs` (1),
  `effectCanvas.parity.test.ts` (3), `gopTail45A4.test.ts` (2),
  `i18nDesktop61R6.test.ts` (2), `native-files.test.ts` (1),
  `migrateRender.test.ts` (1), `test-qa-integration.js` (1). Các file
  này ghi fixture vào thư mục tmp của test; EPERM ở đây chỉ làm test
  fail rõ ràng (không phải ghi lặng dữ liệu người dùng), và nối máy
  móc vào test là điều M5/N8 đã quyết không làm.
- **Ngoài đếm code (không đổi so với N8):** `docs/*.md` 47 dòng (mẫu
  code trong tài liệu), bản copy generated release-round55-l4 ~10 dòng,
  file `.sh` ~6 dòng (chuỗi text, không phải code JS).

### writeFile async còn lại: 0 dòng ngoài helper

`fs.writeFile(` còn lại: 0 (không tính `writeFile` bên trong chính
helper + fake-fs trong test). **Không còn đường ghi async production
nào chưa nối** — khớp kết luận của N8.

## 3. Đã nối: 16 lần gọi / 13 file

Phương pháp: script nối có assert (`/tmp/o10-wire.py`, logic theo N8
§3.1 — chỉ đổi tên callee + chèn 1 dòng import sau dòng `import fs`,
KHÔNG đổi logic/đường dẫn/thứ tự ghi), chạy dry-run trước rồi mới
apply; assert từng file (số lần gọi mới == số lần gọi cũ + số lần
dùng helper đã có; còn 0 `fs.writeFileSync(`; đúng 1 dòng import
helper; mtime không đổi giữa lúc đọc và lúc ghi). Bẫy bắt được ở
dry-run: 2 dòng nằm trong `try { ... } catch {}` một dòng
(`webkit_seek_heldframe2:294`, `clicktest-86n3:305`) làm regex kiểm
hình dạng cũ của N8 fail — đã sửa thành kiểm tra cân bằng ngoặc +
đếm đúng 2 đối số top-level trước khi apply.

| File | Điểm | Helper dùng | Ghi chú |
|---|---|---|---|
| `apps/web/scripts/r86n7-kernel-fit.mjs` | 1 (:273) | `./eperm-retry.mjs` | N7, mtime 03:20Z — đã xong từ đợt 86 |
| `apps/web/scripts/r86n7-phase-analyze.mjs` | 1 (:293) | `./eperm-retry.mjs` | N7, mtime 03:04Z |
| `apps/web/scripts/r86n7-scale-analyze.mjs` | 1 (:313) | `./eperm-retry.mjs` | N7, mtime 03:23Z |
| `apps/web/scripts/r86n7-verify.mjs` | 1 (:515) | `./eperm-retry.mjs` | N7, mtime 03:32Z |
| `apps/web/scripts/r86n7-verify2.mjs` | 1 (:262) | `./eperm-retry.mjs` | N7, mtime 03:38Z |
| `apps/web/scripts/r86n7-verify3.mjs` | 1 (:153) | `./eperm-retry.mjs` | N7, mtime 04:16Z; chạy thật lại, md5 khớp (§4) |
| `apps/web/scripts/r86n7-weights-analyze.mjs` | 1 (:473) | `./eperm-retry.mjs` | N7, mtime 02:55Z |
| `benchmarks/render/webkit_seek_heldframe2_86n3.mjs` | 2 (:288, :294) | `../../apps/web/scripts/eperm-retry.mjs` | N3, mtime 03:54Z; :294 trong `try/catch` |
| `benchmarks/render/webkit_loop_d_watchdog_86n1.mjs` | 1 (:126) | `../../apps/web/scripts/eperm-retry.mjs` | N1, mtime 04:04Z |
| `benchmarks/render/webkit_loop_d_wait_86n1.mjs` | 1 (:152) | `../../apps/web/scripts/eperm-retry.mjs` | N1, mtime 03:17Z |
| `apps/web/scripts/clicktest-86n3-seek-skip-render.mjs` | 3 (:298, :299, :305) | đã import sẵn từ N3 | N3, mtime 04:28Z; chỉ đổi tên callee, không thêm import; :305 trong `try/catch` |
| `apps/web/scripts/seek-p2-retry-probe.ts` | 1 (:94) | `./eperm-retry.mjs` | .ts, mtime 01/11; chạy bằng `node --experimental-strip-types` |
| `apps/web/scripts/seek-o3-retry-probe.ts` | 1 (:101) | `./eperm-retry.mjs` | .ts, mtime 01/11; chạy thật 120 s (§4) |

**Cơ chế import helper từ .ts đã kiểm chứng riêng trước khi nối**
(N8 để lại vì "cần kiểm riêng"): file smoke `.ts` tạm import
`./eperm-retry.mjs` và ghi thật qua helper dưới
`node --experimental-strip-types` → `{attempts:1, bytes:16}`, exit 0.
Sau nối, cả 2 file .ts qua `node --experimental-strip-types --check`
OK.

## 4. Kiểm chứng đã làm (số thật)

- **Test helper (không sửa helper, chỉ chạy lại):** gốc 22/22, port
  CJS server 8/8, port desktop 11/11 — ALL PASS, exit 0.
- **`node --check`: 11/11 file .mjs đã nối OK**; strip-types
  `--check`: 2/2 file .ts OK.
- **Chạy thật 1 script .mjs đã nối end-to-end:**
  `r86n7-verify3.mjs` (đọc 4 JSON đầu vào, ghi
  `r86n7-verify3.json` qua helper) → exit 0, 1,6 s; output md5
  `0187bf604ea5533e5e5626c9a2a3c9ec` **KHỚP ĐÚNG** bản N7 ghi lúc
  04:16Z bằng `fs.writeFileSync` (6.447 byte, JSON parse OK) — nối
  helper không đổi nội dung ghi.
- **Chạy thật 1 script .ts đã nối end-to-end:**
  `seek-o3-retry-probe.ts` (120 s, element giả, không cần browser) →
  exit 0; ghi `benchmarks/results/v32-o3-retry-longrun.json` 499 byte
  qua helper, JSON parse OK (14 key). **File bằng chứng gốc 01/11
  (501 byte, md5 `5fffc62f…`) đã được backup trước khi chạy và khôi
  phục nguyên vẹn sau khi verify** — không ghi đè bằng chứng cũ.
- **Quét file 0-byte cuối lượt:** không file dữ liệu nào 0 byte mới.
  Toàn bộ hit là placeholder third-party trong venv
  (`__init__.py`/`py.typed`/`.pxd`/`REQUESTED`/`.locks` — trạng thái
  bình thường, như M5 đã ghi).
- **Không chạy lại các script đã nối khác** (mỗi file đã qua
  `node --check` + helper đã qua fault-injection + 2 script chạy thật
  end-to-end). Các script đo chạy lại trong đợt sau sẽ tự chứng minh
  đường ghi đã nối khi chúng ghi kết quả.

## 5. Giới hạn trung thực / nợ mở

1. **EPERM KHÔNG được tuyên bố là đã hết.** Probe O10: 2/2 OK tới lúc
   kết sổ; probe N8 chết sau #5; khoảng mù 03:19Z–05:53Z không có quan
   sát. Probe nền vẫn chạy tới ~08:33Z — parent đọc log để có đủ 16 lần.
2. **Probe nền chết 3 lần liên tiếp** (L6 sau #10, M5 sau #11, N8 sau
   #5 — đều không có dòng `probe end`). Cơ chế spawn probe bằng
   setsid + nohup từ phiên subagent không bền; cần cách chạy bền hơn
   ở đợt sau (cron riêng hoặc gắn vào log vòng lặp chính) trước khi
   kết luận gì về sóng.
3. **Retry 5×20 s KHÔNG qua được sóng dài ~15 phút** (luật K8 giữ
   nguyên). Helper chỉ cứu sóng ngắn/lần fail lẻ.
4. **Chưa nối:** 82 dòng code còn lại (xem §2) — trong đó 7 dòng của
   3 file O7/O3/O6 đang bị luồng đợt 87 khác sửa dở (để parent gộp
   sau khi các luồng đó xong); còn lại là helper nội bộ, launcher sinh
   code con, fake-fs/fixture test, và test ghi fixture tmp (theo tiền
   lệ M5/N8). Không còn đường ghi production nào chưa nối ngoài 7 dòng
   O7/O3/O6 đang chờ gộp.
5. **Đồng bộ 3 bản helper** vẫn là việc tay (`.mjs` gốc, `.cjs`
   server, `.js` desktop) — không có test tự động bắt lệch hợp đồng.
   Luồng này KHÔNG sửa helper nên không thêm rủi ro lệch.
6. **Rủi ro va chạm luồng song song:** 8–10 luồng đợt 87 cùng sửa cây;
   script nối có kiểm tra mtime trước khi ghi (0 file bị skip vì lý do
   này trong nhóm đã nối) nhưng vẫn có cửa sổ đua nhỏ giữa lúc đọc và
   lúc ghi. File `test_r87_o6_mask_track_verify.js` xuất hiện giữa lúc
   O10 làm việc là bằng chứng các luồng khác vẫn đang thêm file.
   Parent ở closing nên kiểm tra lại các file chung nếu luồng khác báo
   xung đột.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. **Không thêm i18n key** — không cần bump test khóa số key.

## 6. File của đợt (stage, KHÔNG push)

- 13 file code đã nối (xem §3).
- Docs: `docs/PHASE9_ROUND87_O10_EPERM_WIRING_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round87-o10-eperm-wiring.txt`
(NUL-delimited; 14 entry — 13 file code + 1 LIMITS; verify bằng cách
đọc lại: mọi entry tồn tại và là text; mọi file < 37.768 byte nên
không vướng giới hạn push-files qua privsep).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round87-o10/`
(log luồng `../round87-o10.md`; `eperm-probe.log` + `probe-eperm.sh` —
probe nền vẫn chạy tới ~08:33Z).
Script nối: `/tmp/o10-wire.py` (không stage — công cụ một lần; logic
ghi trong LIMITS §3 để đợt sau tái dùng).

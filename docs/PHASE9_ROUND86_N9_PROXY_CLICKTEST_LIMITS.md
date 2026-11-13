# PHASE9_ROUND86_N9_PROXY_CLICKTEST_LIMITS.md — Proxy: click-test headed đường UI tự động (đợt 86 N9)

> Ngày: 2026-11-11. Luồng N9, đợt 86. KHÔNG push.
> Bối cảnh: L9 (đợt 84) thêm selector 480/720p + ghi chú mất file gốc nhưng
> chưa click-test headed; M8 (đợt 85) thêm tiến trình % + hàng đợi retry và
> click-test 16/16 trên Chromium (checkbox mặc định BẬT, badge, %, retry).
> Nợ còn lại giao cho N9: click-test headed đường UI mới — selector
> 480/720p đổi chiều cao thật, bật/tắt checkbox tự động, badge PROXY,
> ghi chú mất file gốc, thanh tiến trình %, verify proxy file thật trên
> đĩa, export dùng file gốc.

## 0. Đã làm gì

1. **Harness click-test headed mới**
   `apps/web/scripts/clicktest-86n9-proxy-clicktest-headed.mjs`
   (Xvfb :186 + Chromium headed + CDP Node thuần, mẫu M8; cổng riêng
   bridge 8841–8849 / vite 5540–5549 / debug 9640–9649; scratch ở
   `hidden_files/round86-n9/headed/`). 24 bước, 2 lần chạy (xem §1).
2. **KHÔNG sửa code sản phẩm.** Không phát hiện bug thật nào trong đợt
   này — mọi FAIL ở lần chạy 1 đều là lỗi harness, đã sửa harness rồi
   chạy lại. Không thêm i18n key (dict giữ 2507/2507).

## 1. Kiểm chứng thật (số đo lần này, VM 4 vCPU EPYC 9D25, đang chạy nhiều luồng đợt 86 khác)

| Kiểm chứng | Kết quả |
|---|---|
| Click-test headed Chromium, lần 1 | **16/23 pass** — 7 FAIL do harness (xem §2) |
| Click-test headed Chromium, lần 2 (sau sửa harness) | **24/24 pass, exit 0** |
| `proxyAuto.test.ts` (unit, hồi quy) | **46/46 pass, 0 fail** |
| `server/render/test_proxy_q8.js` (export dùng gốc, render-level) | **10/10 pass** |
| `r6-i18n-check.cjs` | **PASS**, vi=2507 en=2507 |
| `tsc --noEmit` (apps/web) | **exit 0** |
| WebKitGTK | **KHÔNG chạy được** — xem §3, không claim đã test |

Kết quả lần 2 (24 bước, report JSON tại
`hidden_files/round86-n9/headed/n9-clicktest-report.json`):

| Bước | Kết quả |
|---|---|
| S0 mẫu tự load (3 clip, media 2 item) | PASS — mau-1/mau-2.webm, file=true |
| N1 selector 480/720p mặc định 720 + checkbox BẬT | PASS — options [480,720], localStorage null lúc đầu |
| N1 đổi selector sang 480 (change event thật) | PASS — select=480, `vcut-auto-proxy-height=480` |
| N2 import clip C 1080p 12 s | PASS — thẻ xuất hiện, btn "Proxy 480p" |
| N2 % thật lúc tạo proxy 480p | PASS — **20 giá trị % khác nhau** trong (0,100) |
| N2 badge ✓ PROXY 480p | PASS |
| N2 store proxyUrl + proxyHeight 480 | PASS |
| N2 file proxy trên đĩa: ffprobe 854x480 | PASS — **250.443 byte, dur 12,0 s**, GET 200 |
| N3 bấm chuột thật TẮT checkbox | PASS — checked true→false, `vcut-auto-proxy=0`, CDP lần 2 |
| N3 import clip D khi auto TẮT | PASS — thẻ xuất hiện |
| N3 auto TẮT → không tự tạo sau 20 s | PASS — btn "Proxy 480p", progress rỗng, store proxyUrl null |
| N3 bấm lại BẬT checkbox | PASS — checked false→true, `vcut-auto-proxy=1`, CDP lần 1 |
| N4 ghi chú mất file gốc | PASS — mau-1.webm: "Không còn file gốc — không tạo được proxy. Import lại file gốc để tạo proxy; preview vẫn dùng bản đã lưu." |
| N5 thêm clip C lên timeline (CDP click lần 1) | PASS — clipCount 3→4 |
| N5 export dùng gốc: spec trỏ file gốc | PASS — src `n9-clip-c-1080p-12s.mp4`, proxyUrl vẫn gắn trên media |
| N5 preview dùng proxy: badge PROXY 480p | PASS |
| N5 preview fetch file proxy qua mạng | PASS — 3 request `/api/proxy/file/` |
| N6 guard checkbox BẬT trước import clip E | PASS |
| N6 đổi selector về 720p | PASS — select=720, `vcut-auto-proxy-height=720` |
| N6 import clip E | PASS — btn "Proxy 720p" |
| N6 % thật lúc tạo proxy 720p | PASS — **12 giá trị % khác nhau** trong (0,100) |
| N6 badge ✓ PROXY 720p | PASS |
| N6 file proxy trên đĩa: ffprobe 1280x720 | PASS — **206.045 byte, dur 8,0 s** |
| E0 không lỗi JS/unhandledrejection | PASS |

## 2. Lần chạy 1 — 7 FAIL đều do harness (đã sửa, chạy lại xanh)

1. **1 lần bấm chuột CDP vào checkbox trượt lặng.** Bấm ở đúng rect
   đo được (18.5, 190) nhưng `checked` không đổi, localStorage không
   ghi — không có lỗi, không có overlay che trong ảnh chụp. Hậu quả dây
   chuyền: clip D vẫn tự tạo proxy (auto thực ra còn BẬT) → N3 fail oan
   2 ca; lần bấm "bật lại" sau đó thực ra đã TẮT checkbox → N6 chờ badge
   720p suốt 4 phút trong khi auto đang TẮT → fail oan 3 ca.
2. **N4 không có ca mất file qua đường UI thường:** cả 2 media mẫu đều
   giữ `file=true` sau reload (sample load lại từ asset kèm File thật).
3. **Sửa harness (lần 2):** `toggleCheckboxTo` verify trạng thái sau mỗi
   lần bấm + thử lại tối đa 3 lần (thêm `mouseMoved` trước press),
   fallback JS `.click()` trên chính input thật khi cả 3 lần CDP đều
   trượt (ghi rõ khi dùng — lần 2 không cần fallback); N4 tạo đúng
   trạng thái mất file bằng `store.setState` qua store thật (zustand,
   gỡ `file` khỏi `mau-1.webm` trong phiên test); N6 thêm guard verify
   checkbox đang BẬT trước khi import clip E (fail nhanh thay vì chờ
   4 phút oan).

## 3. WebKitGTK: KHÔNG test được trong đợt này (ghi rõ, không claim)

- MiniBrowser không khởi động được: `libgstreamer-1.0.so.0` thiếu
  (cả `libwebkitgtk-6.0.so.4`, `libgtk-4.so.1`,
  `libjavascriptcoregtk-6.0.so.1`… — `ldd` liệt kê ~20 lib `not found`).
  VM lại mất dep apt sau lần M4 cài lại ở đợt 85 (cùng mẫu reboot rửa
  dep).
- Đã thử cài lại dep 2 lần (`playwright-core/cli.js install-deps
  webkit`, log `/tmp/round86-n9/webkit-install-deps*.log`): cả 2 lần
  fail ngay ở `apt-get update` vì apt lock đang bị tiến trình replay hệ
  thống giữ (pid 856 rồi 16238, `apt-get update` của os-intent replay,
  chạy từ 02:35 — không phải luồng round-86; không can thiệp/kill).
- Kết luận: **chỉ click-test trên Chromium headed**. Đường UI proxy đã
  chứng minh trên Chromium 24/24; WebKit vẫn là nợ mở — cần chạy lại
  install-deps khi apt lock hết, hoặc parent/user chạy tay.

## 4. Giới hạn trung thực

1. **N4 chứng minh nhánh UI "mất file gốc" bằng trạng thái tạo qua
   `store.setState`, không phải bằng đường user thật** (import → mất
   file → reload). Mẫu giữ File sau reload nên đường user thật không tái
   hiện được ca này trên VM này; nhánh code thì đã render đúng khi state
   xảy ra (ghi chú đầy đủ + nút Proxy ẩn vì `!item.file`).
2. **N5 chứng minh export dùng gốc ở mức spec** (clip timeline trỏ file
   gốc) + render-level `test_proxy_q8.js` 10/10; không chạy export thật
   end-to-end qua UI trong đợt này (nặng, Q8 đã bao phủ mức render).
3. **Lần bấm CDP đầu vào checkbox trượt lặng 2/2 lần chạy** (lần 1 và
   lần 2 đều cần lần thử 2 mới trúng) — harness đã có verify+retry nên
   không còn fail oan; nguyên nhân gốc của cú trượt đầu chưa rõ (không
   có overlay che trong ảnh chụp; có thể do hit-test ngay sau re-render
   của MediaBin). Các bước khác (nút "Thêm", badge, import) không gặp
   hiện tượng này.
4. **Số thời gian theo tải VM.** Encode 12 s ≈ 17–21 s; 8 s ≈ 20–23 s.
   Không suy ra số tuyệt đối cho máy user.
5. **Dict i18n 2507 không đổi.** N9 không thêm key, không cần bump test
   khóa số key. Không kiểm lại TTS 39 (theo lệnh luồng).
6. **Local `~/workspace/repo-1` không có `.git`** nên HEAD 5f548ef8 ghi
   theo parent (không verify được bằng `git rev-parse` tại chỗ).

## 5. File đổi (stage, KHÔNG push)

- `apps/web/scripts/clicktest-86n9-proxy-clicktest-headed.mjs` — harness mới.
- `docs/PHASE9_ROUND86_N9_PROXY_CLICKTEST_LIMITS.md` — file này.

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round86-n9-proxy-clicktest.txt`
(2 entry, verify read-back OK).

## 6. Nợ còn lại

- Click-test đường UI proxy trên WebKitGTK (chờ apt lock hết → cài lại
  dep → chạy lại harness; hoặc chạy tay).
- N4 qua đường user thật (cần 1 media mất file sau reload/rehydrate —
  chưa tái hiện được trên VM này vì sample giữ File).
- Export thật end-to-end qua UI với clip đã có proxy (mức spec +
  render-level Q8 đã xanh; export UI thật chưa chạy trong đợt này).
- Cú bấm CDP đầu vào checkbox trượt lặng: nguyên nhân gốc chưa rõ
  (harness đã có guard, không còn fail oan).

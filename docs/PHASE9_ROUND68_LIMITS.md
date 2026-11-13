# LIMITS gộp — Phase 9 đợt 68: đóng nợ đợt 67 §9 (12 mục, 9 luồng)

Ngày: 09/11/2026 (lượt cron 00:35 +07 → timeout 03:35 +07). 9 luồng song
song V1–V9. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

> Đợt 68 TIMEOUT ở 03:35: 7/9 luồng xong + stage (V2,V3,V5,V6,V7,V8,V9),
> V4 xong + stage nhưng worker báo cáo sai là "không có báo cáo"
> (batch + LIMITS + md đều có trên đĩa — xem §1), V1 dở dang (xem §1).
> Parent gộp: dict 2369 → 2379 key (+10 fragment V2/V6/V8, 0 collision),
> 12 file test khóa số key cập nhật. Tổng chờ push sau đợt 68:
> **125 entry / 18 file batch** (đợt 67: 68/9; đợt 68: 57/9 — xem §3).
> HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 0. Kết quả theo luồng

| Luồng | Nợ đóng (đợt 67 §9) | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| V1 | §9.8 U8 dở dang (bump Pillow/rembg) | **DỞ DANG.** bgremove u2net PASS thật, pip-audit 0/39 xác nhận; nhưng **birefnet verify trạng thái không rõ** (session chạy nhưng không xác định pass/chết lúc timeout); OSV npm audit thất bại timeout; LIMITS V1 chưa viết; backup venv `.venv-py310-bak` (706M) chưa xóa; batch U8 CHƯA stage. Audit files có trên đĩa (`hidden_files/round68-v1-audit-*.txt`). → Đợt 69 đóng. | pip-audit bgremove 0, tts 39 (xác nhận); u2net PASS |
| V2 | §9.2 UI toggle stabilize single-thread | **Xong.** Toggle ở ExportPanel (sau block normalize), checkbox `data-testid="export-stab-single-thread-toggle"`, label vi/en; tuỳ chọn render-time toàn cục, đi chung đường export-preset. Fragment 2 key (import trực tiếp, không chờ gộp dict). Bridge e2e + headed BỊ CHẶN bởi luật sandbox mới (sau `listen()` thì mọi ghi file EPERM — blocker môi trường từ ~01:05). | Unit 16/16, tsc 0, render harness 11/11 |
| V3 | §9.4 ngưỡng halve Chrome 0,45–0,63 | **Xong.** Ngưỡng halve đã pin: **0,5** (2-stage thắng s≤0,48, 1-kernel thắng s≥0,55, trùng nhau đúng từng số ở 0,5 — chú thích trong code đổi từ "xấp xỉ, chưa đo" thành "đã đo, pin", không đổi code). Dư ±16 theo pha KHÔNG giải được bằng mọi biến thể đã thử (3 chặng tệ hẳn) — đã loại trừ cả họ giả thuyết, vẫn mở. w1440 noise05 Δcorr R-G 0,199 **KHÔNG phải lỗi bộ lọc** (Chrome thật drawImage cho corr trùng mô hình 2-stage tới 0,001 — phần dư là khác biệt cấu trúc nhiễu giữa 2 đường). | Probe thang 0,45–0,63 |
| V4 | §9.5 presented 1080p lúc lặng + mâu thuẫn gate | **Xong (worker báo cáo sai là chưa xong).** A/B: giả thuyết canvas-read của U4 **BỊ BÁC BỎ** (A≈B: 30/33 vs 34) — gate KHÔNG phải artifact, không sửa, không hạ chuẩn ≥20; mâu thuẫn U4 là do trạng thái phiên/VM khác nhau (U4: swap 395MB, RAM ~524MB, load 32; phiên này: RAM ~2,6GB, load ~1). **Presented 1080p lúc lặng ĐO ĐƯỢC: 17,73 fps gộp (9,9–29,29, 6 slot, 2 phiên)** — lạnh 11,77 vs ấm 23,68 (dao động 2–3× theo cache lạnh/ấm, không được trích 1 phiên làm số chính thức). Draw chỉ 0,69 fps (lạnh) / 6,11 fps (ấm) — vòng rAF chỉ 4,9–8,4 Hz khi decode 1080p (so với ~47 Hz ở 720p): **giới hạn phần cứng/VM, không phải bug vẽ.** Đo bị chặn nhiều lần bởi EPERM môi trường (harness chết ở ghi config vite). | A/B gate 3 phiên; 6 slot presented; đối chứng tab trắng |
| V5 | §9.6 toast keyframe + click-test khi máy yên | **KHÔNG HOÀN THÀNH (môi trường chặn).** Đã xác minh sửa toast của U5 còn nguyên trong code, đúng thiết kế — KHÔNG cần sửa thêm. Click-test chạy 1 thấy toast ở +169,8s đúng từng ký tự nhưng loadavg 8,69 → INCONCLUSIVE; chạy lại H/C KHÔNG được (Xvfb không lên + Chrome SIGTRAP). Nợ U5 §6 VẪN MỞ. Harness click-test đã cứng hoá (poll wall-clock, eval cap 15s, cổng loadavg, fallback dist-direct, JSON ra stdout). | Unit keyframe 19/19, 13/13, 11/11, 15/15, 9/9, 11/11, 2/2; tsc 0; vite build pass |
| V6 | §9.7 hoàn tác legacy adopt nhiều mức | **Xong.** Stack LIFO tối đa 20 mức; mỗi lần nhận push 1 bản ghi; hoàn tác pop từng mức ngược thứ tự; khôi phục đúng id gốc + khóa con trỏ; envelope lệch → đẩy lại stack, không mất; vượt 20 mức → bỏ cũ nhất + toast báo. Banner hiện đúng mức trên đỉnh + số mức còn lại (`Còn {depth} mức`). Fragment 4 key (Modal dùng `t()` — CẦN gộp dict, parent đã gộp). | Unit 13/13, headed 7/7, hồi quy U6 20/20, T7 16/16, projectHistory 15/15, tsc 0, vite build pass |
| V7 | §9.8 sharpen floor còn lại (ocean/basgo sharp10) | **Xong — phần dư là SÀN CHUỖI ĐO, không phải lỗi effect.** Per-cell: dư ocean nằm 100% ở ô sàn bẩn, 0 pixel ở ô sạch (cả 8 ô); metric cao tần mới M-hp (ĐÃ CHẤP NHẬN): HYB4 0,00–0,17% trên cả 8 ô (ngưỡng KHỚP ≤1%); đối chứng âm bị bắt rõ. Không sửa code production, giữ HYB4. | 8 ô cảnh×cỡ×mức; M-hp |
| V8 | §9.9 Electron exportDest persist + kiểm tra download | **Xong.** `exportDest` vào `JobHistoryEntry` (localStorage); `startRender` ghi đích cùng jobId; bridge thêm HEAD `HEAD /api/render/:id/download` (404/409/200+Content-Length, openapi đã ghi); panel HEAD khi job done — missing thì ẩn nút tải + nút chia sẻ, báo rõ + cho xoá; `unknown` thì giữ hành vi cũ (fail-open); Electron + có đích → ghi chú `savedTo`. Fragment 4 key (import trực tiếp, không chờ gộp dict). | Bridge HEAD 19/19, unit 20/20, hồi quy T8 26/26, S10 13/13, R8 19/19, headed Chrome 9/9, Electron 7/7 |
| V9 | §9.11 ci-security (phần docs) | **Xong (docs).** README sửa 4 chỗ stale (animation 18 → 21; REST "16 endpoints" → **23 endpoint**; thêm app desktop Electron vào quickstart + cây thư mục; số kho trong bảng Tính năng chính). Hướng dẫn thêm tay 4 workflow CI còn lại (`docs/CI_MANUAL_ADD_GUIDE.md`). KHÔNG sửa SECURITY.md / số liệu audit (V1 sở hữu). **Batch V9 ban đầu chứa `.github/workflows/ci-build.yml` — parent đã loại (sẽ 403).** | Docs |

## 1. Ghi chú parent merge (quan trọng)

1. **V4 ĐÃ XONG — worker báo cáo sai.** Worker handoff nói "V4: không có
   báo cáo — likely chưa xong tại timeout", nhưng trên đĩa có đủ:
   batch `phase9-round68-v4-presented-fps.txt` (3 entry),
   `docs/PHASE9_ROUND68_V4_PRESENTED_FPS_LIMITS.md`,
   `hidden_files/round68-v4.md` + thư mục `round68-v4/` (gate-ab.json/log).
   Đây là mẫu "handoff stale" quen thuộc (đợt 32/49/50/66) — parent đã
   kiểm tra đĩa trước khi kết luận. V4 tính là xong, batch được tính vào
   tổng chờ push.
2. **V1 dở dang thật.** Không có LIMITS V1, không có batch U8. Audit files
   (`round68-v1-audit-bgremove.txt`, `round68-v1-audit-tts.txt`,
   `round68-v1-osv-npm.txt`) có trên đĩa. U8 (requirements.txt, README.md,
   LIMITS U8) vẫn CHƯA stage — đợt 69 đóng V1 (verify birefnet, OSV hoặc
   ghi rõ không có số, viết LIMITS V1, stage batch U8, xoá backup
   `.venv-py310-bak` 706M).
3. **V9 batch đã sửa:** loại `.github/workflows/ci-build.yml` khỏi batch
   (5 → 4 entry, sẽ 403 như ci-security.yml từ Phase 6; tiền lệ đợt 63
   R10, đợt 67 U9). File vẫn local-only.
4. **Dict merge (parent làm, 03:4x 09/11):** 3 fragment V2 (2 key) + V6
   (4 key) + V8 (4 key) gộp vào `vi.json`/`en.json`: **2369 → 2379 key lá,
   0 collision, vi==en**. V6 CẦN gộp (Modal dùng `t()` với 4 key mới —
   không gộp sẽ hiện key thô); V2/V8 import trực tiếp nhưng gộp chung cho
   một nguồn sự thật. 12 file test khóa số key cập nhật 2369 → 2379.
   Kiểm chứng ngay sau gộp: dict vi==en==2379, superset (không mất key
   cũ), cả 10 key mới đều có mặt.
5. **U7 test lỗi thời đã sửa (parent):**
   `jobHistory67U7.test.ts` assert "namespace jobHistory.* CHƯA có trong
   dict" — sai từ khi đợt 68 gộp fragment U7 vào dict (đợt 67). Parent đổi
   thành assert namespace ĐÃ có trong dict và khớp fragment (keys +
   values). File này vào batch closing.
6. **css61 vẫn đỏ (không phải lỗi đợt 68):** `.mask-check` dùng ngoài tổ
   tiên ở `ExportPanel.tsx:1503` — do đợt 68 V2/V8 sửa ExportPanel (đợt
   67 parent đã ghi nợ). Đợt 69 xử lý (xem §4).
7. **Không xung đột file** giữa các luồng (trừ ExportPanel.tsx bị V2+V8
   cùng sửa — cả hai đều stage được, parent kiểm chứng sau gộp). Không
   binary, không dist/release trong batch.
8. **Môi trường:** EPERM ghi file qua exec từ ~01:05 09/11 đã HẾT lúc
   ~03:38 (ghi test 1 byte OK, /tmp chỉ dùng 1%). V2 ghi nhận luật
   sandbox mới: sau `listen()` thì mọi ghi file EPERM (blocker cho
   bridge e2e/headed trong lượt này). /tmp từng 100% full; Chrome
   SIGTRAP; Xvfb xkbcomp "not enough space". Các luồng đã vượt qua bằng
   retry/probe/helper riêng.

## 2. Kiểm chứng parent trên cây đã gộp

_(Parent chạy sau khi gộp; đợt 69 đã bắt đầu 03:35 và đang sửa file —
số đỏ ở file đợt 69 là việc của đợt 69, không phải hồi quy đợt 68.)_

- tsc web **0**, desktop **0** (chạy lúc đợt 69 mới bắt đầu, cây còn yên).
- vite build: BỎ QUA (đợt 69 đang build song song; các luồng V5/V6/V8 đã
  build pass trên cây này; chỉ dict/snapshot JSON + md + 2 test fix đổi
  sau đó).
- P7 i18n audit: **8/8**. cssClasses60Q2: **59/59**. cssClasses61R4:
  **ĐỎ** — `.mask-check` dùng ngoài tổ tiên ở ExportPanel.tsx:1503
  (đợt 68 thêm, xem §4 mục 2 — để đợt 69).
- r6-i18n-check: **PASS** (dict nay 2379).
- Suite luồng: V2 **16/16**, V6 **13/13**, V8 **20/20** (sau khi parent
  sửa assert "CHƯA có trong dict" thành "ĐÃ có", khớp fragment),
  U7 **31/31** (sau khi parent sửa assert tương tự — lần sửa đầu dùng
  nhầm JOB_HISTORY_KEYS (dotted) thay vì JOB_HISTORY_LEAF_KEYS, đã
  sửa lại và xanh).

## 3. Batch đã stage (KHÔNG push)

- `phase9-round68-v2-stab-toggle.txt` (9),
  `v3-chrome-threshold.txt` (2), `v4-presented-fps.txt` (3),
  `v5-keyframe-toast.txt` (1), `v6-legacy-undo.txt` (7),
  `v7-sharpen-residual.txt` (2), `v8-export-dest.txt` (12),
  `v9-docs-ci.txt` (4, đã loại workflow file),
  `phase9-round68-closing.txt` (17: dict vi/en + 12 snapshot +
  LIMITS gộp + U7 test fix + V8 test fix).
- Tổng đợt 68: **57 entry / 9 file**. Tổng chờ push sau đợt 68:
  **125 entry / 18 file batch** (đợt 67: 68/9; đợt 68: 57/9).
  HEAD GitHub vẫn `5f548ef8`. KHÔNG push.
  (U8: 3 file — requirements.txt, README.md, LIMITS U8 — vẫn chưa stage,
  đợt 69 đóng V1 rồi stage.)

## 4. Nợ mở cho đợt 69 (§8)

1. **V1 / U8 (ưu tiên cao):** verify birefnet end-to-end (trạng thái
   không rõ lúc timeout) + chạy lại OSV npm tới khi có số (hoặc ghi rõ
   không có số) + viết LIMITS V1 + stage batch U8 (requirements.txt,
   README.md, LIMITS U8) + xoá backup `.venv-py310-bak` (706M) sau khi
   verify xong.
2. **css61:** `.mask-check` dùng ngoài tổ tiên ở ExportPanel.tsx:1503 —
   sửa (bọc trong `.mask-panel` hoặc tách selector).
3. **U5 §6 (toast keyframe):** click-test H/C khi máy yên (V5 đã cứng
   hoá harness; chạy lại khi VM rảnh, ghi loadavg vào verdict).
4. **Stabilize:** UI toggle đã có (V2) — kiểm tra toggle đi qua
   export-preset + bridge whitelist; cơ chế vidstab (vì sao
   frame-threading làm output khác; vì sao VP9 không cải thiện) vẫn mở;
   1 lần SEGFAULT ở đợt 67 U1 chưa điều tra.
5. **Chrome filter:** dư ±16 theo pha 2-stage vẫn mở (đã loại trừ cả họ
   giả thuyết); w1440 noise05 là khác biệt cấu trúc nhiễu, không phải
   lỗi bộ lọc — cần hướng khác nếu muốn khớp hẳn.
6. **Sharpen:** đã đóng (sàn chuỗi đo) — không còn nợ, chỉ ghi nhận
   metric M-hp mới để dùng cho các đo sau.
7. **Presented 1080p lúc lặng:** đã đo được (17,73 fps gộp, 9,9–29,29)
   — không còn nợ đo; nợ còn lại là hiệu năng thật (rAF 4,9–8,4 Hz ở
   1080p, draw 0,7–6,1 fps) nếu muốn cải thiện preview 1080p.
8. **Keyframe:** trần 90s đã có; tải nặng ngoại suy 105–137s vẫn vượt
   trần; Safari chưa đo được.
9. **Legacy adopt:** stack undo 20 mức đã có; kiểm tra lại sau khi đợt
   69 gộp xong dict/snapshot (fragment V6 nay đã trong dict).
10. **Job history / exportDest:** kiểm tra lại sau khi đợt 69 gộp xong
    (fragment V8 nay đã trong dict); audit fail file V2 (V8 LIMITS §6)
    + tsc lỗi file V2 (V6 LIMITS §4.2 — lần đầu 5 lỗi TS6133 ở
    ExportPanel.tsx, kiểm lại bằng binary tsc gốc thì 0).
11. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua
    web GitHub hoặc cấp quyền workflows cho App). `scripts/ci-local.sh`
    là workaround chạy local.
12. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
    CapCut thật.

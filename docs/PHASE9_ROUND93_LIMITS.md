# Phase 9 — Đợt 93: Đóng nợ LIMITS gộp đợt 92 §4 (rVFC, flip-flop, stall, fail-fast, i18n, G1, EPERM)

> Ngày: 12/11/2026. Lượt cron 06:35 +07. 9 luồng U1–U9 spawn song song; **7 luồng U2–U8 về đủ** (LIMITS + log + batch stage). **U1 (rVFC pump/scheduling) CHƯA XONG** — log `hidden_files/round93-u1.md` ghi "đang làm", không LIMITS, không batch; **U9 (kiểm chứng độc lập) KHÔNG CHẠY** — chờ script nền poll đĩa tối đa 120 phút cho U1 nên không về. Parent gộp 7 luồng đã xong; U1 + U9 là nợ cho đợt 94. KHÔNG push. HEAD vẫn 5f548ef8.

## 1. Kết quả từng luồng

### U2 — Flip-flop src, đo đối chứng sau fix T1 (nợ §4 mục 2: ĐÃ ĐO XONG)
- **Flip-flop trong app thật: 0.** 10/10 run app, số lần đổi kind = 0 (trước fix: 22 lần đổi kind/run, 23 lần gán src/run, play() 15 lần).
- Blob-load flaky **42% không giảm** (trước fix 15/20 = 75% loop blob vs 20/20 prog; nay loop blob 12/12? — xem LIMITS U2 §4: tải lượt này nặng hơn nên không kết luận "latch làm tệ hơn", nhưng không có bằng chứng latch gây tệ).
- Kết luận đứng được: fix T1 khóa flip-flop đúng; blob-load flaky là vấn đề riêng, không do latch.

### U3 — Canvas stall, bằng chứng ngoài đời (nợ §4 mục 3: ĐÃ BẮT ĐƯỢC)
- **Bắt được stall >1500 ms ngoài đời — trần giữ đúng:** 8 stall 1,6–3,9 s, playhead đứng yên Δ=0,000 trong mọi stall; lag dư nay khẳng định lại kết luận T3 §1.1 với số lớn hơn.
- **Phát hiện mới (§5): trần chỉ bảo vệ stall ĐẦU TIÊN sau mỗi lần seek hoàn tất** — stall sau đó (không có seek mới) không được giữ. Nợ cho đợt 94.
- rVFC WebKitGTK **0 callback** (phát sạch 20 s, trình 81 frame, vẫn 0 callback) — khẳng định lại kết luận T3: rVFC không bao giờ bắn callback trên WebKitGTK dù supported=true.

### U4 — Fail-fast: đo tiết kiệm + thứ tự lỗi + clip dài / dry-run (nợ §4 mục 4: ĐÃ ĐÓNG)
- **Test đo mới 141/141** (2 lần chạy đầy đủ); T4 chạy lại 32/32; S4 60/60; P1 30/30; tsc web 0; vite build pass (6,00s).
- Tiết kiệm stabilize: **51–78 s ở clip 60 s** (vidstabdetect bước 3b không chạy khi cổng fail fast chặn trước).
- Thứ tự lỗi đổi đúng như T4 §4 mục 3 dự báo: trước đây lỗi bước sau (3b) báo trước vì cổng nằm ở bước 6; nay cổng (ngay sau validate) báo trước. Cùng exit 1, cùng không MP4. **Đổi có chủ ý** (fail fast cấu trúc trước), không phải hồi quy.
- Baseline lấy từ bản sao tạm `~/workspace/tmp-u4-old/server/render/` (copy toàn bộ `server/render` + `server/eperm-retry.cjs`), chỉ khác production đúng 1 dòng: lệnh gọi cổng sớm trong `main()` (dòng 1596) đã comment. Bản sao đã xóa sau khi đo xong; tái tạo lại bằng đúng cách trên — parent đã tái tạo và chạy lại 141/141 (xem §2).

### U5 — i18n nhãn sticker ở data layer + khối checkI18n StickerPanel (nợ §4 mục 5: ĐÃ ĐÓNG)
- Nhãn sticker trong `packages/video-spec/src/sticker.ts` không còn hardcode tiếng Việt ở UI nữa: mỗi entry của `STICKER_CATEGORIES` (5) và `STICKER_LIBRARY` (244) nay mang thêm `labelKey` (`sticker.cat.*` / `sticker.item.*`); `StickerPanel` dịch qua `t(labelKey)`, locale EN hiện tên tiếng Anh thật. Trường `label` giữ nguyên là nhãn tiếng Việt gốc — fallback khi thiếu key + tìm kiếm gõ tiếng Việt ở locale EN.
- **Dict 2518 → 2767 key lá mỗi bên** (+249 key: 5 `sticker.cat.*` + 244 `sticker.item.*`); vi == en, cùng tập key, 0 key mồ côi, 0 giá trị rỗng. Pin đếm key đã bump 2518 → 2767 ở toàn bộ 17 file test pin số key + 6 file chuỗi thành phần.
- Thêm khối `checkI18n` cho `StickerPanel.tsx` vào css60 §8 — css60 **59 → 60 check, xanh 60/60**.

### U6 — G1 evidence v5 (nợ §4 mục 6: SỐ CHO PARENT/USER QUYẾT — G1 VẪN MỞ)
- **60fps: 5/5 lần U6 mới đều PASS** (1,01 / 0,96 / 0,82 / 0,93 / 0,83) → pool 60fps nay n=22: median 0,960×, PASS 20/22 (91%).
- **30fps: 2/3 lần U6 mới PASS** (1,14 / 1,33) + 1 FAIL 0,67× → pool 30fps nay n=35: median ~0,935, PASS 28/35 (80%).
- Nhánh regex EADDRINUSE kích hoạt qua harness thật (xem LIMITS U6). **G1 vẫn CHƯA ĐÓNG — U6 chỉ đưa số + khuyến nghị, quyết thuộc parent/user.**

### U7 — Harness O8/Q5 (nợ §4 mục 12: ĐÃ XONG)
- Sửa nhãn kỳ vọng S7 (lẫn hệ tọa độ — T9 so nhầm, đã sửa); seek GOP 30/60/250: **35/36**; quyết định KHÔNG sửa `seek.test.ts` (căn cứ bằng số đo).
- **Bẫy probe v1 — đã bắt được và sửa trước khi kết luận** (ghi rõ trong LIMITS U7 để khỏi ai mở lại).

### U8 — EPERM probe #12 (nợ §4 mục 8: ĐÃ LÀM)
- `once` ngay sau reboot là **probe #12, boot 88ebef2e (ĐỔI), ok=2 fail=0**, exit 0.
- Khoảng mù **#11 ~182 phút**; reboot **#12 23:33:21Z** (09e8d2af → 88ebef2e) — mới, KHÔNG ai ghi nhận. Không thể kết luận "không có sóng", chỉ kết luận "không thấy".
- Quét writeFileSync: **206 dòng** (source 96 + docs 110). RAM khả dụng lúc đo 1,1 GB.

## 2. Ghi chú gộp parent

- **U1 chưa xong (nợ thật, không phải báo cáo sai):** log `round93-u1.md` ("đang làm") ghi việc đã làm: phân tích offline số T2 (dup callback ~25–33%, coverage thực ~85–92%); instrumentation mới trong `preview.tsx` (marker "Đợt 93 U1", `window.__vcutRvfcPump`, `rvfcCaptureFrame` đổi boolean → decision string); harness mới `apps/web/scripts/probe93u1-rvfc-pump.cdp.mjs`; parity feather lớn + invert XONG (MAD=0 trên 240.672 px). Đo pump chưa có baseline sạch (cả 2 chạy đều đo VM đói CPU, loadavg 10–11). **Không LIMITS, không batch — parent KHÔNG stage phần việc dở dang này**; instrumentation + harness nằm trên đĩa, đợt 94 nối tiếp. U1 là nợ ưu tiên đợt 94.
- **U9 không chạy:** U9 chờ script nền poll đĩa tối đa 120 phút cho U1 nên không về; không log, không LIMITS, không batch. Parent tự kiểm chứng thay U9 (xem §3). U9 là nợ cho đợt 94 (kiểm chứng độc lập lại U1–U8 khi U1 về).
- **r6 FAIL 249 lỗi — parent sửa ở closing (không phải hồi quy):** U5 thêm 249 key `sticker.cat.*`/`sticker.item.*` dùng qua `labelKey` trong data layer (`packages/video-spec/src/sticker.ts`, ngoài cây quét `apps/web/src` của r6) và `StickerPanel` dịch bằng `i18nT(entry.labelKey)` — key không xuất hiện literal trong src nên r6 báo thừa. Parent thêm `"sticker.cat."`, `"sticker.item."` vào `dynamicPrefixes` trong `apps/web/scripts/r6-i18n-check.cjs` (theo đúng tiền lệ `scene.phase.` của parent gộp đợt 65 trong cùng file) + cập nhật comment luật 3. Mức dùng đã khóa ở chỗ khác: orphans 17/17 (quét labelKey) + css60 §8 khối checkI18n StickerPanel (60/60). Chạy lại r6: **PASS**.
- **U4 test không chạy lại được lúc đầu — parent tái tạo fixture theo đúng cách U4 ghi:** test cần bản sao cũ `~/workspace/tmp-u4-old/server/render/src/render.js` (U4 đã xóa sau khi đo xong). Parent copy lại toàn bộ `server/render` (11 MB) + `server/eperm-retry.cjs`, comment đúng 1 dòng gọi cổng sớm trong `main()` (dòng 1596) trong bản sao; `diff` xác nhận chỉ khác đúng dòng đó (+1 dòng comment giải thích). Chạy lại: **141/141**. Fixture `~/workspace/tmp-u4-old/` để lại trên đĩa cho lượt sau (không đưa vào batch — chỉ là bản sao tạm, không phải code sản phẩm).
- Worker báo "tổng 43 entry / 7 file" — đúng cho 7 luồng; cộng closing 3 entry (LIMITS gộp + gap §22 + `r6-i18n-check.cjs` parent sửa) thành đợt 93: 46 entry / 8 file.

## 3. Kiểm chứng parent (cây đã gộp)

- tsc web 0, desktop 0; vite build PASS (6,29s); r6-i18n-check PASS (sau sửa dynamicPrefixes ở closing); P7 8/8; orphans 17/17 (tăng từ 16/16 do U5 thêm check); css60 60/60 (tăng từ 59/59 do U5 thêm khối StickerPanel); css61 60/60.
- U4 test đo mới chạy lại: **141/141** (sau tái tạo fixture bản sao cũ theo đúng cách U4 ghi; diff 1 dòng).
- Không chạy lại: U2/U3/U6/U7/U8 harness đầy đủ (tin LIMITS từng luồng + số đo JSON trên đĩa); click-test O8 headed (U7 đã chạy trong lượt).

## 4. Nợ mở cho đợt 94

1. U1 rVFC pump/scheduling CHƯA XONG (instrumentation + harness đã có trên đĩa, đo pump chưa có baseline sạch) — nợ ưu tiên.
2. U9 kiểm chứng độc lập U1–U8 chưa chạy (chờ U1 về).
3. Trần stall chỉ bảo vệ stall ĐẦU TIÊN sau mỗi lần seek hoàn tất (U3 §5) — stall sau đó không được giữ.
4. G1 đóng hay chưa — parent/user quyết (U6: 60fps n=22 median 0,960 PASS 20/22 = 91%; 30fps n=35 PASS 28/35 = 80%).
5. Birefnet-general trong gói: chỉ thử lại khi RAM đổi (quyết định parent đợt 92) — vẫn 0 lần chạy thành công.
6. EPERM: probe #12 ok=2 fail=0; khoảng mù #11 ~182 phút, reboot #12 không ai ghi nhận; cron riêng 10 phút vẫn chờ user quyết.
7. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
8. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
9. Flip-flop: blob-load flaky 42% không giảm sau fix T1 — vấn đề riêng, không do latch.
10. rVFC WebKitGTK 0 callback dù supported=true (U3 khẳng định lại) — chưa có hướng xử lý.
11. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 93: 7 luồng, **43 entry / 7 file** (U2 5, U3 4, U4 2, U5 24, U6 2, U7 5, U8 1).
- Closing đợt 93: 3 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §22 + `apps/web/scripts/r6-i18n-check.cjs` — parent sửa dynamicPrefixes sticker).
- **Tổng chờ push sau đợt 93: 2170 entry / 270 file batch / 1286 file duy nhất** (đợt 67–92: 2124/262/1265; đợt 93: 46/8 — đếm lại trực tiếp từ đĩa). HEAD vẫn 5f548ef8. KHÔNG push.
- U1 không stage (chưa xong, không LIMITS/batch); instrumentation + harness U1 nằm trên đĩa, đợt 94 nối tiếp.

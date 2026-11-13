# LIMITS gộp — Phase 9 đợt 87: mask bám motion track (E5 phần còn lại) + EPERM + backfill gap

- **Chủ đề:** mask bám motion track — phần còn lại duy nhất của gap E5 (text/video đã bám từ Phase 9 D3; chỉ còn mask). 10 luồng song song O1–O10, lượt cron 12:35 +07 11/11/2026. **KHÔNG push.**
- **Kết quả headline: mask bám motion track ĐÃ HOẠT ĐỘNG ĐÚNG ở cả preview lẫn render (mode mặc định png + mode trackgeq), đo bằng pixel thật, click-test 21/21 trên cây đã gộp.** E5 nay ĐÓNG hoàn toàn (text/video/mask đều bám track).
- **Tổng chờ push sau đợt 87: 1894 entry / 212 file batch / 1144 file duy nhất** (đợt 67–86: 1805/201/1107; đợt 87: 89/11 — 55 thread + 34 closing; unique +37). HEAD GitHub vẫn `5f548ef8`. KHÔNG push.

## 1. Kết quả từng luồng

| Luồng | Việc | Kết quả headline | Test/kiểm chứng |
|---|---|---|---|
| O1 | Spec + hình học chung | Helper `maskGeometryAtTrack` 3 bản mirror (TS canonical + ESM + CJS), track thắng x/y, keyframes thắng w/h; không thêm field spec; validator không có cảnh báo sai nên không sửa | maskTrack 22/22; hồi quy maskKeyframes 14/14; mirror check 427 pass, 6 known, 0 fail; tsc 0 |
| O2 | Render chính (mask video) | Đường png mặc định: keyframes suy từ quỹ đạo → video mask ffv1 qua `buildMaskAnimChain`; tâm mask khớp điểm track sai số <0,0001; tracked vs tĩnh tại t=2,0 MAD 0,023; mask tĩnh không hồi quy (MAD 0,0) | Test mới 25/25; D4 13/13; D3 22/22; render 11,2s vs tĩnh 10,5s (720p 120f) |
| O3 | geq động (A/B) | Geq động chạy đúng (centroid lệch ≤0,2px, feather hòa tuyệt đối 34px) nhưng chỉ 1,14 fps vs PNG 12,14 fps — **KHÔNG đưa vào production**, giữ sau cờ `--mask-mode trackgeq` làm đường thử nghiệm/fallback. Phát hiện bẫy double-shift (tâm cuối = 2·track − 0,5 nếu không bỏ shift D3) | Harness A/B 21/21 |
| O4 | Preview + parity | Preview khớp render png + trackgeq lệch ≤0,0005 (≤0,64px @1280); baseline cũ khớp render geq (harness phân biệt rõ 2 ngữ nghĩa) | Test mới 12/12; tsc 0; vite build pass |
| O5 | UI + i18n | MaskPanel khối trạng thái (follow/attach/transition/none) + nút gỡ track thật; TrackPanel cảnh báo đúng validator; 7 key mới (fragment) | Test 18/18; tsc 0; vite build pass; i18nOrphans 16/16 |
| O6 | Kiểm chứng độc lập | Mask bám track ĐÚNG ở cả 2 đường render (pixel thật); hồi quy vs render O7 MAD = 0; mask vẫn bám qua transition (C6 — đóng nợ O2 §5.5); phát hiện warning transition nói sai về mask (parent sửa ở closing, xem §2) | Unit 26/26; validator 8/8; suite cũ xanh hết; tsc web+desktop 0 |
| O7 | Benchmark | Tracked (video mask) 10,9–18,9 fps (720p), nhanh hơn geq ~2,4–4,4×, chậm hơn PNG tĩnh ~2–3×; preview tracked 15,15 fps ≈ static 13,15 fps; sinh video mask ~0,025–0,030 s/frame 720p | Đo thật, n=2/arm render (tracked dao động 74% theo tải VM) |
| O8 | Click-test headed | Chromium 19/21 → **21/21 sau khi parent gộp i18n** (b1/b4 lật PASS); WebKitGTK 19/21 (cùng 2 fail i18n, chưa chạy lại sau gộp — xem §5); mask bám track PASS cả 2 engine, hồi quy mask tĩnh PASS | Headed thật, blob đo sai ≤0,0041 |
| O9 | Docs backfill | Gap analysis §14 (đợt 85) + §15 (đợt 86) đã viết bù (file trước đó dừng ở §13); đính chính số tổng 1765 sai → 1805; cập nhật 9 hàng gap đã đóng (A1, E1/P2, E2, E3, E5 một phần, P5) | Nguồn từng số ghi trong LIMITS O9 |
| O10 | EPERM | Nối thêm 16 điểm / 13 file; helper 22/22, server 8/8, desktop 11/11; probe #1+#2 OK; phát hiện probe nền N8 đã CHẾT sau #5 (lần thứ 3 liên tiếp) | Xem §3 |

## 2. Quyết định của parent ở closing (đã làm, có kiểm chứng)

1. **Warning transition nói sai về mask — ĐÃ SỬA.** O6 C6 chứng minh mask vẫn bám track qua transition; parent verify thêm ở mode png mặc định (closing script `hidden_files/round87-closing-png-transition.cjs`): tâm 0,275/0,499/0,649 tại t=0,5/2,0/3,0 — PASS. Nguyên nhân: mask chain áp theo unit, trước xfade; chỉ shift D3 của unit bị bỏ qua. Đã sửa 3 chỗ: `validate.js:730` (warning ghi rõ "chỉ phần dịch chuyển của unit; mask vẫn bám theo track"), `TrackPanel.tsx` + `MaskPanel.tsx` (nhánh transition + mask hiện key mới `motionTrack.maskStillFollows` thay cho `maskNotFollowing` sai). Nhánh ASS (text) giữ `maskNotFollowing` (text không hỗ trợ mask — đúng).
2. **Merge i18n O5 — ĐÃ GỘP.** 7 key O5 + 1 key closing `motionTrack.maskStillFollows` → `vi.json`/`en.json`; dict **2507 → 2515**; bump 2507→2515 ở 12 test khóa số dict + cập nhật `cssClasses60Q2` (TrackPanel: 9 key/9 call → 13 key/13 call) + cập nhật test O5 sang trạng thái sau gộp (fragment 8 key, đã có trong dict). Kiểm chứng sau gộp: P7 8/8, i18nOrphans 16/16, G9 9/9, css60 59/59, css61 60/60, O5 test 18/18, tsc web+desktop 0, vite build pass, click-test O8 chạy lại **21/21** (b1/b4 lật PASS, chuỗi tiếng Việt hiện đúng).
3. **Hành vi đổi có chủ ý — GIỮ.** png + track + mask tĩnh: trước đây clip dịch theo track (mask cưỡi shift D3), nay clip đứng yên, chỉ mask di chuyển (O2 §5.4, O6 xác nhận bằng pixel C7). Đây là ngữ nghĩa đúng của "track lái mask" (quyết định O3, render.js:900 + preview O4).
4. **Fallback khi sinh video mask thất bại — XÁC NHẬN.** Rơi về mask tĩnh tại hình học track t=0 + warn rõ, không fail job (O2). Fallback chưa ép kích hoạt end-to-end (nợ mở, xem §5).
5. **Geq động — KHÔNG vào production.** Giữ sau cờ `--mask-mode trackgeq` (O3). A/B trackgeq-vs-O2: nay đã có số O2 (tracked png ~10,7 fps, ngang PNG tĩnh 12,14 fps) — geq động thua ~10×, quyết định O3 giữ nguyên.
6. **Preview không có cờ mask-mode — CHẤP NHẬN, ghi rõ.** Preview luôn theo ngữ nghĩa mới, lệch với render `--mask-mode geq` (O4 đã đo). Mode mặc định là png nên preview khớp mặc định; geq là đường cũ/thử nghiệm.
7. **Comment `preview.tsx:2015` trái với code — ĐÃ SỬA** (ghi rõ trackShift=null khi mask+track, snapshot mang mask bám track sẵn).
8. **EPERM 7 dòng O10 để lại + 2 dòng O6 — ĐÃ NỐI ở closing** (bench O7 3 dòng, test O3 2 dòng, test O6 verify/remeasure/final 2+1+1 dòng — tổng 9 dòng; `node --check` cả 5 file pass). Không còn đường ghi production nào chưa nối (theo phân loại M5/N8/O10: còn lại là helper nội bộ, launcher, fake-fs/fixture test).
9. **Đính chính 2 lệch số do O9 nêu:** gap §13 giữ tổng đợt 84 là 1033/178/680 — SAI, đúng là **1053/179/681** (parent đếm lại từ đĩa ở closing đợt 86; đã sửa §13 trong file). `ROUND86_LIMITS.md` §1.1/§1.4 ghi 1800/1804 (dùng base 1216 chưa tính +4 muộn) — SAI, đúng là **1805** (đã sửa 2 chỗ trong file).

## 3. Kiểm chứng parent trên cây đã gộp

- tsc web 0, desktop 0; vite build pass (6,57s); P7 8/8; i18nOrphans 16/16; G9 9/9; css60 59/59; css61 60/60.
- O1 maskTrack 22/22 (strip-types — lưu ý: bundle esbuild ra /tmp làm hỏng `import.meta.url`, không phải lỗi code); O2 test 25/25; O4 test 12/12; O5 test 18/18 (sau cập nhật post-merge); mask.js self-test pass; O3 test `node --check` pass (không chạy lại harness 11 phút).
- Closing png+transition: PASS (tâm 0,275/0,499/0,649).
- Click-test O8 chạy lại trên cây đã gộp (Chromium headed): **21/21 PASS**, 0 lỗi JS.
- Batch đợt 87: mọi entry tồn tại và là text, không binary, không workflow, không batch nào thiếu NUL cuối (kiểm bằng script đếm lại từ đĩa).
- VM: reboot 1 lần trong đợt (up 9 phút lúc đầu đợt); host 4 vCPU EPYC 9D25, RAM khả dụng ~1GB lúc đầu đợt; WebKitGTK khởi động được sau `install-deps webkit` (thiếu libevent-2.1.so.7 sau reboot) + bắt buộc `GST_PLUGIN_SYSTEM_PATH` (N2).
- **Kiểm chứng bổ sung của parent (sau khi worker gộp — 2 lỗi do closing đợt 87 gây ra, đã sửa):**
  1. **Đường dẫn require EPERM sai trong 3 test O6 — ĐÃ SỬA.** Closing đợt 87 nối helper vào `test_r87_o6_mask_track_verify.js:44`, `test_r87_o6_final.js:29`, `test_r87_o6_remeasure.js:26` bằng `require("./eperm-retry.cjs")` — sai: file helper ở `server/eperm-retry.cjs`, từ `server/render/` phải là `../eperm-retry.cjs`. Cả 3 test crash `MODULE_NOT_FOUND` khi chạy lại. Quét toàn repo: đúng 3 chỗ sai này (mọi file khác dùng `../` hoặc `../../` đúng). Đã sửa cả 3 về `../eperm-retry.cjs` (mẫu của sibling `server/render/*.js`). Chạy lại: verify **65 pass, 1 fail (C3)**; final **21 pass, 1 fail (C8)**; remeasure **53 pass, 1 fail (C3)** — khớp đúng số cuối trong LIMITS O6 §6 (C3 = kỳ vọng cũ đã thay bằng C7; C8 = artifact cắt biên đã giải thích bằng mép vệt). Hai "fail" này là artifact đã ghi trong hồ sơ, KHÔNG phải hồi quy — không sửa test để ép xanh.
  2. **Chuỗi thành phần dict chưa nối — ĐÃ SỬA.** Worker bump assert 2507 → 2515 ở 12 file nhưng không nối chuỗi thành phần trong 6 file comment (ProjectMenu, speedWarn, codecProbeDebts, i18nModals80H7, i18nSweep81I9, errorDetail34Q4 — chuỗi dừng ở 2507). Parent nối thêm "+7 key đợt 87 O5 + 1 key closing → 2515" vào cả 6 file; 5 file mới đưa vào closing batch (ProjectMenu đã có sẵn trong closing). Closing batch nay 34 entry; tổng đợt 87 nay **89 entry / 11 file**; tổng chờ push **1894/212/1144** (số 1889 trong bản gộp đầu của worker đã sửa ở 3 chỗ: LIMITS gộp ×2 + gap §16).

## 4. Nợ mở cho đợt 88

1. **G1 đóng hay chưa — parent/user quyết** (N5: pool30 n=24 median 0,845 PASS 19/24; N10: 60fps 6/8; câu hỏi "verdict ở chế độ yên" vẫn mở sau 3 đợt).
2. **Birefnet-general trong gói** (N4: 0/4 trong gói đợt 86, 6 lần chết liên tiếp; RSS 4,74→2,62 GB; đề xuất: RAM guard + chạy lại ngoài giờ vòng lặp).
3. **WebKit clip D loop** (N1: race preroll GStreamer vs HTTP progressive; watchdog seek-cứu thất bại 0/5; fix chưa thử).
4. **EPERM:** probe nền chết 3 lần liên tiếp (L6 sau #10, M5 sau #11, N8 sau #5) — cần cơ chế probe bền hơn; khoảng mù 03:19Z–05:53Z không có quan sát. Retry 5×20s không qua được sóng dài ~15 phút (luật K8 giữ nguyên). Quét writeFileSync toàn repo (cách đếm parent closing, gồm cả test/build-copy): 99 dòng — nhưng theo phân loại M5/N8/O10 thì không còn đường ghi production nào chưa nối.
5. **TTS 39:** vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
6. **ci-security.yml + ci-build.yml:** vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
7. **Fallback video-mask chưa ép kích hoạt end-to-end** (O2); pre-pass R2 vẽ PNG tĩnh thừa cho clip tracked (O2).
8. **Keyframes+track:** preview giữ w/h keyframes, render trackgeq bỏ keyframes hoàn toàn — lệch chưa đo (O4); ở mode png thì khớp (cùng helper O1). Chưa đo pixel: mask+track+SR, +motion blur, +transition (preview), feather > 0.
9. **Trackgeq:** track 240 điểm chưa render thật (khuyến nghị ≤20 điểm); trackgeq + clip merged / speed-ramp chưa test; chưa nối preview web (O3).
10. **WebKit click-test 19/21 chưa chạy lại sau gộp i18n** (O8 chỉ chạy lại Chromium; WebKit b1/b4 gần chắc cũng lật PASS nhưng chưa đo — đợt sau chạy lại cho đủ).
11. **Image+track+mask:** warn validator "track sẽ bị bỏ qua" chưa chính xác hẳn cho clip image có mask (O2).
12. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.
13. **Preview O4 là bản inline thứ 3** (không dùng helper O1 `maskGeometryAtTrack`) — nợ refactor nhỏ, hành vi đã khớp số đo nên chưa đụng.

## 5. Batch đã stage (KHÔNG push)

Đợt 87: 11 file — O1 (7) + O2 (4) + O3 (4) + O4 (4) + O5 (5) + O6 (5) + O7 (7) + O8 (3) + O9 (2) + O10 (14) + closing (34). Tổng đợt 87: **89 entry / 11 file**. Tổng chờ push sau đợt 87: **1894 entry / 212 file batch / 1144 file duy nhất** (đợt 67: 68/9; 68: 57/9; 69: 33/9; 70: 21/10; 71: 42/10; 72: 53/10; 73: 56/10; 74: 85/10; 75: 58/9; 76: 67/10; 77: 40/10; 78: 48/11; 79: 55/10; 80: 123/11; 81: 63/11; 82: 58/9; 83: 44/10; 84: 82/11; 85: 167/11; 86: 585/11; 87: 89/11). HEAD vẫn 5f548ef8. KHÔNG push.

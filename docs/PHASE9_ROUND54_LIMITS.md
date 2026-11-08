# Phase 9 đợt 54 — LIMITS tổng hợp (parent gộp, 07/11/2026)

Đợt 54: 9 luồng song song (K1–K9), lượt cron 06:35 +07 07/11. Cả 9 luồng
đều hoàn thành có LIMITS + tự stage batch riêng (46 entry). Handoff đợt
54 báo "K4 chưa xong" là stale — lúc gộp, batch K4 (6 entry) + LIMITS
K4 đã có đủ trên đĩa (01:42 UTC); parent tin đĩa, không chờ handoff
bổ sung. Parent gộp từ main chat: đối chiếu đĩa, kiểm chứng lại, viết
LIMITS tổng hợp này. KHÔNG push — chờ user nhắn "push đi".

## 1. Tóm tắt từng luồng (số thật, xem LIMITS riêng từng luồng)

- **K1 — loadProject** (`..._K1_LOADPROJECT_LIMITS.md`): sửa
  `parseProjectText` đọc `meta.name` từ bare-spec — đóng bug sản phẩm
  J3 (tên kẹt "Dự án không tên"). Test 7/7, hồi quy 10/10 + 13/13,
  tsc 0. Nợ: cần rebuild để đo lại P7 argv/Recent/D4c.
- **K2 — D4 exit 127** (`..._K2_D4_EXIT127_LIMITS.md`): chứng minh 127
  là artifact AppImage runtime (shared extract dir), KHÔNG phải bug
  sản phẩm. Fix sản phẩm: `loadSample()` gọi `markSaved(spec)`.
  D4 --binary 6/1 exit 0. Test mới 3/3.
- **K3 — Menu M19–M26** (`..._K3_MENU_M19_M26_LIMITS.md`): 41/45 pass
  (lượt 2). Phát hiện **bug i18n thật**: `ProjectMenu.tsx` dùng
  literal tiếng Việt cứng + không `useLang()`, `TopBar.tsx:196`
  "👋 Bắt đầu" cũng là literal — chuyển ngôn ngữ không đổi hết UI.
  Chưa sửa (cần luồng riêng i18n hoá). P7 đo pre-K1.
- **K4 — discard-confirm + D1 argv** (`..._K4_DISCARD_CONFIRM_D1_LIMITS.md`):
  harness xử lý CHỦ ĐỘNG dialog discard-confirm (`answerDiscardDialog`
  ở guard openTopMenu, M5, M7, D1, D2b, D4d, phaseDialogProbe).
  D1 argv: **đã điều tra + sửa** — "app log không có dòng argv" không
  chứng minh gì vì `main.ts` cũ hoàn toàn không log argv; main.ts nay
  log kết quả parse argv. **D1 PASS, D1-argv PASS** (tên "H9
  Doubleclick", currentPath đúng). Chỉ D2a fail (§4.1). Test mới
  openFileQueue 4/4.
- **K5 — AppImage test** (`..._K5_APPIMAGE_TEST_LIMITS.md`): test bản
  576 MB sha 2a15ea90; diag 12/12, menu 9/30 (không regression), GTK
  5/5, D4 exit 127 chỉ ở second-instance. Không đổi code (chỉ LIMITS).
- **K6 — TTS P13 lặp** (`..._K6_TTS_P13_REPEAT_LIMITS.md`): P13 vs M3
  giữ vững (+0,37 ký tự/giây gộp, nút φ không đổi); transfer M6
  1,42–1,58. Test H1 12/12, H2 14/14 (tăng so với đợt 51 nhờ test mới).
- **K7 — Proxy toolbar + stale** (`..._K7_PROXY_TOOLBAR_STALE_LIMITS.md`):
  `grid-auto-rows: max-content` sửa tràn nút; proxy stale HEAD 404 +
  nút "Tạo lại" + checkAlive tri-state; headed 10/10. Unit proxyAuto
  20/20, rehydrate 27/27.
- **K8 — GOP long reverse** (`..._K8_GOP_LONG_REVERSE_LIMITS.md`):
  phiên lùi 180 s 18/18; siết moov giả lớp (c) ở T3. Hồi quy GOP I6
  25/25, T3 10/10, F4 6/6. Test mới 18/18.
- **K9 — Audio re-seek** (`..._K9_AUDIO_RESEEK_LIMITS.md`): forward
  sync mirror nhánh reverse; re-seek tổng 16–18 → 10–11 (video 5–6 →
  0–1), audio sàn 9–11 do drift gốc. Test mới 11/11.

## 2. Việc parent gộp đã làm

1. **Đối chiếu đĩa**: 9 batch đợt 54 (46 entry) — mọi file tồn tại,
   toàn text, NUL cuối. LIMITS K1–K9 đủ. i18n vi == en == 987, 0 key
   mồ côi — đợt 54 không thêm key nên KHÔNG cần cập nhật snapshot
   (khác đợt 51/53).
2. **Xung đột file chung**: `tsconfig.json` đủ 3 dòng exclude mới
   (K1/K8/K9); `store.ts` chứa cả hunk K2 lẫn K7; `click-test-menu.mjs`
   chứa cả marker K2 (dòng 53) lẫn K4 (nhiều điểm) — K4 chạm sau K2
   nhưng không ghi đè; `node --check` harness pass. tsc web/desktop
   đều 0 (xem §3).
3. **K4 test chạy trực tiếp fail là artifact cách chạy**: `node --test`
   thẳng file `.ts` trong apps/desktop (không có `"type": "module"`)
   ném "Cannot use import statement outside a module" — chạy lại bằng
   esbuild bundle thì **4/4 pass**. Không phải bug code.

## 3. Kiểm chứng parent (chạy lại trên cây đã gộp, số thật)

- `tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi**.
- `vite build` apps/web: **pass** (5,30 s).
- Test mới chạy lại: K1 7/7, K2 3/3, K4 4/4 (bundle), K6 H1 12/12 +
  H2 14/14, K7 proxyAuto 20/20 + rehydrate 27/27, K8 18/18, K9 11/11.
- i18n: vi == en == 987 (không đổi so với đợt 53).
- Số các luồng (chỉ đối chiếu LIMITS, không đo lại): K3 probe 41/45,
  K5 diag 12/12 + menu 9/30 + GTK 5/5, K8 hồi quy I6 25/25.
- KHÔNG chạy lại ở bước gộp: mọi phép đo headed/TTS WAV/heap/smoke
  AppImage/full-run menu của các luồng, phiên solo thật, đo IDB thật,
  Safari/máy thật/GPU thật. Parent không sửa logic luồng nào.

## 4. Nợ mở / chưa làm được (trung thực)

1. **Bug i18n M19** (K3): ProjectMenu + TopBar "👋 Bắt đầu" dùng
   literal tiếng Việt cứng — chuyển sang EN không đổi hết UI. Cần luồng
   riêng i18n hoá (ngoài phạm vi K3).
2. **D2a fail** (K4 §4.1): chỉ case fail còn lại sau khi D1/D1-argv/
   D2b/D3/D4 đều PASS — xem LIMITS K4.
3. **K1 nợ**: cần rebuild để đo lại P7 argv/Recent/D4c (K1 §6).
4. **K2 nợ**: click-test-menu.mjs đã được K4 chạm sau K2 — parent đã
   xác nhận cả 2 marker còn đủ (xem §2.2); lần chạy menu sau cần kiểm
   tra lại toàn vẹn harness.
5. **K5**: AppImage 576 MB chưa có kết luận gì thêm ngoài diag/menu/
   GTK (chỉ test, không đổi code).
6. **K9**: audio re-seek còn sàn 9–11 do drift gốc (video đã về 0–1);
   drift gốc chưa xử lý.
7. **K6**: P13 vs M3 biên mỏng — đã giữ vững lần đo lặp này, vẫn nên
   đo lặp định kỳ khi có thêm mẫu.

## 5. Batch đã stage (KHÔNG push), chờ user push sau

- Đợt 54 (9 file / 46 entry): `phase9-round54-k1-loadproject.txt` (4),
  `phase9-round54-k2-d4-exit127.txt` (4),
  `phase9-round54-k3-menu-m19-m26.txt` (2),
  `phase9-round54-k4-discard-confirm-d1.txt` (6),
  `phase9-round54-k5-appimage-test.txt` (1),
  `phase9-round54-k6-tts-p13-repeat.txt` (5),
  `phase9-round54-k7-proxy-toolbar-stale.txt` (13),
  `phase9-round54-k8-gop-long-reverse.txt` (5),
  `phase9-round54-k9-audio-reseek.txt` (6).
- Batch đóng đợt: `phase9-round54-closing.txt` (1 entry — LIMITS tổng
  hợp này).
- **Tổng chờ push: 32 file paths / 350 entry** (303 trước đợt 54 + 46
  đợt 54 + 1 LIMITS tổng hợp đợt 54). Các đợt 1–50 đã push xong
  (HEAD e2cb35e1).

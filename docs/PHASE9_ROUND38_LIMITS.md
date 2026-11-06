# Phase 9 đợt 38: đóng nợ đợt 37 — LIMITS tổng hợp (khôi phục + kiểm chứng lại)

> Đợt 38 gồm 6 luồng U1–U6, chạy chiều 02/11/2026 từ main chat, đóng nợ §3
> của `docs/PHASE9_ROUND37_LIMITS.md`. Mỗi luồng tự ghi LIMITS riêng và
> ghi rõ "parent gộp batch" — nhưng bước gộp (stage paths + ghi log) đã
> không xảy ra: tới 02:03 03/11 vẫn chưa có file paths đợt 38, chưa có
> mục log đợt 38, và `round-in-progress.md` không tồn tại.
>
> Lượt cron 02:03 03/11/2026 đóng vai parent gộp muộn: đối chiếu danh
> sách file của 6 LIMITS với mtime đĩa thật trong khung giờ đợt 38,
> kiểm chứng độc lập lại bằng 3 luồng chỉ-đọc + tsc/vite build của
> parent, rồi mới stage batch này. KHÔNG push, KHÔNG tag/release,
> KHÔNG binary, KHÔNG dist. Mọi số dưới đây đều là số đã chạy thật;
> chỗ nào chỉ đối chiếu JSON đã lưu thì ghi rõ, không mạo nhận đo lại.

## 1. Đợt 38 đã làm gì (tóm tắt theo luồng)

- **U1 — toggle UI decode-ahead Q3** (`PHASE9_ROUND38_U1_Q3_TOGGLE_LIMITS.md`):
  cờ `wanted` + status registry trong `reverseWebcodecs.ts`, module
  thuần `reverseDecodeAheadToggle.ts`, nút toggle + badge + refresh
  trong `preview.tsx`, i18n `decodeahead` vi=en đủ key. Cổng S3
  không đổi ngưỡng, mặc định vẫn TẮT; chưa có số đo thì toggle hiện
  "BỊ CHẶN" kèm lý do thay vì im lặng. Test 12/12, click-test app
  thật 6/6 (theo LIMITS U1).
- **U2 — size proxy qua cổng S4 + hợp đồng Range theo GOP**
  (`PHASE9_ROUND38_U2_PROXY_SIZE_RANGE_LIMITS.md`): `MediaItem`
  thêm `proxySizeBytes?`, bridge POST /api/proxy trả `proxySizeBytes`
  (stat file proxy), sidecar thêm `proxySize`, `knownSizeBytesForPreview`
  là điểm duy nhất quyết định size vào controller, `MediaBin.tsx` cả
  2 đường tạo proxy đều truyền size. Cổng Range `reverseRangeGate38U2`
  đã khóa bằng code + test 20/20 nhưng CHƯA được code fetch nào gọi
  (chờ demux mảnh đợt sau). Số đo bridge thật: HEAD báo
  `Accept-Ranges: bytes`, Range 0–99 → 206 đúng 100 byte,
  `proxySizeBytes: 167943` = đúng kích thước file proxy trên đĩa.
- **U3 — relink tay bền + dedup alias**
  (`PHASE9_ROUND38_U3_RELINK_DEDUP_LIMITS.md`): `relinkMedia` nay
  ingest thật (await) thay vì chỉ probe tên; `AssetManifest.aliases?`
  + `addAlias`; `planRehydrate` thêm via `"alias"`, candidate alias
  giữ `file.name == src`. Probe pha A–E: allPass, 14/14 check, tải
  MP4 về ffprobe hợp lệ. Test 7/7.
- **U4 — nhánh INVALID live cho mobile/check-proxy + H2**
  (`PHASE9_ROUND38_U4_SNAPSHOT_INVALID_LIMITS.md`): `bench-preview-fps.mjs`
  thêm cờ `--cdp-hang-probe-h2` (mode `controlled-hang-H2-busy-loop`);
  mobile INVALID live (254 → 255 file, exit 1), check-proxy INVALID
  live (exit 3), bench H2 live frozenDist VALID, hiệu chuẩn CPU 3 vòng
  allPass=false đúng 1 check fail (`busyHighAllRounds`) nên GIỮ
  NGƯỠNG CŨ. Không sửa code check-proxy/mobile (nhánh INVALID đã có
  sẵn, chỉ thiếu kích hoạt live).
- **U5 — chẩn đoán mobile touch + đo DPR**
  (`PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md`): nguyên nhân FAIL đợt 37
  là `WelcomeModal` che toàn bộ điểm chạm trên profile mới (harness
  chưa đóng modal), không phải lỗi sản phẩm; sửa duy nhất ở harness
  (thêm bước đóng modal) → SCRUB PASS + PINCH PASS 2/2. Probe DPR:
  element backing 854×480 ở cả DSF=2 và DSF=3 (trần `min(dpr,2)`),
  WebCodecs 62/62/0 khớp pts 62/62. Click-test fallback verdict PARTIAL
  (frame thật đầu muộn ~9–13 s trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] 420 MB). KHÔNG sửa
  code sản phẩm nào.
- **U6 — runner phiên đo solo A/B**
  (`PHASE9_ROUND38_U6_SOLO_RUNNER_LIMITS.md`): `seek-ab-solo-run.mjs`
  mới (dry-run, self-test, run; import cổng v3, không sửa file cũ),
  test 10/10, self-test 6/6 mẫu đúng phân loại đã công bố. Phiên solo
  thật CHƯA chạy — quyết định khóa A/B <10% và chốt v3 vẫn chờ dữ
  liệu mới. Probe per-seek (§3.3 U6) thiết kế xong, CHƯA cài.

## 2. Kiểm chứng khôi phục của parent (lượt cron 02:03 03/11)

- **Đối chiếu đĩa:** `find` file sửa trong khung giờ đợt 38 (trừ
  node_modules/dist) cho đúng 42 file, khớp từng file với hợp 6 danh
  sách LIMITS (kể cả file dùng chung `preview.tsx`, `store.ts`,
  `tsconfig.json`). Không phát hiện file lạ nào ngoài
  `package-lock.json` (xem §4).
- **3 luồng kiểm chứng chỉ-đọc chạy song song**, mỗi luồng chạy lại
  test/đo của mình, không sửa repo, không vite build/tsc:
  - V1 (U1+U2): đủ file 19/19; marker đủ (`proxySizeBytes`,
    `proxyKnownSizeBytes`, `reverseRangeGate`, toggle decode-ahead);
    `__vcutU1MeasureDebug` grep = 0 (đã gỡ); test chạy lại U1 12/12,
    U2 20/20; `node --check` pass; JSON bridge khớp số.
  - V2 (U3+U4): đủ file 17/17; marker đủ (`aliases`/`addAlias`,
    via `"alias"`, `--cdp-hang-probe-h2`); test U3 chạy lại 7/7;
    `node --check` pass 3 script; 5 JSON parse được, giá trị khớp
    LIMITS (u3 allPass 14/14; u4 H2 ok + frozenDist VALID, mobile
    INVALID exit 1, check-proxy INVALID exit 3, cpu-calibration
    allPass=false đúng 1 check fail).
  - V3 (U5+U6): đủ file; bước đóng WelcomeModal đúng vị trí mô tả;
    runner solo import cổng v3 dòng 70; `node --check` pass 5 script;
    test U6 10/10; self-test runner exit 0, 6/6 mẫu đúng phân loại
    và tỉ số đã công bố; 2 JSON U5 parse được, field khớp LIMITS
    (DPR 854×480 cả 2 DSF, WebCodecs 62/62/0; fallback PARTIAL,
    wcHits 0, wcMisses 144).
  - Không phát hiện mâu thuẫn vật chất nào giữa claim và đĩa.
- **Kiểm chứng gộp của parent (chạy lại độc lập):** `tsc --noEmit`
  0 lỗi; `vite build` pass (4,83 s); `tsconfig.json` parse OK, đủ 3
  dòng exclude test đợt 38 (U1/U2/U3) — file dùng chung gộp nguyên vẹn.
- **KHÔNG chạy lại ở bước gộp:** mọi phép đo browser headed / FPS /
  probe live của các luồng (chỉ đối chiếu JSON đã lưu); click-test
  browser 6/6 của U1; bench live H2/INVALID của U4; số mobile/DPR/
  fallback của U5; dry-run của U6. Các số đó giữ trạng thái "theo
  LIMITS, chưa tái kiểm live".

## 3. Batch đã stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round38-closing-debts37.txt`
  (43 file text, NUL-delimited, không binary, không dist, đã verify
  read-back 43 entry + mọi file tồn tại): 42 file đợt 38 + file
  LIMITS tổng hợp này.
- Tổng batch đang chờ user push sau đợt này: 17 file paths
  (đợt 22–38; các đợt 1–21 đã push xong chiều 29/10).

## 4. Loại khỏi batch — và lý do (trung thực)

- **`package-lock.json`:** có mtime đổi trong khung giờ đợt 38
  (13:12 UTC) nhưng KHÔNG luồng nào kê khai. `package.json` không
  đổi (mtime 23/10); U2 ghi rõ `npm install` trong server/bridge báo
  "up to date", không cài thêm gì. Parent loại khỏi batch vì không
  có bằng chứng thay đổi dependency nào; khả năng cao chỉ là npm
  viết lại file khi kiểm tra. Hạn chế: repo local không có `.git`
  nên parent KHÔNG đối chiếu được nội dung với bản đã push — nếu
  khi user push mà lock có diff thì đó là rewrite của npm, không
  phải dependency mới có chủ đích; cần xem diff trước khi nhận.
- **`apps/web/dist/`:** build lại ở bước gộp, theo tiền lệ không vào
  batch.
- **Scratch ngoài repo:** `~/workspace/tmp-round38-u*/`, `/tmp/vcut-*`,
  fixture MP4, file proxy đo, bản sao dist tamper của U4 — không vào
  batch.
- **Snapshot backup H2** trong
  `workspace/goals/capcut-clone-video-editor/hidden_files/cdp-hang-snapshots-backup/`
  thuộc goal workspace, không phải repo — không vào batch; backup
  vẫn chưa ra khỏi máy (nợ của user, xem §5).
- **`preview.tsx` mtime 13:26 trong đợt 38:** đã giải thích được —
  file chứa cả hunk U1 (toggle, import dòng 71, class dòng 2944)
  lẫn hunk U2 (`knownSizeBytesForPreview` dòng 1211); U5 không đụng
  file này (Timeline/WelcomeModal mtime cũ hơn đợt 38). Đây là giới
  hạn chứng cứ do thiếu `.git`, không phải bằng chứng vi phạm.

## 5. Nợ mở cho đợt 39 (từ LIMITS U1–U6, không trùng batch đã stage)

1. **Phiên đo solo A/B thật chưa chạy** (U6): runner sẵn, cần chạy
   `--dry-run` tới exit 0, xác nhận port trống rồi `run`; sau đó mới
   khóa được A/B <10% và chốt cổng v3; ngưỡng load5 mong manh
   (bảng nhạy 1,95) và vùng INDETERMINATE_MIXED (mới 1 tiền lệ)
   vẫn chờ dữ liệu solo.
2. **Probe per-seek chưa cài** (U6 §3.3): cần luồng khác sửa harness
   N2/probe phụ thì phiên solo mới trả lời được cơ chế sụp đoạn;
   không có probe thì vẫn khóa được A/B nhưng không giải thích
   được sụp.
3. **Range theo GOP thật chưa làm** (U2): cần demux mảnh + fetch
   từng đoạn GOP + ghép decoder; gate hiện chưa code nào gọi;
   file > 128 MiB vẫn fallback element trong mọi đường đo.
4. **Click-test full-app cho clip proxy có proxySizeBytes** (U2):
   import file lớn → tạo proxy → phát ngược với cờ bật, xác nhận
   controller khóa 0 request khi proxy > 128 MiB (cần proxy thật
   > 128 MiB, hiếm vì proxy 720p thường nhỏ hơn ngưỡng).
5. **Toggle Q3:** bật giữa chừng vẫn cần decode cửa sổ mới mới có
   prefetch (giữ buffer cửa sổ cũ tốn 1 file bộ nhớ — ngoài phạm vi
   U1); tắt giữa chừng, prefetch đang bay có thể hoàn tất sau khi
   tắt; chưa quyết re-gate liên tục kèm chống flapping hay giữ luật
   T2; badge hợp lý do nhiều controller có thể gây hiểu nhầm.
6. **Relink/alias:** chưa đo ingest file hàng trăm MB, chưa có UI
   tiến trình; project cũ ingest trước đợt 38 vẫn Relink một lần
   rồi mới bền; hai `addAlias` song song có thể mất một alias;
   alias thừa (trùng tên thật tạo trước guard) chưa có luồng dọn.
7. **Snapshot/CPU:** ngưỡng CPU chưa thành cổng tự động (cần phiên
   quiet có điều phối lặp hiệu chuẩn rồi khóa); backup snapshot
   chưa ra khỏi máy (cần lệnh riêng của user với đích ngoài);
   H2 mới chứng minh page kẹt busy-loop, chưa chứng minh Chrome
   đơ toàn bộ / deadlock đa tài nguyên; mọi manifest U4 gắn với
   dist cũ (bundle BNjMwXhb, 254 file) — lượt sau đo lại trên dist
   mới, không trích số cũ.
8. **Mobile/DPR/fallback:** mobile touch trên máy thật / Safari /
   viewport khác chưa đo; click-test App ở dpr > 1 qua `preview.tsx`
   thật và đường `asset:` ở dpr > 1 vẫn mở; fallback frame đầu
   muộn ~9–13 s trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] 420 MB cần cải tiến đường element;
   mobile touch PASS/FAIL dao động theo cách serve (vite preview
   FAIL đợt 37 vs static server PASS đợt 38) — nguyên nhân chưa
   xác định dứt điểm.
9. **Chung:** mọi số đợt 38 đều đo under-load (6 luồng song song)
   hoặc gắn dist cũ — cấm dùng làm baseline quiet hay claim fps;
   Safari / máy thật / GPU thật / footage B-frame / độ phân giải
   khác / đường `asset:` vẫn chưa đo cho nhiều mảng trên.

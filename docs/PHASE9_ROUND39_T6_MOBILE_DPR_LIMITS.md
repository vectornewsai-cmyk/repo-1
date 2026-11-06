# Phase 9 đợt 39, luồng T6 — Mobile/DPR/fallback + nền tảng cổng CPU tự động — LIMITS

Ngày: 03/11/2026 (giờ +07; log probe ghi UTC 01:2x–02:1x).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary hay dist
vào repo, KHÔNG sửa file của luồng khác ngoài đoạn của mình trong
`preview.tsx` (ghi rõ hunk ở §6), KHÔNG ghi paths-loop hay
build-loop-log (parent gộp). Mọi số dưới đây đều đo thật; chỗ nào đo
under-load (chạy chung các luồng đợt 39 khác) thì ghi rõ, cấm dùng
làm baseline quiet hay claim fps.

## 0. Kết luận ngắn (không vượt số đo)

1. **Click-test App ở dpr > 1 qua `preview.tsx` thật: HÌNH HỌC ĐẠT,
   NỘI DUNG KHI PHÁT ĐẠT, nhưng frame pause đầu chưa vẽ (a).**
   Ở cả DSF=2 và DSF=3: `devicePixelRatio` báo đúng, canvas preview
   thật CSS 712×234 → backing 1424×468 ở CẢ hai DSF (đúng trần
   `min(dpr,2)` — DSF 3 không phình thành 2136×702); đường `asset:`
   rehydrate đúng (MediaBin hiện `asset:a_ee0caf7625dd51b4`, element
   blob load đủ rs=4, buffered [0,3]); bấm Phát thì vẽ đúng nội dung
   (centerMean ~129 so với nền 12,67). Nhưng frame pause tại t=0
   KHÔNG vẽ (canvas nền suốt 12 s pause) — và đối chứng DSF=1 tái
   hiện Y HỆT, nên đây là lỗi có sẵn của vòng lặp pause, không đặc
   thù dpr, không do sửa của luồng này (§3). Luồng này KHÔNG sửa lỗi
   đó (thuộc logic ngủ của vòng lặp preview, ngoài phạm vi giao) —
   báo rõ để parent giao luồng sở hữu.
2. **Cải tiến đường element cho frame đầu muộn trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa']
   420 MB: CHẨN ĐOÁN XONG + CẢI TIẾN ĐO ĐƯỢC (b).** Nguyên nhân gốc
   (§2): mỗi seek bay 1,2–6,8 s trong khi playhead vẫn lùi ~0,87×
   realtime, nên lag lúc seek xong thường 2,2–4,9 s — vượt guard 2 s
   → 4 lần seek xong liên tiếp đều bị chặn, frame đầu tới sau
   17,8 s. Sửa: bypass guard đúng tick vừa hoàn tất seek
   (`stepDrawAllowedWithCompletion` + cờ `seekCompletedThisTick`).
   Đo lại cùng file, cùng kịch bản: **frame đầu 17,8 s → 6,9 s
   (sớm 2,6×), draw trong 20 s từ 2 → 10, skip từ 280 → 102**;
   routing vẫn đường element thuần (wcHits 0, `largeFileLocked`
   true). Guard 2 s vẫn nguyên cho mọi tick khác.
3. **Dao động mobile touch theo cách serve: BÁC BỎ GIẢ THUYẾT SERVE
   (c).** Cùng script (đã có sửa đóng modal của U5), cùng dist đóng
   băng (bundle `index-CDz_yNSq.js`, 254 file): static server PASS
   2/2 và vite preview PASS 2/2, số đo giống hệt nhau (scrub
   00:00:00:00 → 00:00:03:10, pinch 60 → 150, exit 0, frozenDist
   VALID cả 4 lượt). Cách serve không phải nguyên nhân FAIL đợt 37
   vs PASS đợt 38 — nguyên nhân vẫn là giải thích của U5 (script
   đợt 37 chưa đóng `WelcomeModal`); các lượt PASS trên static
   server của U4 trùng thời điểm U5 sửa script nên đã hưởng sửa đó.
4. **Cổng CPU tự động: THIẾT KẾ + KHUNG CODE XONG, CHƯA KHÓA (d).**
   Hiệu chuẩn lặp 2 lần (mỗi lần 3 vòng, probe U4): tầng CDP phân
   biệt 3/3 cả 2 lần (H1 ≤ 2,7%, H2 ≥ 92,2%, gap ≥ 91,2); tầng Node
   trượt cả 2 lần (lần 1: 39,9/39,4/39,4; lần 2: 77,4/39,4/39,5 —
   mức ~39–40% lặp lại dưới tải). Theo tiêu chí ghi trước, cổng
   KHÔNG lockable. Khung `cpuGate39T6.ts` (hàm thuần + test 8/8)
   tồn tại với `locked: false`, chưa nối vào harness nào — quyết
   định khóa phải chờ một phiên quiet có điều phối.

## 1. Thiết lập đo (ghi rõ vì dist và tải trôi giữa đợt)

- File GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa']: `~/workspace/tmp-round34-q2/sparse-gop-noise.mp4`,
  419.967.521 byte (đúng file U5 dùng, cùng dung lượng), 1280×720,
  30 fps, 30 s, h264, keyframe mỗi 1 s (GOP=30, đo bằng ffprobe
  `-skip_frame nokey`: keyframe tại 0,1,2,…,29 s), bitrate ~112 Mbps
  (noise không nén được — lý do decode phần mềm chậm).
- Dist đóng băng cho A/B serve: copy `apps/web/dist` lúc đầu lượt
  sang scratch (`dist-frozen`), bundle `index-CDz_yNSq.js`
  sha256[:16] `f5099b12449efff8f`, 254 file, manifest
  `25c95c2b…` — KHÔNG dùng dist repo trực tiếp (tránh đua build
  với luồng đợt 39 khác).
- Đo fallback (b): vite dev từ bản sao scratch có layout đúng repo
  (`repo/apps/web` + symlink `packages`, `server`, `node_modules`
  về repo) + patch diag CHỈ ở scratch (`media.ts` đăng ký element
  và log seeking/seeked — không vào repo). Bài học giữa chừng:
  bản sao đầu thiếu `packages/` nên vite dev lỗi import
  `../../../../../packages/video-spec/...` (overlay) và app không
  ready; bản sao thứ hai đồng bộ lại toàn bộ `src` từ repo mới
  chạy được (lỗi này do scratch, không phải do code repo).
- Đo DPR/asset (a): cùng vite dev scratch + Chrome headed
  `--force-device-scale-factor` 2 rồi 3 (Xvfb :97), clip test
  `testsrc2` 640×360 3 s tự tạo bằng ffmpeg (300.336 byte) đặt ở
  `public/` của scratch để seed qua fetch cùng origin.
- Đo CPU (d): bản sao probe U4 (`clicktest-u4-round38-cpu-…`),
  OUT đổi sang scratch, cổng CDP riêng 19468/19469, snapshot dir
  riêng (probe tự dọn về 0 file sau chạy — đã kiểm tra).
- Tải lúc đo: VM 4 vCPU / 8 GB, RAM đã dùng ~7,0/7,9 GB, load
  trung bình ~2–3, 13 tiến trình Chrome của luồng khác đang chạy
  — TẤT CẢ số timing trong file này là under-load.

## 2. Chẩn đoán frame đầu muộn + cải tiến đường element (b)

### 2.1 Trace baseline (JSON `v39-t6-fallback-diag-before.json`)

Kịch bản như T5/U5: import file noise qua input file thật, tắt
"Tự tạo proxy", bật cờ WebCodecs, Thêm → End (playhead 30,0) →
Phát ngược, mẫu mỗi 250 ms × 80 (20 s), kèm log seeking/seeked
của element. Trước khi phát ngược, element đã rs=4, buffered
[0,30] đầy đủ — KHÔNG phải thiếu dữ liệu.

| Seek (target) | Bay | Lag lúc xong (ước từ mẫu) | Vẽ? |
|---|---|---|---|
| 29,900 | 6.842 ms | ~4,9 s | KHÔNG (vượt guard 2 s) |
| 24,667 | 2.889 ms | ~2,7 s | KHÔNG |
| 21,900 | 3.481 ms | ~3,6 s | KHÔNG |
| 18,300 | 2.173 ms | ~2,2 s | KHÔNG (vừa vượt) |
| 16,133 | 1.497 ms | ~1,5 s | CÓ — frame đầu ở mẫu 51/80, 17.808 ms |
| 14,533 | 3.316 ms | ~2,8–3,3 s | KHÔNG |
| 11,167 | 1.208 ms | ~0,6 s | CÓ — draw thứ 2 ở mẫu 67 |
| 9,800 | 3.473 ms | (chạy tiếp) | — |

Tổng 20 s: draw 2, hold 187, skip 280, `maxHoldAgeSec` 4,6,
playhead 30,0 → 6,0. Lưu ý kỹ thuật: `currentTime` khi đang
seeking đã báo target (Chrome), nên lag đo được là khoảng cách
giữa target và playhead đang lùi — không phải sai vị trí frame.
Frame ở tick hoàn tất CHÍNH LÀ frame của seek vừa xong (target
lúc phát seek, đơn điệu theo chiều ngược); lag chỉ đo playhead
đã chạy trong lúc seek bay.

### 2.2 Sửa (đoạn của T6 trong `preview.tsx` + hàm thuần mới)

- `apps/web/src/lib/reversePlayback.ts`: thêm
  `stepDrawAllowedWithCompletion(seeking, currentTime, target, fps,
  justCompleted)` — `justCompleted && !seeking` → true, còn lại
  rơi về `stepDrawAllowed` nguyên vẹn. `stepDrawAllowed` cũ không
  đổi một chữ.
- `apps/web/src/preview.tsx` (chỉ 4 hunk của T6):
  1. Import thêm `stepDrawAllowedWithCompletion`, gỡ import
     `stepDrawAllowed` (hết chỗ dùng — tsc `noUnusedLocals` bắt).
  2. Thêm `seekCompletedThisTick: Set<object>` cạnh
     `steppingPrevSeeking`, kèm chú thích vòng đời.
  3. Đầu `syncMedia`: `seekCompletedThisTick.clear()` (1 lần/tick).
  4. Hai nhánh stepping (ngược toàn cục + clip reverse): khi
     `justCompletedSeek(...)` thì `seekCompletedThisTick.add(a.el)`.
  5. Guard trong `drawVideoClip`: thay `stepDrawAllowed(...)` bằng
     `stepDrawAllowedWithCompletion(..., seekCompletedThisTick.has(v))`.
- KHÔNG đổi: guard 2 s cho tick khác, pacing L2, luật
  justCompletedSeek, nhánh pause/scrub (playing=false không set
  cờ nên không ảnh hưởng), đường WebCodecs, store, i18n.
- Test mới `reversePlaybackRound39T6.test.ts` (10/10): 4 lag
  baseline (4,9/2,7/3,6/2,2) với justCompleted=true → vẽ, guard cũ
  chặn đúng 4 trường hợp đó; justCompleted=true nhưng seeking
  (trạng thái không thể) → rơi về guard; justCompleted=false thì
  guard cũ nguyên vẹn (1,5 s vẽ, 2,2 s chặn, seeking lệch chặn).

### 2.3 Đo lại sau sửa (JSON `v39-t6-fallback-diag-after.json`)

Cùng file, cùng kịch bản, vite dev scratch đã đồng bộ code mới:

| Chỉ số (20 s) | Trước | Sau | Đọc |
|---|---|---|---|
| Frame thật đầu (mẫu / wall) | 51 / 17.808 ms | 19 / 6.886 ms | sớm 2,6×, đúng bằng seek đầu xong (6.466 ms) |
| Số draw | 2 | 10 | frame mới mỗi lần seek xong, thay vì nền |
| skip | 280 | 102 | giảm 64% |
| hold | 187 | 426 | frame giữ hiển thị thay vì nền |
| Seek đầu | 6.842 ms | 6.466 ms | cùng bậc — sửa không làm seek nhanh hơn, chỉ không chặn frame đã xong |
| Routing | wcHits 0, misses 468 | wcHits 0, misses 537, `largeFileLocked: true` | vẫn đường element thuần, không lan sang WebCodecs |

Giới hạn trung thực: 6,9 s vẫn CHƯA phải "nhanh" — nó bằng đúng
thời gian seek đầu (decode 27 frame noise 112 Mbps + chi phí
seek đầu). Muốn nhanh hơn nữa cần ấm decoder trước (preload
seek khi arm ngược — chưa làm, vì pre-seek lúc pause sẽ đổi
frame hiển thị nếu không kèm guard; để luồng sở hữu preview
quyết) hoặc đường WebCodecs cho file lớn (đang bị khóa có chủ ý
theo cổng S4). So sánh trước/sau là cùng máy, cùng tải nền kiểu
under-load nhưng khác thời điểm — không phải baseline quiet, và
số tuyệt đối (6,9 s) sẽ khác trên máy yên tĩnh.

## 3. Click-test App ở dpr > 1 + đường `asset:` (a)

### 3.1 Cách đo

Seed (lần DSF đầu, profile Chrome dùng chung cho DSF 2 và 3):
fetch clip test từ cùng origin → SHA-256 → assetId
`a_ee0caf7625dd51b4` → ghi manifest + blob vào IndexedDB
`vcut-studio-assets` (đúng schema app: store `manifests`
keyPath `assetId` + index `bySha256`, store `blobs`) → ghi
autosave envelope có track V1 với clip
`{kind:"video", src:"asset:a_ee0caf7625dd51b4", start:0,
duration:3, in:0, out:3}` → reload để App tự rehydrate
(`App.tsx` → `rehydrateMediaItems` → MediaItem
`name = "asset:<id>"`, `url` = blob object URL) → đo canvas
preview thật + bấm Phát.

### 3.2 Kết quả (JSON `v39-t6-dpr-asset-clicktest.json`)

| Chỉ số | DSF=2 | DSF=3 | Đọc |
|---|---|---|---|
| `devicePixelRatio` báo cáo | 2 | 3 | đúng DSF đã đặt |
| Canvas CSS | 712×234 | 712×234 | cùng layout |
| Canvas backing | 1424×468 | 1424×468 | đúng trần `min(dpr,2)` qua `preview.tsx` thật: DSF 3 không phình thành 2136×702 |
| MediaBin (đường `asset:`) | `asset:a_ee0caf7625dd51b4` | giống | rehydrate đúng |
| Nội dung khi pause ở t=0 | nền 12,67 | nền 12,67 | FAIL — xem §3.3 |
| Nội dung khi bấm Phát | mean ~129,0 (draw 4→64) | (không đo lại, cùng code) | vẽ đúng nội dung qua Preview thật |

### 3.3 Lỗi tìm thấy khi đo (a): frame pause đầu không vẽ — KHÔNG sửa ở luồng này

Trace debug (JSON debug DSF=1 + log DSF=2 trong scratch):
element blob hoàn hảo (rs=4, buffered [0,3], vw 640, ct 0, không
lỗi), clip có trên timeline (1 `.tl-clip`), nhưng
`__vcutHoldStats` = draw 0 / hold 0 / skip 1, vòng lặp NGỦ với
`{ticks: 7, sleeping: true, lastDrawn: 0, lastRequested: 0,
pendingSeek: false}`. Cơ chế: tick seek xong ở nhánh pause chạy
khi element chưa có frame (rs < 2) nên `decideVideoFrame` skip
(skip duy nhất 1 lần đó), nhưng code vẫn gán `lastDrawn = t`
vô điều kiện sau `renderFrame` → vòng lặp đủ điều kiện ngủ
(`playhead === lastDrawn`, `lastRequested === playhead`) và
không bao giờ tỉnh lại dù element sau đó đã sẵn sàng. Đối chứng
DSF=1 tái hiện Y HỆT (skip=1, ngủ, lastDrawn=0; bấm Phát vẽ
ngay mean 128,7) — nên lỗi này có sẵn, không đặc thù dpr, không
do sửa T6, và cũng không phải do `asset:` (element đã load đủ).
Hướng sửa (để luồng sở hữu vòng lặp preview quyết, không làm
lén ở đây): chỉ gán `lastDrawn` khi renderFrame thực sự vẽ được
ít nhất 1 clip, hoặc không cho ngủ khi lần vẽ cuối toàn skip.
Phạm vi T6 dừng ở báo cáo + tái hiện chính xác.

### 3.4 Chưa đo (ghi rõ)

- Footage 4K ở dpr > 1; Safari / máy thật / màn hình thật (toàn
  bộ trên Chromium Linux headed, DSF ép bằng flag); dpr phân số
  (1,5 / 1,25); đường `asset:` cho audio/image (chỉ video);
  clip `asset:` ở playhead khác 0 khi pause (chỉ đo pause ở 0
  và phát từ 0).

## 4. Serve A/B cho mobile touch (c)

Cùng script `mobile-touch-check.mjs` (đã có sửa đóng modal của
U5), cùng dist đóng băng (§1), 2 lượt mỗi cách serve, cổng CDP
riêng (9231/9232), Chrome headless của script:

| Lượt | Cách serve | Kết quả | frozenDist |
|---|---|---|---|
| 1 | static server Node (scratch, MIME đúng) cổng 5391 | SCRUB PASS (00:00:00:00 → 00:00:03:10), PINCH PASS (60 → 150), exit 0 | VALID (254 file, manifest trước = sau) |
| 2 | static server cổng 5391 | PASS, exit 0 | VALID |
| 1 | vite preview cổng 5392 (serve đúng dist đóng băng) | PASS, exit 0, số đo giống hệt lượt static | VALID |
| 2 | vite preview cổng 5392 | PASS, exit 0 | VALID |

Kết luận: **cách serve không giải thích được dao động.**
Round 37 FAIL trên vite preview 4173 vs round 38 PASS trên
static server khác nhau ở PHIÊN BẢN SCRIPT (đợt 37 chưa có bước
đóng `WelcomeModal`; các lượt static của U4 chạy trùng lúc U5
sửa script nên đã hưởng sửa đó), không phải ở server. Bằng chứng
này không chạy lại đúng điều kiện đợt 37 (script cũ + dist
DAS3nyo_ đã mất) — nhưng nó loại trừ biến serve một cách trực
tiếp: cùng script + cùng dist thì 2 cách serve cho kết quả đồng
nhất 4/4. Test mobile cũ liên quan: `test-mobile.sh` 58
assertions pass (không liên quan trực tiếp tới CDP touch nhưng
là test mobile hiện có).

## 5. Cổng CPU tự động: thiết kế + khung code, CHƯA KHÓA (d)

### 5.1 Hiệu chuẩn lặp (probe U4, tiêu chí ghi trước giữ nguyên)

Điều kiện: under-load (mục §1) — KHÔNG phải phiên quiet, nên
mọi ngưỡng dưới đây chỉ là đề xuất, không phải ngưỡng khóa.

| Tầng | Lần 1 (3 vòng) | Lần 2 (3 vòng) | Tiêu chí | Kết quả |
|---|---|---|---|---|
| Node busy (% 1 core) | 39,9 / 39,4 / 39,4 | 77,4 / 39,4 / 39,5 | mọi vòng > 50 | TRƯỢT cả 2 lần |
| Node idle | 0,0 / 0,0 / 0,0 | 0,0 / 0,0 / 0,0 | mọi vòng < 20 | đạt |
| CDP H1 | 1,0 / 0,3 / 0,3 | 2,7 / 0,3 / 0,0 | mọi vòng < 20 | đạt 3/3 cả 2 lần |
| CDP H2 | 92,2 / 98,3 / 98,6 | 94,9 / 99,9 / 98,9 | mọi vòng > 50 | đạt 3/3 cả 2 lần |
| Gap CDP (min H2 − max H1) | 91,2 | 92,3 | > 30 | đạt |
| ps lifetime | mù (2,5–2,7 cả H1/H2) | mù (2,7 cả hai) | chỉ ghi số | như S6/T4/U4 |
| allPass / exit | false / 1 | false / 1 | — | giữ ngưỡng cũ |

Đọc trung thực: mức busy ~39–40% lặp lại ở 5/6 vòng T6 (và
41,4% ở vòng 1 của U4) cho thấy sampler tầng Node bị trần bởi
tải nền (4 vCPU, RAM ~88% lúc đo), không phải do busy-loop yếu
— một cổng dựa vào ngưỡng Node > 50 sẽ mở/tắt thất thường theo
tải máy, không theo trạng thái treo thật. Tầng CDP thì ổn định
tuyệt đối qua 3 lần chạy (U4 + T6×2): H1 ≤ 5,7%, H2 ≥ 87,3%.

### 5.2 Khung code (chưa có hiệu lực)

- MỚI `apps/web/src/lib/cpuGate39T6.ts`: hàm thuần
  `evaluateCpuGate(rounds, thresholds?)` → `{lockable, checks,
  reasons}`; hằng `PROPOSED_CPU_GATE` với `locked: false`,
  `minRounds: 3`, CDP (H2 > 50, H1 < 20, gap > 30), Node
  (busy > 50, idle < 20 — ghi rõ CHƯA XÁC NHẬN). Không harness
  nào import nó; không hành vi đo nào đổi.
- Test mới `apps/web/src/lib/cpuGate39T6.test.ts` (8/8): U4,
  T6 lần 1, T6 lần 2 → `lockable=false` với tầng CDP đạt và tầng
  Node chặn; bộ quiet giả định → `lockable=true` (khóa HÀM,
  không phải khóa cổng); ít hơn 3 vòng / gap ≤ 30 / rỗng →
  không lockable.
- Đề xuất khóa (CHƯA thực hiện, cần quyết định riêng): chạy
  probe U4 trong một phiên quiet có điều phối (không chạy chung
  luồng browser khác, ghi rõ loadavg/RAM lúc chạy). Nếu phiên đó
  đạt TẤT CẢ các tầng thì khóa theo đúng `evaluateCpuGate`;
  nếu tầng Node vẫn trượt trong phiên quiet thì phải sửa hoặc
  loại tiêu chí Node khỏi cổng trước khi khóa — cấm khóa chỉ từ
  dữ liệu under-load của U4/T6.
- Sơ suất ghi rõ: lần chạy hiệu chuẩn 2 đã ghi đè JSON của lần
  1 (cùng OUT trong bản sao probe). Số lần 1 còn đủ trong log
  scratch (`logs/cpu-calibration.log`); JSON stage chỉ có lần 2
  (`v39-t6-cpu-calibration.json`). Lần sau mỗi lần chạy phải
  dùng OUT riêng.

## 6. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (3 file):

- `apps/web/src/preview.tsx` — 4 hunk của T6 (§2.2): import
  `stepDrawAllowedWithCompletion` + gỡ `stepDrawAllowed` thừa;
  `seekCompletedThisTick` + `clear()` đầu `syncMedia`; ghi cờ ở
  2 nhánh stepping; guard `drawVideoClip` dùng hàm mới. Không
  đụng hunk của luồng khác (U1 toggle, U2 size, T3/T4 decode-ahead
  đều nguyên vẹn — chỉ đọc, không sửa).
- `apps/web/src/lib/reversePlayback.ts` — thêm
  `stepDrawAllowedWithCompletion` (+ chú thích §2.2); hàm cũ
  không đổi một chữ.
- `apps/web/tsconfig.json` — thêm 2 dòng exclude cho 2 file test
  mới (theo mẫu mọi test file trong repo).

MỚI (2 file code + 1 LIMITS + 5 JSON):

- `apps/web/src/lib/reversePlaybackRound39T6.test.ts` (10/10).
- `apps/web/src/lib/cpuGate39T6.ts` (khung cổng, `locked: false`,
  chưa nối harness).
- `apps/web/src/lib/cpuGate39T6.test.ts` (8/8).
- `docs/PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md` (file này).
- `benchmarks/results/v39-t6-fallback-diag-before.json` (baseline
  §2.1, mẫu 250 ms × 80 + seekLog).
- `benchmarks/results/v39-t6-fallback-diag-after.json` (sau sửa
  §2.3).
- `benchmarks/results/v39-t6-dpr-asset-clicktest.json` (DSF 2+3,
  §3.2).
- `benchmarks/results/v39-t6-dpr-asset-debug-dsf1.json` (trace
  debug đối chứng DSF=1, §3.3; trace DSF=2 nằm ở scratch log
  `logs/dpr-asset-debug.log` — cùng hiện tượng, đã ghi ở §3.3).
- `benchmarks/results/v39-t6-cpu-calibration.json` (hiệu chuẩn
  lần 2, §5.1; lần 1 chỉ còn trong log scratch).

KHÔNG ĐỔI: mọi code sản phẩm khác, script harness của luồng
khác (chạy nguyên bản `mobile-touch-check.mjs`, probe U4 chỉ
sao sang scratch đổi OUT/cổng), paths-loop, build-loop-log.
Scratch chẩn đoán ở `~/workspace/tmp-round39-t6/` (dist đóng
băng, bản sao vite dev + patch diag, log, clip test, dist-verify
của vite build) — không vào batch. Không chạy push-files, không
ghi qua GitHub connector.

## 7. Kiểm chứng gộp của luồng (số thật)

- `tsc --noEmit`: 0 lỗi (sau khi gỡ import thừa + thêm exclude
  test; lỗi trung gian đã sửa, không giấu).
- `vite build --outDir` tạm (không đụng `apps/web/dist`):
  pass 7,85 s, bundle `index-DUErbWLk.js` (build này chứa cả
  code đang sửa dở của luồng khác nên hash không đại diện riêng
  cho T6 — chỉ chứng minh cây build được).
- Unit: `reversePlaybackRound39T6` 10/10, `cpuGate39T6` 8/8,
  `reversePlaybackRound28L2` 17/17 (hồi quy), `holdFrame` 13/13
  (hồi quy), `test-mobile.sh` 58 assertions pass.
- Browser: fallback trước/sau (§2), DPR/asset DSF 2+3 (§3),
  debug DSF=2 + đối chứng DSF=1 (§3.3), serve A/B 4 lượt (§4),
  hiệu chuẩn CPU 2 lần × 3 vòng (§5).

## 8. Nợ mở (không mạo nhận đã xong)

1. Frame pause đầu không vẽ khi seek xong trước khi có frame
   (§3.3): thuộc vòng lặp preview (lastDrawn/sleep) — cần luồng
   sở hữu quyết hướng sửa; tái hiện chính xác bằng seed
   `asset:` + pause ở 0 (DSF nào cũng bị).
2. Frame ngược đầu vẫn 6,9 s (bằng thời gian seek đầu): muốn
   nhanh hơn cần preload/warm decoder hoặc đường WebCodecs cho
   file lớn — cả hai đều cần quyết định thiết kế riêng, ngoài
   phạm vi T6.
3. Cổng CPU chưa khóa (§5.2): cần phiên quiet có điều phối rồi
   mới quyết; ngưỡng Node có thể phải sửa/loại.
4. DPR: chưa đo 4K ở dpr > 1, Safari/máy thật, dpr phân số,
   `asset:` cho audio/image (§3.4).
5. Mọi số timing ở đây đều under-load — cấm dùng làm baseline
   quiet hay claim fps. JSON hiệu chuẩn lần 1 bị ghi đè (chỉ
   còn log) — xem §5.2.

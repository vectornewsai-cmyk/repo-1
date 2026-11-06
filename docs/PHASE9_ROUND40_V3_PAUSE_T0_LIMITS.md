# Phase 9 đợt 40, luồng V3 — Sửa lỗi vòng lặp preview: frame pause tại t=0 không vẽ — LIMITS

Ngày: 03/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary hay dist
vào repo, KHÔNG tạo batch paths (parent gộp). Chỉ sửa file thuộc luồng
mình + 1 dòng exclude trong `tsconfig.json` (file chung, theo mẫu các
đợt trước). Mọi số dưới đây đều đo/chạy thật; chỗ nào chưa đo được thì
ghi rõ, không mạo nhận.

## 0. Kết luận ngắn

1. **Lỗi đã sửa, có bằng chứng browser.** Pause tại t=0 nay vẽ được
   frame đầu ở cả DSF=1 và DSF=2 (đối chứng trực tiếp, §4): canvas
   hiện nội dung (centerMean ~127–130 thay vì nền 12,67), vòng lặp
   ngủ LẠI với frame đã vẽ (`lastDrawn = 0`, `sleeping = true`) thay
   vì ngủ với nền đen như trước.
2. **Hướng sửa gợi ý trong LIMITS T6 §3.3 ("chỉ gán `lastDrawn` khi
   renderFrame thực sự vẽ được") là ĐÚNG nhưng CHƯA ĐỦ** — đã tự kiểm
   chứng và bổ sung nửa còn lại (§2.3). Chỉ giữ `lastDrawn` thôi thì
   vòng lặp tick mãi không vẽ gì (nhánh pause chỉ vẽ trong `.then`
   của seek, mà seek đã xong rồi), tức đổi "ngủ với nền đen" thành
   "quay với nền đen". Sửa đầy đủ = giữ `lastDrawn` có điều kiện +
   tick vẽ lại không seek mới.
3. **Không hồi quy đường T6.** Guard 2 s và cờ `seekCompletedThisTick`
   (frame đầu 17,808 ms → 6,886 ms trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa']) không đụng tới
   một chữ: sửa chỉ nằm trong nhánh pause/seek, đường stepping
   (playing) nguyên vẹn; test khóa T6 10/10 vẫn xanh (§5). Con số
   17,808 → 6,886 ms KHÔNG đo lại trong luồng này (đường đó không đổi
   nên không có gì để đo lại; đo lại cũng chỉ là số under-load mới).

## 1. Nguyên nhân gốc (đã kiểm chứng từ code, khớp trace T6 §3.3)

Chuỗi sự kiện ở nhánh pause/seek trong `preview.tsx`:

1. Tick đầu: `t = 0`, `lastDrawn = null`, `lastRequested = null` →
   request seek qua Seeker (`lastRequested = 0`, `pendingSeek = true`).
2. Seek hoàn tất (`seeked` bắn, `timedOut = 0`, `ok = true`) NHƯNG
   element chưa có frame (`readyState < 2` — seeked không đảm bảo đã
   có frame giải mã xong, nhất là dưới tải; xem thêm ghi chú đợt 31
   N1 trong `seek.ts` về trường hợp `seeking = true, ct = target,
   rs = 1`). `.then` gọi `renderFrame`.
3. `renderFrame` xóa nền đen trước, rồi `drawVideoClip` gọi
   `decideVideoFrame`: ở nhánh pause (`paused = true`,
   `stepping = false`) thì `rs < 2` → `skip` (không có frame giữ để
   vẽ lại — hold chỉ xảy ra khi đang phát/stepping). Canvas chỉ còn
   nền đen.
4. Code cũ gán `lastDrawnTRef.current = t` VÔ ĐIỀU KIỆN sau
   `renderFrame` → tick sau đủ điều kiện ngủ (`playhead === lastDrawn`,
   `lastRequested === playhead`, không seek bay) → `sleeping = true`.
5. Không còn gì đánh thức vòng lặp: element sẵn sàng sau đó không
   chạm store, không có store change / resize / visibility change →
   **ngủ vĩnh viễn với nền đen**, đúng dấu vết T6 đo được
   (`draw 0 / hold 0 / skip 1`, `sleeping: true`, `lastDrawn: 0`,
   `lastRequested: 0`). Bấm Phát thì vẽ ngay vì nhánh playing vẽ mỗi
   tick không qua điều kiện ngủ này.

Vì sao đối chứng DSF=1 tái hiện y hệt (T6): lỗi nằm trong vòng lặp
chung, không liên quan DPR/backing — code sửa cũng nằm ở vòng lặp
chung, không chạm logic DPR.

## 2. Cách sửa

### 2.1 Hai hàm thuần mới — `apps/web/src/lib/pauseDraw40V3.ts`

- `pauseDrawComplete(beforeSkip, afterSkip)`: true khi lần render
  vừa rồi không skip thêm clip video nào. Đo bằng delta
  `holdStats.skip` của `preview.tsx` (snapshot trước/sau
  `renderFrame`). Vì sao delta skip là đủ, không cần đếm clip đã vẽ:
  ở nhánh pause, `decideVideoFrame` chỉ trả draw hoặc skip cho video
  (hold chỉ khi phát/stepping); track ẩn, clip không active, clip
  ảnh/chữ/sticker, clip thiếu media (vẽ placeholder "Thiếu media")
  và đường WebCodecs đều không chạm `holdStats.skip`, nên delta 0
  nghĩa là không có clip video active nào bị bỏ lại với nền đen.
- `pauseTickNeedsRetry(t, lastDrawn, lastRequested, pendingSeek)`:
  true khi seek đã xong cho chính `t` (`lastRequested === t`), frame
  tại `t` chưa được đánh dấu đã vẽ (`lastDrawn !== t`), và không có
  seek nào đang bay (`!pendingSeek` — seek đang bay thì chờ `.then`
  của nó để khỏi vẽ frame sai vị trí).

### 2.2 Hai hunk trong `apps/web/src/preview.tsx` (marker `// ROUND40-V3-T0`)

1. **`.then` của seek ở nhánh pause:** snapshot `holdStats.skip`,
   gọi `renderFrame` như cũ, chỉ gán `lastDrawn = t` khi
   `pauseDrawComplete` true. Không vẽ được thì giữ nguyên `lastDrawn`
   cũ + `lastRequested = t` (KHÔNG reset `lastRequested` — reset sẽ
   gây seek lại, tốn decode lại trong khi element đã ở đúng target).
2. **Tick vẽ lại (ngay sau khối request seek, cùng nhánh pause):**
   khi `pauseTickNeedsRetry(...)` thì vẽ lại (`drawTransport =
   {playing: false, ...}` như `.then`) mà KHÔNG seek mới; vẽ được thì
   `lastDrawn = t` và vòng lặp ngủ lại bình thường, vẫn skip thì tick
   tiếp. Không seek storm: `lastRequested` giữ nguyên `t` nên khối
   request không bao giờ chạy lại trong lúc chờ vẽ.

### 2.3 Vì sao hướng T6 một mình là chưa đủ (đã kiểm chứng bằng lập luận + test)

Nhánh pause CHỈ vẽ trong 2 nơi: `.then` của seek và (nay thêm)
tick vẽ lại. Nếu chỉ làm (a) giữ `lastDrawn`: sau lần skip đầu,
`lastDrawn ≠ playhead` nên vòng lặp không ngủ (đúng), nhưng mọi tick
sau đều rơi vào trường hợp `t === lastRequested` → không request
mới → không `.then` mới → không render nào nữa. Canvas kẹt nền đen,
chỉ khác là vòng lặp quay rAF vô ích thay vì ngủ. Test mô phỏng
trong `pauseDraw40V3.test.ts` khóa cả hai phía: mô hình code cũ
(skip → ngủ với nền đen) và code mới (skip → thức → vẽ lại → ngủ
với frame).

### 2.4 Không đổi (đã đối chiếu bằng grep, không sửa)

- Nhánh playing: vẫn gán `lastDrawn = t` mỗi tick như cũ (playing
  không bao giờ ngủ nên không kẹt; cạnh xuống `justPaused` reset để
  vẽ lại như cũ).
- Guard 2 s (`stepDrawAllowed`) + bypass tick vừa hoàn tất seek
  (`stepDrawAllowedWithCompletion`, `seekCompletedThisTick`) của T6:
  nguyên vẹn (7 tham chiếu trong `preview.tsx` còn đủ).
- Toggle/badge Q3 decode-ahead, GOP wiring (`gopRangeFetch`,
  `reverseWebcodecs`), `seekRuler`: không đụng.
- Không reformat file; chỉ thêm import + 2 hunk + 1 dòng exclude
  test trong `tsconfig.json` (theo mẫu các đợt trước).

### 2.5 Đánh đổi ghi rõ

- Media hỏng vĩnh viễn (element không bao giờ có frame): vòng lặp
  tick ở tốc độ rAF với lần render rẻ (nền đen + early-return ở clip
  skip) thay vì ngủ — KHÔNG đặt giới hạn số lần vẽ lại, vì giới hạn
  sẽ phá hội tụ khi element sẵn sàng muộn dưới tải (cùng lý do đợt
  32 O3 không giới hạn retry seek). Không có seek storm (không seek
  mới nào được phát trong lúc chờ vẽ).
- Trường hợp `pool.videoFor` trả null (element chưa tồn tại) và clip
  ảnh chưa load xong: không chạm `holdStats.skip` nên hành vi giữ
  như cũ (ngủ, chờ media-identity change đánh thức) — ngoài phạm vi
  luồng này, xem nợ §6.

## 3. File đổi/thêm (text, không binary, không dist — parent gộp batch)

SỬA (2 file):

- `apps/web/src/preview.tsx` — import `pauseDraw40V3` + 2 hunk marker
  `// ROUND40-V3-T0` (§2.2). Không đụng vùng của luồng khác.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude
  `src/lib/pauseDraw40V3.test.ts` (theo mẫu mọi test file trong repo).

MỚI (2 file code + 1 LIMITS này):

- `apps/web/src/lib/pauseDraw40V3.ts` — 2 hàm thuần (§2.1).
- `apps/web/src/lib/pauseDraw40V3.test.ts` — 11 test (§5).

KHÔNG ĐỔI: mọi code sản phẩm khác, paths-loop, build-loop-log.
Scratch chẩn đoán ở `~/workspace/tmp-round40-v3/` (dist build tạm,
clip test `t6-asset-clip.mp4` tự tạo bằng ffmpeg, script
`pause-t0-debug.mjs`, JSON kết quả) — không vào batch.

## 4. Đối chứng browser (Chromium headed thật, Xvfb :98)

Phương pháp: tái dùng cách seed của T6 (fetch clip testsrc2 640×360
3 s — đúng 300.336 byte như clip T6 — ghi IDB `vcut-studio-assets` +
autosave có clip `asset:<id>`, reload để App rehydrate), nhưng serve
bằng static server trên **dist đã build từ code CÓ sửa V3** (bundle
`index-Ddhrenhi.js`) thay vì vite dev scratch của T6, và KHÔNG bấm
Phát trước khi kết luận (pha pause 15 mẫu × 1 s). Tiêu chí PASS:
5 mẫu pause cuối có centerMean khác nền 12,67 quá 2 đơn vị VÀ
`hold.draw ≥ 1` VÀ backing đúng trần `min(dpr,2)`.

| Lượt | DSF | CSS → backing | Pause t=0 (không bấm Phát) | Kết quả |
|---|---|---|---|---|
| 1 | 1 | 711×232 → 711×232 | mean 130,0; hold draw 1 / skip 0; idle ngủ với `lastDrawn = 0` | PASS |
| 2 | 2 | 712×234 → 1424×468 (đúng trần `min(2,2)`) | mean 127,5; hold draw 1 / skip 0; idle ngủ với `lastDrawn = 0` | PASS |
| 3 (tải nặng: 3 busy-loop CPU nền) | 1 | 711×232 → 711×232 | mean 130,0; hold **draw 1 / skip 3**; idle ngủ với `lastDrawn = 0` | PASS — **đường retry chạy thật** |

Đọc lượt 3: dưới tải, 3 lần render đầu bị skip (element chưa có
frame — đúng race của lỗi gốc), rồi 1 lần vẽ lại vẽ được (draw 1),
canvas hiện nội dung, vòng lặp ngủ LẠI với frame. Dưới code cũ,
lần skip ĐẦU TIÊN đã gán `lastDrawn = 0` → ngủ với nền đen và skip
dừng ở 1 (đúng trace T6) — không bao giờ tới được draw 1. Lượt 1–2
vẽ được ngay lần đầu (clip nhỏ, tải nhẹ) nên chỉ chứng minh "pause
t=0 hiện nội dung + không hồi quy đường thường"; lượt 3 mới là bằng
chứng browser cho chính đường retry.

JSON: `~/workspace/tmp-round40-v3/results/v40-v3-pause-t0-dsf1.json`,
`...-dsf2.json`, `...-dsf1-load.json` (scratch, không vào batch).
Sanity cuối mỗi lượt: bấm Phát vẫn phát bình thường (mean ~127,
draw tăng đều; mẫu cuối ở 00:03.0 về nền 12,7 là do clip đã phát
hết — không phải lỗi).

Giới hạn của đối chứng: DSF=2 + race (skip rồi retry) chưa bắt được
trực tiếp (lượt DSF=2 vẽ ngay lần đầu); nhưng code sửa nằm ở vòng
lặp chung, không phụ thuộc DPR, và lượt DSF=1 dưới tải đã bắt được
race — xem nợ §6.1.

## 5. Kiểm chứng gộp của luồng (số thật)

- Unit mới `pauseDraw40V3`: **11/11** (predicate 2 + retry 5 + mô
  phỏng vòng lặp 5, gồm mô hình bug cũ và 3 kịch bản sửa mới).
- Hồi quy T6 (khóa bypass tick hoàn tất seek): `reversePlaybackRound39T6`
  **10/10**; `reversePlaybackRound28L2` **17/17**; `holdFrame`
  **13/13**; `seek` **15/15**.
- `tsc --noEmit` (apps/web): **0 lỗi** ở lần chạy cuối. Ghi rõ nhiễu
  giữa chừng: lần chạy tsc + vite build đầu tiên đọc trúng lúc các
  luồng đợt 40 khác đang ghi file chung (`tsconfig.json` lỗi JSON
  giữa chừng; `reverseWebcodecs.ts` và `cpuGateNodeDiag40V6.ts` của
  luồng V2/V6 đang sửa dở) — đó là trạng thái trung gian của cây
  đang sửa song song, KHÔNG phải lỗi của luồng này; chạy lại sau khi
  cây ổn định thì sạch. Parent gộp nên chạy lại tsc/build sau khi
  mọi luồng đợt 40 xong.
- `vite build --outDir` tạm (không đụng `apps/web/dist`): **pass
  35,38 s**, bundle `index-Ddhrenhi.js`; cảnh báo chunk > 500 kB cũ.

## 6. Nợ mở (không mạo nhận đã xong)

1. **DSF=2 + race chưa bắt trực tiếp:** lượt DSF=2 vẽ ngay lần đầu;
   bằng chứng race ở browser hiện chỉ có ở DSF=1 dưới tải (§4 lượt
   3). Muốn khóa chặt hơn: chạy lại lượt DSF=2 dưới tải nặng.
2. **Con số T6 17,808 ms → 6,886 ms không đo lại:** đường stepping
   không đổi, chỉ khóa bằng unit test (§5); nếu parent muốn số
   browser mới cho đường ngược thì cần chạy lại diag fallback của T6
   trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] 420 MB.
3. **Media hỏng vĩnh viễn → vòng lặp tick rAF mãi** (§2.5): rẻ nhưng
   không ngủ; chấp nhận có chủ đích, chưa có cơ chế cho ngủ sau N lần
   skip (cơ chế đó cần cân với hội tụ dưới tải — để luồng sở hữu
   vòng lặp quyết nếu muốn thêm).
4. **Pool-miss và ảnh chưa load:** vẫn giữ hành vi cũ (§2.5), chưa
   có test browser cho 2 trường hợp này.
5. **Chưa đo:** dpr phân số (1,5/1,25), 4K ở dpr > 1, Safari/máy thật
   (toàn bộ trên Chromium Linux headed, DSF ép bằng flag) — cùng
   giới hạn như T6 §3.4.

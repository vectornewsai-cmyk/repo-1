# PHASE9_ROUND102_D2_GHOST_LIMITS — tap rVFC độc lập: anchor hết phân kỳ nhưng ghost chưa khỏi → KHÔNG LAND

> Luồng D2, đợt 102, lượt cron 09:35 +07 13/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> Nợ LIMITS gộp đợt 101 §4 mục 4: Ghost residual — F5 bị bác bằng counterfactual;
> cần hướng fix mới. Hướng thử ở đây: **F7 tap rVFC độc lập** (spec C2 §7 — hướng duy
> nhất còn đứng sau đợt 101).
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính (5 ý):**
> 1. **Tap chạy đúng cơ chế, anchor hết phân kỳ sau pump chết + seek (CHỨNG MINH):**
>    flip-protocol với tap bật: gap presented−expected giữ trung vị **1,0**, |gap|≤3
>    đạt **94–96% ở mọi cửa sổ hậu flip kể cả 15s+** (C2 không tap: +80 ở seek đầu,
>    +1028 ở seek cuối, |gap|≤3 = 0% sau 5s). Không còn tăng trưởng theo seek.
> 2. **Nhưng ghost residual CHƯA khỏi — KHÔNG LAND:** snapshot-label clean chỉ
>    **52,4% (B) / 53,8% (flip)** so với baseline **40,5% / 45,0%** — dưới bar đăng
>    ký trước (≥70% và hơn baseline ≥20 điểm). Spread vẫn fail (45,3 ở flip).
> 3. **Nguyên nhân (phân tích cơ chế): tap không thể sửa NHÃN snapshot** — nhãn lấy
>    từ currentTime lúc capture, tap chỉ sửa `presented` → quyết định skipLatest.
>    Clean/spread đo nhãn snapshot nên tap không chạm được vào chúng.
> 4. **Độ chính xác của presented: 26% (frameIdx) → 46% (B) / 60% (flip)** theo
>    strip curPix; và phụ thuộc mạnh vào tuổi anchor: **[0,50ms): 69–78%**,
>    [50,100ms): 28–31%, [100,200ms): 16–37% — ngưỡng tươi 500ms QUÁ LAX, anchor
>    cũ ngoại suy sai 70%+ thời gian.
> 5. **Production đã REVERT hoàn toàn** (0 marker D2; md5 cuối khác baseline CHỈ do
>    luồng D3 land song song — không động vào phần D3). Batch stage chỉ có file này.

## 0. Môi trường đo + xung đột luồng

- Boot **249407b6-27ba-436a-9aab-abcbde721eb8 — KHÁC boot C2 3a12a7d3**: máy đã reboot
  thêm 1 lần sau phiên C2 (uptime 32' lúc 02:44Z ⇒ boot ~02:12Z 13/11). Ghi cho
  luồng EPERM (reboot #26 — số thứ tự do parent/EPERM chốt).
- RAM khả dụng 713 MB lúc bắt đầu → 2796 MB lúc đo (dao động theo luồng khác).
  Load: run A 4,93 → 1,72; run B 5,99 → **21,41** (nặng — các luồng đợt 102 khác);
  run C 3,03 → 2,08.
- Vite riêng D2 trên 5173 (chạy từ `apps/web` — chạy từ repo root crash ENOSPC
  watchers như C2 đã ghi). Verify serve code trước probe: `PresentedTap` ×21.
- **Xung đột luồng: D3 sửa `preview.tsx` SONG SONG trong phiên** (land
  `rvfcClipWindow`: import + kill đồng bộ pump + chặn capture stale + hoãn tạo
  pump; lib `rvfcClipWindow.ts` mtime 03:18:38Z, test 03:18:47Z). D2 kiểm md5
  trước mỗi probe: baseline 07f56792 → sau edit D2 833ca8ef → sau revert ed260e62
  (+90 dòng = đúng phần D3, 0 marker D2 còn lại). D2 KHÔNG động vào phần D3.
  Tsc lúc đầu báo 1 lỗi TS5097 ở file test của D3 (import `.ts`); lúc kiểm cuối
  tsc đã **0** (D3 tự sửa sau đó).
- Probe: `probe102d2-ghost.cdp.mjs` (copy probe101c2 + cờ `--disable-tap` mới).
  Analyzer: `analyze-d2.py` (copy analyze-c2.py + breakdown theo anchorSrc),
  `analyze-d2-flip.py` (copy + breakdown anchorSrc), `analyze-d2-presented.py`
  (MỚI — độ chính xác presented qua strip curPix, §3).
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
- **WebKit: KHÔNG chạy được** (như C2 — không có driver). Mọi kết luận nhân quả
  chỉ đo trên Chromium. Tap VÔ DỤNG trên WebKit theo thiết kế (rVFC không bắn).

## 1. Fix đã thử — F7 tap rVFC độc lập (đã revert)

Thiết kế (đăng ký trước trong boot.log; code đã revert, mô tả để luồng sau tái dùng):

- Tap = 1 đăng ký rVFC RIÊNG trên cùng element video, callback CHỈ cập nhật anchor
  trình chiếu (`lastFrameIdx` + `lastExpectedDisplayTime` + `lastTapMs`), KHÔNG
  capture pixels, KHÔNG động ring, KHÔNG động pump.
- Chạy SONG SONG với pump (ensure cùng block drawVideoClip với ensureRvfcPump,
  không phụ thuộc `snapshotsViaRvfc`); vòng đời mirror pump (stale >1500ms thì
  dừng đăng ký lại; kill khi element đổi chủ). KHÔNG gate bởi `__vcutDisableRvfc`
  hay `rvfcDeadClips` (đó là điểm cứu đường tick khi pump chết); CÓ gate bởi
  `rvfcSilentEngine` + hook test `__vcut102d2PresentedTap=false`.
- `presentedFrameIndex` chọn anchor TƯƠI NHẤT giữa pump và tap (ngưỡng 500ms);
  cả 2 đều cũ → rơi về frameIdx (triệt drift ngoại suy đóng băng).
- Blend-tick log thêm `anchorSrc` ("pump"|"tap"|"frameIdx") + `anchorAgeMs`.

## 2. A/B — run A baseline (tap TẮT) vs run B (tap BẬT), --disable-rvfc, 20 pass, case B

| | A — tap TẮT | B — tap BẬT |
|---|---|---|
| Thời gian (Z) | 02:57:31–02:59:02 | 03:00:32–03:03:40 |
| Blend tick | 435 | 294 |
| Gap blend-tick trung vị | 92,2ms | 145,9ms (tải nặng hơn) |
| Snapshot distinct / đơn-nghĩa | 162 / 111 | 141 / 103 |
| **Clean** | **45/111 = 40,5%** | **54/103 = 52,4%** (+11,9pt) |
| anchorSrc trên toàn bộ tick | frameIdx 435/435 | **tap 294/294 (100%)** |
| presented accuracy (curPix, §3) | 26,4% (53/201) | 46,2% (78/169) |
| Assert | 1 fail (spread 45,6; nGroups=21) | PASS — NHƯNG VACUOUS (spread nGroups=1, skipped=289; assert bỏ qua khi <5 nhóm) |
| CF δ* tốt nhất | +0 (41%) — F5 chết lần nữa | — |
| P2 (rawCt) | 41,4% vs baseline 40,5% | 53,4% vs baseline 52,4% |

- Hook tắt tap được verify: run A `presentedTapCallbacks=0`, `presentedTapActive=false`
  ở cả 20 pass; run B tap callbacks tới 226, active=true cả 20 pass.
- Bar đăng ký trước: clean ≥70% VÀ hơn baseline ≥20 điểm, n≥40 mỗi bên.
  **B đạt 52,4% (+11,9pt) — KHÔNG ĐẠT BAR.**
- gStd theo offset presented−frameIdx (run B): offset 0 (n=19) gStdMed **37,6**
  (tmix đúng); offset +1 (n=4) 60,0; −1 (n=8) 59,9; +3/+5/+8/+9 (n=1–2) 112,4
  (ringSize=1, đơn-frame). Khi presented==frameIdx thì blend đúng; khi khác thì
  hiệu quả không rõ (n nhỏ + nhiễu mislabel snapshot) — không dùng để kết luận.

## 3. Run C — flip-protocol với tap BẬT (seek-resync): anchor hết phân kỳ

Flip sau pass 5, 20 pass, case B (như C2, chỉ khác tap bật):

| Hậu flip | n | Gap trung vị | Min–max | \|gap\|≤3 | C2 không tap (để so) |
|---|---|---|---|---|---|
| [0, 2000)ms | 10 | 2,0 | 0…6 | 8/10 (80%) | 32/32 (100%) |
| [2000, 5000)ms | 22 | 1,0 | −1…6 | 20/22 (91%) | 9/33 (27%) |
| [5000, 15000)ms | 114 | 1,0 | −1…6 | 110/114 (96%) | 0/154 (0%) |
| [15000ms+) | 177 | 1,0 | −1…12 | 166/177 (94%) | 0/605 (0%) |

- Gap tại mỗi seek hậu flip: 6, 6, 5, 2, 3, 2, 3, 5, 6, 3, 5, **12**, 6, **10** —
  KHÔNG tăng theo seek (C2: 80, 158, 233, …, 1028). 10 gap đầu: [6,1,2,0,0,2,4,3,2,0];
  10 gap cuối: [1,1,2,−1,0,2,0,1,3,3].
- 2 ngoại lệ +10/+12 là 1 tick duy nhất ngay lúc seek: callback tap trễ + element
  đang seek-stall (currentTime đứng yên) trong khi ngoại suy cứ đếm tiếp — tự
  hồi phục ở callback sau (resync). Cơ chế này cũng giải thích gap +5 ở tick đầu
  run B (anchor 182ms tuổi ngoại suy +5 khung trong lúc element chưa chạy đều).
- Snapshot đường tick hậu flip+2000ms: distinct 121, đơn-nghĩa n=91,
  **clean 49/91 = 53,8% (toàn anchor=tap)** vs baseline C2 **45,0% (n=151)**.
- Assert flip run: 1 fail (spread 45,3; nGroups=11) — như C2.
- **Kết luận phần flip: claim "tap giữ anchor tươi qua pump chết + seek" ĐÃ ĐƯỢC
  CHỨNG MINH.** Gap trung vị +1 là pha lead kỳ vọng (trình chiếu dẫn currentTime
  ~1 khung, khớp W4), không phải lỗi.

## 4. Độ chính xác của presented theo tuổi anchor (phân tích mới)

Phương pháp: strip curPix (frame hiện tại vừa vẽ, đường mask) đối chiếu frame nguồn
trong cửa sổ presented±3 (khóa như phân loại snapshot — mẫu sọc tuần hoàn chu kỳ
4 khung nên không tìm khắp 90 frame). Hit = strip khớp duy nhất presented.

| | A (frameIdx) | B (tap) | C (flip, tap) |
|---|---|---|---|
| Presented accuracy (hit/det) | 26,4% (53/201) | 46,2% (78/169) | 60,3% (126/209) |
| Ambiguous | 234/435 | 125/294 | 182/391 |

Accuracy theo tuổi anchor lúc blend (B + C gộp mẫu):

| Tuổi anchor | B | C |
|---|---|---|
| [0, 50)ms | **69%** (50/72) | **78%** (107/137) |
| [50, 100)ms | 28% (15/53) | 31% (15/49) |
| [100, 200)ms | 37% (11/30) | 16% (3/19) |
| [200, 500)ms | 14% (2/14) | 25% (1/4) |

- Tuổi trung vị: HIT 19ms (B) / 10ms (C) vs MISS 85ms / 79ms.
- **Ngưỡng tươi 500ms QUÁ LAX:** anchor 50–500ms tuổi ngoại suy sai 70%+ thời
  gian (trong khoảng đó video thường stall/seek/decode không đều dưới tải nên
  trình chiếu KHÔNG tiến đều 30fps như công thức giả định). Siết ngưỡng về
  ~50ms sẽ chỉ dùng anchor khi nó còn tươi; các tick còn lại rơi về frameIdx
  (26%) thay vì ngoại suy sai (28% — không tệ hơn bao nhiêu, nhưng cũng không
  tốt hơn). Đây là hướng chỉnh, CHƯA đo lại (xem §6).
- Lưu ý: probe tự gây tải (getImageData toàn canvas mỗi khung rAF) làm callback
  trễ thêm — tuổi anchor ngoài đời thật (không probe) có thể tươi hơn; nhưng
  không có số đo đó nên không mạo nhận.

## 5. Verdict — KHÔNG LAND + vì sao + đã revert những gì

| Tiêu chí đăng ký trước | Kết quả | Đạt? |
|---|---|---|
| B clean ≥70% và hơn A ≥20pt | 52,4% (+11,9pt) | **KHÔNG** |
| C chứng minh resync sau seek | Gap bounded, \|gap\|≤3 94%, không tăng theo seek | **CÓ** |
| Không hồi quy | tsc 0, vite build PASS, ghostBlend 15/15, previewEngine 27/27 (trên cây revert); run A/C assert chỉ fail spread như baseline | **CÓ** |

- **KHÔNG LAND vì bar đăng ký trước không đạt.** Tap sửa được anchor (mục 1)
  nhưng không sửa được ghost residual như đo bằng clean/spread — và ghost mới là
  nhiệm vụ của luồng. Land lúc này sẽ là "sửa production chỉ để trông như đã fix".
- **Phân tích cơ chế (vì sao clean không lên):** nhãn snapshot lấy từ currentTime
  lúc capture (`updateMotionBlurSnapshots(..., frameIdx)`); tap chỉ đổi `presented`
  → quyết định skipLatest trong `compositeMotionBlurLayer`. Clean/spread đo NHÃN
  snapshot nên tap không chạm được. Muốn clean lên phải sửa tầng gán nhãn
  snapshot, không phải tầng presented — xem F8 ở §6.
- **Đã revert:** toàn bộ code F7 khỏi `preview.tsx` (interface, tap state +
  callback + ensure + kill, `presentedFrameIndex` bản mới, `anchorSrc` log,
  `ensurePresentedTap` ở drawVideoClip). Verify: grep marker D2 = **0**;
  `presentedFrameIndex` + `blendPresentedFrame.set` + `recordDrawnBlendWindow`
  về đúng bản gốc; md5 cuối **ed260e62** (khác baseline 07f56792 CHỈ do D3 land
  song song — D2 không động vào phần D3, không thử khôi phục md5 cũ vì sẽ xóa
  công việc của D3).
- **Giới hạn đã biết của tap (nếu luồng sau làm lại):** vô dụng trên WebKit
  (rVFC không bao giờ bắn — divergence sau pump chết vẫn còn nguyên ở đó);
  chỉ cứu trường hợp pump chết trên Chromium (hiếm — pump thường sống); 1 đăng
  ký rVFC thêm mỗi clip có blur (callback rẻ — chỉ cập nhật 3 trường — nhưng
  vẫn là chi phí + độ phức tạp); registration pending có thể dangle trên engine
  im lặng tới khi element đổi chủ/bị drop (cùng dạng với pump pending).

## 6. Nợ mở + đề xuất cho đợt sau

1. **F8 — relabel snapshot bằng anchor tap (hướng mới, CHƯA thử):** nhãn snapshot
   lúc capture lấy từ `presentedFrameIndex` (anchor tap/pump) thay vì
   `floor(currentTime·30)`. Nếu presented đúng 69–78% khi tươi thì clean có thể
   lên tương ứng — ĐÂY mới là fix chạm trực tiếp vào metric clean. Cần A/B
   riêng với bar clean như cũ; rủi ro: nhãn presented sai ~25% khi tươi sẽ gán
   sai nhãn theo hướng khác — đo rồi mới kết luận.
2. **Siết ngưỡng tươi anchor 500ms → ~50ms + đo lại:** anchor cũ sai 70%+ (§4);
   đo lại presented accuracy + gap với ngưỡng 50ms. Rẻ (1 hằng số) nhưng vẫn
   cần A/B đầy đủ — không tự land.
3. **F6' pixel-verified skipLatest** (C2 §7): vẫn đứng cho WebKit (nơi tap vô
   dụng) — so strip snapshot mới nhất với curPix để quyết skip, không cần rVFC.
4. **Spread đường tick vẫn fail (45,3–45,6):** do mislabel snapshot trong ring,
   không phải do skipLatest — mọi fix chỉ sửa presented đều không chạm được;
   chỉ F8 (hoặc F6') mới có cơ hội.
5. Nợ khác đứng yên theo LIMITS gộp đợt 101 §4: G1 chờ user quyết metric G5/M2;
   2 MiB; re-arm drift-gate đã land (C3); blur r7; zombie seek-across; EPERM
   probe #21 + khoảng mù #20 (boot mới 249407b6, reboot ~02:12Z 13/11 — EPERM
   thread tự cập nhật); birefnet 0 lần; TTS 39 CẤM kiểm lại; ci-security.yml 403;
   release gate không đổi.

## 7. Kiểm chứng (cây đã revert)

- `tsc` apps/web: **0** (lúc đầu có 1 lỗi TS5097 ở file test của D3 — D3 tự sửa
  trong phiên; lỗi đó không phải của D2).
- `vite build`: **PASS 10,15s**.
- `ghostBlend.probe.test.ts`: **15/15 PASS**.
- `previewEngine.test.ts`: **27 ✓** (C4 thêm 2 test so với 25 của C2).
- Probe assert: A 1 fail (spread — kỳ vọng ở đường tick); B PASS vacuous
  (spread nGroups=1 — không tính); C 1 fail (spread — kỳ vọng).
- Không sửa file Y2/Z2/A2/B2/C2; không đụng drift Y4 / watchdog Y5 / clip-change
  Y7 / re-arm Z3 / B3 / B4 / C3 / D3.

## 8. File D2 tạo/sửa (batch stage)

- `docs/PHASE9_ROUND102_D2_GHOST_LIMITS.md` — file này (DUY NHẤT trong batch).
- `apps/web/src/preview.tsx` — ĐÃ REVERT hoàn toàn, KHÔNG vào batch.
- Scratch đo (không vào batch):
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d2/`
  (`boot.log`, `probe102d2-ghost.cdp.mjs` (copy C2 + cờ `--disable-tap`),
  `analyze-d2.py` (copy C2 + breakdown anchorSrc),
  `analyze-d2-flip.py` (copy C2 + breakdown anchorSrc),
  `analyze-d2-presented.py` (MỚI — accuracy presented qua curPix + theo tuổi anchor),
  `preview-b-norvfc-d2-tapoff.json`, `preview-b-norvfc-d2-tapon.json`,
  `preview-b-flip-d2-tapon.json`, `run-a-tapoff.log`, `run-b-tapon.log`,
  `run-c-flip-tapon.log`, `analyze-d2-tapoff.txt`, `analyze-d2-tapon.txt`,
  `analyze-d2-flip-tapon.txt`, `analyze-d2-presented.txt`, `vite-5173-d2.log`).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round102-d2-ghost.txt`
  (NUL-delimited, 1 entry). KHÔNG push GitHub; user tự push sau từ main chat.

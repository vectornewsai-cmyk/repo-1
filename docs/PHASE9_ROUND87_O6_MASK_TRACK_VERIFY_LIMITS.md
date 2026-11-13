# LIMITS — Phase 9 đợt 87, luồng O6: kiểm chứng độc lập mask bám motion track

Ngày: 11/11/2026 (lượt cron 12:35 +07). Luồng kiểm chứng độc lập: KHÔNG tin
báo cáo luồng khác, tự chạy lại mọi thứ dưới đây. KHÔNG sửa production
(không có thay đổi nào vào `mask.js`/`render.js`/`preview.tsx` từ luồng này).
KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39, KHÔNG đụng file workflow.

Phạm vi kiểm chứng: O1 (spec `maskGeometryAtTrack`), O2 (render đường video
mask mặc định), O3 (render `--mask-mode trackgeq`), O4 (preview), O5 (UI +
validator wording). O7 (benchmark) và O9 (gap backfill) được đối chiếu số
liệu, không kiểm lại toàn bộ. O8 (click-test headed preview) và O10 (eperm)
vẫn đang chạy lúc viết file này — xem §7.

## 0. Kết luận ngắn

**Mask bám motion track ĐÃ HOẠT ĐỘNG ĐÚNG ở cả 2 đường render** (video mask
mặc định của O2 và geq động của O3), đo bằng pixel thật trên render 720p:

- Tâm mask đo được khớp quỹ đạo tuyến tính với sai số ≤ 0,001 ở mọi mốc đo
  (0,275 / 0,499 / 0,725 tại t = 0,5 / 2,0 / 3,5; kỳ vọng 0,275 / 0,5 / 0,725).
- T của geq là **thời gian clip-local** (clip.start = 1,0 vẫn cho cùng tâm
  tại local t tương ứng) — khẳng định claim của O3.
- Video đứng yên khi mask bám track (không double-shift `2*track - 0,5`):
  chứng minh bằng pixel phân biệt (xem C7).
- Hồi quy bằng 0: frame render lại đúng spec của O7 (trước thay đổi) cho
  **MAD = 0, max = 0** cả 3 đường tĩnh/keyframes.
- Unit / validator / mirror chéo: toàn bộ pass (chi tiết §1–§2).
- **Phát hiện chính (cần parent quyết, xem §5.1):** validator warning và
  UI O5 state `"transition"` nói track "bị bỏ qua" khi clip dính
  transition — **SAI đối với mask**: C6 chứng minh mask vẫn bám track qua
  transition (tâm 0,275 / 0,499 / 0,649). Chỉ D3 unit-shift mới bị bỏ qua.
  O2 đã tự ghi nhận vấn đề tương tự cho clip image (§5.1 của O2_LIMITS) và
  hoãn sửa tới lúc gộp; luồng này KHÔNG tự sửa câu warn (xem §5.1).

## 1. Unit — hình học (chạy lại 2 lần, lần 2 sau khi O2 hạ cánh)

Harness: `server/render/test_r87_o6_mask_track_verify.js` (§A) và
`server/render/test_r87_o6_remeasure.js` (chạy lại toàn bộ A+B).

| Kiểm tra | Kết quả |
|---|---|
| `maskGeometryAtTrack` không track (undefined/null/points rỗng) == `maskGeometryAt` tại t = -1/0/1,3/5 | ✅ |
| Track tuyến tính 0,2→0,8: t = -1/0/1/2/3/4/5/10 → x = 0,2/0,2/0,35/0,5/0,65/0,8/0,8/0,8 (clamp 2 đầu) | ✅ (sai số < 1e-9) |
| Track 1 điểm → hằng số mọi t | ✅ |
| Keyframes + track: x từ track (0,5), w từ keyframes (0,4); shape/feather/invert giữ; keyframes bị bỏ khỏi kết quả | ✅ |
| Cross-mirror CJS (`server/render/src/mask.js`) == ESM (`packages/video-spec/src/mask.js`) tại 9 mốc t × 2 mask | ✅ bit-for-bit |
| `interpolateTrackPoints` (CJS) == `interpolateTrack` (ESM `tracking.js`) tại 8 mốc t | ✅ bit-for-bit |
| `buildMaskTrackGeqExpr`: chứa `T` + `if(lt(T`; y hằng → `(720*(0.5))`; ellipse có `sqrt(`; rect 1280 cho biên ±192px | ✅ |
| Track 1 điểm → geq không chứa `T` (hằng số) | ✅ |
| Track rỗng / mask w=0 → throw đúng thông điệp | ✅ |
| `buildMaskTrackGeqChain`: 3 entry, `geq=lum=`, `alphamerge` | ✅ |
| `mask.js --self-test` (gồm §10 O2, §10b O3, §11 O1) | ✅ pass |
| `check-video-spec-mirror.mjs` | ✅ **427 pass, 6 known, 0 fail** |
| `maskTrack.test.ts` (O1, strip-types) | ✅ **22/22** |
| `maskKeyframes.test.ts` (hồi quy D4) | ✅ **14/14** |
| `maskTrackUi87O5.test.ts` (O5, **phải chạy bằng esbuild bundle** theo header file — chạy trực tiếp bằng strip-types lỗi `ERR_MODULE_NOT_FOUND` do import không đuôi, không phải lỗi sản phẩm) | ✅ **18/18** |

## 2. Validator — `validateSpec` combo mask+track

| Kiểm tra | Kết quả |
|---|---|
| mask + track hợp lệ → ok, 0 error, 0 warning | ✅ |
| track rỗng → lỗi, nhắc `track.points phải là mảng không rỗng` | ✅ |
| t không tăng → lỗi `track.points[1].t phải tăng dần` | ✅ |
| x > 1 → lỗi `track.points[0].x phải là số 0..1` | ✅ |
| 241 điểm → lỗi `tối đa 240 điểm` | ✅ |
| text + mask + track → ok, warning `mask chưa hỗ trợ cho clip text` | ✅ |
| mask + keyframes + track → ok (validate cho phép combo) | ✅ |
| mask + track + transition → ok + warning D3 (xem §5.1 — câu warn này SAI với mask) | ✅ ok, ⚠️ câu chữ |

## 3. Render thật — đo tâm mask bằng pixel (720p, 30fps, tuần tự)

Nguồn kiểm chứng: video tự tạo `split.mp4` 1280×720 4s — nửa trái đỏ, nửa
phải xanh (ranh giới tại x = 0,5). Mask ellipse w = 0,3 h = 0,4 feather = 0.
Track tuyến tính (0, 0,2, 0,5) → (4, 0,8, 0,5). Đo bằng quét hàng y = 0,5,
tìm vệt sáng dài nhất (đo tâm = trung điểm vệt, dung sai ±0,03).
Harness: `test_r87_o6_mask_track_verify.js` (C1–C5),
`test_r87_o6_remeasure.js` (đo lại + C6), `test_r87_o6_final.js` (C7/C7b/C8).

### C1. `--mask-mode trackgeq`, clip.start = 0

| t | Kỳ vọng | Đo được | Kết quả |
|---|---|---|---|
| 0,5 | 0,275 | 0,275 (vệt [0,126, 0,424], rộng 0,298) | ✅ |
| 2,0 | 0,5 | 0,499 (vệt [0,350, 0,648], rộng 0,298) | ✅ |
| 3,5 | 0,725 | 0,725 (vệt [0,576, 0,874], rộng 0,298) | ✅ |

Video đứng yên: (0,2, 0,5) đỏ [252,0,0] @0,5 → đen [0,0,0] @3,5;
(0,8, 0,5) đen @0,5 → xanh [0,0,252] @3,5. Wall 89,9 s = 1,33 fps (tải nặng).

### C2. `--mask-mode trackgeq`, clip.start = 1,0 — T là local hay timeline?

Cùng tâm đo được tại timeline t = 1,5 / 3,0 / 4,5 (local 0,5 / 2,0 / 3,5):
**0,275 / 0,499 / 0,725** — khớp local, KHÔNG khớp timeline (timeline sẽ cho
0,425 / 0,65 / 0,8). ✅ **T của geq là thời gian clip-local** (khớp claim O3).
Wall 123,8 s, duration output 5 s đúng.

### C3. Mode png mặc định — và bài học về kỳ vọng sai của chính O6

Render C3 chạy lúc 05:59 bằng `render.js` 05:50 (TRƯỚC khi O2 nối đường
tracked vào 06:05) cho tâm 0,275 / 0,499 / 0,725 — KHÔNG tĩnh như kỳ vọng
ban đầu của harness ("track chưa nối ở mode png"). Lý do: ở code pre-O2,
clip vẫn shift theo D3, mask tĩnh (tâm 0,5) cưỡi theo shift nên tâm cuối
trên canvas = 0,5 + (track − 0,5) = track — trùng số với mask bám track thật
khi mask x = 0,5. Kỳ vọng "tĩnh" của O6 là sai; hành vi đúng của pre-O2 là
dịch cả clip. Đã sửa kỳ vọng và kiểm lại bằng C7 (code sau O2). Bài học:
tâm mask giống nhau không đủ phân biệt 2 cơ chế — phải đo cả ranh giới nội
dung video (xem C7).

### C4. Hồi quy vs render của O7 TRƯỚC thay đổi (05:47 UTC)

Render lại đúng spec B1/B2/B3 của O7 (cùng file media testsrc2 trong
`/tmp/vcut-r87-o7-wct3Fb/media/`), so frame @2,5 với frame O7 đã lưu:

| Đường | MAD mean / max / pctGt8 | Kết quả |
|---|---|---|
| B1 mask tĩnh png | 0 / 0 / 0% (file output cùng 228.329 byte) | ✅ |
| B2 mask tĩnh geq | 0 / 0 / 0% (cùng 207.208 byte) | ✅ |
| B3 mask keyframes (D4) | 0 / 0 / 0% (cùng 270.655 byte) | ✅ |

**Không hồi quy** ở cả 3 đường tĩnh/keyframes. (MAD = 0 tuyệt đối, không
chỉ dưới ngưỡng.)

### C5. Hồi quy đường track cũ (D3)

- Video có track, không mask (default): frame @0,5 vs @3,5 khác xa
  (MAD mean 114,075, 45% pixel lệch > 8) — D3 shift còn hoạt động. ✅
- Sticker có track: tâm vệt đỏ 0,274 / 0,5 / 0,724 tại t = 0,5 / 2,0 / 3,5
  (kỳ vọng 0,275 / 0,5 / 0,725). ✅

### C6. MỚI — mask + track + transitionOut (fade), trackgeq

**Đóng nợ mở §5.5 của O2_LIMITS** ("chưa có test render riêng cho combo
này, chỉ suy từ luật code"): clip c1 (split, mask + track) có
`transitionOut: fade 0,5s` sang clip c2 (xanh), render trackgeq, đo trước
vùng fade:

| t | Kỳ vọng (local) | Đo được | Kết quả |
|---|---|---|---|
| 0,5 | 0,275 | 0,275 | ✅ |
| 2,0 | 0,5 | 0,499 | ✅ |
| 3,0 | 0,65 | 0,649 | ✅ |

**Mask vẫn bám track qua transition.** Wall 40,0 s, duration 8 s đúng.
Hệ quả: warning validator + UI O5 về transition là sai với mask (xem §5.1).

### C7. Mode png mặc định + track + mask, render LẠI bằng code sau O2 (06:05)

| t | Kỳ vọng | Đo được | Kết quả |
|---|---|---|---|
| 0,5 | 0,275 | 0,275 | ✅ |
| 2,0 | 0,5 | 0,499 | ✅ |
| 3,5 | 0,725 | 0,725 | ✅ |

Video đứng yên — điểm phân biệt với pre-O2: (0,4, 0,5)@0,5 **đỏ** [252,0,0]
(pre-O2 cưỡi shift sẽ là xanh); (0,6, 0,5)@3,5 **xanh** [0,0,252] (pre-O2
sẽ là đỏ). ✅ **O2 đã đổi đúng hành vi: clip đứng yên, chỉ mask di chuyển.**
Wall 5,9 s = 20,32 fps (cả job 4 s, gồm sinh video mask).

### C7b. trackgeq render LẠI bằng code sau O2

Tâm 0,275 / 0,499 / 0,725; video đứng yên ((0,4, 0,5)@0,5 đỏ,
(0,6, 0,5)@3,5 xanh). ✅ **O2 không làm hỏng đường trackgeq.**
Wall 31,7 s = 3,79 fps.

### C8. Mode geq thường + mask x = 0,3 (≠ 0,5) + track — đo giới hạn

Theo chú thích O2 (§2 O2_LIMITS): mode geq giữ hành vi cũ — mask tĩnh cưỡi
shift D3, tâm cuối = 0,3 + (track − 0,5):

| t | Dự đoán (cưỡi shift) | Đo được | Kết quả |
|---|---|---|---|
| 0,5 | 0,075 | 0,112* | ⚠️ xem ghi chú |
| 2,0 | 0,3 | 0,299 | ✅ |
| 3,5 | 0,525 | 0,525 | ✅ |

\* t = 0,5: vệt đo được [0,000, 0,224] — ellipse bị cắt bởi biên trái khung
(tâm thật 0,075, nửa rộng 0,15 → vệt lý thuyết [−0,075, 0,225]); mép phải
0,224 ≈ 0,225 dự đoán, mép trái kẹt ở 0 nên trung điểm đo bị lệch lên 0,112.
**Đây là artifact đo (cắt biên), không phải lệch sản phẩm.** Kết luận: mode
geq thường KHÔNG bám track đúng khi mask x ≠ 0,5 — đúng như O2 đã ghi;
đường đúng cho mask động là png (O2) hoặc trackgeq (O3).

### Tốc độ (cần đọc kèm tải VM)

VM vừa reboot, 9–10 luồng đợt 87 chạy song song; fps dao động mạnh theo tải
(cùng đường trackgeq: 1,33 fps lúc tải nặng, 3,79 fps lúc tải nhẹ hơn).
Chỉ tỉ lệ trong cùng một lượt chạy mới có ý nghĩa:

| Đo (lượt O6) | Giá trị |
|---|---|
| trackgeq 720p 4s (C7b) | 3,79 fps (31,7 s) |
| png tracked 720p 4s (C7) | 20,32 fps (5,9 s) |
| geq tĩnh 720p 5s (C4b, tải nặng) | 1,90 fps (79 s) |
| png tĩnh 720p 5s (C4a, tải nặng) | 10,02 fps (15 s) |

So sánh cùng điều kiện O3 (A/B cùng lượt): trackgeq 1,14 fps vs png 12,14 fps
(~10,6× chậm hơn); O2: tracked-video 11,2 s vs tĩnh 10,5 s (+0,7 s). Hướng
nhất quán: **trackgeq chậm hơn png ~5–10×; đường video mask (O2) chỉ chậm
hơn tĩnh không đáng kể.** Không đo 4K / clip dài / track dày (O3 khuyến nghị
≤ 20 điểm cho trackgeq).

## 4. Suite cũ chạy lại trên code cuối (sau O2, render.js 06:05)

| Suite | Kết quả |
|---|---|
| `test_round87_o2_mask_track.js` (test của O2, 640×360) | ✅ **25/25** |
| `test_mask_p4.js` | ✅ **33/33** |
| `test_d4_mask_keyframes.js` | ✅ **13/13** |
| self-test `mask.js` / `tracking.js` / `sticker.js` | ✅ pass |
| `tsc` apps/web | ✅ 0 lỗi |
| `tsc` apps/desktop | ✅ 0 lỗi |
| `vite build` apps/web | ✅ pass (11,15 s) |
| `check-video-spec-mirror.mjs` | ✅ 427 pass, 6 known, 0 fail |

## 5. Phát hiện cần parent quyết / nợ mở

### 5.1. [QUAN TRỌNG] Warning transition + UI "transition" nói sai về mask

- Validator (`server/render/src/validate.js`): "clip video có track nhưng
  dính transition — track bị bỏ qua ở unit đã merge".
- UI O5 (`maskTrackUiState` = `"transition"`): hiện
  `motionTrack.transitionIgnored` + `motionTrack.maskNotFollowing`
  ("Mask cũng không bám theo track.").
- **C6 chứng minh mask VẪN bám track qua transition** (mask áp ở unit stage,
  trước xfade; chỉ D3 unit-shift mới bị bỏ qua với unit đã merge). Câu chữ
  hiện tại đúng cho *vị trí clip* nhưng sai cho *mask*.
- O2 đã tự ghi nhận vấn đề tương tự cho clip image (§5.1 O2_LIMITS:
  warn "track sẽ bị bỏ qua" trong khi track vẫn lái mask) và hoãn sửa tới
  lúc gộp. Luồng O6 KHÔNG tự sửa câu warn: nó nằm ở 3 chỗ (validator +
  fragment i18n + TrackPanel) và O5/O8 vẫn đang chạy — parent quyết câu chữ
  khi gộp (gợi ý: "track không dịch clip ở unit đã merge, nhưng mask vẫn
  bám track").
- Tương tự, validator warn cho image ("track chưa hỗ trợ cho clip image —
  track sẽ bị bỏ qua") cũng chưa chính xác hoàn toàn với image CÓ mask
  (O2 đã đo image tracked: tâm 0,3875/0,5/0,6125 chính xác).

### 5.2. i18n O5 chưa gộp vào dict chính

7 key mới chỉ nằm trong `apps/web/src/i18n/fragments/round87-o5.json`;
`vi.json`/`en.json` có **0** kết quả cho `trackFollow`/`trackDetach`/
`maskNotFollowing`/`transitionIgnored` → UI sẽ hiện key thô thay vì tiếng
Việt (O8 cũng ghi nhận). Theo header test O5, parent gộp fragment vào dict
ở cuối đợt (mẫu M1 đợt 56: không sửa dict trực tiếp để tránh xung đột).

### 5.3. Preview (O4): kiểm chứng bằng đọc code + build, chưa có browser thật từ O6

- Logic O4 nhất quán: `maskedUnitSource` nhận `clip.track`, `effMask =
  {...baseMask, ...interpolateTrackPoints(...)}` (track thắng x/y, keyframes
  thắng w/h — khớp O1); `drawVideoClip` null `trackShift`/`trackCenter`
  khi có mask + track (mirror `render.js:876`); mọi nhánh vẽ dưới (mask SR,
  mask thường, ghost motion-blur, vignette) đều đọc 2 biến đã null nên
  không double-shift. Comment O4 tự ghi nhận: preview luôn theo ngữ nghĩa
  trackgeq, lệch với render mặc định pre-O2 — nay O2 đã nối png nên lệch
  này không còn (preview và render png nay cùng cho mask bám track, video
  đứng yên).
- **Hạn chế:** preview dùng bản inline thứ 3 của phép hợp thành
  track+keyframes (không gọi `maskGeometryAtTrack` của O1) — cùng ngữ nghĩa
  theo đọc code, nhưng không được test helper chung bao phủ; rủi ro lệch
  nếu quy tắc O1 đổi sau này.
- Comment cũ `preview.tsx:2015` ("mask unit cũng dịch theo track") nay
  trái với code (trackShift đã null) — chỉ sai comment, không sai hành vi.
- **Chưa có LIMITS O4 trên đĩa** (comment preview nhắc "O4_LIMITS §2").
  O8 đang click-test headed (script
  `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs`, đã có screenshot
  `o8-a1-track-t1.png`…) nhưng chưa có `round87-o8.md` — kết quả browser
  thật của preview chờ O8.

### 5.4. Hành vi đổi có chủ ý (O2 §5.4 — O6 xác nhận bằng pixel)

Video + track + mask tĩnh ở mode png: trước đây clip dịch theo track (mask
cưỡi theo), nay clip đứng yên, chỉ mask di chuyển. Tâm mask cuối giống nhau;
nội dung clip khác. Nếu parent muốn giữ hành vi cũ cho mask tĩnh thì cần
tách luật (chỉ bỏ shift khi mask thực sự động).

### 5.5. Các nợ nhỏ khác

- Pre-pass R2 vẽ thừa 1 PNG tĩnh cho mỗi mask tracked (O2 §5.3 tự ghi) —
  lãng phí nhỏ, chưa đo riêng.
- Fallback video/PNG → geq tĩnh chưa được ép kích hoạt end-to-end (O2 §5.2
  tự ghi; O6 không ép vì sẽ phải giả chết `mask_anim.py` trong lúc luồng
  khác đang dùng).
- Mode geq thường + track + mask x ≠ 0,5: mask lệch (đo ở C8) — theo
  thiết kế (dùng trackgeq hoặc png).
- Chưa đo: 4K, clip dài, track dày 240 điểm (O3 khuyến nghị ≤ 20 điểm cho
  trackgeq), image + track + mask render độc lập (O2 đã đo, O6 chỉ chạy
  lại test 25/25 của O2).

## 6. Xung đột file chung / ghi chú gộp

- **Không phát hiện xung đột chưa xử lý.** O1/O2/O3 cùng sửa `mask.js` và
  `render.js` song song (O2 §6 ghi: file bị ghi đè xen kẽ ít nhất 2 lần,
  1 lần mất dòng require gây SyntaxError tạm thời). Trạng thái cuối nhất
  quán: self-test pass, mirror check 427/433, tsc 0, mọi render test pass.
  O6 không sửa production nên không thêm xung đột.
- Thứ tự hạ cánh quan sát được: O1/O3 05:50 → O2 (mask.js) 05:54:52 →
  O4 preview 05:53 / O5 MaskPanel 05:54:55 → O2 (render.js) 06:05:32 →
  LIMITS O1/O2/O3 sau 06:05. Các render C1–C5 của O6 chạy bằng code trước
  O2-render.js nên C3 đã được đo lại bằng C7 trên code cuối.
- **Lỗi harness của chính O6 (đã sửa, ghi trung thực):** lượt chạy đầu
  (`test_r87_o6_mask_track_verify.js`) báo 16 fail giả — `measure.py` in
  nhiều cặp `key=value` trên 1 dòng và parser JS chỉ lấy cặp đầu + không
  parse được key chứa dấu chấm (`px_0.2_0.5`) → scan/px/mad trả NaN/undefined.
  Đã sửa `measure.py` (1 cặp/dòng) + parser (tách theo token), đo lại từ
  chính các file render cũ (đo là xác định, render không đổi) + render mới
  C6/C7/C7b/C8. Kết quả cuối: re-measure 53/54 (1 "fail" là kỳ vọng C3 cũ,
  đã thay bằng C7), vòng cuối 21/22 (1 "fail" là artifact cắt biên ở C8,
  đã giải thích bằng mép vệt).

## 7. Chưa kiểm được trong lượt này

- Preview trên browser thật (chờ O8 — đang chạy, chưa có log).
- LIMITS O4 chưa có trên đĩa lúc viết file này.
- Fallback ép kích hoạt end-to-end (xem §5.5).
- TTS 39 (cấm theo luật cứng — không đụng, không đo).

## 8. File của luồng O6 (stage, KHÔNG push)

- `server/render/test_r87_o6_mask_track_verify.js` — harness tổng (A–D).
- `server/render/test_r87_o6_measure.py` — đo pixel/frame (đã sửa format output).
- `server/render/test_r87_o6_remeasure.js` — đo lại A–C5 + C6 mới.
- `server/render/test_r87_o6_final.js` — C7/C7b/C8 + D trên code cuối.
- `docs/PHASE9_ROUND87_O6_MASK_TRACK_VERIFY_LIMITS.md` — file này.
- Log luồng: `workspace/goals/capcut-clone-video-editor/hidden_files/round87-o6.md`.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round87-o6-mask-track-verify.txt`
  (5 entry, verify read-back 5/5 tồn tại và là text). KHÔNG push.
- Render/work tạm nằm ở `/tmp/vcut-r87-o6-s6TUQA/` (C1–C6) và
  `/tmp/vcut-r87-o6f-kSK4x5/` (C7/C7b/C8) — không stage (file tạm, không
  phải asset repo).

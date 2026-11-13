# PHASE9_ROUND96_X2_GHOST_FIX_LIMITS — sửa blend sai tập ghost rVFC pump + trường presented frame

> Luồng X2, đợt 96, lượt cron 15:35 +07 12/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
> **Kết quả chính (đo lần 2 + lần 3 — xem §3): median gStd về đúng triple
> 37,5 ở mọi case B–E (lần 2: 37,5–37,6; lần 3: 37,0–37,6, trừ E t=1
> 83,9 do mẫu nhỏ nG=12 dưới tải cao); assert PASS cả 2 lượt. NHƯNG
> ~19–25% mẫu vẫn ở mức double-count 84,6 — snapshot trong ring trùng
> frame với hàng xóm (nhãn đúng, nội dung sai); giả thuyết estimate
> dẫn trước BỊ BÁC (84-mẫu đa số skp=1), còn lại cơ chế capture gán
> nhầm nhãn (xem §3.5, §4.1).**
> Đo lần 1 (assert96) bắt được lỗi thiết kế của lần sửa đầu: ring chỉ giữ
> frames-1 snapshot nên trường hợp pump bắt kịp blend thành pair (~79)
> thay vì triple (37,5) — đã sửa bổ sung bằng cách tăng dung lượng ring
> lên frames snapshot (§1.5) rồi đo lại.

## 0. Môi trường đo

- Boot a3a13d5a (reboot #17 ~08:01Z) lúc bắt đầu; **reboot #18 ~09:24Z
  (boot 04b83831)** giữa lượt — sau khi sửa capacity, trước lượt đo 2.
  RAM khả dụng 1156 MB (lúc bắt đầu) → 1433 MB (sau reboot #18).
  2 vCPU chia sẻ với 8–9 luồng X1–X9 đợt 96.
- Vite dev 5173: pid 8148 (từ 08:47Z, boot cũ) phục vụ lượt đo 1; sau
  reboot #18, vite khởi lại pid 1983 (09:26Z, `--strictPort
  --host 127.0.0.1`) phục vụ lượt đo 2; **pid 1983 chết không rõ lý do
  trước lượt đo 3 (không reboot mới) → lượt 3 lần 1 exit=2; X2 khởi vite
  riêng (apps/web, `--port 5173 --strictPort`, log
  `round96-x2/vite-5173-x2.log`) phục vụ lượt đo 3 lần 2.** Tất cả đều
  được verify phục vụ code mới bằng curl (transformed preview.tsx chứa
  `blendPresentedFrame`, `maxGhosts: ghostWeights.length`).
- `apps/web/src/preview.tsx` mtime: 06:15:41Z (đợt 95 W5) trước lượt →
  08:58:45Z (epoch 1794473925, sửa lần 1) → 09:28:20Z (epoch
  1794475700, sửa capacity) → **09:41:00Z (epoch 1794476460, thêm nhãn
  ringSize/skippedLatest)**. X4 sửa cùng file trong lượt (5 marker
  "Đợt 96 X4" — vùng drift/re-seek của X4, khác vùng blend của X2;
  16 marker "Đợt 96 X2" còn nguyên, tsc 0 sau cả hai).
  Mtime được kiểm trước/sau MỌI lượt đo (xem §3).
- Harness: `apps/web/scripts/probe91s1-motionblur-rvfc.cdp.mjs --cases
  a,b,c,d,e --passes 5 --assert` (cùng clip/probe như W4 đợt 95) +
  waiter nền `wait-quiet-assert96.sh` / `wait-quiet-assert96b.sh` chờ
  load1 < 3,0 tối đa 60' (mẫu W4 đợt 95). Chrome headless
  Playwright chromium-1254 (probe tự spawn, không cần Xvfb).

## 1. Sửa blend sai tập ghost

### 1.1 Cơ chế lỗi (đợt 95 W4 — nhắc lại ngắn)

Render tmix frames=3 cho frame K là trung bình {K-2,K-1,K} → gStd 37,5
(trên clip sọc `stripes-scroll.mp4`, baseline frame đơn 112). Preview
blend ghost = các snapshot MỚI NHẤT trong ring + frame hiện tại qua
`drawImage` — khi snapshot mới nhất CHÍNH LÀ frame hiện tại (pump đã
capture frame đang trình chiếu) thì frame hiện tại bị đếm 2 lần:
cửa sổ {K-1,K,K} → gStd 84,6 (√5/3 ≈ 0,745 × 112). Đa số tick (~2/3
mẫu W4) rơi vào trường hợp này nên preview mờ chỉ ~44% độ mờ đúng
(blur yếu hơn render ~2,25× độ tương phản còn lại). Tick muộn (trình
chiếu đã lật sang K+1 trong khi frameIdx vẫn K) cho triple liên tiếp
{K-1,K,K+1} → 37,5 — đúng biên độ nhưng lệch cửa sổ +1 (là tmix của
frame K+1, vẽ sớm 1 frame). Không mức nào là tmix đúng của frame K.

### 1.2 Sửa lần 1 — loại current khỏi tập ghost

`compositeMotionBlurLayer` (chốt chặn duy nhất — cả 3 đường vẽ mask /
plain-SR / plain đều qua đây): ghost chỉ lấy từ các snapshot CŨ HƠN
frame đang trình chiếu P (`presentedFrameIndex`, xem §1.3). Quy tắc
theo P so với snapshot mới nhất L:
- P == L: bỏ snapshot L khỏi tập ghost, lấy các snapshot trước nó
  (ghost = {L-2,L-1,...}) → cửa sổ {L-2,L-1,P} = tmix(P) đúng.
- P == L+1: snapshot L là ghost hợp lệ (frame ngay trước P) → giữ hành
  vi cũ (ghost = {L-1,L}) → cửa sổ {L-1,L,P} = tmix(P) đúng.
- P > L+1 (pump capture thưa dưới tải) hoặc P < L: giữ hành vi cũ —
  cửa sổ vốn đã không liên tiếp, ngoài phạm vi sửa này (đợt 95 W4 §5.2).
- Ring vẫn giữ snapshot L cho frame sau (chỉ đổi TẬP GHOST ở lần blend
  này, không xoá snapshot). Ring chỉ còn đúng snapshot L (pool rỗng)
  thì trả null để caller vẽ trực tiếp (tmix của 1 khung không lịch sử
  chính là khung đó).
- Plan (`motionBlurBlendPlan`) tính lại theo số ghost THỰC DÙNG (pool)
  nên weights chuẩn hoá đúng cửa sổ mới.
- `frameIdx` được truyền từ cả 3 call site (mask / plain-SR / plain);
  mặc định -1 giữ hành vi cũ khi không biết frameIdx.

### 1.3 presented frame — ước lượng từ lịch trình chiếu rVFC

`frameIdx` (từ `currentTime`) không đủ để biết frame đang trình chiếu:
trình chiếu lật khung không đồng bộ với currentTime (W4: pha median
0,23–0,32 cho mức 84,6 và 0,62–0,79 cho mức 37,5). Nguồn đúng là
metadata rVFC: callback gần nhất cho frame F với `expectedDisplayTime`
E (thời điểm F bắt đầu trình chiếu); frame F trình chiếu trong
[E, E + 1/fps) nên tại thời điểm now, frame trình chiếu =
F + floor((now − E) / (1/fps)) (đã tính playbackRate vào độ dài khung).
Công thức tự nhất quán ở cả 2 thứ tự callback/tick trong cùng vsync:
nếu callback của frame kế đã bắn trước tick thì F_last đã là frame kế;
nếu chưa bắn thì số khung trôi qua kể từ E_last bù đúng 1.
- Ghi ở `rvfcCallback`: `pump.lastPresentedFrameIdx` +
  `pump.lastExpectedDisplayTime` ở MỌI callback bắn (kể cả
  duplicate/skip/stale — frame đó vẫn đã trình chiếu), TRƯỚC các
  early-return. Reset (-1/null) khi pump tạo mới/khởi động lại.
- Fallback `frameIdx` khi: không có pump (đường tick — không có metadata
  trình chiếu), pump chưa có callback nào, hoặc metadata thiếu
  `expectedDisplayTime` (WebKitGTK có thể không đưa trường này).
- Sai số (ghi rõ — nhãn này là ước lượng có phương pháp, không phải đo
  trực tiếp pixels): lệch tối đa khi now rơi đúng biên lật khung (±vài
  ms quanh E + k/fps), footage VFR (độ dài khung ≠ 1/fps), hoặc callback
  bắn sớm hơn E một chút (frame kế chưa thực sự trình chiếu). Bằng
  chứng thực nghiệm: phân tách skip/noskip theo ước lượng này tách sạch
  2 mức gStd (xem §3) — ước lượng đủ tốt để quyết định ghost.
- Phát hiện phụ từ dữ liệu lượt 1: presented THƯỜNG ĐI SAU currentTime
  (offset −1 phổ biến: E n=168, D n=69) — ngược hướng "trình chiếu chạy
  trước đồng hồ media ~10ms" của W4 §1.4. Giải thích: trong môi trường
  headless `--disable-gpu`, compositor có thể trình chiếu chậm hơn đồng
  hồ media ~1 khung (frame mới chưa sẵn khi currentTime đã qua mốc).
  W4 suy "chạy trước" từ pha — pha chỉ cho biết ĐIỂM LẬT nằm giữa khung,
  không cho biết chiều lệch tuyệt đối. Cả hai chiều đều xảy ra (offset
  −1..+1 đều có mặt); quy tắc skip theo P (không theo frameIdx) đúng ở
  cả hai chiều — đó chính là lý do phải ước lượng P thay vì dùng K.

### 1.4 Trường presented frame trong debug state

- `MotionBlurDebugState` += `lastDrawnPresentedFrame: number` (-1 =
  chưa từng blend) — ghi trong `recordDrawnBlendWindow` cùng lúc với
  3 trường cửa sổ cũ. Giá trị đọc từ stash `blendPresentedFrame`
  (map clipId → presented mà `compositeMotionBlurLayer` vừa dùng để
  quyết định tập ghost) — ĐÚNG giá trị quyết định, không ước lượng lại
  sau khi blend (lúc đó trình chiếu có thể đã lật khung trong lúc blend
  chạy ~1–8ms). Fallback frameIdx khi không có stash.
- **Lượt 3 bổ sung** (sau đo lần 2, để chẩn đoán cụm 84): stash đổi
  thành object `{presented, skippedLatest, ringSize}`; thêm 2 trường
  `lastDrawnRingSize` + `lastDrawnSkippedLatest` (ghi lúc blend thành
  công: ringSize = `arr.length` lúc blend; skippedLatest = 1/0 theo
  `skipLatest`; fallback -1 khi không có stash).
- Harness `probe91s1-motionblur-rvfc.cdp.mjs`: copy trường mới vào dbg
  mỗi khung; `drawnStable` so thêm trường mới (blend mới với presented
  khác giữa lúc đo pixel → loại mẫu); thêm nhóm chẩn đoán theo (cửa sổ
  đã vẽ + presented) + thống kê gStd theo offset presented − frameIdx.
  Nhóm/assert W4 giữ nguyên để số so được trực tiếp. **Lượt 3:**
  copy thêm 2 trường mới; drawnStable so 6 trường; nhóm chẩn đoán
  tách thêm theo (ringSize, skippedLatest) lúc blend.

### 1.5 Sửa bổ sung — tăng dung lượng ring lên frames (SAU ĐO LẦN 1)

Đo lần 1 (assert96, §3.1) bắt được lỗi thiết kế của lần sửa đầu: ring
chỉ giữ `frames-1` = 2 snapshot. Khi pump bắt kịp (L == P), sau khi
loại snapshot L khỏi ghost chỉ còn 1 ghost → `motionBlurBlendPlan`
co cửa sổ thành pair {K-1, K} weights [0,5, 0,5] → gStd ~79 thay vì
triple 37,5. Sửa: ring giữ `ghostWeights.length` (= frames) snapshot —
`maxGhosts: ghostWeights.length` ở `ensureRvfcPump` + cả 7 điểm gọi
`updateMotionBlurSnapshots(..., ghostWeights.length, ...)` (đường tick).
Khi đó trường hợp bắt kịp có đủ 2 ghost cũ hơn current → triple đúng;
trường hợp lag vẫn đúng như cũ. Bộ nhớ thêm: 1 snapshot canvas/clip.
Harness: assert ring 2 → 3 (mọi spec a–e đều frames=3).
Quy tắc tổng quát: tmix-N cần N frame phân biệt (N-1 ghost cũ hơn
current + current) nên ring phải giữ N snapshot; giữ N-1 thì trường hợp
bắt kịp luôn thiếu 1 ghost. Quy tắc này cũng sửa luôn frames=2 (trước
đây ring 1 snapshot → blend {K,K} = không mờ; nay ring 2 → pair đúng).

## 2. Kiểm chứng code

| kiểm chứng | sau sửa lần 1 | sau sửa capacity | sau thêm nhãn lượt 3 |
|---|---|---|---|
| tsc web | 0 | 0 | 0 |
| vite build | PASS (14,74 s) | PASS (16,84 s) | PASS (8,72 s) |
| ghostBlend probe | 15/15 | 15/15 | 15/15 |
| previewEngine | 25/25 | 25/25 | 25/25 |
| seek | 21/21 | 21/21 | 21/21 |
| playheadHold90R2 | 41/41 | 44/44 (X4 thêm 3 test) | 44/44 |
| playheadPacing54K9 | 17/17 | 19/19 (X4 thêm 2 test) | 19/19 |
| O8 Chromium / WebKit | [CHỜ — xem §5] | [CHỜ — xem §5] | **21/21 + 21/21** (xem §2.1) |

### 2.1 O8 (Chromium + WebKit) — chạy sau lượt đo 3

- Chromium (`clicktest-87o8-mask-track-headed.mjs`, Xvfb :187, vite
  riêng 5550, scratch `round96-x2/o8-chromium/`): **21/21 pass, 0 fail,
  0 note** (10:01–10:02Z). Lần chạy đầu lỗi harness do thiếu fixture —
  copy 3 fixture từ `round87-o8/headed/` rồi chạy lại PASS hết (S5 mask
  bám track lúc phát, S6 gợi ý O5, S7 bóng nằm giữa mask, E0 không lỗi JS).
- WebKit (`clicktest-87o8-mask-track-webkit.mjs`, Xvfb :188, vite riêng
  5560, scratch `round96-x2/o8-webkit/`): **21/21 pass, 0 fail, 0 note**
  (10:05–10:06Z). Cùng kỳ vọng, cùng kết quả.
- Ý nghĩa với sửa này: đường mask/plain đều qua `compositeMotionBlurLayer`
  (chốt chặn duy nhất) — O8 xác nhận mask + track vẫn đúng sau sửa blend,
  không hồi quy đường mask.
- Lưu ý: sau khi O8 Chromium của X2 xong, luồng X3 đợt 96 chạy O8
  Chromium tiếp trên :187/5550 (user-data-dir round96-x3) — không phải
  tiến trình X2 kẹt cleanup.

Không sửa vùng drift/re-seek của X4; không sửa vùng nào khác của
preview.tsx ngoài blend/ghost + debug state + pump metadata (marker
"Đợt 96 X2" ×15). Harness probe91s1 chỉ thêm đọc trường mới + nhóm
chẩn đoán + assert ring 3 — không đổi nhóm/assert W4.

## 3. Đo lại MAD spec B sau sửa — 3 lượt (assert96, assert96b, assert96c)

### 3.1 Đo lần 1 — assert96 (09:06–09:08Z, cửa sổ yên load 0,25–2,79; mtime ổn định 1794473925; LẦN SỬA ĐẦU, ring=2)

Chạy `probe91s1 --cases a,b,c,d,e --passes 5 --assert` (waiter bắt cửa
sổ yên poll 2, load1=2,79). EXIT=1, 1 assert fail. Dữ liệu thô:
`preview-abcde-assert96.json` (phân tích trong LIMITS này bằng script
python ngoài repo — không đưa vào batch).

- **Skip logic ĐÚNG** (phân tách sạch theo presented): case E skip
  (L==P) n=244 gStd med 78,5; noskip n=106 med 37,7. Case D: skip n=162
  med 79,1; noskip n=82 med 37,7. Case C: skip n=21 med 79,1; noskip
  n=53 med 38,3. Ước lượng presented đủ tốt để quyết định ghost.
- **NHƯNG skip case ra PAIR (~79) chứ không phải triple 37,5**: case B
  play t=0,5/1/1,5 gStdMed 78,5/78,5/81,3; case E 80/78,5/78,4. Nguyên
  nhân: ring chỉ giữ frames-1 = 2 snapshot — sau khi loại snapshot
  trùng current chỉ còn 1 ghost → plan co thành pair weights [0,5, 0,5]
  (gStd 0,718 × 112 ≈ 80). Đây là lỗi thiết kế của lần sửa đầu (xem
  §1.5) — đo mới bắt được, đã sửa bổ sung trước lượt 2.
- Noskip case (pump lag, L != P) đã cho triple đúng 37,7 — hành vi cũ
  vốn đúng ở trường hợp này, sửa giữ nguyên.
- 1 assert fail duy nhất: B `captures delta=-98` (captures 154 → 9,
  ringClears 19 → 0 giữa pass 4→5: page reload do HMR — luồng khác sửa
  file import trong lúc đo; pass 4 của B stall 1500 mẫu ở frameIdx=0).
  Pass 1–3 của B vẫn dùng được; pass 4–5 loại khỏi phân tích B.
- Mẫu ~0-cancel (D 53/244, E 59/350): ring không liên tiếp sau clear
  (prev cách last tới 12 frame) + pair đối pha — xem §3.4.
- ringClears cao (E 27–31/case): reset do seek; xem §3.4.
- Spread theo cửa sổ đã vẽ (B): nGroups=1 (không đủ nhóm — phần lớn
  mẫu bị loại do nhãn cũ/stale sau stall) → assert spread bỏ qua.

### 3.2 Đo lần 2 — assert96b (09:32–09:35Z, cửa sổ yên load 1,6–1,9; mtime ổn định 1794475700; sau tăng ring lên 3)

EXIT=0 — **ASSERT PASS, tất cả kiểm tra xanh** (kể cả assert ring=3
mới, captures coverage, spread median ≤ 15).

| case | play t=0,5 / 1 / 1,5 gStdMed (lần 1 → lần 2) | buckets lần 2 |
|---|---|---|
| A (tĩnh) | 111,8–112 (giữ nguyên identity) | 637 mẫu toàn 112 |
| B | 78,5/78,5/81,3 → **37,6/37,5/37,5** | triple 531/677 (78%), pair/dbl 129 (19%), direct 14, cancel 3 |
| C | — → triple 325/441 (74%) | pair/dbl 92 (21%), direct 22, cancel 2 |
| D | — → triple 299/392 (76%) | pair/dbl 71 (18%), direct 21, cancel 1 |
| E | 80/78,5/78,4 → **36,9/37,6/36,9** | triple 522/672 (78%), pair/dbl 133 (20%), direct 14, cancel 3 |

- Skip (L==P) sau sửa: B n=653 med 37,5; C n=370 med 37,6; D n=312
  med 37,6; E n=651 med 37,5. Offset 0 (presented == frameIdx): B n=624
  med 37,5; E n=586 med 37,5. **Trường hợp pump bắt kịp nay blend
  đúng tmix triple** — mục tiêu chính của đợt đạt được ở mức median.
- Spread theo cửa sổ đã vẽ: E nGroups=69 (lần 1: 20), spreadMed 0,8
  (≤ 15 → assert PASS), NHƯNG spreadMax vẫn 77,5. Nhóm worst trộn 2
  mức trong cùng nhãn: (10,9,10,10): 4×36,7 + 4×84,0;
  (22,21,22,22): 5×36,5 + 4×83,7; (34,33,34,34), (46,45,46,46),
  (58,57,58,58) tương tự. Mẫu 84 tập trung ở pha sớm trong khung
  (vt 0,339–0,347) còn 36,7 ở pha muộn (vt 0,352–0,366). Xem §3.3.
- Case A: ring=3 ở mọi pass end; captures đơn điệu tăng 63→329 (case A),
  không reload. Case B captures 395→670, C 738→911, D 952→1130,
  E 1196→1469 — đơn điệu, không reset.
- Mẫu ~0-cancel còn rất ít (tổng 9/~2180 mẫu, 0,4%).

### 3.3 Cụm 84 còn lại sau lần 2 — chưa đóng, chẩn đoán ở lượt 3

Sau lần 2, ~19–21% mẫu ở mức pair/dbl (79–85), tập trung ở mức
double-count 83,7–84,6 (= {K-1,K,K}, √5/3 × 112) chứ không phải pair
79,2. Tức là ở ~1/5 tick, frame hiện tại VẪN bị đếm 2 lần. Hai giả
thuyết (xem §1.3 về sai số ước lượng):
- (a) **Ước lượng presented dẫn trước 1 khung**: estimate nói P=K+1
  (đã qua E_K + 1/fps) trong khi trình chiếu thật vẫn ở K (compositor
  chậm 1 vsync so với lịch) và pump chưa capture K+1 (L=K) → không
  skip → ghost {K-1,K} + current K → {K-1,K,K} = 84. Khớp pha sớm
  (estimate lật sớm hơn trình chiếu thật).
- (b) **Snapshot trùng trong ring**: ring chứa 2 snapshot cùng frame
  (vd {9,10,10}) thì skip cũng vẫn để lại ghost {9,10} + current 10.
  Cần dữ liệu lượt 3 (ringSize + skippedLatest lúc blend) để phân biệt:
  84-mẫu có skippedLatest=0 → (a); =1 → (b).
- Nhóm (1,0,1) (spread 77,5: 1,0 + 78,5): ring lúc blend chỉ có 2
  snapshot (vừa refill sau clear) → pair; mẫu 1,0 là pair đối pha
  {0,2} — estimate trễ 1 khung ở sát biên lật (vt=0,058, cuối khung 1).
  Hiếm (n=4), không phải cụm hệ thống như 84.
- Lưu ý trung thực: tiêu chí W4 §6.1 ("spread về ~0 VÀ median về
  37,5") mới đạt 1,5/2: median 37,5 ✓, spread median 0,8 ✓ (assert
  PASS), nhưng spreadMax 77,5 và cụm 84 ở ~19% mẫu cho thấy preview
  vẫn nhấp nháy giữa 2 mức blur ở ~1/5 tick — mức độ mờ trung bình
  đúng nhưng chưa đồng đều từng tick. Lượt 3 chẩn đoán để đóng hoặc
  ghi thành nợ có số đo.

### 3.4 Hiện tượng phụ (không phải lỗi sửa này)

- **ringClears cao** (B 11→15, C 19→30, D 35→42, E 47→51 mỗi case;
  +1/pass + thêm trong pha pause/setup): reset do seek/nhảy lùi — cả 3
  điểm tăng ringClears (updateMotionBlurSnapshots, motionBlurResetOnSeek,
  rvfcCaptureFrame reset-capture) đều là code cũ, X2 không đụng. Số cao
  hơn đợt 95 (W4: 0–6/case A) vì lượt này tick dày (55–98 khung rAF/
  pass so với 7–10 lúc nhiễm tải) nên bắt được nhiều lần seek hơn; và
  vì mỗi pass seek về 0 + pause measurements seek 0,5/1/1,5. Không phải
  hồi quy. Hệ quả: sau mỗi clear, ring refill 1–2 tick đầu blend pair/
  direct — đóng góp vào mẫu 79/112 rải rác.
- **Ring không liên tiếp sau clear** (prev cách last tới 12 frame, vd
  D pass 1: last=18 prev=6): pump capture thưa khi decoder nhảy cóc
  (element nhảy frame, pump capture frame mới mà không reset vì nhảy
  TIẾN — reset chỉ cho nhảy lùi). Code cũ (W4 §5.2 đã ghi lúc tải
  nặng); nay gặp cả lúc yên ở case mask nặng (D/E: mask CPU + SR).
  Blend với ghost cách xa cho cửa sổ không liên tiếp — đóng góp mẫu
  ~0-cancel (pair đối pha) và 112 (cùng pha). Nợ mở (§4).
- **presented thường đi SAU currentTime** (offset −1 phổ biến ở lần 1:
  E n=168, D n=69; lần 2: D n=139, C n=98): headless `--disable-gpu`,
  compositor trình chiếu chậm hơn đồng hồ media ~1 khung. Ngược hướng
  "chạy trước ~10ms" của W4 §1.4 — pha chỉ cho điểm lật, không cho
  chiều lệch tuyệt đối. Cả 2 chiều đều xảy ra; quy tắc skip theo P
  đúng ở cả 2 chiều.

### 3.5 Đo lần 3 — assert96c (09:47–09:49Z, cửa sổ yên load 2,7; mtime ổn định 1794476460; sau thêm nhãn ringSize/skippedLatest lúc blend)

Lần 1 của lượt này HỎNG (vite 5173 DOWN — pid 1983 chết không rõ lý
do, không reboot mới — assert exit=2 "app không boot"; mtime ổn
định). Đã khởi vite riêng trên 5173, verify 200 + đúng code mới, chạy
lại waiter 09:44:51Z (poll 4 mới yên, load1 3,71→4,40→2,70). EXIT=0 —
**ASSERT PASS, tất cả kiểm tra xanh** (kể cả drawnStable mới với 6
trường). Dữ liệu: `preview-abcde-assert96c.json`.

| case | play t=0,5 / 1 / 1,5 gStdMed | buckets (triple / pair-dbl / direct / cancel) |
|---|---|---|
| A | 111,9 (identity) | 269 mẫu toàn 112 |
| B | 37,5 / 37,5 / 37,5 | 412/538 (77%) / 107 (20%) / 17 / 2 |
| C | 37,6 / 37,6 / 37,6 | 431/590 (73%) / 142 (24%) / 14 / 3 |
| D | 37,6 / 37,6 / 37,6 | 368/487 (76%) / 98 (20%) / 18 / 3 |
| E | 37,0 / **83,9** / 37,4 | 223/330 (68%) / 82 (25%) / 20 / 5 |

- **E t=1 median lật sang 83,9** (lần 2: 37,6) — mẫu nhỏ (nG=12,
  gStdMin 37 / Max 84,6) dưới tải cao hơn (waiter poll 3,7–4,4 trước
  khi yên; lần 2 load 1,6–1,9). Tổng buckets E vẫn 68% triple — không
  phải hồi quy code (code blend không đổi giữa lần 2 và 3, chỉ thêm
  instrumentation), mà là nhiễu tải + mẫu nhỏ. Ghi nhận trung thực:
  median từng điểm đo có thể lật khi nG < ~15 dưới tải cao.
- **Phán quyết cụm 84 — giả thuyết (a) BỊ BÁC, (b) còn lại:**
  - 84-mẫu (79–90, n=417, B–E) có **skippedLatest=1 chiếm ~90%**
    (B 94/102, C 133/141, D 84/94, E 56/80) và ringSize=3 chiếm
    ~95%. Triple cũng skp=1 (B 391/412). Quyết định skip đã xảy ra —
    không phải estimate dẫn trước gây không-skip.
  - Cùng nhãn đầy đủ (fi,pf,lf,pres,rsz,skp) cho cả 2 mức: B
    (10,9,10,10,3,1) n=7: [36,7×2, 84×5]; C (22,21,22,22,3,1):
    [36,6×2, 83,1, 83,8×4]; D (67,66,67,67,3,1): [37,7×4, 111,8×8].
    Nhãn blend không quyết định được pixels → **nội dung snapshot
    trong ring khác nhãn của nó** (snapshot trùng frame với hàng xóm).
  - Tương quan phụ (yếu, không kết luận): 84-mẫu giàu offset +1
    (presented chạy trước frameIdx từ currentTime): 97/417 (23%) so
    với triple 175/1434 (12%); pha trong khung sớm hơn (median frac
    0,3 vs 0,5). Nhưng 287/417 (69%) 84-mẫu ở offset 0 — offset lúc
    ĐO không bằng offset lúc CAPTURE (snapshot lỗi có thể là ghost
    K-1/K-2, capture từ 1–2 khung trước), nên phân tích này không
    chứng minh được cơ chế.
  - Cơ chế còn lại duy nhất trong code: **capture gán nhầm nhãn**
    (U1 §7 đã ghi: snapshot nhãn K chứa pixels K+1 cho đúng cặp
    37,5/84,6). Guard freshness hiện tại tin `currentTime`
    (skip khi currentTime − mediaTime > 1/fps + 0,5ms), nhưng
    currentTime có thể CHẠY SAU trình chiếu thật (offset +1 đo được)
    → callback trễ vẫn lọt guard, drawImage vẽ frame mới hơn nhưng
    gán nhãn cũ. Bằng chứng trực tiếp (log capture-time từng
    callback) không có trong dataset này — harness không export pump
    event log. Hướng sửa cho đợt sau: xem §4 mục 1.
- Spread theo cửa sổ đã vẽ + presented (nhóm ≥2 pass): E nGroups=14,
  spreadMed 0,8 (assert PASS), spreadMax 74,9. Worst: (47,44,45,46,
  ringSize 3, skp 0) [36,5, 111,4] — ring không liên tiếp (prev 44,
  last 45, fi 47, presented 46: pump lag, ghost {44,45} + current 46
  nhưng 1 mẫu ra 111,4 — blend với ghost cách xa + pha); (9,8,9,9,
  3,1) spread 45,5; (63,62,63,63,3,1) spread 44,8.
- Nhóm (67,66,67,67) / (68,67,68,68) ra 112,4 ở 1/3–1/2 mẫu: cuối clip
  (frame 67–68/90, video gần hết, pump ngừng capture) — blend với
  snapshot cũ + current đứng yên → direct. Artifact cuối clip, có từ
  trước, không phải do sửa này.
- Mẫu ~0-cancel: tổng 13/~2214 (0,6%), giữ mức lần 2.

## 4. Nợ mở (sau đợt 96 X2)

1. **Cụm double-count 84 (~19–25% mẫu) — CHƯA ĐÓNG.** Sửa blend đã
   đưa median về triple 37,5 nhưng ~1/5 tick vẫn blend {K-1,K,K} do
   snapshot trong ring trùng frame với hàng xóm (nhãn đúng, nội dung
   sai). Giả thuyết còn lại: capture gán nhầm nhãn khi callback trễ
   mà currentTime chạy sau trình chiếu (guard U1 lọt). Cần đợt sau:
   (a) export pump event log (seq, mediaTime, ctDeltaMs, decision)
   ra harness để tương quan trực tiếp 84-mẫu với capture trễ;
   (b) cân nhắc nhãn capture theo `presentedFrames` (đếm frame trình
   chiếu) thay vì mediaTime/currentTime; (c) lưu frameIdx từng
   snapshot trong ring (mảng song song) để blend verify tính liên
   tiếp lúc blend và harness đọc được cửa sổ THẬT (không chỉ nhãn
   debug). Không sửa trong đợt này (ngoài phạm vi: chỉ sửa vùng
   blend/ghost + debug state).
2. **Ring không liên tiếp sau clear / capture thưa** (prev cách last
   tới 3 frame, vd (68,65,68,68)): pump bỏ lỡ frame (skip-stale)
   mà không reset khi nhảy TIẾN; blend với ghost cách xa cho 112 /
   ~0-cancel rải rác. Nợ từ W4 §5.2 + đợt 95, nay đo rõ hơn.
3. **ringClears cao** (E 47–51/case): reset do seek — hành vi cũ,
   không hồi quy; đóng góp mẫu pair/direct sau mỗi clear.
4. **Median điểm đo lật dưới tải cao + mẫu nhỏ** (E t=1: 37,6 → 83,9
   khi nG=12, load ~4): assert nên yêu cầu nG tối thiểu lớn hơn hoặc
   báo median kèm nG (harness đã in nG — người đọc tự kiểm).
5. **probe90r1 còn assert ring===2 lỗi thời** — chỉ probe91s1 được
   cập nhật đợt này. Ai chạy probe90r1 sẽ fail assert ring.
6. **Vite 5173 của luồng khác chết không rõ lý do** giữa lượt 2 và 3
   (pid 1983, không reboot mới): X2 đã khởi vite riêng; các luồng
   khác cần tự kiểm tra vite của mình trước khi đo (waiter đã bắt
   được — exit=2, không đo sai).
7. Đứng yên theo LIMITS gộp đợt 95 §4 mục 9: TTS 39 CẤM kiểm lại;
   birefnet chỉ thử lại khi RAM đổi (u2net là fallback); ci-security.yml
   403 chờ user; G1 vẫn MỞ chờ user quyết; EPERM probe #15 + khoảng
   mù #14; blob-flaky giả thuyết 2 MiB mới; retry-play mở rộng;
   re-arm ân hạn 1 tick (X4); rVFC WebKit.

## 5. Kết luận

- **Sửa blend ghost (mục tiêu chính): ĐẠT ở mức median.** Preview
  nay blend đúng tmix {K-2,K-1,K} khi pump bắt kịp: median gStd
  37,5 ở mọi case B–E, cả 3 lượt đo sau sửa (lần 2: 37,5–37,6; lần 3:
  37,0–37,6, trừ E t=1 nhiễu mẫu nhỏ). Lỗi gốc đợt 95 (blend
  {K-1,K,K}, blur yếu ~2,25×) đã sửa xong ở trường hợp pump bắt kịp
  (~75% tick).
- **Chưa đạt đồng đều từng tick:** ~19–25% mẫu vẫn ở mức double-count
  84,6 do snapshot trùng trong ring (nhãn đúng, nội dung sai) — cơ
  chế capture gán nhầm nhãn, cần đợt sau chẩn đoán trực tiếp bằng
  pump event log (xem §4.1). Tiêu chí W4 §6.1 đạt 1,5/2: median ✓,
  spread median 0,8 ✓, nhưng spreadMax ~75 và cụm 84 còn ~1/5 mẫu.
- Kiểm chứng: tsc 0; vite build PASS (8,72 s); ghostBlend 15/15;
  previewEngine 25/25; seek 21/21; playheadHold90R2 44/44;
  playheadPacing54K9 19/19; assert a–e 5 pass × 3 lượt đo (lần 1
  EXIT=1 do 1 assert + nhiễm HMR; lần 2, 3 EXIT=0 PASS).
- Không push GitHub; batch đã stage (xem §6). Không release/tag.

## 6. File X2 tạo/sửa (batch stage)

- `apps/web/src/preview.tsx` — sửa blend ghost + ring capacity + trường
  presented frame / ringSize / skippedLatest (16 marker "Đợt 96 X2").
- `apps/web/scripts/probe91s1-motionblur-rvfc.cdp.mjs` — copy trường mới,
  drawnStable 6 trường, nhóm chẩn đoán tách theo (ringSize, skippedLatest).
- `docs/PHASE9_ROUND96_X2_GHOST_FIX_LIMITS.md` — file này.
- Scratch đo (không vào batch): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x2/`
  (`preview-abcde-assert96*.json`, `assert96*.log`, waiter scripts/logs,
  `o8-chromium/`, `o8-webkit/`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round96-x2-ghost-fix.txt`
  (NUL-delimited, 3 file trên). KHÔNG push GitHub; user tự push sau từ main chat.

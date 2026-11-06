# Phase 9 đợt 38, luồng U6 — Chuẩn bị phiên đo solo để khóa A/B <10% + chốt v3 — LIMITS

Ngày: 02/11/2026 (giờ +07). KHÔNG push, KHÔNG release/tag, KHÔNG
binary vào repo, KHÔNG code giả. Luồng này KHÔNG chạy browser
headed (tránh nhiễm các luồng khác đang chạy song song trong đợt
38) — mọi số phân tích đều tính từ dữ liệu JSON cũ đã có, và
phiên đo solo thật CHƯA CHẠY. Chỉ chuẩn bị runner + phân tích +
kiểm chứng tiền điều kiện; không sửa runner cũ, cổng v2/v3, probe
Q6, harness N2, code sản phẩm, hay file của luồng khác — chỉ thêm
3 file mới (§7). Không relabel dữ liệu cũ: mọi nhãn cũ giữ nguyên,
phân loại lại trong self-test/dry-run chỉ để đối chiếu.

Đọc trước khi làm: `docs/PHASE9_ROUND37_LIMITS.md` §3.1–§3.2 và
`docs/PHASE9_ROUND37_T1_GATE_V3_LIMITS.md` toàn bộ (§4 protocol
phiên solo, §8 nợ).

## 0. Kết luận ngắn

1. **Runner phiên solo đã viết xong** (`apps/web/scripts/seek-ab-solo-run.mjs`,
   file .mjs riêng, không sửa runner cũ): thực thi đúng protocol T1
   §4 — tiền kiểm solo, xen kẽ retry/single theo khối 8, dừng sớm
   khi đủ 8 accepted/phía + trôi đạt, trần 48 lượt, verify-solo
   bằng cổng v3 cho mọi lượt, JSON từng lượt + tổng hợp (trung vị/
   trung bình/sd, tỉ số từng cặp, CI Welch 95%, kiểm tra trôi nửa
   đầu/nửa sau). Có `--dry-run` (kiểm tra toàn bộ tiền điều kiện +
   phân loại file mẫu, không browser) và `--self-test` (phân loại
   lại đúng các lượt đã biết từ JSON cũ).
2. **Ngưỡng chốt trước cho phiên solo: GIỮ 2,0 cho cả load5 và
   load15** (§2). load15 tách sạch hơn load5 giữa hai cụm quiet
   (khoảng cách 0,77 so với 0,22), nhưng load15 một mình KHÔNG đủ
   làm cổng độc lập (§2.1) — và mọi ngưỡng thay thế suy ra từ cùng
   dữ liệu này đều là chỉnh hồi tố, nên chỉ được báo cáo dưới dạng
   phân tích độ nhạy, không được làm tiêu chí nhận/loại.
3. **Cơ chế sụp đoạn sâu VẪN CHƯA PHÂN BIỆT ĐƯỢC từ dữ liệu cũ**
   (§3): dữ liệu cũ không có thời gian từng seek, và các tín hiệu
   còn lại (hold, skip, rAF) đều không tách được cơ chế. Đã thiết
   kế xong spec probe per-seek (§3.3) — cần một luồng khác cài vào
   harness, vì U6 không sửa harness/probe trong đợt này.
4. **Cặp bundle đóng băng R1 và fixture sparse-gop-flat CÒN NGUYÊN,
   sha khớp công bố** (§4). Nhưng tại thời điểm dry-run, máy
   KHÔNG đủ điều kiện solo (14 tiến trình Chrome khác + load
   11,97/5,07/2,13) — đúng như kỳ vọng khi đợt 38 đang chạy song
   song. Dry-run trả exit 2 và fail-closed đúng thiết kế; phiên
   solo thật phải chạy khi máy đã yên, từ main chat hoặc phiên có
   quyền dừng các luồng browser khác.

## 1. Runner phiên solo: cái gì đã viết

`apps/web/scripts/seek-ab-solo-run.mjs` (mới, import cổng v3 có sẵn,
không copy ngưỡng — ngưỡng lấy từ `GATE_V3` của module v3 nên
không thể lệch khỏi v3 mà không ai hay):

- **Tiền kiểm solo mỗi lượt (T1 §4.3):** chờ tối đa 10 phút (poll
  30 s) tới khi load1/load5/load15 pre-run < 2,0 VÀ pgrep Chrome
  = 0; hết 10 phút → gate-timeout, KHÔNG tính là lượt đo, thử lại
  tối đa 2 lần rồi dừng phiên. Sau lượt: chromePost = 0, manifest
  sha trước = sau, bundle sha trước = sau (vi phạm manifest/bundle
  → INVALID, exit 3, dừng phiên — dist đóng băng đổi là lỗi phiên,
  không phải lượt đo bình thường).
- **Chạy lượt:** spawn probe Q6 y nguyên (`probe-round34-q6-measure-protocol.mjs
  run`) với env Q6_VIDEO/Q6_SCRATCH/Q6_DISPLAY/Q6_PORT/Q6_OUT/
  Q6_DIST; variant được chọn bằng chính thư mục dist đóng băng
  (dist-retry vs dist-single — cùng cách runner36 vận hành, không
  cần cờ variant riêng và không sửa probe). Sau đó dựng merged JSON
  kiểu runner36 (pre/post chrome + loadavg + top, bundle sha,
  frozen sha trước/sau, frozenDist validity của Q6) rồi chạy
  `verifySolo` của cổng v3 trên forward-hold.json + merged.
  Mỗi lượt ghi 1 JSON `v38-solo-seek-ab-solo-<variant>-s<N>.json`
  vào --out-dir; summary `v38-solo-seek-ab-summary.json` được
  ghi lại sau mỗi lượt (có --resume để đọc lại các lượt đã ghi
  thay vì chạy trùng).
- **Thứ tự và dừng:** xen kẽ nghiêm ngặt theo số lượt đã tính
  (lượt chẵn → retry, lượt lẻ → single) nên lượt bị loại không
  làm lệch nhịp; khối 8 luôn là 4 retry + 4 single. Dừng sớm khi
  đủ 8 accepted/phía và kiểm tra trôi đạt thì vẫn ghi summary rồi
  mới xét khóa (không tuyên bố khóa từ số gộp khi trôi fail);
  trần 48 lượt; quá trần → kết luận "không khóa được trên VM này",
  không chạy tiếp, không nới ngưỡng.
- **Tổng hợp:** trung vị/trung bình/sd mỗi phía (chỉ lượt
  accepted), tỉ số từng cặp theo thứ tự nhận, CI Welch 95% cho
  chênh lệch trung bình (single − retry) với bậc tự do
  Welch–Satterthwaite và bảng t rút gọn, kiểm tra trôi (trung vị
  nửa đầu/nửa sau mỗi phía, ngưỡng 10%). Khóa chỉ khi đủ cả ba:
  8/phía + trôi đạt + CI nằm gọn trong ±10% trung bình retry.
  CẤM gộp số solo với R1/b36 trong quyết định khóa; summary
  solo không chứa số R1/b36.
- **Chế độ `run` CHƯA TỪNG CHẠY trong đợt này** — code cho phiên
  solo tương lai. Mọi lệnh run trong LIMITS này đều là "chưa
  chạy", không được trích như kết quả.

## 2. Ngưỡng chốt trước cho phiên solo (quyết định + bằng chứng)

### 2.1 Phân tích từ dữ liệu cũ (tính lại từ 27 forward-hold.json R1+b36, không nhập tay)

Cụm quiet theo v2, load tối đa qua đúng 3 checkpoint Q6:

| Cụm | n | load5max | load15max |
|---|---|---|---|
| R1 quiet (a3, a4, a5, a6, single-a1, single-a2, single-a4) | 7 | 1,46–1,84 | 0,77–1,30 |
| b36 "quiet" (b6, b7, b8, single-b7) | 4 | 2,06–2,28 | 2,07–2,14 |

- **Khoảng cách cụm:** load5 = 0,22 (1,84 → 2,06); load15 = 0,77
  (1,30 → 2,07), gấp ~3,5 lần. Biên an toàn dưới ngưỡng 2,0 ở phía
  R1: load5 chỉ 0,16 (single-a2 1,84), load15 là 0,70 (retry-a6
  1,30). Ở phía b36, lượt gần ngưỡng nhất là retry-b8 ở cả hai
  cửa sổ (load5 2,06, vượt 0,06; load15 2,07, vượt 0,07) — tức
  khoảng cách cụm lớn của load15 đến chủ yếu từ phía R1 thấp hẳn
  (cửa sổ 15 phút trung bình hoá các đợt bùng ngắn), không phải
  từ phía b36 xa ngưỡng hơn.
- **load15 tách sạch hơn — nhưng chỉ trong so sánh hai cụm quiet
  này.** Nó KHÔNG phải cổng độc lập tốt hơn: trên toàn bộ 27 lượt,
  load15 < 2,0 vẫn "qua" nhiều lượt under-load theo v2 (ví dụ
  retry-b1 1,10; single-b4 1,91; retry-b5 1,94) vì những lượt đó bị
  loại bởi load1 hoặc tiêu chí xuôi/decode, không phải bởi tải
  nền bền. Ngược lại, load1 bắt được tải ngắn hạn mà load15 mù
  (tiền lệ S2 sparse-1: load5 1,23 / load15 0,54 nhưng vẫn
  under-load vì load1). Và trong nội bộ phiên b36, load15 của các
  lượt không-quiet (2,01–2,21) chồng lấn hoàn toàn cụm quiet-b36
  (2,07–2,14) — load15 đo tải nền của PHIÊN, không đo nhãn của
  lượt. Vì vậy v3 đúng khi yêu cầu CẢ BA (load1 + load5 + load15),
  và phiên solo phải giữ nguyên cả ba.
- **Mọi ngưỡng thay thế đều là chỉnh hồi tố nếu áp từ dữ liệu
  này:** bất kỳ ngưỡng load5 nào trong (1,84, 2,06) cũng tách
  được hai cụm trên dữ liệu cũ — kể cả điểm giữa 1,95 (biên cân
  0,11/0,11, đẹp hơn 2,0 vốn lệch về phía b36: 0,16 trên / 0,06
  dưới). Nhưng 1,95 được "phát hiện" sau khi đã thấy hai cụm, nên
  dùng nó làm tiêu chí nhận/loại cho phiên solo vẫn là đổi ngưỡng
  sau khi thấy số — chỉ khác là đổi trước phiên solo chứ không
  phải giữa phiên. Không làm vậy.

### 2.2 Quyết định chốt trước (ghi vào runner, cấm đổi giữa phiên)

- **Giữ 2,0 cho cả load1, load5, load15** làm tiêu chí nhận/loại
  duy nhất (đúng module v3, đúng T1 §4.1). Nhãn cũ không đổi hồi
  tố dưới bất kỳ ngưỡng nào khác.
- **Quy tắc gắn cờ mong manh (đăng ký trước, không đổi ngưỡng):**
  mọi lượt accepted solo có load5max ≥ 1,90 được gắn cờ
  `near-threshold-load5` trong JSON lượt; nếu > 25% lượt accepted
  mang cờ này, báo cáo phiên phải ghi rõ "ngưỡng load5 2,0 mong
  manh trên dữ liệu solo" và việc xem lại ngưỡng được hoãn sang
  đợt sau với dữ liệu mới — không nới/siết giữa phiên.
- **Phân tích độ nhạy (chỉ báo cáo, không nhận/loại):** summary
  phiên solo được phép kèm thêm một bảng: tập accepted sẽ thay
  đổi thế nào nếu ngưỡng load5 là 1,95 (điểm giữa hai cụm cũ).
  Bảng này không được dùng để tuyên bố khóa hay loại lượt.

## 3. Cơ chế sụp đoạn sâu: dữ liệu cũ cho thấy gì, và probe mới cần gì

### 3.1 Dữ liệu cũ KHÔNG đủ để phân biệt cơ chế — bằng chứng

Quét toàn bộ khóa của 27 forward-hold.json R1+b36: KHÔNG có khóa
nào về seek/latency/decoded/dropped/currentTime/readyState. Các
trường duy nhất của phase ngược là: samplesDetail {t, mean, draw,
hold, skip} theo lưới ~0,5 s, timeSeries, raf.reverse tổng hợp,
và probeMarks chỉ có mốc biên phase (rev-start/rev-end). Không có
thời gian của từng seek nên không thể nói seek nào chậm, decode
nào tắc, hay rAF nào trễ.

### 3.2 Các tín hiệu còn lại đều KHÔNG tách được cơ chế

- **Mẫu hình "GOP2 phẳng ở 1 frame/khoảng" không đặc trưng cho
  sụp đoạn.** Tính lại draw-delta từng khoảng từ samplesDetail:
  single-a4 (R1, SEGMENT_COLLAPSE) có GOP2 = 1,1,1… suốt từ
  t = 19,9 xuống 15,8, nhưng single-b7 (b36, HEALTHY, accepted
  theo v2) cũng có GOP2 = 1,2,1,2… tương tự — tỉ số GOP của b7
  (0,435) chỉ cao hơn vì GOP1 của nó thấp hơn (mức khỏe của phiên
  b36 vốn đã thấp), không phải vì GOP2 của nó khỏe. Kết luận:
  GOP2 phẳng là "sàn" của cả phiên chậm, tỉ số GOP chỉ tách được
  khi GOP1 còn khỏe — đúng giới hạn T1 đã ghi, và là lý do tỉ số
  không được dùng để nhận/loại lượt.
- **Vòng hold vẫn sống trong lúc sụp:** dHold mỗi khoảng 15–24 ở
  TẤT CẢ các lượt, kể cả single-a4 đang sụp (19,18,20,15,17…) và
  các lượt b36 — tức callback hold vẫn kích hoạt đều, nút thắt
  nằm sau bước hold, không phải vòng lặp seek đứng yên. skip = 0
  ở mọi lượt kiểm tra, nên skip cũng không mang tín hiệu.
- **rAF vẫn sống trong lúc sụp:** tickRate ngược 83,8–102,6/s ở
  cả lượt sụp (single-a4 93,1/s; single-b1 83,8/s) lẫn lượt khỏe
  (retry-a5 102,6/s); gapMax ~1,43 s xuất hiện ở MỌI lượt (kể cả
  khỏe) nên đó là gap khởi động duy nhất, không phải gap giữa
  phase ngược. Vì vậy "main thread bị đóng băng" đã bị loại trừ
  ở mức rAF, nhưng ba cơ chế còn lại (seek scheduling, decode
  stall, presentation/draw scheduling) vẫn không phân biệt được.
- **mean (mức xám trung tâm) vẫn đổi theo t trong GOP2 sụp**
  (single-a4: 168 → 159 → 151 → 143 → 135 khi t giảm) — tức
  currentTime vẫn tiến và frame hiển thị vẫn đổi, chỉ chậm. Đây
  là bằng chứng chống lại "seek kẹt hẳn", nhưng không đủ để nói
  decode hay presentation là nút thắt.
- **maxHoldAgeSec chồng lấn:** sụp single-a4 0,667 s; khỏe R1
  retry-a5 0,267 s; khỏe b36 single-b7 0,500 s — khoảng của lượt
  khỏe b36 nằm giữa, không đặt được ngưỡng tách.
- **Không hồi khi t → keyframe 10 s:** single-a4 phẳng suốt từ
  khoảng cách tới keyframe 9,9 s xuống 5,8 s (t = 19,9 → 15,8)
  không có dấu hiệu hồi — nhưng phase ngược dừng ở ~15,8 s nên
  chưa từng quan sát được đoạn t qua biên 10 s. Không thể kết
  luận "không hồi ở keyframe tiếp theo" khi chưa đo qua biên đó.

### 3.3 Spec probe per-seek mới (thiết kế xong, CHƯA cài — cần luồng khác sửa harness)

Probe này phải được cài vào harness N2 (hoặc probe phụ chạy cùng
phiên, ghi cùng forward-hold.json) TRƯỚC phiên solo nếu muốn
phiên solo trả lời được cơ chế — nếu không, phiên solo chỉ khóa
được A/B <10%, không claim cơ chế. Mỗi bước seek k trong phase
ngược ghi đúng các trường sau (tên trường chốt trước, không đổi
giữa phiên):

```
perSeek[k] = {
  k, targetTime,                       // t đích của bước seek (giây video)
  seekRequestedAtMs,                   // performance.now() lúc gán currentTime
  seekedAtMs,                          // performance.now() lúc callback seeked
  firstDrawAfterSeekAtMs,              // performance.now() lúc draw đầu tiên sau seeked có currentTime mới
  seekLatencyMs,                       // = seekedAtMs - seekRequestedAtMs
  drawLatencyMs,                       // = firstDrawAfterSeekAtMs - seekedAtMs
  currentTimeAtSeek,                   // video.currentTime lúc gán
  currentTimeAtSeeked,                 // video.currentTime lúc seeked
  decodedFramesAtSeek, decodedFramesAtSeeked,   // getVideoPlaybackQuality().totalVideoFrames (fallback webkitDecodedFrameCount)
  droppedFramesAtSeek, droppedFramesAtSeeked,   // getVideoPlaybackQuality().droppedVideoFrames
  rafTicksWhileWaiting,                // số tick rAF giữa requested và firstDraw
  holdCountAtSeek, holdCountAtFirstDraw // đếm hold để nối với drawDelta hiện có
}
```

Dự đoán phân biệt (đăng ký trước khi đo, để đối chiếu chứ không
để suy diễn sau):

- seekLatencyMs phình ở GOP2 nhưng drawLatencyMs và decodedFrames
  tăng ngay sau seeked → nút thắt ở lập lịch/trạng thái seek.
- seeked nhanh nhưng drawLatencyMs phình và decodedFrames đứng
  yên → decode stall (frame chưa giải mã xong).
- Cả hai nhanh nhưng draw vẫn chậm trong khi rafTicksWhileWaiting
  vẫn đều → nút thắt ở presentation/draw scheduling (canvas/rAF).
- Kéo dài phase ngược qua biên 10 s (tới ~5 s): nếu GOP2 hồi về
  mức GOP1 ngay sau biên 10 s → trạng thái gắn với GOP đó; nếu
  vẫn phẳng → chậm toàn cục hoặc trạng thái bền, không phải
  GOP-local.

Giới hạn của probe: vẫn không nhìn được bên trong decoder Chrome
(CDP pipe không expose tín hiệu decode nội bộ — T1 §3.2); probe
chỉ tách được ba tầng seek/decode/presentation, không chứng minh
được nguyên nhân gốc trong decoder.

## 4. Cặp bundle đóng băng + fixture: còn hay mất (kiểm tra thật, không bịa sha)

Kiểm tra bằng `sha256sum` + manifest đệ quy (đúng thuật toán Q6)
trong dry-run (§5):

| Vật chứng | Đường dẫn | Trạng thái | sha256 |
|---|---|---|---|
| Bundle retry | `~/workspace/tmp-round35-r1/dist-retry/assets/index-BqxQgBuf.js` | CÒN, khớp S1 §1 | `f2fb01664045fcac30275d0d2459e38188f28b4413988d33063331d503b4f65d` |
| Bundle single | `~/workspace/tmp-round35-r1/dist-single/assets/index-xfaJXEFE.js` | CÒN, khớp S1 §1 | `fffcd2c019461441b16860879841b0c019ef6fb2085815eb1fa3764b1cf8136a` |
| Manifest dist retry | `~/workspace/tmp-round35-r1/dist-retry/` (254 file) | CÒN, khớp manifest Q6 đã công bố của lượt retry-a5 | `71ddbb25e2e5f8ba52bebf068990a6c3f00b533887e2270f5970537d75803681` |
| Manifest dist single | `~/workspace/tmp-round35-r1/dist-single/` (254 file) | CÒN (giá trị này quan sát trong dry-run đợt này, chưa từng công bố trước) | `b549f6908c0ccc062bdfac731808a52fdcb137eae03e4176cff8493426bb2360` (runner tính lại mỗi lần, không hardcode) |
| Fixture sparse-gop-flat | `~/workspace/tmp-round27-k4/sparse-gop-flat.mp4` (45.369 byte) | CÒN, khớp sha đã công bố (R2/S2, v35-r4) | `a4ea20eb67bb6b214eb38c8aee8f2a30f28d698d714265ab8049716e820bd00e` |

Cả hai dist đều có index.html + đúng 1 bundle .js trong assets/.
KHÔNG thiếu vật chứng nào cho phiên solo. Điều duy nhất thiếu tại
thời điểm dry-run là điều kiện máy (mục §5): 14 Chrome khác +
load cao — đó là điều kiện phiên, không phải vật chứng mất. Nếu
một trong các vật chứng trên mất trước phiên solo, phiên CHƯA ĐỦ
ĐIỀU KIỆN và phải tái tạo đúng spec (bundle: rebuild từ cây đóng
băng R1 cho sha đồng nhất như S1; fixture: GOP 300, 720p, 30 s,
H.264 đúng spec đợt 27 K4), rồi ghi lại sha mới — không dùng file
khác thay thế mà không ghi lại sha.

## 5. Kiểm chứng đã chạy (lệnh + kết quả thật, không browser headed)

- `node --check apps/web/scripts/seek-ab-solo-run.mjs` → pass.
- `node --check apps/web/scripts/seek-ab-solo-run.test.mjs` → pass.
- `node --test apps/web/scripts/seek-ab-solo-run.test.mjs` →
  10 test, 10 pass, 0 fail (loadMaxima đúng 3 checkpoint; manifest
  xác định + khớp manifest Q6 công bố của dist-retry; planOrder
  khối 8; pairwise đúng thứ tự nhận với fps đầy đủ; Welch trên
  tập R1-v3 cho nửa khoảng vượt ±10% nên không khóa; drift 22%
  bị gắn cờ / 5% đạt; buildSummary tập 8+8 giả locked / tập R1-v3
  thật không locked; summarizeSide; file mẫu tồn tại).
  Lỗi gặp trong lúc viết test (trung thực): bản đầu dùng fps làm
  tròn 3 chữ số nên tỉ số cặp 1 ra 0,9894 thay vì 0,9895 của bản
  công bố — đã sửa test dùng fps đầy đủ từ file cũ, runner không
  đổi (runner tính từ fps đầy đủ nên luôn ra 0,9895).
- `node apps/web/scripts/seek-ab-solo-run.mjs --self-test` →
  exit 0, ok: true, failures: []. Phân loại lại đúng cả 6 lượt đã
  biết: retry-a5 acceptedV3/HEALTHY/quiet; single-a4 STEADY_SLOW /
  SEGMENT_COLLAPSE tỉ số 0,214; retry-b6/b7, single-b7 under-load
  theo v3 (HEALTHY về decode); retry-b8 INDETERMINATE_MIXED tỉ số
  0,343. Thống kê kiểm tra: 2 cặp R1 0,9895/1,0939 (khớp bản công
  bố R1); Welch trên tập 3+2 cho nửa khoảng 1,795 fps = 19,94%
  trung bình retry nên không khóa (đúng — n < 8); lockLocked =
  false; planFirst8 đúng; drift giả 22% bị gắn cờ.
- `node apps/web/scripts/seek-ab-solo-run.mjs --dry-run` → exit 2,
  ok: false — ĐÚNG THIẾT KẾ fail-closed, không phải lỗi runner:
  kiểm tra bundle/fixture/manifest/sample đều PASS (bảng §4;
  sample 6/6 PASS), nhưng tiền điều kiện máy FAIL: pgrep Chrome
  = 14 (các luồng đợt 38 đang chạy) và load pre-run 11,97 / 5,07 /
  2,13 (vượt 2,0 ở cả ba cửa sổ). Kết luận dry-run: phiên solo
  CHƯA ĐỦ ĐIỀU KIỆN tại thời điểm đó vì máy đang bận, không phải
  vì thiếu vật chứng. Dry-run phải được chạy lại ngay trước phiên
  solo thật và phải ra exit 0 mới được chạy lượt đầu.
- Hồi quy cổng v3 (không sửa v3, chỉ chạy lại):
  `node --test apps/web/scripts/seek-ab-gate-v3.test.mjs` → 13/13
  pass, 0 fail.
- Không chạy: `tsc`/`vite build` (luồng không sửa code sản phẩm
  hay TypeScript — chỉ thêm script .mjs đo lường; parent gộp vẫn
  chạy lại theo quy trình chung nếu cần); không chạy browser
  headed nào; không chạy chế độ `run` của runner.

## 6. Cái gì vẫn mở (trung thực)

1. **Phiên đo solo thật chưa chạy** — runner đã sẵn nhưng quyết
   định khóa A/B <10% và chốt v3 vẫn cần dữ liệu mới từ phiên đó.
   Người chạy phiên phải: chạy `--dry-run` tới khi exit 0, xác
   nhận display/port (:91/4191 mặc định — phải không trùng luồng
   khác tại thời điểm chạy) còn trống, rồi mới chạy `run`.
2. **Probe per-seek (§3.3) chưa cài** — cần luồng khác sửa harness
   N2/probe phụ; U6 không sửa harness trong đợt này theo luật
   luồng. Nếu probe chưa có khi phiên solo chạy, phiên vẫn khóa
   được A/B nhưng KHÔNG trả lời được cơ chế sụp đoạn.
3. **Ngưỡng load5 mong manh vẫn mở** (§2.2): quy tắc gắn cờ
   near-threshold và bảng độ nhạy 1,95 chỉ là đăng ký trước, chưa
   có dữ liệu solo để kiểm tra.
4. **Vùng INDETERMINATE_MIXED vẫn chỉ có 1 tiền lệ (retry-b8)** —
   phiên solo cần ghi subtype cho mọi lượt STEADY_SLOW (runner đã
   làm qua verifySolo) để có thêm ca.
5. **Nợ đứng chung:** Safari / máy thật / GPU thật / footage
   B-frame / độ phân giải khác / đường `asset:` — vẫn chưa đo;
   V3-a của S2 (loại trừ N tick đầu phase xuôi) vẫn chưa làm.

## 7. File đổi/thêm (chỉ của U6 — text, không binary, không dist)

- Mới: `apps/web/scripts/seek-ab-solo-run.mjs` (runner phiên solo:
  dry-run, self-test, run; import cổng v3, không sửa file cũ).
- Mới: `apps/web/scripts/seek-ab-solo-run.test.mjs` (test unit
  10/10 cho hàm thuần của runner).
- Mới: `docs/PHASE9_ROUND38_U6_SOLO_RUNNER_LIMITS.md` (file này).
- Không sửa: runner36, cổng v2/v3, probe Q6, harness N2, code sản
  phẩm, file của luồng khác, paths-loop, build-loop-log. Không
  push, không tag. Scratch đọc vào (không ghi):
  `~/workspace/tmp-round35-r1/runs/` và
  `~/workspace/tmp-round36-s1/runs/` (chỉ đọc forward-hold.json);
  output kiểm chứng của U6 nằm ở /tmp (self-test/dry-run JSON),
  không đưa vào repo.

# Phase 9 đợt 37, luồng T1 — Cổng đo v3 + tách "sụp đoạn" khỏi "chậm toàn cục" — LIMITS

Ngày: 02/11/2026 (giờ +07). KHÔNG push, KHÔNG release/tag, KHÔNG
binary vào repo, KHÔNG code giả. Luồng này KHÔNG chạy browser
headed (tránh nhiễm các luồng đo khác đang chạy song song) —
mọi số hiệu chuẩn đều tính từ dữ liệu JSON cũ đã có, không có
lượt đo mới nào. KHÔNG sửa file của luồng khác, KHÔNG sửa cổng
v2, probe Q6, code sản phẩm, harness N2, hay bất kỳ file đã có
nào — chỉ thêm file mới (§6). KHÔNG relabel dữ liệu cũ: các file
kết quả đợt 34–36 giữ nguyên nhãn đã công bố; cột v3 trong file
hiệu chuẩn chỉ là phân loại lại bằng cổng đề xuất để đo mức đổi
nhãn.

Đọc trước khi làm: `docs/PHASE9_ROUND36_LIMITS.md` §3.1,
`docs/PHASE9_ROUND36_S1_SEEK_AB_LOCK_LIMITS.md` (đặc biệt §2,
§3, §5.2, §5.4) và `docs/PHASE9_ROUND36_S2_FROZEN_BASELINE_LIMITS.md`
§5 (đề xuất v3 của S2 — xem §2.4 để biết v3 này lấy gì từ S2 và
không lấy gì).

## 0. Kết luận ngắn

1. **Cổng v3 đã cài đặt xong** (`apps/web/scripts/seek-ab-gate-v3.mjs`,
   trạng thái `proposed`): giữ nguyên mọi ngưỡng v2, thêm load5/load15
   vào verdict tải và tỉ số GOP2/GOP1 làm bộ tách sụp-đoạn vs
   chậm-toàn-cục. Test unit 13/13 xanh (lệnh §6).
2. **Hiệu chuẩn hồi tố trên 35 lượt thô + 8 lượt S2** (file
   `benchmarks/results/v37-t1-gate-v3-calibration.json`, tính bằng
   script, không nhập tay):
   - Ngưỡng load5/load15 < 2,0 đổi nhãn tải của đúng 4 lượt — toàn
     bộ 4 lượt "quiet" đợt 36 (retry-b6, retry-b7, retry-b8,
     single-b7) — và làm 3 lượt accepted đợt 36 rớt khỏi thống kê
     (b6, b7, single-b7); 5 lượt accepted đợt 35 R1 giữ nguyên.
     Tập accepted gộp R1+b36 theo v2 là 8 → theo v3 là 5 (toàn R1).
   - Tỉ số GOP2/GOP1 < 0,30 (gợi ý của S1, nay đã hiệu chuẩn) bắt
     2/5 ca STEADY_SLOW thành SEGMENT_COLLAPSE (single-a4 0,214;
     single-b1 0,290), 0/23 lượt HEALTHY bị gắn cờ sai. retry-b8
     (0,343) rơi vào vùng chưa rõ INDETERMINATE_MIXED; retry-b1/b2
     (0,495/0,467) là NON_SEGMENT.
   - **Cả hai ngưỡng đều là hiệu chuẩn HỒI TỐ** — v3 CHƯA phải cổng
     chính thức. v2 vẫn là cổng chính thức cho tới khi phiên đo
     riêng (§4) chạy với ngưỡng v3 đã chốt trước và xác nhận được
     cụm tách.
3. **Hiệu ứng <10% VẪN CHƯA KHÓA** — luồng này không claim gì thêm:
   không có lượt đo mới, không có phiên đo riêng thật, và tập
   accepted theo v3 (n = 5, toàn một phiên R1) còn nhỏ hơn tập v2.
4. **Cơ chế sụp đoạn sâu VẪN CHƯA RÕ.** v3 chỉ gắn nhãn mẫu hình
   (GOP2 phẳng ở 1 frame/khoảng, không hồi khi t → keyframe 10 s);
   vì sao nó phẳng thì vẫn chưa có tín hiệu decode nội bộ nào
   chứng minh.

## 1. Cổng v3: cái gì giữ, cái gì thêm

### 1.1 Giữ nguyên v2 (không nới, không siết)

- Tải: load1 < 2,0 ở đúng 3 checkpoint của Q6 (beforeFwd,
  beforeRev, atEnd), tốc độ xuôi trong [0,98, 1,02], gap rAF P50
  xuôi ≤ 0,015 s, predictedRate xuôi (trừ tick biên) ≥ 0,98,
  chromePre = 0.
- Decode: stall ≤ 1, chuỗi stall ≤ 1, tickRate ≥ 80/s,
  tailMean < 1,5 NGHIÊM NGẶT (lượt tailMean đúng 1,500 vẫn qua,
  đúng quy tắc S1 §5.4), tailMax ≤ 2.
- Acceptance: chỉ khi loadLabel = quiet VÀ decode = HEALTHY.
  Tỉ số GOP KHÔNG dùng để nhận/loại lượt — chỉ là chẩn đoán kèm.

### 1.2 Thêm: load5/load15 (đề xuất)

- Tiêu chí mới: load5 tối đa và load15 tối đa qua cùng 3
  checkpoint Q6 đều < 2,0 (cùng logic "0,5/core" trên máy 4 vCPU
  như load1). atStart và loadavg pre-run chỉ ghi làm tín hiệu,
  không làm tiêu chí (xem §5 về lỗi đã sửa: bản đầu tính cả
  atStart và phân loại sai retry-b7).
- Cả hai tiêu chí phải cùng đạt: trên dữ liệu hiệu chuẩn, mỗi
  tiêu chí riêng lẻ cũng cho cùng tập đổi nhãn 4 lượt (xem §2.1),
  nhưng ngưỡng load5 mong manh (khoảng cách cụm chỉ 0,22) nên
  không được dùng một mình.
- Đề xuất V3-b của S2 (dùng load pre-run làm tín hiệu tải môi
  trường chính): v3 GHI pre-loadavg vào signals nhưng KHÔNG đổi
  tiêu chí sang pre-run, vì pre-run không có trong mọi file cũ
  và chưa có bằng chứng nó tách cụm tốt hơn checkpoint N2.
  Phiên đo riêng (§4) sẽ ghi cả hai để so sánh tiền định.

### 1.3 Thêm: bộ tách GOP2/GOP1

- Định nghĩa (đã khớp đúng số S1 báo cáo cho cả 6 lượt kiểm tra:
  single-a4 4,667→1,000; retry-b1 2,778→1,375; retry-b8 3,278→1,125;
  single-b1 3,444→1,000; retry-b6 3,556→1,875; retry-a4 4,778→2,750):
  GOP1 = các khoảng mà cả hai đầu mẫu đều có t ≥ 20 s (keyframe
  20 s của fixture sparse-gop-flat), GOP2 = cả hai đầu < 20 s,
  khoảng bắc cầu biên (20,5 → 19,9) bị loại. Mỗi phía cần ≥ 4
  khoảng, không thì tỉ số = unavailable. Biên 20 s là tham số
  (`boundarySec`, mặc định 20) — fixture khác phải truyền biên
  của nó, không được áp mù 20 s.
- Phân loại subtype CHỈ khi decode = STEADY_SLOW:
  - ratio < 0,30 → SEGMENT_COLLAPSE;
  - 0,30 ≤ ratio < 0,435 → INDETERMINATE_MIXED (0,435 là tỉ số
    thấp nhất quan sát được ở lượt HEALTHY — sàn quan sát, KHÔNG
    phải ngưỡng tiền định; vùng này hiện chỉ có 1 tiền lệ);
  - ratio ≥ 0,435 → NON_SEGMENT (mẫu hình không khu trú ở đoạn —
    phù hợp chậm toàn cục, nhưng tỉ số một mình KHÔNG chứng minh
    cơ chế; cần đối chiếu GOP1 với baseline cùng phiên).
- Khi decode = STARVED, subtype = null kèm lý do: GOP1 cũng sụp
  nên tỉ số vô nghĩa (tiền lệ: retry-a3 ratio 1,714; single-b4
  ratio 0,000 — cả hai đều là artefact của stall, không phải
  tín hiệu đoạn). Khi decode = HEALTHY, tỉ số chỉ ghi làm chẩn
  đoán, không gắn cờ.
- Giới hạn: tỉ số cần samplesDetail có t từng mẫu. JSON gộp kiểu
  S1 không có t nên v3 trả về GOP unavailable cho dạng đó (các
  phần còn lại vẫn tính lại được từ drawDeltaSeries) — đó là
  lý do `verify-solo` yêu cầu kèm forward-hold.json thô (§4.5).

## 2. Hiệu chuẩn trên dữ liệu cũ (không relabel, không lượt mới)

Nguồn (script `seek-ab-gate-v3-calibrate.mjs` đọc và tính, không
nhập tay): 8 lượt thô đợt 34 Q1 (trong repo), 11 lượt R1 +
16 lượt b36 (forward-hold.json trong scratch tmp-round35-r1 /
tmp-round36-s1 — scratch nằm ngoài repo; nếu mất, script báo rõ
và bỏ qua phần đó thay vì bịa số), 8 lượt S2 (chỉ tải, trong
repo). Đối chiếu chéo: decode tính lại khớp 100% nhãn v2 đã công
bố của b36 (0 lệch), tải v2 tính lại khớp 100% nhãn đã công bố
(0 lệch); 1 ca "lệch" duy nhất là single-a4, mà file gộp R1 mang
nhãn decode v1 (HEALTHY) còn v2 tính lại là STEADY_SLOW — đúng ca
phân loại lại mà S1 đã công bố, không phải lỗi.

### 2.1 Ngưỡng load5/load15 < 2,0: đổi nhãn đúng 4 lượt

Cụm quiet theo v2, tách theo phiên (load tối đa qua 3 checkpoint):

| Phiên | Lượt quiet v2 | load5max | load15max | Theo v3 |
|---|---|---|---|---|
| R1 đợt 35 | 7 lượt (a3, a4, a5, a6, single-a1, single-a2, single-a4) | 1,46–1,84 | 0,77–1,30 | Giữ quiet |
| b36 | 4 lượt (b6, b7, b8, single-b7) | 2,06–2,28 | 2,07–2,14 | → under-load |

- Khoảng cách giữa hai cụm: load5 chỉ 0,22 (R1 tối đa 1,84 của
  single-a2 → b36 tối thiểu 2,06 của retry-b8; b8 chỉ vượt ngưỡng
  0,06), load15 là 0,77 (1,30 → 2,07). Ngưỡng load15 tách sạch và
  xa biên hơn ngưỡng load5 — nhưng v3 vẫn yêu cầu cả hai, vì
  load5 là tín hiệu sớm hơn của tải nền (cửa sổ 5 phút phản ứng
  nhanh hơn 15 phút) và cả hai đều vượt ở cả 4 lượt b36.
- Đổi nhãn tải: 4 lượt (toàn bộ quiet b36). Đổi accepted: 3 lượt
  (retry-b6, retry-b7, single-b7 — retry-b8 vốn đã bị loại vì
  decode STEADY_SLOW nên không tính vào đổi accepted). Tập
  accepted gộp: v2 = 8 (R1 5 + b36 3) → v3 = 5 (toàn R1).
- 16 lượt under-load theo v2 (có nhãn công bố): 10 lượt cũng vi
  phạm load5/load15, 6 lượt chỉ vi phạm lý do v2 — tức load5/15
  không thay đổi kết luận cho nhóm này, chỉ bổ sung.
- 8 lượt S2: cả 8 vẫn under-load theo v3 (đã under-load theo v2).
  S2 chứng minh load5/load15 là tiêu chí BỔ SUNG, không thay thế
  v2: sparse-1 có load5max 1,23 / load15max 0,54 (đều thấp) nhưng
  vẫn under-load vì load1 — tải ngắn hạn vẫn bắt bằng load1.
  Ngược lại, không lượt S2 nào cho thấy load5/15 bắt được ca mà
  v2 bỏ sót, vì S2 không có lượt quiet nào để đối chiếu.

### 2.2 Tỉ số GOP: < 0,30 bắt 2/5 ca, 0 false positive

| Lượt STEADY_SLOW | GOP1 | GOP2 | Tỉ số | Subtype v3 |
|---|---|---|---|---|
| single-a4 (R1) | 4,667 | 1,000 | 0,214 | SEGMENT_COLLAPSE |
| single-b1 (b36) | 3,444 | 1,000 | 0,290 | SEGMENT_COLLAPSE |
| retry-b8 (b36) | 3,278 | 1,125 | 0,343 | INDETERMINATE_MIXED |
| retry-b2 (b36) | 2,944 | 1,375 | 0,467 | NON_SEGMENT |
| retry-b1 (b36) | 2,778 | 1,375 | 0,495 | NON_SEGMENT |

- HEALTHY (n = 23): tỉ số 0,435–0,603, thấp nhất là single-b7
  (0,435, lượt quiet b36). Không lượt HEALTHY nào < 0,30 → 0
  false positive cho ngưỡng sụp đoạn. Khoảng trống giữa ca
  collapse cao nhất (0,290) và sàn HEALTHY (0,435) chứa đúng
  retry-b8 (0,343) — ca hỗn hợp theo S1 §5.3 (sụp đoạn nhẹ +
  chậm toàn cục, GOP1 3,28 cũng thấp hơn mức khỏe cùng phiên
  R1 nhưng ngang mức khỏe cùng phiên b36).
- Vì sao không đặt ngưỡng ở 0,35 để "bắt thêm" b8: làm vậy sẽ
  thu hẹp khoảng cách tới sàn HEALTHY còn 0,085 và biến một ca
  hỗn hợp (GOP1 cũng chậm) thành "sụp đoạn thuần" mà không có
  bằng chứng mới. Ngưỡng 0,30 giữ nguyên gợi ý của S1 và được
  dữ liệu này xác nhận ở mức "2 ca thuần tách sạch, 1 ca hỗn
  hợp nằm giữa" — không hơn.
- Chậm toàn cục (b1/b2) KHÔNG tách được khỏi HEALTHY bằng tỉ số
  một mình (0,467/0,495 nằm trong dải HEALTHY 0,435–0,603) — đó
  là đúng thiết kế: tỉ số chỉ tách sụp đoạn ra, còn chậm toàn
  cục được nhận diện bằng GOP1 tuyệt đối thấp so với baseline
  cùng phiên + nhãn under-load đi kèm (cả b1/b2 đều under-load).

### 2.3 Ngưỡng nào CHƯA đủ bằng chứng (để là đề xuất, không áp đặt)

- load5/load15 < 2,0: CHƯA ĐỦ. Đây là hiệu chuẩn hồi tố trên
  đúng 11 lượt quiet (7 R1 + 4 b36); ngưỡng được chọn sau khi đã
  thấy hai cụm. Nó chỉ thành ngưỡng chính thức khi phiên đo
  riêng (§4) — chạy với ngưỡng đã chốt trước — cho thấy lượt
  quiet thật có load5/load15 dưới ngưỡng và lượt nhiễm tải nền
  bị bắt. Cho tới lúc đó, mọi thống kê chính thức vẫn dùng v2,
  và mọi số v3 đều phải ghi kèm chữ "đề xuất".
- GOP < 0,30: ĐỦ Ở MỨC "bộ tách chẩn đoán", CHƯA ĐỦ ở mức "cổng
  nhận/loại". 2 ca thuần + 0 false positive là bằng chứng tốt
  cho việc ghi nhãn, nhưng n = 5 ca STEADY_SLOW là quá nhỏ để
  khóa ngưỡng vĩnh viễn; v3 vì vậy không dùng tỉ số để loại lượt.
- Sàn HEALTHY 0,435: CHỈ LÀ SỐ QUAN SÁT, không phải ngưỡng. Vùng
  INDETERMINATE_MIXED được định nghĩa bằng sàn này và sẽ thu hẹp
  hoặc dịch chuyển khi có thêm dữ liệu — không được trích 0,435
  như một ngưỡng đã khóa.
- TailMean = 1,500: giữ nguyên quy tắc v2 (< nghiêm ngặt). Hai
  lượt accepted b36 (retry-b7, single-b7) nằm đúng biên này;
  dưới v3 cả hai đã rớt vì tải nên biên tail không còn ảnh hưởng
  tới tập accepted v3, nhưng phiên đo riêng vẫn phải giữ quy tắc
  này như đã chốt trước, không được đổi dấu bất đẳng thức giữa
  chừng (S1 §5.4).

### 2.4 Đối chiếu với đề xuất v3 của S2 (§5 của S2)

- V3-a của S2 (loại trừ N tick đầu phase xuôi khỏi predictedRate):
  KHÔNG đưa vào v3 này. S2 chứng minh gap đầu phase là stall khởi
  động, nhưng chưa có lượt mới để kiểm chứng N = 2 hay 3 tách cụm
  — đưa vào lúc này sẽ là đổi ngưỡng sau khi thấy số. Nợ này
  chuyển cho đợt sau, đo bằng lượt mới (xem §7).
- V3-b của S2 (load pre-run làm tín hiệu môi trường): v3 GHI
  pre-loadavg vào signals, chưa đổi tiêu chí (§1.2).
- V3-c của S2 (điều phối cửa sổ quiet giữa các luồng): trở thành
  điều kiện tiên quyết của phiên đo riêng (§4) — không phải
  ngưỡng số mà là điều kiện tổ chức.
- V3-d của S2 (vị trí gap làm tín hiệu phụ): chưa đưa vào v3; tỉ
  số GOP là tín hiệu phụ tương đương cho phía decode, không phải
  cho phía rAF xuôi.

## 3. Cái gì v3 KHÔNG làm (để không đọc quá)

- Không sửa v2, không đổi nhãn chính thức của bất kỳ lượt nào.
- Không giải thích cơ chế sụp đoạn sâu: vì sao GOP2 phẳng ở
  1 frame/khoảng trong khi khoảng cách tới keyframe 10 s đã thu
  từ 9,4 xuống 5,8 s (single-a4) vẫn chưa có lời giải từ dữ liệu
  hiện có — mọi giả thuyết (trạng thái decode của Chrome cho GOP
  đó, lập lịch thread decode, trạng thái seek nội bộ) đều chưa
  phân biệt được vì không có tín hiệu từ bên trong decoder qua
  CDP pipe (S1 §3.2). Cần probe thời gian từng seek trong phase
  ngược hoặc kéo dài phase ngược qua biên GOP tiếp theo — ngoài
  phạm vi luồng này.
- Không phân biệt được stall khởi động idx=1 là seek-first-frame
  hay decode warm-up (nợ của S2 §8.3).
- Không đo lại trên máy khác / GPU thật / Safari — mọi số đều từ
  VM này, fixture này, bundle đóng băng R1.

## 4. Protocol phiên đo riêng (solo session) — CHỈ VIẾT, CHƯA CHẠY

Mục tiêu duy nhất: khóa hoặc loại trừ hiệu ứng <10% giữa retry
và single bằng dữ liệu đủ sạch. Protocol này chưa từng chạy —
mọi con số dưới đây là kế hoạch chốt trước, không phải kết quả.

### 4.1 Chốt trước (pre-registration — cấm đổi giữa phiên)

- Bundle: cặp bundle đóng băng R1 (retry `index-BqxQgBuf.js`,
  single `index-xfaJXEFE.js`, 212 module, sha như S1 §1) + manifest
  dist đóng băng; fixture `sparse-gop-flat.mp4` (GOP 300, 720p,
  30 s); harness N2 y nguyên; probe Q6 + cổng v3 của luồng này.
- Ngưỡng (đóng băng đúng như module `seek-ab-gate-v3.mjs`):
  load1/load5/load15 < 2,0 ở beforeFwd/beforeRev/atEnd; xuôi
  [0,98, 1,02]; rAF P50 ≤ 0,015 s; predictedRate ≥ 0,98;
  chromePre = 0; decode v2 (stall ≤ 1, chuỗi ≤ 1, tick ≥ 80/s,
  tailMean < 1,5 nghiêm ngặt, tailMax ≤ 2); biên GOP 20 s; vùng
  subtype như §1.3.
- Acceptance: loadLabelV3 = quiet VÀ decode = HEALTHY. Tỉ số GOP
  chỉ ghi kèm, không dùng để nhận/loại.
- Mục tiêu: 8 accepted/phía (mục tiêu gốc 8+8 của S1). Thứ tự:
  xen kẽ, bắt đầu bằng retry (retry, single, retry, single…);
  cặp ghép theo thứ tự nhận như S1.
- Tiêu chí khóa: khoảng tin cậy Welch 95% cho chênh lệch trung
  bình (single − retry) nằm gọn trong ±10% của trung bình retry
  VÀ đủ 8 accepted/phía VÀ kiểm tra trôi (§4.4) đạt. Thiếu một
  trong ba → chưa khóa.
- Cấm: đổi ngưỡng giữa phiên; nới ngưỡng sau khi thấy số; gộp
  số phiên solo với số phiên R1/b36 mà không kiểm tra trôi;
  tính lượt bị loại (STARVED/STEADY_SLOW/under-load) vào thống kê
  A/B; revert `seekElement` trừ khi điều kiện revert của R1 xảy
  ra (retry thua có ý nghĩa thống kê).

### 4.2 Cỡ mẫu và thời gian (ước tính, không phải cam kết)

- Tỉ lệ nhận quan sát được: R1 5/11 ≈ 45% (retry 3/6 = 50%,
  single 2/5 = 40%); b36 3/16 ≈ 19% trong buổi nhiều luồng.
  Phiên solo kỳ vọng đạt ít nhất mức R1 (không còn browser luồng
  khác), nhưng kế hoạch lấy mức bảo thủ 40%: cần 8/0,40 = 20
  lượt/phía → 40 lượt tổng. Ở mức 50% thì cần 32 lượt.
- Kế hoạch: chạy 40 lượt (20/phía) theo khối 8 lượt (4/phía);
  dừng sớm khi đủ 8 accepted/phía VÀ kiểm tra trôi đạt; trần
  48 lượt (24/phía). Quá trần mà chưa đủ 8/phía hoặc CI vẫn vượt
  ±10% → kết luận "không khóa được trên VM này" thay vì chạy
  tiếp vô hạn hay nới ngưỡng.
- Kiểm tra năng lực thống kê với phương sai trong phiên R1-v2
  (retry sd 0,310; single sd 0,533; trung bình ~9,0): ở n = 8/phía,
  SE chênh lệch ≈ 0,218 fps, nửa khoảng CI 95% (t bảo thủ 2,776)
  ≈ 0,61 fps ≈ 6,7% của trung bình retry — vừa trong ±10% nếu
  điểm ước lượng gần 0. Nếu phương sai phiên solo phình như phiên
  b36 (sd ~1,7 khi gộp trôi), CI sẽ vượt ±10% và phiên đó không
  khóa được dù đủ n — đó là lý do có kiểm tra trôi (§4.4).
- Thời gian: mỗi lượt ~35–40 s cửa sổ đo + chờ cổng; 40 lượt
  ước ~35–50 phút chạy thuần cộng thời gian chuẩn bị (đóng băng
  dist, kiểm tra máy). Đây là ước tính từ thời lượng lượt cũ,
  không phải cam kết.

### 4.3 Điều kiện solo (bắt buộc — vi phạm là lượt đó bị loại)

- Một phiên duy nhất, không chạy chung với bất kỳ luồng browser
  nào khác: trước mỗi lượt, `pgrep` Chrome = 0 và không có
  tiến trình vite build / probe browser nào khác; sau mỗi lượt,
  chromePost = 0 (browser khác chen giữa lượt → lượt bị loại,
  ghi lý do, không tính vào mục tiêu).
- Cổng tiền kiểm trước mỗi lượt (kế thừa runner36, siết thêm):
  chờ tối đa 10 phút tới khi load1 < 2,0 VÀ load5/load15 pre-run
  < 2,0 VÀ chromePre = 0; hết 10 phút → ghi gate-timeout, không
  tính là lượt đo, thử lại tối đa 2 lần rồi dừng phiên để xem
  lại máy (không cố chạy trong tải cao).
- Dist đóng băng: Q6_DIST trỏ tới bản sao đã đóng băng, manifest
  sha256 trước = sau mỗi lượt (vi phạm → INVALID exit 3, lượt bị
  loại như S2 §4); bundle sha trước = sau mỗi lượt.
- Không build lại dist trong phiên; không mở thêm tab/probe nào
  trên cùng display/port trong khi lượt đang chạy.
- Ghi nhãn tải đầy đủ mỗi lượt: load 1/5/15 ở atStart, beforeFwd,
  beforeRev, atEnd + loadavg pre-run + chromePre/chromePost +
  top tiến trình — để về sau đối chiếu được cả tiêu chí Q6 lẫn
  đề xuất V3-b của S2.

### 4.4 Kiểm tra sau phiên (trước khi tuyên bố khóa)

- Mỗi lượt chạy `verify-solo` (§4.5): chỉ lượt nào soloEligible
  mới tính vào 8/phía.
- Kiểm tra trôi phiên: chia lượt accepted mỗi phía thành nửa đầu
  / nửa sau theo thời gian; nếu trung vị hai nửa lệch nhau
  > 10% trong một phía → phiên bị gắn cờ trôi, không được tuyên
  bố khóa từ số gộp mà phải báo hai nửa riêng (bài học từ trôi
  ~30% giữa R1 và b36).
- Thống kê: trung vị/trung bình/sd mỗi phía, tỉ số từng cặp theo
  thứ tự nhận, CI Welch 95% như script tổng hợp của S1. Chỉ khi
  cả ba điều kiện §4.1 đều đạt mới ghi "KHÓA ĐƯỢC hiệu ứng <10%".
- Ghi kèm GOP subtype cho mọi lượt STEADY_SLOW trong phiên (dù bị
  loại): nếu có ≥ 3 ca SEGMENT_COLLAPSE mới với tỉ số < 0,30 và
  0 ca HEALTHY nào < 0,30, ngưỡng 0,30 được coi là đã có xác nhận
  tiền định đầu tiên — nhưng vẫn chưa đủ để thành cổng nhận/loại
  (tỉ số tiếp tục chỉ làm chẩn đoán).

### 4.5 Checklist trước khi chạy (copy-paste cho người chạy phiên)

- [ ] Dist đóng băng đã sao chép, manifest sha256 đã ghi, bundle
      retry/single khớp sha của S1 §1.
- [ ] `pgrep -f 'chrome-linux64/chrome|meta-chromium/chrome'` = 0;
      không còn luồng nào khác đang chạy browser/probe/build.
- [ ] Load pre-run: load1/load5/load15 đều < 2,0 (đọc /proc/loadavg).
- [ ] Display/port của phiên không trùng với luồng khác; Q6_DIST
      đã trỏ đúng bản sao đóng băng.
- [ ] Ngưỡng v3 trong module chưa bị sửa sau khi chốt (so lại với
      §4.1 trước lượt đầu tiên).
- [ ] Sau mỗi lượt: chạy `verify-solo` với forward-hold.json +
      JSON gộp của lượt đó; lượt nào không soloEligible thì ghi lý
      do, không tính vào mục tiêu.
- [ ] Sau mỗi khối 8 lượt: kiểm tra số accepted/phía và dấu hiệu
      trôi; không đổi ngưỡng dù khối đầu cho tỉ lệ nhận thấp.

Lệnh hỗ trợ (không chạy browser, chỉ phân loại file đã có):

```
node apps/web/scripts/seek-ab-gate-v3.mjs classify <forward-hold.json> [chromePre]
node apps/web/scripts/seek-ab-gate-v3.mjs verify-solo <forward-hold.json> <merged-run.json>
node apps/web/scripts/seek-ab-gate-v3-calibrate.mjs [out.json]
```

Lưu ý đã biết khi dùng `verify-solo`: JSON gộp kiểu S1 một mình
không đủ (thiếu raf xuôi) nên phải đưa kèm forward-hold.json thô;
ngược lại forward-hold một mình thiếu chromePost nên không chứng
minh được solo — cần cả hai file.

## 5. Sửa sai trong chính luồng này (trung thực)

- Bản đầu của module tính load tối đa qua 4 checkpoint (gồm
  atStart). Khi đối chiếu với nhãn v2 đã công bố, retry-b7 bị
  phân loại sai (under-load thay vì quiet) vì atStart load1 của
  nó là 2,05 trong khi 3 checkpoint của Q6 đều < 2,0. Nguyên nhân:
  Q6 chỉ xét beforeFwd/beforeRev/atEnd, không xét atStart — S1
  cũng chỉ ghi "trước-xuôi/trước-ngược/cuối". Đã sửa module về
  đúng 3 checkpoint (atStart chỉ còn là tín hiệu); sau sửa, đối
  chiếu = 0 lệch tải và 0 lệch decode-v2 (§2). Bài học ghi lại
  cho đợt sau: mọi tiêu chí "kế thừa v2" phải đối chiếu từng
  checkpoint với code Q6, không được suy ra từ tên trường.
- Test unit ban đầu dựng lưới thời gian sai (29 mẫu thay vì 28
  mẫu như forward-hold thật) khiến tỉ số GOP của ca b8 thành NaN
  và rơi nhầm vào NON_SEGMENT. Đã sửa fixture theo đúng lưới
  28 mẫu (19 mẫu ≥ 20,5 rồi 19,9…15,8); sau sửa, test b8 cho đúng
  0,343 → INDETERMINATE_MIXED. Không có số hiệu chuẩn nào bị
  ảnh hưởng vì hiệu chuẩn chạy trên dữ liệu thật, không qua
  fixture test.

## 6. File đổi/thêm (chỉ của T1 — text, không binary, không dist)

- Mới: `apps/web/scripts/seek-ab-gate-v3.mjs` (cổng v3: phân loại
  tải + decode + GOP + verify-solo; `node --check` pass; import
  không chạy main — khác v2 vốn chạy main ngay khi import).
- Mới: `apps/web/scripts/seek-ab-gate-v3-calibrate.mjs` (hiệu
  chuẩn trên dữ liệu cũ; `node --check` pass).
- Mới: `apps/web/scripts/seek-ab-gate-v3.test.mjs` (test unit).
- Mới: `benchmarks/results/v37-t1-gate-v3-calibration.json`
  (bảng hiệu chuẩn: 35 lượt thô + 8 lượt S2, tính bằng script).
- Mới: `docs/PHASE9_ROUND37_T1_GATE_V3_LIMITS.md` (file này).
- Không sửa: cổng v2, probe Q6, harness N2, code sản phẩm, file
  của luồng khác, paths-loop, build-loop-log. Không push, không
  tag. Scratch đọc vào (không ghi): `~/workspace/tmp-round35-r1/`,
  `~/workspace/tmp-round36-s1/` (chỉ đọc forward-hold.json).

## 7. Kiểm chứng đã chạy (lệnh + kết quả thật)

- `node --check apps/web/scripts/seek-ab-gate-v3.mjs` → pass.
- `node --check apps/web/scripts/seek-ab-gate-v3-calibrate.mjs`
  → pass.
- `node --test apps/web/scripts/seek-ab-gate-v3.test.mjs` →
  13 test, 13 pass, 0 fail (gồm: parse loadavg; GOP đúng lưới
  thật; GOP unavailable khi thiếu dữ liệu; SEGMENT_COLLAPSE /
  INDETERMINATE_MIXED / NON_SEGMENT / STARVED-không-subtype;
  biên tailMean 1,500 vẫn HEALTHY; load5/load15 đổi nhãn b6 và
  giữ quiet a4; atStart không làm tiêu chí; S2 vẫn under-load vì
  load1; JSON gộp không có t → GOP unavailable; verify-solo đủ
  3 điều kiện và 2 trường hợp vi phạm).
- `node apps/web/scripts/seek-ab-gate-v3-calibrate.mjs` →
  runs = 35, s2 = 8, loadFlips = 4, acceptedFlips = 3,
  decodeMismatchV2 = 0, loadMismatch = 0, v1ToV2 = 1 (single-a4,
  đã biết từ S1).
- Kiểm tra CLI trên file thật (không browser):
  - `verify-solo` retry-a5 (thô + gộp) → soloEligible = true,
    acceptedV3 = true, HEALTHY, quiet.
  - `verify-solo` retry-b6 (thô + gộp) → soloEligible = false
    (load under-load theo v3, decode HEALTHY).
  - `verify-solo` single-a4 (thô + gộp) → soloEligible = false
    (load quiet, decode STEADY_SLOW, subtype SEGMENT_COLLAPSE,
    tỉ số 0,214, GOP1 4,667 → GOP2 1,000).
- Không chạy: `tsc`/`vite build` (luồng không sửa code sản phẩm
  hay code TypeScript — chỉ thêm script .mjs đo lường; parent
  gộp vẫn chạy lại theo quy trình chung nếu cần); không chạy
  browser headed nào trong luồng này.

## 8. Nợ còn lại (trung thực)

1. **Phiên đo riêng (§4) chưa chạy** — đây là việc duy nhất có
   thể biến v3 từ "đề xuất" thành "cổng chính thức" và khóa
   hiệu ứng <10%. Cần chạy từ main chat hoặc phiên có quyền
   dừng các luồng browser khác (luồng cron/subagent không tự
   dừng được luồng khác — đúng bài học của S1/S2).
2. **Cơ chế sụp đoạn sâu chưa rõ** (§3): cần probe thời gian
   từng seek trong phase ngược, hoặc kéo dài phase ngược qua
   biên GOP tiếp theo để xem GOP2 có hồi khi t → 10 hay không.
3. **Hiệu chuẩn v3 của S2 (V3-a: loại trừ N tick đầu phase xuôi)**
   chưa làm — cần lượt đo mới, không được nới ngưỡng 0,98 sau
   khi đã thấy số.
4. **Vùng INDETERMINATE_MIXED chỉ có 1 tiền lệ (retry-b8)** — cần
   thêm ca STEADY_SLOW mới để biết vùng này là hỗn hợp thật hay
   chỉ là biên của một trong hai dạng.
5. **Ngưỡng load5 mong manh** (khoảng cách cụm 0,22; b8 chỉ vượt
   0,06): phiên solo phải ghi load5/load15 đầy đủ để xem cụm
   quiet thật có giữ dưới 2,0 với biên an toàn hay không; nếu
   lượt quiet solo liên tục chạm 1,9–2,1 thì ngưỡng 2,0 cần xem
   lại (bằng dữ liệu mới, không sửa hồi tố).
6. **Nợ đứng chung:** Safari / máy thật / GPU thật / footage
   B-frame / độ phân giải khác / đường `asset:` — vẫn chưa đo.

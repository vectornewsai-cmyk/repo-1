# Phase 9 đợt 97 — Y4: re-arm, đuôi ân hạn sau khi watch hết + nới ngưỡng analyzer 1,5 frame

**Nợ gốc:** LIMITS gộp đợt 96 §4 mục 4 — (a) lỗ hổng c1: stall mới
sau khi watch cũ hết vẫn đi đường drift re-seek cũ; (b) analyzer bỏ
sót ca biên Δct hơn đúng 1 frame 0,0001 s (LIMITS đợt 96 X4 §5 mục 6).
**Ngày:** 12/11/2026 (lượt cron 18:35 +07; Y4 làm việc 11:37–12:10Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái:** **ĐÃ SỬA (đuôi ân hạn 97Y4), ĐÃ ĐO TRƯỚC + SAU SỬA —
nợ GIẢM THÊM, CHƯA ĐÓNG HẲN** (xem §1 + §5): đuôi ân hạn đã implement
+ pin unit + chạy live đúng thiết kế (11 tick tail sống, 2 tick grace
bật + drift vượt ở tải vừa), nhưng **vẫn 0 lần CANCELLED ngoài đời**
(0/3 lượt hậu-fix có chuỗi grace ≥ 2 tick); lỗ hổng c1 đúng dạng đã
không tái hiện, nhưng 1 drift re-seek vẫn bắn ở d3 theo cơ chế khác
(stall "bò" — detector mù, xem §3.3) nằm ngoài phạm vi đuôi.

## 0. Dữ liệu nào dùng, lượt nào hợp lệ

- **Tiền-sửa (đo lại bằng analyzer Y4, không chạy lại probe):** 7 JSON
  gốc đợt 96 — b1/b2/b3/b4c/b5 (X4) + c1/c2 (X4b). Kết quả
  `hidden_files/round97-y4/analyze-old7-y4.txt`; đối chiếu analyzer
  gốc X4 trên cùng 7 file: `round97-y4/analyze-old7-x4orig.txt`.
- **Hậu-fix (probe97y4, build đã gộp Y2+Y5+Y4):** 3 lượt hợp lệ,
  cả 3 đều PASS 2 verdict probe, mtime `preview.tsx` không đổi trong
  lượt (xem probe-*.log):
  - d1: webkit load2 GOP250, gap mean 154 ms (nhẹ), 55 tick.
  - d2: webkit load3 GOP30, gap mean 215 ms (nhẹ), 55 tick.
  - d3: webkit load4 GOP250, gap mean **379 ms (TẢI VỪA)**, 44 tick.
  - 1 lượt d1 đầu tiên LỖI setup (pause-seek tới t=5 không xác nhận
    canvas sau 30 s, tElement=1875 ms, tCanvas=null — cùng lỗi b4/b4b
    đợt 96; lúc đó loadavg VM 13,6–15,7 vì nhiều luồng đợt 97 chạy
    song song) — LOẠI theo đúng thiết kế probe, chạy lại d1 khi tải
    hạ (loadavg 2,79) thì PASS. Không dùng làm bằng chứng.
- **Gộp hậu-fix:** `round97-y4/analyze-post3-y4.txt`.

## 1. Kết quả

### 1.1 Câu (1) — Nới ngưỡng nhảy hại Δct < 1,5 frame, chạy lại dữ liệu cũ

**Có bắt thêm 1 ca, nhưng KHÔNG phải ca b5.**

| | Analyzer X4 gốc (Δct < 1 frame) | Analyzer Y4 (Δct < 1,5 frame) |
|---|---|---|
| Nhảy hại gộp 7 lượt | 1 | **2** |
| Ca bắt thêm | — | b1 relMs=8411: Δph=+0,600, Δct≈0,033, drift sau nhảy = 0,000 |
| Ca b5 (relMs≈5270: Δph=+0,833, Δct=+0,0334) | 0 | **0 (vẫn sót)** |

- **Ca bắt thêm (b1 8411):** Δct in ra 0,033 — cùng mẫu làm tròn
  1-frame + epsilon như b5 (ct toFixed(4): 0,0334 > 1/30 = 0,03333).
  Lưu ý trung thực: drift sau nhảy = 0,000 nên đây là nhảy
  ĐUỔI-KỊP (playhead nhảy tới bắt kịp element đã burst trước) chứ
  không phải nhảy TẠO-DRIFT như ca b1 relMs=11417 (Δph=+1,300,
  drift=1,033). Heuristic nhảy hại đếm cả hai; phân biệt này chỉ
  đọc từ drift sau nhảy, analyzer chưa tách.
- **Ca b5 VẪN SÓT — chẩn đoán chính xác từ JSON (không đoán):**
  tick i=14 relMs=5270 Δph=+0,8333 Δct=+0,0334 — ngưỡng 1,5 frame
  (0,05) ĐÃ qua, nhưng `usable=false` vì tick rơi vào khoảng seeking
  5592→10670 mở rộng ±600 ms ([4992, 11270]). Chẩn đoán §5.6 của X4
  ("chỉ do ngưỡng") là CHƯA ĐỦ: ngưỡng là nguyên nhân cần nhưng chưa
  đủ; bộ lọc seeking-window là nguyên nhân thứ hai. Nợ mở: analyzer
  cần carve-out cho tick nhảy ở ĐẦU khoảng seeking (seek là hệ quả
  của nhảy, không phải nguyên nhân) — chưa làm trong luồng này (giữ
  thay đổi analyzer tối thiểu theo brief).
- Các số khác trên 7 lượt cũ khớp đúng X4b: CANCELLED=0 DELAYED=2
  NOT-DUE=1, drift re-seek=4, seeking kẹt ≥3 s=1 (b5 5,08 s),
  tick tăng ≥1 frame 110, trong đó Δct>0,35 là 28 (25%).

### 1.2 Sửa Y4 — đuôi ân hạn drift re-seek sau khi watch hết vì element tăng (marker "Đợt 97 Y4" / `97Y4`)

**Cơ chế:** khi khối dọn watch trong `preview.tsx` bỏ 1 watch VÌ
element đã tăng >= 1 frame (decoder nhúc nhích — không phải chạm
trần 5000 ms, không phải seeking), mở 1 "đuôi ân hạn" cho element đó
(`ResumeGraceTail97Y4 { endedAtMs, advances, lastCt }`, helper thuần
`nextResumeGraceTail97Y4` trong `playheadHold90R2.ts`). `syncMedia`
coi element trong đuôi như đang có watch sống (grace cho drift
re-seek — cùng tham số `graceTick` của `shouldIssueForwardReseek`).
Đuôi ĐÓNG khi: (a) watch mới arm cho element đó (tập live X4 tiếp
quản — đuôi chỉ là cầu nối); (b) element tăng >= 1 frame ở **2 tick
riêng biệt** sau khi đuôi mở (decoder resume ỔN ĐỊNH thật — burst
1 tick rồi đóng băng lại chỉ đếm 1, đuôi vẫn mở; phát thường thì
2 lần tăng tới sau ~2 tick nên đuôi là no-op, drift lúc đó vốn đã
dưới ngưỡng); (c) quá trần cứng 5000 ms (cùng trần với watch — van
an toàn, đuôi không bao giờ chặn seek mãi); (d) dừng phát.
**Không mở đuôi** khi watch hết vì chạm trần (đường phục hồi sau trần
PHẢI được seek ngay — xem header V2 `ceilingSpent`) hay vì seeking.
Chỉ video xuôi, chỉ đường drift qua helper (`freshSeekDue` /
`restartEnded` / đường pause không ân hạn, như W5/X4). Diện tích
thay đổi: 1 helper thuần + 1 map trong closure tick + 1 tham số
`syncMedia` + hook đo `__vcutResumeGraceTail97Y4`.

**Vì sao là đuôi (không phải rút ngắn ngưỡng detector 300 ms):**
cuộc đua đã đo ở c1 là detector cần 300 ms đóng băng liên tục mới
arm, trong khi drift re-seek chỉ cần 2 tick xác nhận — dưới tải
(gap ~200 ms) seek bắn ở tick thứ 2 (~400 ms sau burst), TRƯỚC khi
detector kịp arm (~300 ms + lệch tick). Rút ngưỡng detector xuống
dưới 2 tick sẽ arm oan cho mọi lần tăng chậm tích lũy (xem test
V2-R9); đuôi chỉ mở khi đã CÓ watch vừa hết (bằng chứng element
vừa stall xong) nên không arm oan thêm trường hợp nào mới.

### 1.3 Đo hậu-fix — đuôi chạy live đúng thiết kế, nhưng chưa có CANCELLED

| Lượt | rAF gap mean | Re-arm | Tail sống | Grace bật + drift vượt | Chuỗi grace ≥2 tick |
|---|---|---|---|---|---|
| d1 load2 GOP250 | 154 ms (nhẹ) | 0 | 3 tick | 0 | 0 |
| d2 load3 GOP30 | 215 ms (nhẹ) | 0 | 4 tick | 0 | 0 |
| d3 load4 GOP250 | **379 ms (TẢI VỪA)** | 0 | 4 tick | **2 tick** | 0 (cả 2 đều chuỗi 1 tick) |
| **Gộp 3 lượt** | | **0** | **11 tick** | **2** | **BỊ CHẶN=0, LỌT=0** |

- **Đuôi mở/đóng đúng thiết kế trong cả 3 lượt** (11 tick tail sống,
  không kẹt đuôi nào, không hồi quy: verdict probe PASS cả 3 lượt,
  0 seeking kẹt ≥3 s hậu-fix so với 1 tiền-sửa).
- **2 tick grace-bật + drift vượt (đều ở d3, tải vừa):**
  relMs=5709 maxDrift=0,406 (tail sống) và relMs=12590 maxDrift=0,400
  (tail sống) — đúng cấu hình c1 (burst sau khi watch hết, drift vượt
  ngưỡng trong lúc đuôi sống), và **không có resync nào bắn ở cả 2 ca**.
  Nhưng cả 2 đều là chuỗi **1 tick** (drift về dưới ngưỡng ngay tick
  sau: 0,406 → 0,133 và 0,400 → −0,200) nên seek vốn đã không đủ 2 tick
  xác nhận để bắn — **không đếm được thành "seek bị chặn"**. Nói thẳng:
  đuôi đã đứng đúng chỗ cần đứng 2 lần, nhưng chưa có lần nào drift
  vượt đủ 2 tick liên tiếp trong lúc đuôi sống để chứng minh chặn.
- **CANCELLED vẫn = 0 (0/3 lượt hậu-fix; tiền-sửa 0/7).** Vì sao vẫn 0
  — chứng minh bằng số, không phải do thiếu lượt đo:
  1. d1/d2 rơi về tải nhẹ (gap 154/215 ms) — VM yên dần khi các luồng
     đợt 97 khác xong việc; stall ngắn, drift không vượt ngưỡng trong
     lúc grace sống (0 tick grace-bật + drift vượt).
  2. d3 đạt tải vừa (379 ms) và có 2 tick grace-bật + drift vượt,
     nhưng drift tự về dưới ngưỡng sau đúng 1 tick (element burst
     xong decode tiếp, không đóng băng lại) — mẫu c1 "burst rồi đóng
     băng lại ≥2 tick" không tái hiện trong 3 lượt này.
  3. Phân loại CANCELLED của analyzer đòi drift đủ xác nhận (due) ở
     đúng tick arm + không resync + drift về dưới ngưỡng trong 2 tick
     sau arm — đuôi làm drift KHÔNG BAO GIỜ tới được trạng thái due ở
     tick arm (playhead đuổi kịp trong lúc grace), nên ngay cả khi
     đuôi chặn thành công, phân loại CANCELLED hẹp này cũng có thể
     vẫn 0; chỉ tiêu đúng cho đuôi là §4 "chuỗi grace ≥2 tick BỊ
     CHẶN", cũng đang 0/3 lượt.
- **Drift re-seek hậu-fix: 3 (tick formula) / 2 (mẫu 100 ms)** — d2: 1,
  d3: 2 (xem §3.3). Không giảm so với tiền-sửa (4/7 lượt) vì các
  re-seek này bắn ở cấu hình NGOÀI phạm vi đuôi (không có watch vừa
  hết — xem §3.3); đuôi không lọt ca nào trong phạm vi của nó
  (LỌT=0). Đây không phải bằng chứng đuôi vô dụng — phạm vi của đuôi
  là hẹp theo thiết kế — nhưng cũng không phải bằng chứng đuôi đã
  cứu được ca nào ngoài đời.

### 1.4 Câu (3) — Bằng chứng nhả trần 5000 ms: VẪN KHÔNG CÓ

- **0 ứng viên trần (stall ≥4,5 s) / 10 lượt** (7 tiền-sửa + 3 hậu-fix);
  **0 lần nhả trần quan sát được.** Stall dài nhất hậu-fix: d3 2,92 s
  (ct 4,3667 đóng băng relMs 10277→13192, watch giữ, kết thúc do
  element tăng 4,3667→4,4 — KHÔNG phải trần nhả). Hạ tầng đo trần
  (`__vcutResumeWatch96X4` + `watchCeil`) vẫn còn nguyên; lượt sau
  vẫn chỉ cần 1 stall ≥5 s.

### 1.5 Kiểm chứng (cây đã gộp Y2+Y5+Y4, `preview.tsx` mtime 12:02:15Z)

- tsc web **0 lỗi**; vite build **PASS** (8,54 s, lần 2; lần 1 37,04 s).
- `playheadPacing54K9.test.ts` **19/19**; `playheadHold90R2.test.ts`
  **50/50** (44 cũ + 6 mới Y4-R1..R6, gồm replay đúng dãy tick c1:
  đuôi sống qua t=3970 — đúng tick seek từng bắn — và đóng khi watch
  mới arm t=4170); `seek.test.ts` **21/21**.
- Kiểm chứng chạy lại SAU lần sửa `preview.tsx` cuối cùng của luồng
  khác (12:02:15Z, xem §6) — tsc/build/3 suite đều xanh trên cây
  cuối, không chỉ trên cây lúc Y4 sửa xong.

## 2. Vì sao sửa là đuôi ân hạn (không phải hướng khác)

1. Lỗ hổng c1 đã đo chính xác: watch hết t=3372 (element burst qua
   completion), drift 0,68 ở t=3770, seek bắn ~t=3970, watch mới chỉ
   arm t≈4170 — thua đúng 1 tick. Đuôi mở ngay ở tick watch hết nên
   bao phủ đúng khoảng trống 3372→4170 (trong replay unit Y4-R2, đuôi
   sống qua t=3970).
2. Đuôi chỉ mở khi đã có watch vừa hết — bằng chứng element vừa trải
   qua 1 stall — nên không tạo thêm trường hợp ân hạn oan nào ngoài
   các element đã được giữ; điều kiện đóng "2 lần tăng riêng biệt"
   phân biệt được burst-rồi-đóng-băng (giữ đuôi) với resume ổn định
   (đóng đuôi sau ~2 tick, drift lúc đó vốn dưới ngưỡng).
3. Không đổi đường playhead, không đổi helper drift, không đổi ngưỡng
   detector 300 ms — diện tích thay đổi nhỏ nhất cho đúng cuộc đua
   đã đo được.

## 3. Đo hậu-fix — truy vết

### 3.1 d3 tập A — đúng mẫu c1, đuôi đứng đúng chỗ (relMs 4277→6475)

| t | ct | ph | drift | watchCeil | tail | Diễn giải |
|---|---|---|---|---|---|---|
| 2502→3898 | 0,5 | 0,5 | 0 | 1604 | — | watch S2 giữ, stall 2,5 s |
| 4277 | 0,5333 | 0,5 | −0,033 | 1604 | — | element tăng 1 frame, watch sắp hết |
| 4998 | 0,5667 | 0,8667 | 0,300 | null | `{endedAtMs:4464, advances:0}` | **đuôi mở** (watch hết ở tick dọn ~4464) |
| 5709 | 2,0056 | 1,6 | **−0,406** | null | `{advances:1}` | **burst +1,44 s, drift vượt ngưỡng, đuôi sống — không seek** (đúng cấu hình c1) |
| 6475 | 2,1667 | 2,3 | 0,133 | null | null | drift về dưới ngưỡng; đuôi đóng (đủ 2 lần tăng) |

### 3.2 d3 tập B — mẫu c1 thứ hai (relMs 12188→13785)

Watch giữ stall 2,92 s (ct 4,3667, relMs 10277→12188); element tăng
1 frame ở t=12188 → watch hết; đuôi mở `{endedAtMs:12375}`;
t=12590 drift **+0,400** trong lúc đuôi sống — không seek; t=13192
ct burst 4,4333→5,4333, drift −0,200; đuôi đóng ở t=13785 (đủ 2 lần
tăng). Cùng kết luận như tập A: đuôi đứng đúng chỗ, drift chỉ vượt
1 tick.

### 3.3 d3 — 2 drift re-seek vẫn bắn, NGOÀI phạm vi đuôi (không phải lọt)

- **Re-seek 1 (resyncsV 1→2, ~t=7979, seeking 1,63 s):** tick 17
  drift **+0,367** (ct 3,4, ph 3,7667), không watch, không đuôi
  (đuôi cuối cùng đã đóng từ t≈6475). Cơ chế MỚI đo được: element
  "bò" — tăng đúng ~1 frame mỗi tick dài (~0,033/608 ms = 0,055×
  realtime) trong khi playhead chạy +0,37/tick. Detector không bao
  giờ arm vì mỗi lần tăng ≥1 frame đều reset đồng hồ đóng băng
  (`nextResumeFreezeRearm`: tăng → cập nhật `lastAdvanceMs`, không
  arm) — detector MÙ với stall bò. Đuôi cũng không mở vì không có
  watch nào vừa hết. Đây là nợ mở lớn nhất còn lại (xem §5 mục 1).
- **Re-seek 2 (resyncsV 2→3, t=14101):** drift = 0 trong trace vận
  tốc, xảy ra SAU khi localPh đã qua 5,0 (điều kiện dừng của probe)
  — công thức tick (tổng resyncsV − restart − forceSeek) đếm thành
  drift = 2, trong khi mẫu 100 ms đếm drift ≈ 1. Khả năng cao là
  artifact cuối-clip/dừng-đo, không phải drift re-seek giữa lúc phát
  — ghi rõ là CHƯA GIẢI THÍCH được từ trace, không nhận là drift.

### 3.4 d2 — đuôi mở/đóng đúng thiết kế 2 lần, drift không vượt ngưỡng

- Tập 1: watch hết t≈3287, đuôi sống tick 13–14 (drift tối đa 0,267),
  đóng ở tick 15 khi element tăng lần 2 (resume ổn định).
- Tập 2: watch hết t≈6373, đuôi sống tick 26–27 (burst ct 2,1→2,7793,
  drift −0,279), đóng ở tick 28 (tăng lần 2).
- 1 drift re-seek ở d2 (~t=4529, resyncsV 1→2, seeking 104 ms):
  drift trong trace ≤0,267 quanh đó, không watch/đuôi sống — thoáng
  qua giữa 2 tick probe (tick app thấy drift vượt 2 tick liên tiếp
  mà probe sampling ~200 ms không bắt được) — cùng họ với §3.3
  (không watch vừa hết), không phải lọt đuôi.

## 4. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/playheadHold90R2.ts` — hằng
  `PLAYHEAD_RESUME_STALL_GRACE_TAIL_MAX_MS = 5000` + helper thuần
  `nextResumeGraceTail97Y4` + type `ResumeGraceTail97Y4` (Đợt 97 Y4).
- `apps/web/src/lib/playheadHold90R2.test.ts` — 6 test mới Y4-R1..R6
  (50/50).
- `apps/web/src/preview.tsx` — 8 marker Đợt 97 Y4: import, tham số
  `syncMedia` `resumeGraceTailLive97Y4`, điều kiện grace OR thêm đuôi,
  khai báo map/set đuôi, hook type `__vcutResumeGraceTail97Y4`, mở đuôi
  ở khối dọn watch (chỉ nhánh tăng ≥1 frame), bước đuôi + hook đo,
  truyền vào `syncMedia`, dọn hook. **Chồng lấn:** file này cũng chứa
  thay đổi của Y2 (blend) + Y5 (watchdog) + luồng khác trong đợt 97 —
  batch Y4 stage cả file (parent gộp/khử trùng với các batch đợt 97
  khác lúc push, như mẫu push #4).
- `apps/web/scripts/analyze97y4-grace-ceiling.mjs` — analyzer mới
  (ngưỡng nhảy hại 1,5 frame + §4 đếm seek bị grace chặn).
- `apps/web/scripts/probe97y4.mjs` — probe hậu-fix (sao probe96x4b,
  scratch round97-y4, sampler ghi thêm trường `tail`).
- `docs/PHASE9_ROUND97_Y4_REARM_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round97-y4-rearm`
(`~/workspace/repo-1-push/paths-loop/phase9-round97-y4-rearm.txt`).
Log Y4: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y4/`
(`round97-y4.md`, `analyze-old7-y4.txt`, `analyze-old7-x4orig.txt`,
`analyze-d1.txt`, `analyze-d2.txt`, `analyze-d3.txt`,
`analyze-post3-y4.txt`, `probe-d1.log`, `probe-d2.log`, `probe-d3.log`,
`probe-webkit-load2-gop250-d1/`, `probe-webkit-load3-gop30-d2/`,
`probe-webkit-load4-gop250-d3/` — mỗi thư mục có `probe-results.json`).

## 5. Giới hạn còn lại (trung thực)

1. **CANCELLED ngoài đời VẪN = 0 — nợ re-arm CHƯA ĐÓNG, chỉ giảm thêm
   một nấc:** đuôi đã implement + pin unit + chạy live đúng thiết kế
   (11 tick tail sống; 2 tick grace-bật + drift vượt ở tải vừa), nhưng
   chưa có chuỗi grace ≥2 tick nào để đếm thành "seek bị chặn".
   Cần thêm lượt đo ở tải vừa/nặng khi VM bận hơn (d3 là lượt tải vừa
   duy nhất trong 3 lượt hậu-fix; d1/d2 rơi về tải nhẹ vì VM yên dần),
   hoặc chấp nhận đuôi chỉ là giảm tần suất re-seek thừa trong cấu
   hình burst-sau-watch.
2. **PHÁT HIỆN MỚI — detector mù với stall "bò" (d3 §3.3):** element
   tăng đúng ~1 frame mỗi tick dài (0,055× realtime) thì mỗi lần tăng
   đều reset đồng hồ đóng băng 300 ms → không watch nào arm, đuôi
   không mở, drift re-seek bắn sau 2 tick xác nhận (seek kẹt 1,63 s).
   Hướng sau: định nghĩa đóng băng theo TỐC ĐỘ (tăng < tiến độ kỳ
   vọng theo gap) thay vì tuyệt đối 1 frame; chưa đo, chưa làm —
   đây là nợ lớn nhất còn lại của hướng re-arm, không thuộc phạm vi
   đuôi (đuôi chỉ vá stall SAU watch).
3. **Analyzer vẫn sót ca b5** (§1.1): ngưỡng 1,5 frame đã đủ nhưng
   bộ lọc seeking-window (±600 ms) nuốt tick nhảy ở đầu khoảng
   seeking. Cần carve-out cho tick nhảy ở đầu khoảng seeking; chưa làm.
4. **Trần 5000 ms VẪN chưa có bằng chứng nhả ngoài đời** (0 ứng viên
   / 10 lượt; stall dài nhất hậu-fix 2,92 s kết thúc do element tăng).
5. **Re-seek thứ 2 ở d3 (t=14101) chưa giải thích được từ trace**
   (drift 0, sau điều kiện dừng localPh≥5,0) — công thức tick đếm
   thành drift = 2, mẫu 100 ms đếm drift ≈ 1. Không nhận là drift
   re-seek giữa lúc phát.
6. **Số đo chỉ cho 1 clip video, 720p, 6 s, WebKitGTK 27.2** — GOP
   30/250; Chromium không stall ở cùng tải nên không đo được stall 2+
   trên Chromium. Tick probe ≠ tick app (±1 tick), hook resyncsV chậm
   1 nhịp (kế thừa W5 §6.3). Phân loại CANCELLED hẹp có thể không bao
   giờ đếm được đuôi chặn thành công (xem §1.3 mục 3) — chỉ tiêu đúng
   là §4 "chuỗi grace ≥2 tick BỊ CHẶN".

## 6. Chuyện bên lề khi đo (đã xử lý)

1. **Va chạm Y2/Y5/Y7 cùng sửa `preview.tsx`:** file đổi mtime
   09:41:00Z → 11:41:59Z → 11:47:48Z → 12:02:15Z trong lúc Y4 làm
   việc (Y2 blend + Y5 watchdog + 1 luồng khác). Y4 đọc lại tươi mọi
   vùng trước khi sửa, chỉ sửa bằng exact-text match nên không ghi đè
   thay đổi của họ; cả 8 marker Y4 còn nguyên sau lần sửa cuối
   (kiểm 12:02Z) và tsc/build/3 suite chạy lại xanh trên cây cuối.
   Các lượt probe đều kiểm mtime đầu/cuối và KHÔNG lượt nào bị đổi
   giữa chừng (d3 bắt đầu sau lần sửa 12:02:15Z — mtime lúc bắt đầu
   đã là 12:02:15Z).
2. **Tải VM thay đổi mạnh trong lượt:** loadavg 15,6 lúc thử d1 lần
   đầu (làm lỗi setup pause-seek) → 2,79 lúc d1 chạy lại → 0,95 lúc
   d2 → 2,04 lúc d3. So sánh trước/sau chỉ so được theo bậc độ lớn;
   gap mean các lượt hậu-fix: 154/215/379 ms (chỉ d3 vào dải tải vừa).
3. **d1 lần đầu lỗi setup** (xem §0): pause-seek không xác nhận canvas
   sau 30 s dưới tải VM cao — cùng lỗi b4/b4b đợt 96; probe dừng đúng
   thiết kế, không dùng làm bằng chứng; chạy lại khi tải hạ thì PASS.

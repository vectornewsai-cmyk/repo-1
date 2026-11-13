# Phase 9 đợt 102 — luồng D6: Re-arm drift-gate follow-up — KHÔNG SỬA, GIỮ NGUYÊN GATE

- **Ngày:** 2026-11-13 (phân tích dữ liệu C3 09:38–10:00 +07; baseline live 03:00–03:27Z; viết doc sau đó, giờ VN).
- **Nợ đóng (nửa chừng):** LIMITS gộp đợt 101 §4 mục 5 — "re-arm drift-gate: tuổi đuôi trung vị +45% (1339 → 1942 ms), 2 đuôi đóng do trần 5000 ms, seek sửa drift bị hoãn tối đa tới trần trong chế độ burst mãn tính".
- **Kết luận ngắn:** **KHÔNG SỬA — GIỮ NGUYÊN drift-gate C3.** Phương án duy nhất có thể cắt đáng kể tuổi đuôi (D6-A: đóng sớm khi 2 lần chặn liên tiếp có drift gần như không đổi) **BỊ BÁC BẰNG DỮ LIỆU**: "drift giống nhau giữa 2 lần chặn" ngoài đời KHÔNG phải decoder ổn định — mà là **điểm đáp của burst lặp lại** (decoder nhảy vọt lên ~+1 s trước playhead, đóng băng, rồi nhảy tiếp). Mô phỏng D6-A trên 24 lượt (h1–h12 + i1–i12) sẽ đóng sớm 13 đuôi — gồm cả 2 đuôi đóng trần h4 và i10 — trong lúc decoder đang burst, tức tái mở đúng cửa sổ lỗi f4. Không có ca "ổn định nhưng lệch vị trí" nào ngoài đời: **0/24 đuôi bị chặn** đạt tiêu chí ổn định-lệch (xem §2). Phương án hạ trần 5000 → 3000 ms cũng **không làm**: lợi nhỏ (trung vị không đổi, chỉ 4/38 đuôi chạm trần) mà rủi ro không chứng minh được an toàn ở cỡ mẫu khả thi (xem §3). Baseline live mới 12/12 lượt (i1–i12, không đổi code): **f4-like 0/12, gate chặn 59 lần, burst-rate chặn 21 lần, 0 seek kẹt, 2 đóng trần đều vô hại** — gate C3 tái hiện đúng trên cây hiện tại (xem §4). Không hồi quy (tsc 0, vite build PASS, Hold 75/75, Pacing 19/19, previewEngine 27/27).

## §1. Phương án đã thử — D6-A "stable-offset close" (và vì sao nó trông hứa hẹn lúc đầu)

**Thiết kế D6-A (đã phân tích, KHÔNG land):** trong `nextResumeGraceTail97Y4`, khi một lần tăng lành-về-tốc-độ bị gate chặn (|drift| > 0,35), so drift với lần chặn trước trên cùng đuôi: nếu |Δdrift| ≤ 0,10 s (drift gần như không đổi — element đi cùng nhịp playhead, chỉ lệch vị trí) thì đếm là "stable advance"; đủ 2 stable advance liên tiếp thì **đóng đuôi** (decoder đã chứng minh ổn định; drift re-seek sau đó là một lần seek sửa bình thường vào decoder ổn định, không còn bị hoãn tới trần).

**Vì sao trông hứa hẹn:** trên mẫu probe 100 ms của C3, drift tại các lần gate chặn trong cùng đuôi trông rất giống nhau (vd h4: +0,84; +0,86; +0,93; +0,83; +0,68; +0,73 — chênh lệch liên tiếp chỉ 0,016–0,078). Mô phỏng D6-A trên dữ liệu h1–h12 cho trung vị tuổi đuôi 1509 → 1348 ms và đóng sớm 5 đuôi (tiết kiệm 8682 ms, gồm đuôi đóng trần h4: 5004 → 1625 ms). Trên baseline mới i1–i12, mô phỏng còn "đẹp" hơn: trung vị 2400 → 1289 ms, đóng sớm 8 đuôi, tiết kiệm 16113 ms, gồm đuôi đóng trần i10: 5086 → 1273 ms.

**Vấn đề:** mô phỏng dùng drift tại *mẫu probe*, không phải drift tại *tick app chặn*. Giống nhau ở mẫu probe không chứng minh decoder ổn định — cần kiểm tra quỹ đạo tick-by-tick (xem §2). Kết quả kiểm tra đó bác D6-A.

## §2. Vì sao D6-A bị bác — quỹ đạo tick-by-tick cho thấy burst mãn tính, không phải ổn định-lệch

### 2.1 Răng cưa Δct + drift dao động (đọc trực tiếp từ velocityTicks rAF)

Đuôi h11 (load2 gop30, 10 lần gate chặn / 3,9 s), in từng tick (`dump-tail-ticks.txt`):

| t | Δct | drift |
|---|---|---|
| 4498 | +0,079 | +1,000 |
| 4761 | **+0,433** | +1,200 |
| 4987 | +0,000 (đóng băng) | +0,933 |
| 5183 | **+0,447** | +1,147 |
| 5377 | +0,120 | +1,067 |
| 5573 | +0,133 | +1,000 |
| 5783 | **+0,347** | +1,147 |
| 6173 | +0,066 | +1,000 |
| 6381 | **+0,345** | +1,145 |
| 7170 | **+0,432** | +1,232 |
| 7471 | +0,000 (đóng băng) | +0,867 |

Mẫu lặp lại ở mọi đuôi: element **nhảy vọt +0,35…+0,90 s rồi đóng băng** (Δct = 0) để playhead đuổi kịp, drift dao động +0,57…+1,39 trong cùng đuôi. Decoder ổn định 1× thì Δct ≈ gap tick đều đặn và drift gần hằng — không có ở đây. "Drift giống nhau giữa 2 lần chặn" chỉ là **cùng một điểm đáp của burst lặp lại** (mỗi lần nhảy đều đáp ~+1,0 s trước playhead), không phải ổn định. Đóng đuôi trên bằng chứng đó = cho drift re-seek bắn vào decoder đang burst — đúng chuỗi lỗi f4 (burst → đóng đuôi → seek kẹt 5,5 s+).

### 2.2 Định lượng trên toàn bộ 24 đuôi bị chặn (12 h + 12 i)

Ba chỉ số độc lập, đo trên velocityTicks (`quantify-*-burst-vs-stable.py`):

| Chỉ số | Kỳ vọng decoder ổn định 1×, lệch vị trí | h1–h12 (12 đuôi) | i1–i12 (12 đuôi) |
|---|---|---|---|
| blocks/s (lần gate chặn / giây tuổi đuôi) | ~5/s (mỗi tick tăng ≥ 1 frame đều bị chặn) | trung vị **1,20** (max 2,56) | trung vị **1,25** (max 2,08) |
| blocks/tick (lần chặn / tick rAF) | ~1,00 (chặn gần như mọi tick) | trung vị **0,50** (max 0,75) | trung vị **0,62** (max 0,80) |
| Tỉ lệ mẫu đóng băng (Δct < 1 frame) | 0% | trung vị **14%** (min 0%) | trung vị **25%** (min 5%) |
| Biên drift trong đuôi (max − min) | ~0,05 s | trung vị **0,450 s** (min 0,298 s) | trung vị **0,847 s** (min 0,429 s) |
| Nhảy vọt Δct ≥ 0,30 s | 0 | **34 / 76** khoảng mẫu | **42 / 85** khoảng mẫu |
| **Đuôi đạt cả 3 tiêu chí ổn định-lệch** | — | **0 / 12** | **0 / 12** |

Tiêu chí ổn định-lệch: blocks/s ≥ 4 + đóng băng 0% + biên drift ≤ 0,10 s. **0/24 đuôi** đạt. Ngược lại, mọi đuôi đều có ít nhất một bằng chứng burst (nhảy vọt và/hoặc drift dao động ≥ 0,30 s và/hoặc blocks/s ≤ 2,6). Drift lớn nhất ghi nhận ở i-runs: **+2,41 s** (i6) và **+1,65 s** (i3) — element có lúc chạy trước playhead hơn 2 giây; đóng sớm ở biên độ đó là không thể biện minh.

Caveat trung thực về blocks/tick: ở load1 (gap rAF ~16 ms), decoder ổn định 1× cũng chỉ tăng ≥ 1 frame mỗi ~2 tick nên blocks/tick ~0,5 là tương thích với ổn định — chỉ số này một mình yếu ở tải thấp. Kết luận không dựa vào nó một mình: blocks/s (kỳ vọng load1 ~30/s, đo được 1,26–2,08/s) + biên drift (≥ 0,43 s ở mọi đuôi) + nhảy vọt mới là các chân quyết định, và cả ba đều bác giả thuyết ổn định ở **mọi mức tải**.

### 2.3 Hệ quả

D6-A sẽ đóng sớm 13/24 đuôi bị chặn (5 h + 8 i), gồm cả 2 đuôi đóng trần h4 (5004 → 1625 ms) và i10 (5086 → 1273 ms) — đúng các đuôi burst nặng nhất. Không có cách nào phân biệt "đáp giống nhau vì ổn định" với "đáp giống nhau vì burst lặp lại cùng biên độ" từ dữ liệu gate có được (chỉ có drift tại tick tăng, không có lịch sử Δct từng tick trong lib — và ngay cả khi có, §2.1 cho thấy burst dài-gap vẫn qua được luật rate). **D6-A bị bác, không land, không để lại code.**

## §3. Phương án hạ trần 5000 → 3000 ms cho đuôi bị chặn nhiều lần — cũng không làm

**Lợi đo được (mô phỏng trên 24 lượt):** chỉ 4/38 đuôi chạm trần (h4 5004 ms, h8 5019 ms, i5 5108 ms, i10 5086 ms). Hạ trần xuống 3000 ms chỉ rút ngắn 4 đuôi này ~2 s; **trung vị tuổi đuôi không đổi** (1509/2400 ms đều dưới 3000 ms). Lợi tập trung ở trường hợp xấu nhất, không phải trường hợp thường.

**Rủi ro:** đóng đuôi sớm 2 s trong lúc decoder đang burst mãn tính = bật lại drift re-seek vào decoder chưa ổn định — đúng cơ chế lỗi f4. Tỉ lệ f4-like tiền-gate là 1/11 lượt (~9%/lượt). Một đợt kiểm chứng 12 lượt với 0 f4-like vẫn để lại xác suất **~(10/11)^12 ≈ 32%** bỏ sót rủi ro đã quay lại mức tiền-gate — tức thí nghiệm không đủ lực chứng minh an toàn ở cỡ mẫu khả thi trong vòng lặp. Lợi nhỏ + rủi ro không loại trừ được = **không làm**. Ghi rõ để đợt sau không thử lại mà không đọc phần này.

**Các hướng khác đã xét và loại (không code, không đo live vì bị loại bằng lý luận + dữ liệu §2):**
- *Đóng sớm khi element đóng băng và drift đang giảm* (playhead đuổi kịp): seek sửa vẫn bắn nếu drift còn > 0,35 lúc đóng — seek vào decoder đang đói CPU (đóng băng vì starved) là đúng ca dễ kẹt nhất; chờ drift tự về (gate hiện tại) đã là hành vi an toàn, không có lợi gì thêm.
- *Nới ngưỡng gate 0,35 → 0,50/1,0:* phá pin với ngưỡng drift re-seek (C3-R1) — đuôi sẽ đóng khi drift còn vượt ngưỡng seek, tức gate tự vô hiệu một phần; không khác gì hạ trần mà tệ hơn (áp cho mọi đuôi, không chỉ đuôi bị chặn nhiều).
- *Rebase mốc trần theo lần chặn:* restart đồng hồ trần mỗi lần gate chặn sẽ cho đuôi sống LÂU hơn, ngược hướng cần giảm; rebase `lastCt` thì C3 đã làm rồi.
- *Sửa phía decoder (giảm burst):* ngoài phạm vi D6 — burst là hệ quả tải CPU/WebKitGTK, không phải lỗi luật đuôi; ghi làm nợ mở, không phải hướng của đợt này.

## §4. Baseline live mới i1–i12 — gate C3 tái hiện đúng, không đổi code

Probe: WebKitGTK 27.2, clip bóng 720p 6 s, ma trận y hệt h1–h12 (load1–4 × GOP30/250), 1 instance/lượt, dọn process sau mỗi lượt; boot 249407b6 (sau reboot #26 — xem §7); `playheadHold90R2.ts` md5 **00cce1ac** suốt đợt (= md5 C9 đã verify — code gate không đổi một byte); `preview.tsx` có sibling sửa giữa đợt nhưng vùng đuôi/grace giữ nguyên 17 marker C3 (xem §7).

| Chỉ số | C3 h1–h12 (11/2026) | D6 baseline i1–i12 |
|---|---|---|
| Lượt hợp lệ / tổng chạy | 12/12 (+1 chạy lại h9) | **12/12** (+3 chạy lại lỗi harness i1/i7/i10, +2 chạy lại mtime-đổi i7/i10) |
| Verdict probe (giữ playhead trong seek + canvas đổi khung) | 12/12 PASS | **12/12 PASS** |
| f4-like (đóng-drift-vượt + resync trong 2 tick sau) | 0 | **0** |
| tailDriftGate (gate chặn đáp xa — hook trực tiếp) | 44 | **59** |
| tailBursts (luật B3 chặn burst) | 31 | **21** |
| Đuôi đóng khi drift vượt (analyzer) | 2 (h4, h8 — đều đóng trần) | **1** (i10 — đóng trần, xem §5) |
| Đuôi đóng do watch mới arm tiếp quản | 8 | **14** |
| Grace chuỗi ≥ 2 tick BỊ CHẶN / LỌT | 11 / 0 (C3) | không đo lại (không đổi code; C3 đã đo) |
| resyncsV tăng tổng (mọi đường) | — | 20 |
| Tuổi đuôi trung vị (phương pháp velocityTicks) | 1509 ms (đo lại D6) | **2400 ms** |
| Tuổi đuôi trung vị (phương pháp mẫu probe 100 ms, như C3 §4.4) | 1942 ms | không đo lại theo phương pháp này |
| Seeking kẹt ≥ 3 s | 0 | **0** |
| ARM-HELD §6 / CANCELLED hẹp | 1/12 / 1 (artifact) | không đo lại (không đổi code) |

**Đọc trung vị 2400 vs 1509 ms:** hai con số cùng phương pháp (velocityTicks) nhưng khác phiên đo. Gate code giống hệt nhau (md5 00cce1ac) nên không có hồi quy gate nào để quy kết; chênh lệch phù hợp với (a) tải song song nặng hơn đợt này (loadavg 5,6–9,6 lúc retry2, 10 luồng D chạy cùng lúc + D9 verify — C3 cũng chạy song song nhưng nhẹ hơn), (b) dao động mẫu (n=12–20 đuôi, tuổi trải 700–5432 ms). Không kết luận "gate tệ đi" từ chênh lệch này — chỉ số an toàn (f4-like 0, 0 kẹt seek) mới là chỉ tiêu của đợt, và nó đứng yên.

**Ca i10 đóng trần (kiểm tay, §5):** đuôi endedAtMs=4197, tick cuối có đuôi t=9283 (tuổi 5086 ms > trần), advances=0, không resync sau, drift về 0,000 ở mẫu sau (playhead đuổi kịp element đóng băng ở ct 5,7667). Đúng mẫu h8 — vô hại, không phải gate thất bại. Ca i5 (5108 ms) cũng đóng trần, advances=0; i12 sống 5432 ms nhưng đóng do watch mới arm tiếp quản (REARM), không phải trần.

## §5. Kiểm tay ca "đuôi đóng khi drift vượt" duy nhất (i10)

Analyzer báo 1 ca: i10 (load3 gop250), t=9283→9687, ct=5,7667, ph=5,3667, drift +0,40, adv=0, resyncSau2tick=không. Kiểm tay trên velocityTicks: đuôi endedAtMs=4197; tick cuối có đuôi là t=9283 → tuổi **5086 ms > trần 5000 ms** → đóng do trần (đúng thiết kế §2 C3), không phải đóng ADV2. resyncsV đứng yên 1, restartV đứng yên 0 sau đó; drift về 0 ở mẫu sau vì playhead đuổi kịp element đóng băng. **Không phải f4-like, không phải gate lọt.** Ghi rõ để không ai trích "1 ca đóng khi drift vượt" thành gate thất bại.

## §6. Caveat (đọc trước khi trích số)

1. **Tick probe ≠ tick app** (kế thừa C3 §6.1): drift tại mẫu probe chỉ xấp xỉ drift tại tick app chặn; nhiều tick app ẩn giữa 2 mẫu. Số lần gate/burst chặn (59/21) là số đo trực tiếp từ hook nên không dính caveat này; mọi con số drift từng ca đều là "tại mẫu probe". Kết luận D6-A bị bác dựa vào quỹ đạo tick rAF (Δct răng cưa + drift dao động), không dựa vào drift từng mẫu đơn lẻ.
2. **Blocks/tick yếu ở tải thấp** (xem §2.2): ở load1, decoder ổn định cũng chỉ chặn ~0,5 lần/tick. Kết luận ổn định-lệch = 0 dựa vào tổ hợp blocks/s + biên drift + nhảy vọt, không dựa vào blocks/tick một mình.
3. **Phạm vi đo hẹp:** chỉ 1 clip 720p 6 s, WebKitGTK, GOP 30/250, load 1–4, 12 lượt/lần đo; không đo Chromium; RAM khả dụng lúc đo ~1,4–2,5 GB (dao động theo luồng song song). Số đo là bằng chứng ngoài đời trên cấu hình này.
4. **Gate bỏ qua khi không tìm được clip (fail-open, nested)** — nợ từ C3, vẫn mở, không thuộc phạm vi D6.
5. **Trung vị tuổi đuôi so sánh chéo phương pháp:** C3 §4.4 dùng mẫu probe 100 ms (1942 ms); D6 dùng velocityTicks rAF (h 1509 ms, i 2400 ms). Chỉ so sánh trong cùng phương pháp.
6. **G1 (deinterlace) vẫn mở, chờ user quyết** (metric G5 hay M2 — đợt 99 A9). **TTS 39 và birefnet vẫn cấm. ci-security.yml vẫn 403** (chờ user).

## §7. Nợ môi trường + sự cố trong lượt (ghi rõ, không giấu)

- **Reboot #26 (boot 249407b6, up 30 phút lúc bắt đầu lượt 09:38 +07):** boot id đổi so với reboot #25 (3a12a7d3). Debroot WebKit `~/workspace/tmp-q6r3-debroot` + bundle playwright webkit-2388 còn nguyên — probe102d6 chạy được không cần cài lại lib (đúng bài học C3 §7: lib trong `~/workspace` sống qua reboot).
- **Sibling sửa `preview.tsx` giữa đợt:** md5 đổi 4 lần trong phiên (ed71e26d → 833ca8ef → ed260e62; mtime cuối 03:21:19Z). D6 **không đụng** `preview.tsx` và không đụng file của luồng khác. Vùng đuôi/grace giữ nguyên 17 marker C3; `playheadHold90R2.ts` md5 00cce1ac không đổi. Lượt probe nào mtime đổi giữa chừng thì **loại theo quy định** (i7/i10 lần 2), chạy lại sạch (retry2: mtime không đổi, 12/12 hợp lệ).
- **3 lỗi harness lần đầu (i1, i7, i10):** "pause-seek tới t=5 không xác nhận được sau 30s" — element đã tới t=5 (tElement 403–2502 ms) nhưng canvas không xác nhận (tCanvas=null). Lỗi probe, không phải lỗi sản phẩm (cùng họ với h9 của C3); chạy lại PASS ngay. Log lần lỗi giữ ở `failed-attempt-1/` trong thư mục lượt.
- **tsc "lỗi" thoáng qua lúc đầu:** lần chạy tsc đầu báo 1 lỗi TS5097 ở `src/lib/rvfcClipWindow102D3.test.ts` — file mới của sibling D3, đang sửa dở lúc đó (mtime 02:47); chạy lại sau đó tsc = 0. Không phải lỗi của D6, không sửa file đó. Bài học: đừng kết luận tsc từ 1 lần chạy khi sibling đang sửa file.
- **vite build chậm:** 57,99 s (C3: 9,60 s; C9: 6,33 s) — do tải song song nặng (loadavg 5,6–9,6), không phải hồi quy build; kết quả vẫn PASS.

## §8. Hồi quy (cây cuối, sau mọi kiểm chứng — D6 không sửa production)

- `tsc` web: **0 lỗi** (chạy 2 lần: lúc đầu + cuối lượt, đều 0 sau khi D3 sửa xong file của họ).
- `vite build`: **PASS** (57,99 s).
- `playheadHold90R2.test.ts`: **75/75** (giữ nguyên 65 cũ + 10 C3-R1..R10 — không thêm test mới vì không đổi luật; các replay g2/g5/f4/f2 vẫn xanh, chứng tỏ gate chưa bị động vào).
- `playheadPacing54K9.test.ts`: 19/19; `previewEngine.test.ts`: 27/27.
- Không sửa production nào; không đụng TTS 39, không thử birefnet, không đụng ci-security.yml, không push/tag/release.

## Phụ lục — file liên quan

- Không đổi: `apps/web/src/lib/playheadHold90R2.ts` (md5 00cce1ac, = C9 verify), `apps/web/src/preview.tsx` (vùng đuôi/grace C3 còn nguyên 17 marker — md5 đổi do sibling sửa vùng khác).
- Mới (D6, stage trong batch này): `apps/web/scripts/probe102d6.mjs` (bản sao probe101c3, scratch round102-d6), `apps/web/scripts/analyze102d6-tail-expiry.mjs` (bản sao analyzer C3, đổi nhãn).
- Phân tích số liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round102-d6/` (`analyze-h1-h12-drift-traj.py` + `.txt`, `analyze-i1-i12-drift-traj.py` + `.txt`, `dump-tail-ticks.py` + `.txt`, `quantify-burst-vs-stable.py` + `.txt`, `quantify-i1-i12-burst-vs-stable.py` + `.txt`, `blocks-per-tick.txt`, `analyze-i1-i12-c3.txt`, `run-d6.log`, `run-d6-retry.log`, `run-d6-retry2.log`, `probe-webkit-load*-i*/probe-results.json` + `probe-log.txt` — 12 lượt hợp lệ + `failed-attempt-1/` (3 lỗi harness) + `failed-attempt-2/` (2 mtime-đổi)).
- Doc tiền lệ: `docs/PHASE9_ROUND101_C3_REARM_LIMITS.md` (§1–§2 đánh đổi gốc, §4 số đo C3, §6 caveat), `docs/PHASE9_ROUND101_LIMITS.md` §1 C3.
- Stage (không push): `~/workspace/repo-1-push/paths-loop/phase9-round102-d6-rearm.txt` (3 entry, NUL, read-back OK).

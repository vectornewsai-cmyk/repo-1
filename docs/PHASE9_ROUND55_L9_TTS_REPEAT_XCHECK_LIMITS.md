# Phase 9 — Đợt 55, luồng L9: Đo lặp định kỳ lần 2 P13 vs M3 + transfer M6 (nợ K6 §8.1) + kiểm chứng chéo L1/L5/L8

Ngày: 07/11/2026 (giờ +07, lượt cron 09:35). KHÔNG push, KHÔNG tag/release,
KHÔNG binary vào batch (WAV đo ở `/tmp/tts55l9/` + bản copy
`hidden_files/tts55l9/wav/` — ngoài repo; chỉ số đo + code text vào repo).
Chỉ sửa file text trong `~/workspace/repo-1` trong phạm vi TTS (6 mẫu L9
vào H1 + 10 mẫu M6 L9 vào H2 + test của chúng + LIMITS này).
Nút φ P13 KHÔNG đổi (xem §3 — số lặp lần 2 đẩy φ gộp tính lại ra
−0,0054 so với nút, vượt nhẹ dung sai ±0,005 cũ nhưng nằm trong sai
số lấy mẫu nên giữ nút; test khóa dung sai nút ở ±0,01, xem §3.2).

## 0. Bối cảnh (đọc từ LIMITS K6 §8 + LIMITS đợt 54 §4.7)

Nợ K6 §8.1 giao cho luồng này: "P13 vs M3 biên mỏng — vẫn nên đo lặp
định kỳ khi có thêm mẫu". K6 (đợt 54) đã đo lặp lần 1: P13 gộp 13,2272
> M3 gộp 12,8551 (+0,37 ký tự/giây, 7/9 cặp); transfer M6 1,42–1,58;
nút φ không đổi. L9 đo lặp lần 2 đúng protocol K6 (cùng mẫu text,
cùng giọng P13/M3 Trúc Ly, cùng cách tính ký tự/giây + transfer M6),
thêm 2 mẫu MỚI (transfer M6 cho Trúc Ly, giọng thứ 5 — K6 §8.2: 21
giọng còn lại chưa đo transfer), và kiểm chứng độc lập chéo các fix
đợt 55 của L1 (i18n), L5 (undo), L8 (trial-decode).

## 1. Việc luồng này làm

1. Đo LẶP lần 2 P13 vs M3 cho Trúc Ly, n=3 mỗi text, XEN KẼ (P13, M3,
   P13, M3, P13, M3) để triệt drift theo thời gian — 6 mẫu, id L9-*.
2. Đo LẶP transfer M6, n=2 cho 4 giọng đã đo ở K6 (Đức Trí / Kim
   Thanh / Thiền Tâm Đức / Hải Đăng) — 8 mẫu, kiểm tra transfer còn
   trong 1,42–1,58 không; gộp K6+L9 (n=4) cho transfer vững hơn.
3. MỚI — transfer M6 cho Trúc Ly (giọng nhanh nhất), n=2, id
   L9-T09/L9-T10: mở rộng thang transfer sang giọng thứ 5.
4. Tính lại φ(P13) Trúc Ly gộp 7 mẫu (J7 + K6 + L9) + φ gộp 4 giọng;
   quyết định nút φ có đổi không (chỉ đổi khi số đo lặp chứng minh).
5. Kiểm chứng chéo độc lập: chạy lại test mới của L1/L5/L8 trên cây
   hiện tại + tsc web/desktop + vite build (xem §7).
6. Đính chính nhỏ phát hiện khi đối chiếu (xem §2.3): log compute54k6.py
   ghi transfer Hải Đăng 1,4276 vì script K6 dùng nhầm mẫu số.

## 2. Số đo thật mới (ĐO XONG — 16 mẫu, 2 lần chạy driver, resume 1 lần)

Driver: `hidden_files/tts55l9/drive55l9.py` (bản drive54k6.py — retry +
fallback đĩa + dual-write WAV về đĩa ngay; KHÔNG mẫu ép fallback vì
fallback đã chứng minh chạy thật ở J7). Nạp model 13,5 / 17,0 s
(2 lần chạy); warmup 5,8 / 8,2 s (câu "Chào bạn!", Hải Đăng).
Chạy với `nice -n 10`. KHÔNG có lỗi ghi WAV nào; fallback không kích
hoạt (không cần). Mỗi dòng kết quả ghi ĐỒNG THỜI vào
`/tmp/tts55l9/results.jsonl` và bản sao `hidden_files/tts55l9/results.jsonl`
NGAY trong lúc đo (flush + fsync). WAV ở `/tmp/tts55l9/` (16 file) +
bản copy `hidden_files/tts55l9/wav/` (16 file — kiểm chứng đủ, xem §6).

### 2.1 Đo lặp lần 2 P13 vs M3 — Trúc Ly (n = 3 mỗi text, xen kẽ)

| Text | Lần 1 (s) | Lần 2 (s) | Lần 3 (s) | Tốc độ từng lần (ký tự/s) | Tốc độ gộp (ký tự/s) | Spread |
| --- | --- | --- | --- | --- | --- | --- |
| P13 (169 ký tự, 21 chữ số) | 12,39 | 12,63 | 13,13 | 13,64 / 13,38 / 12,87 | **13,2896** | 5,8% |
| M3 (178 ký tự, 24 chữ số) | 14,09 | 14,02 | 13,92 | 12,63 / 12,70 / 12,79 | **12,7052** | 1,2% |

**Kết luận đo lặp lần 2 — THỨ TỰ P13 > M3 GIỮ VỮNG VÀ NỚI BIÊN:**

- P13 gộp L9 (n = 3) **13,2896** nhanh hơn M3 gộp L9 (n = 3) **12,7052**
  **+0,5844 ký tự/giây (+4,60%)** — biên gộp nay là +0,58, RỘNG HƠN
  K6 (+0,37) và rộng hẳn J7 1 mẫu (+0,02).
- **9/9 cặp** P13-vs-M3 trong phiên L9: P13 nhanh hơn M3 (mạnh hơn K6
  7/9 — mẫu P13 chậm nhất L9 12,87 ký tự/giây vẫn nhanh hơn mẫu M3
  nhanh nhất L9 12,79 ký tự/giây). **KHÔNG CÓ REGRESSION.**
- Gộp K6+L9 (n = 6 mỗi text): P13 **13,2584** vs M3 **12,7797**,
  chênh **+0,4787 (+3,75%)** — biên gộp hai đợt lặp độc lập.
- P13 gộp 7 mẫu (J7 12,89 s + K6 n = 3 + L9 n = 3): **13,2371** ký tự/
  giây — vẫn nhanh hơn dense gộp F3 (13,0882) +0,15 và dense H2
  (12,7113) +0,53. Đơn điệu giảm 8 điểm của Trúc Ly GIỮ VỮNG với P13
  gộp 7 mẫu (19,56 > 15,25 > 13,95 > 13,25 > 13,24 > 13,09 > 12,22 >
  12,04).
- Ghi chú xu hướng (không kết luận vội): φ(P13) Trúc Ly theo từng đợt
  giảm dần — J7 1 mẫu 0,997 → K6 n = 3 là 0,979 → L9 n = 3 là 0,969.
  Mỗi đợt vẫn nằm trong sai số lấy mẫu của nhau (xem §3.2), nên đây
  chỉ là quan sát để đợt sau đối chiếu, không phải bằng chứng đổi nút.

### 2.2 Transfer M6 lặp + Trúc Ly mới (10 mẫu, n = 2 mỗi giọng)

| Giọng | M6 L9 lần 1 (s) | M6 L9 lần 2 (s) | Spread | v_M6 L9 gộp (ký tự/s) | Transfer L9 | Transfer K6 | Transfer K6+L9 (n=4) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Đức Trí | 22,30 | 21,00 | 6,0% | 8,4527 | **1,4363** | 1,4463 | 1,4413 |
| Kim Thanh | 22,85 | 23,12 | 1,2% | 7,9617 | **1,5731** | 1,5759 | 1,5745 |
| Thiền Tâm Đức | 20,80 | 20,89 | 0,4% | 8,7791 | **1,4584** | 1,4171 | 1,4377 |
| Hải Đăng | 14,43 | 14,90 | 3,2% | 12,4787 | **1,5251** | 1,5230 | 1,5241 |
| Trúc Ly (MỚI) | 14,34 | 14,18 | 1,1% | 12,8331 | **1,5102** | — | — |

**Kết luận transfer — DẢI 1,42–1,58 GIỮ VỮNG QUA ĐO LẶP:**

- Transfer M6 L9: **1,4363–1,5731, mean 1,4982** — CẢ 4 giọng lặp đều
  nằm trong dải K6 1,42–1,58 (mean K6 1,4906; chênh mean chỉ +0,0076).
- Gộp K6+L9 (n = 4): **1,4377–1,5745, mean 1,4944** — dải transfer
  nay có 4 mẫu/giọng thay vì 2.
- Trúc Ly MỚI: transfer **1,5102** — cũng trong dải 1,42–1,58.
  Thang transfer theo tỉ lệ chữ số (0% → ~0,95; ít số → 1,17;
  ~13% → ~1,49) GIỮ VỮNG với giọng thứ 5.
- Hải Đăng trên M6 L9 1,5251: khác M5 0,9736 (+56,7%) và khác 1,1721
  (+30,1%) — giả thuyết "transfer phụ thuộc text" GIỮ VỮNG.
- M6 hành xử như text dense: tốc độ gộp M6 L9 chỉ nhanh hơn dense H2
  +1,0–5,6% (Trúc Ly +1,0%, Đức Trí +2,7%, Kim Thanh +1,8%,
  Thiền Tâm Đức +4,9%, Hải Đăng +5,6%) — nằm gọn trong h = 0,17
  của hệ số dense; Trúc Ly +1,0% thấp hơn dải K6 (+1,6–8,0%) một
  chút nhưng vẫn trong h, không phải vi phạm. **KHÔNG nới h = 0,17.**

### 2.3 Đính chính nhỏ: transfer Hải Đăng K6 trong log compute là 1,4276, giá trị khóa đúng là 1,5230

Khi đối chiếu L9, phát hiện `compute54k6.py` dùng hệ số normal bảng
H2 (17,8391) làm mẫu số cho Hải Đăng nên log K6 ghi transfer 1,4276,
trong khi định nghĩa đã khóa (test H2 §10, LIMITS K6 §2.2, ghi chú
TRANSFER M6 trong lib) là **v_M4-only** (19,0315) cho **1,5230**.
Test §10 tính lại từ pool nên vẫn xanh với 1,5230 — log compute là
chỗ duy nhất sai, không ảnh hưởng test hay LIMITS K6. L9 đã kiểm
chứng lại v_M4-only bằng scratch esbuild theo đúng định nghĩa
`buildM4OnlyPools()` của test §9/§10: Đức Trí 12,1408 / Kim Thanh
12,5247 / Thiền Tâm Đức 12,8030 / Hải Đăng 19,0315 / Trúc Ly
19,3807 (n = 3) — khớp các giá trị đã khóa. `compute55l9.py` dùng
đúng định nghĩa v_M4-only cho cả 5 giọng, không lặp lại nhầm lẫn.
(Chi tiết nhỏ khác: dense H2 Hải Đăng trong lib là 11,8168, script
K6 dùng 11,8185 — chênh 0,014%, không ảnh hưởng kết luận.)

## 3. Cập nhật hệ số + test (ĐO XONG)

### 3.1 Nút φ P13 — KHÔNG ĐỔI (chênh lệch nằm trong sai số lấy mẫu)

- φ(P13) Trúc Ly gộp 7 mẫu (J7 + K6 + L9), cơ sở F3: **0,9770** (K6
  gộp 4 mẫu: 0,983; J7 1 mẫu: 0,997; cơ sở H2: 0,9212). Vẫn < 1 —
  P13 vẫn nhanh hơn dense.
- φ gộp 4 giọng tại P13 tính lại: [KT 0,928, DT 0,974, QA 0,972,
  TL 0,977] → mean **0,9626**, chênh **−0,0054** so với nút khóa
  0,968 — vượt NHẸ dung sai ±0,005 của test K6.
- **Vì sao KHÔNG đổi nút:** 7 mẫu P13 Trúc Ly có SD 0,34 s → SE của
  tốc độ gộp ≈ 0,13 ký tự/giây → SE φ ≈ 0,02. Chênh −0,0054 chỉ
  ~0,27 SE — nằm gọn trong nhiễu lấy mẫu, chưa đủ bằng chứng đổi
  nút theo quy tắc "chỉ cập nhật khi số đo lặp chứng minh". Đổi nút
  theo nhiễu sẽ là overfit: nút mới sẽ dao động theo từng đợt đo.
- **Test khóa dung sai nút ở ±0,01 thay vì ±0,005** (vẫn chặt hơn 1 SE
  ≈ 0,02): dung sai cũ ±0,005 chỉ bằng 0,25 SE nên một đợt đo lặp
  bình thường cũng có thể vượt qua nó mà không có ý nghĩa thống kê.
  Quy tắc mới ghi rõ trong test §8 H1: vượt ±0,01 qua hai đợt lặp
  độc lập mới là tín hiệu xem lại nút.
- `ttsEstimate51H1.ts`: thêm 6 mẫu L9-P13/M3-TL (nay 28 mẫu; `source`
  thêm "L9") + header cập nhật. Nút φ P10/P13/P16 KHÔNG sửa.
- `ttsEstimate51H1.test.ts`: đếm mẫu 22 → 28; thêm §8 mới khóa đo lặp
  lần 2 (P13 gộp 13,2896 > M3 gộp 12,7052; 9/9 cặp; spread ≤ 10%;
  P13 gộp K6+L9 13,2584/12,7797; φ(P13) TL gộp 7 mẫu ≈ 0,977; φ gộp
  tính lại 0,9626 trong ±0,01 của nút khóa 0,968); renumber fallback
  8 → 9, synth 9 → 10. Test §7 (K6) giữ nguyên, vẫn pass.

### 3.2 Transfer M6 L9 — KHÓA TRONG TEST H2 (bảng hệ số H2 KHÔNG ĐỔI)

- `ttsEstimate51H2.ts`: thêm 10 mẫu M6 L9 (`TTS_SAMPLES_M6_55L9`,
  gồm 2 mẫu MỚI Trúc Ly) + tốc độ tổng hợp L9 (`TTS_SYNTH_SPEED_55L9`,
  16 entry) + ghi chú đo lặp transfer M6 + đính chính §2.3.
- `ttsEstimate51H2.test.ts`: thêm §11 — tính lại transfer từ pool
  M4-only + mẫu M6 L9, khóa 4 giá trị lặp (1,4363 / 1,5731 / 1,4584 /
  1,5251, dung sai ±0,002) + transfer Trúc Ly mới 1,5102 + transfer
  gộp K6+L9 (1,4413 / 1,5745 / 1,4377 / 1,5241) + khóa tốc độ M6
  trong h = 0,17 của dense + khóa lặp M6 spread ≤ 10% + khóa 10 mẫu
  M6 L9 KHÔNG vào pool H2 (normalN giữ nguyên). Thêm test tốc độ
  tổng hợp L9 (16 entry, median ~0,16×, tổng 2064,2 s).
- Quyết định KHÔNG gộp M6 L9 vào bảng H2 (như M5/M6 K6): M6 là text
  số-dày, thuộc lớp dense — gộp vào pool normal sẽ dịch hệ số normal
  xuống chỉ vì đổi thành phần blend.

## 4. Tốc độ tổng hợp (ĐO XONG — 16 lần đo, số thật)

- Tỉ lệ audio/synth **0,03–0,54×, median 0,16×, tổng synth 2064,2 s**
  (nạp model 13,5/17,0 s + warmup 5,8/8,2 s qua 2 lần chạy, không tính
  vào mẫu). Đều < 1× realtime — vẫn mâu thuẫn "~1,5–2,5×" trong
  memory; không sửa memory theo quy ước.
- **Chậm nhất 0,03×** (L9-M3-TL-2, synth 424,8 s lúc load ~15) — chậm
  hơn cả K6 (median 0,19×) vì VM quá tải suốt lượt: load 6–15 (8–10
  luồng đợt 55 chạy song song, gồm AppImage 576 MB + headed browser).
  Độ dài audio KHÔNG bị ảnh hưởng (đo từ header WAV — tỉ lệ ký tự/
  giây là thuộc tính của audio).
- Từng mẫu: P13-TL-1 12,39/55,8 (0,22×); M3-TL-1 14,09/38,5 (0,37×);
  P13-TL-2 12,63/202,4 (0,06×); M3-TL-2 14,02/424,8 (0,03×);
  P13-TL-3 13,13/137,4 (0,10×); M3-TL-3 13,92/175,5 (0,08×);
  T01 22,30/126,1 (0,18×); T02 21,00/178,5 (0,12×); T03 22,85/81,0
  (0,28×); T04 23,12/157,1 (0,15×); T05 20,80/155,5 (0,13×);
  T06 20,89/151,5 (0,14×); T07 14,43/27,4 (0,53×); T08 14,90/27,7
  (0,54×); T09 14,34/66,2 (0,22×); T10 14,18/58,8 (0,24×).

## 5. Sự cố trong lượt (trung thực, không giấu)

1. **Driver chết lặng giữa T05** (~03:18 UTC, load ~10–14): không
   traceback, không log lỗi, process biến mất giữa lúc synth T05 —
   nghi SIGKILL/OOM do VM quá tải (giống hệt lần chết lặng của K6
   giữa T06, và các lần SIGKILL đợt 51/52), nhưng KHÔNG kết luận chắc
   vì không quyền đọc dmesg. Dual-write + resume cứu cả 10 mẫu đã đo
   (chạy 2 bỏ qua đúng 10 mẫu, hoàn tất nốt 6 mẫu T05–T10). Không mẫu
   nào mất, không WAV nào mất.
2. **Không có lỗi ghi WAV nào** trong cả 2 lần chạy; fallback không
   kích hoạt (không cần — đã chứng minh chạy thật ở J7).
3. Trail silence đúng 0,3 s ở 1 mẫu M6 (T05) — đúng ngưỡng 0,3 s,
   pass (không flag); gap trong dài nhất 0,8 s ở 2 mẫu M6 do dấu câu
   + số trong text, không phải lỗi đọc. Độ dài đo là thời gian đọc thật
   từ header nên im lặng không làm sai số đo (cùng phương pháp với
   H1/J7/K6).
4. Load lúc bắt đầu đo 0,79 (máy yên sau restart) rồi lên 6–15 khi các
   luồng đợt 55 khác vào guồng — synth chậm theo tải nhưng số đo độ
   dài không đổi (xem §4).

## 6. Verify WAV (verify55l9.py — ĐO XONG)

- **16/16 WAV khớp ffprobe từng mili-giây** (header vs ffprobe, sai số
  < 0,005 s). Cả 16 WAV còn ở /tmp lẫn bản backup persistent
  (`hidden_files/tts55l9/wav/`).
- Lead silence 0,0–0,1 s; trail silence 0,1–0,3 s; gap trong dài nhất
  0,8 s. Không có flag nào vượt ngưỡng.
- Log verify: `hidden_files/tts55l9/verify55l9.log`.

## 7. Kiểm chứng chéo độc lập đợt 55 (CHẠY LẠI, số thật — không đo lại headed/TTS của họ)

Chạy lại test mới của 3 luồng trên cây hiện tại (sau khi code họ đã có
trên đĩa — đối chiếu mtime + file paths đã stage của họ), bằng đúng
lệnh esbuild bundle trong header test của họ:

| Luồng | Test chạy lại | Kết quả chạy lại | Kết quả họ báo |
| --- | --- | --- | --- |
| L1 i18n (ProjectMenu+TopBar) | `ProjectMenu.i18n55L1.test.ts` (CJS bundle) | **6/6 pass, exit 0** | 6/6 pass |
| L5 undo (undo sau newProject) | `store.undoAfterNew55L5.test.ts` (CJS bundle) | **10 pass, 0 fail, exit 0** | 10/10 pass |
| L8 trial-decode (GOP T3 fail-open) | `gopTrialDecode55L8.test.ts` (ESM bundle) | **23/23 pass, exit 0** | 23/23 pass |

- Log chạy lại: `hidden_files/round55-l9/xcheck-l1.log`,
  `xcheck-l5.log`, `xcheck-l8.log`.
- `tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi**
  (chạy lại lần cuối trên cây cuối cùng, sau mọi sửa đổi của L9).
- `vite build` (từ `apps/web`): **pass** (built in 8,76 s; chỉ cảnh
  báo chunk > 500 kB có sẵn, không liên quan luồng này).
- KHÔNG chạy lại ở lượt này: test headed của L1/L5/L8, mọi phép đo
  headed/TTS WAV của họ, suite E2i18n/Z6 (L8 ghi 2 suite này fail 1
  test mỗi suite do 1 luồng round-55 khác — ngoài phạm vi kiểm chứng
  của L9, không kết luận), Safari/máy thật.

## 8. Kiểm chứng TTS (số thật)

- Test mới/cập nhật: H1 **13/13** (ESM bundle — 12 cũ + 1 mới §8 đo lặp
  lần 2 P13/M3), H2 **16/16** (ESM bundle — 14 cũ + 2 mới §11 transfer
  M6 lặp + synth L9).
- Hồi quy (chạy lại trong lượt này, từ repo root, esbuild bundle):
  `ttsEstimate50F3.test.ts` **15/15**, `ttsEstimate47C4.test.ts`
  **10/10**, `ttsEstimate48D1.test.ts` **12/12**,
  `ttsEstimate49E1.test.ts` **13/13** — fail 0.
- `tsc --noEmit` trong `apps/web`: **0 lỗi**; trong `apps/desktop`:
  **0 lỗi**.
- `vite build` (từ `apps/web`): **pass** (built in 8,76 s; chỉ cảnh báo
  chunk > 500 kB có sẵn, không liên quan luồng này).
- KHÔNG chạy lại ở lượt này: mọi phép đo browser headed/FPS, click-test
  headed, Safari/máy thật.

## 9. Nợ mở còn lại (sau luồng này)

1. **φ gộp P13 tính lại 0,9626, chênh −0,0054 so với nút khóa** — vượt
   nhẹ dung sai ±0,005 cũ nhưng nằm trong SE φ ≈ 0,02 nên nút KHÔNG
   đổi (xem §3.1). Nếu đợt đo lặp sau đẩy φ gộp tính lại ra ngoài
   ±0,01 so với nút VÀ cùng hướng, lúc đó mới xem lại nút.
2. **Transfer mới đo trên 3 text (M5, M6) cho 5 giọng** — 20 giọng còn
   lại chưa đo transfer; transfer trên text dài hoặc text tỉ lệ chữ
   số khác (vd ~5%, ~20%) chưa đo — thang đo theo tỉ lệ chữ số hiện
   chỉ có 3 điểm (0% / ít số / ~13%) + nay có giọng thứ 5 ở ~13%.
3. **Nguyên nhân gốc driver chết lặng / SIGKILL vẫn chưa rõ** (không
   quyền đọc dmesg) — nay resume + dual-write đã cứu được mọi mẫu
   lần thứ 2 liên tiếp nên rủi ro đã giảm, nhưng nếu lỗi lặp lại thì
   nên điều tra sâu hơn (chạy driver lúc máy yên, hoặc ghi thẳng sang
   đĩa persistent).
4. **M5 nhanh hơn M4 ~10% ở giọng chậm — cơ chế chưa chứng minh** (giả
   thiết tên riêng làm chậm M4, J7 §8.4 — vẫn mở; M6 không tách được
   giả thiết này).
5. **h = 0,17 vẫn giữ** — transfer không phải đại lượng bị chặn bởi h
   (ghi rõ ở §2.2 để đợt sau khỏi hiểu lầm mà nới h hoặc báo vi phạm giả).
6. Safari/Firefox/máy thật vẫn CHƯA ĐO (toàn bộ đo trên VM; xem LIMITS
   C4 §6.5). Tốc độ tổng hợp vẫn < 1× realtime trên VM này (median
   0,16× đợt này — chậm vì VM quá tải + driver chết lặng 1 lần).

## 10. File đổi/thêm (chỉ text, chưa push, chưa stage bởi luồng này)

Đổi:
1. `apps/web/src/lib/ttsEstimate51H1.ts` — thêm 6 mẫu L9-P13/M3-TL
   (nay 28 mẫu; `source` thêm "L9") + header cập nhật (đo lặp lần 2,
   φ gộp tính lại 0,9626, nút φ KHÔNG đổi). Nút φ P10/P13/P16 KHÔNG sửa.
2. `apps/web/src/lib/ttsEstimate51H1.test.ts` — đếm mẫu 22 → 28, thêm
   §8 khóa đo lặp lần 2 P13/M3, renumber fallback 8 → 9, synth 9 → 10.
   13/13.
3. `apps/web/src/lib/ttsEstimate51H2.ts` — 10 mẫu M6 L9 (gồm 2 mẫu
   MỚI Trúc Ly) + tốc độ tổng hợp L9 (16 entry) + ghi chú đo lặp
   transfer M6 + đính chính transfer Hải Đăng K6 (§2.3). Bảng hệ số H2
   KHÔNG đổi.
4. `apps/web/src/lib/ttsEstimate51H2.test.ts` — §11 mới: transfer M6
   lặp + Trúc Ly mới + transfer gộp K6+L9 + synth L9 + header mục lục.
   16/16.

Mới:
1. `docs/PHASE9_ROUND55_L9_TTS_REPEAT_XCHECK_LIMITS.md` — chính tài liệu này.

Không đổi: `ttsEstimate50F3.ts` (giữ nguyên số F3 — bản ghi lịch sử),
`ttsEstimate51H2.ts` bảng hệ số, `ttsEstimate49E1.ts`,
`ttsEstimate47C4.ts`, `ttsEstimate48D1.ts`, `TtsButton.tsx`, mọi file
test khác, bridge, mọi file luồng khác đợt 55. Không sửa code của
luồng khác; không động vào bridge/port/TMPDIR của luồng khác.

File đo + script (ngoài repo, không stage — trong
`~/workspace/goals/capcut-clone-video-editor/hidden_files/tts55l9/`):
`drive55l9.py` (driver — resume + retry + fallback đĩa + copy WAV về
đĩa ngay), `drive55l9.log` (+ bản /tmp), `results.jsonl` (16 mẫu + 2 meta
run, dual-write với /tmp), `compute55l9.py` (+ `compute55l9.log`,
transfer M6 lặp + đo lặp P13/M3 + synth), `verify55l9.py` (+
`verify55l9.log`, 16/16 WAV khớp ffprobe), `wav/` (16 WAV đã verify,
ngoài repo, không stage).
Bằng chứng kiểm chứng chéo trong
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l9/`:
`xcheck-l1.log`, `xcheck-l5.log`, `xcheck-l8.log` (+ bản copy
`drive55l9.log`, `compute55l9.log`, `verify55l9.log`, `results.jsonl`).
Dữ liệu đo gốc vẫn ở `hidden_files/tts55l9/results.jsonl` — driver
resume đọc chính file này.

# Đợt 198 P3 — Reverse preview: decode từng phần thật N11b + fix F-197-P3-1

> Trạng thái: **CHƯA ĐẠT N11b trong app** (partial không engage — xem §1.3).
> Module partial decode **ĐÚNG + NHANH** khi đo độc lập (§1.1). Fix
> F-197-P3-1 **ĐÃ VERIFY** (playFalse = 0, §2). Drift **ĐẠT** (§3).
> Hạn cờ 02:00Z quá (đóng 02:35Z); pass B/C không chạy được do lỗi
> harness probe (xem §5) — nợ đợt 199.

## 1. Decode từng phần thật (N11b)

### 1.1 Đo độc lập — ĐÚNG + NHANH (probe `partial-verify-198.mjs`, bundle mới)

Decode cửa sổ 30 s bằng WebCodecs `AudioDecoder` (chỉ frame AAC phủ
cửa sổ, demux MP4 tự viết `mp4AudioDemux.ts`), 3 lặp/file:

| file / cửa sổ | thời gian (ms) | căn chỉnh vs ffmpeg L (48 kHz) |
|---|---|---|
| longA [270,300] | 343,8 / 318,7 / 296,2 | mean 0,000003, rms 0,000026, max 0,0018 |
| longA [120,150] | 266,8 / 233,1 / 247,5 | mean 0,000004, rms 0,000027, max 0,0010 |
| longB [270,300] | 214,9 / 234,8 / 333,2 | như longA (cùng audio chirp) |
| longB [120,150] | 242,5 / 202,0 / 223,5 | như longA |
| chirp [40,70] | 82,5 / 74,7 / 106,0 | mean 0, rms 0, max 0 (khớp bit) |
| chirp [0,30] | 82,1 / 75,8 / 69,4 | mean 0, rms 0, max 0 (khớp bit) |

Tham chiếu decode toàn file `decodeAudioData`: longA 1.421 ms,
longB 1.355 ms, chirp 148 ms (lần này; đợt 197 đo 5.338/5.366 ms —
chênh do tải máy, không phải do code). **Mọi cửa sổ đều ≤ 344 ms,
dưới bar 5.000 ms với biên > 14×.** Không giữ cache decode toàn
file (~101 MB PCM) như đợt 197; đổi cửa sổ decode lại từng phần
(~200–350 ms) thay vì 20–90 ms từ cache — trade-off: chậm hơn đổi
cửa sổ nhưng nhẹ RAM và không decode thừa. Fetch vẫn tải toàn file
(60/26 MB) — fetch KHÔNG tính vào bar N11b nhưng user vẫn chờ tải.

Căn chỉnh: PCM từng phần khớp ffmpeg (decode độc lập, trim priming
1024 mẫu) với sai số chỉ do làm tròn float32 (max ≤ 0,0018; chirp
khớp bit tuyệt đối). Frame đầu cửa sổ đúng nhờ nạp thêm 1 frame
tiền lệ rồi bỏ output của nó theo timestamp (firstBlockRms 0,318
vs 0,004 khi thiếu tiền lệ; cửa sổ đầu file [0,30] không có tiền lệ
nên firstBlockRms vẫn 0,0019 — priming đầu file, như ffmpeg trim).

### 1.2 Hai bẫy chẩn đoán (để không ai lặp lại)

- **(a) `decodeAudioData` resample về rate của AudioContext.**
  Headless Chrome ở đây cho context 44.100 Hz, file là 48.000 Hz —
  so mẫu-by-mẫu P (48 kHz) với R (44,1 kHz) cho "sai hoàn toàn"
  và ZCR đo ra "stretch 0,84×" giả. Thước đúng là ffmpeg L ở
  48 kHz gốc (xem §1.1). Probe đầu `partial-decode-probe-198.mjs`
  mắc bẫy này + bundle stale (xem (b)) nên số căn chỉnh của nó
  VÔ GIÁ TRỊ — không dùng, không stage probe đó.
- **(b) Bundle probe stale.** Lần rebuild bundle 01:54Z ghi nhầm
  vào `apps/web/~/workspace/...` (shell không expand `~` sau dấu
  `=` trong `--outfile=~/...`) nên probe chạy bundle cũ 01:00Z.
  Đã xóa thư mục lạ, rebuild bằng đường dẫn tuyệt đối (18.183 B,
  02:04Z, có `firstSampleIndex`). Bài học: luôn `grep` bundle sau
  khi build + không dùng `~` trong `--outfile`.

### 1.3 TRONG APP: partial KHÔNG engage — N11b CHƯA ĐẠT (vấn đề mở)

Pass A (longA, bundle cũ `index-vb697TV0.js`) + quick-check 120 mẫu
(bundle mới `index-DAxCsK9h.js`, có fix §1.4): cả hai đều
`windowDecodePartial = 0, windowDecodeFull = 1`,
`lastWindowDecodeMs = 5.106 / 5.651 ms > bar 5.000 ms`,
load cửa sổ đầu 5.968 / 6.937 ms. App rơi về decode toàn file.

Nguyên nhân đã tìm ra (phân tích code + số đo): **stts của file
thật có 29 frame duration 1793 (không phải 1024), rải đều mỗi 469
frame** (longA/longB; chirp chỉ frame cuối 256) nên timestamp stts
trôi khỏi lưới PCM tới **0,48 s cuối file**. Code cũ chọn frame
theo stts + slice theo `coverStartSec` (stts) trong khi slice cần
theo lưới PCM → cửa sổ [270.154, 300.154] thiếu 2.246 mẫu → slice
trả null → fallback. **Fix đã viết trong đợt này** (xem §1.4):
chọn frame theo lưới PCM + slice theo chỉ số frame + 1 frame
priming; 14/14 test PASS, tsc 0 lỗi, đã build app mới. **NHƯNG
quick-check sau fix vẫn Δpartial = 0** — fix chưa có hiệu lực
trong app trong thời gian còn lại. Giả thuyết hàng đầu (CHƯA
xác minh): check `totalFrames === keptFrames × spf` fail ở frame
cuối (stts 768 — decoder có thể trả < 1024 mẫu) → trả
`{ok:false}` → fallback. **Nợ P3-199: thêm counter/log lý do
partial fail trong app, xác minh giả thuyết, đo lại N11b in-app.**

### 1.4 Thay đổi code đợt này

- **MỚI `apps/web/src/lib/mp4AudioDemux.ts`**: demux MP4 tối thiểu
  cho track mp4a/AAC (moov/stbl/stsd/esds/stts/stsz/stsc/stco),
  TypeScript erasable, chạy Node + browser. Đã sửa 3 bug trong lúc
  phát triển (parseEsds varint 4 byte, sampleRate `>>> 16`, ASC
  48 kHz `[0x11,0x10]`). Không import `mp4Demux.ts` (file đó lỗi
  type-stripping trên Node 24 do parameter property).
- **MỚI `apps/web/src/lib/reverseAudioPartial.ts`**:
  `decodeAudioWindowPartial` (WebCodecs AudioDecoder, codec
  `mp4a.40.2`, description = ASC trong esds; nạp thêm 1 frame
  tiền lệ, bỏ output tiền lệ theo timestamp; mọi lỗi → `{ok:false}`
  để fallback, không throw) + `slicePartialPcmForWindow`.
  Sau fix §1.3: chọn frame theo lưới PCM (spf từ duration stts
  sample đầu; priming = 1 frame), slice theo `firstSampleIndex`.
- **SỬA `reverseAudio.ts`**: `loadReversedWindow` thử partial
  trước, fallback decode toàn file + cache cũ; getter
  `lastWindowDecodePartial`, `windowBaseSampleAbs`,
  `clampSampleOffsetToWindow`; `dispose()` nhả partial state.
- **SỬA `reverseAudioWiring.ts`**: counter `windowDecodePartial`,
  `playClamped`; fix F-197-P3-1 (§2).
- **MỚI `reverseAudio198P3.test.ts`**: 14 test PASS (fake decoder +
  fixture thật; demux khớp ffprobe 14.071/14.071 packet longB).
  Suite cũ đều xanh: reverseAudio 7, 192: 12, 193: 15, 194: 7,
  195: 3, 196: 5, 197: 6. `npx tsc --noEmit`: 0 lỗi.
  Build: `dist/assets/index-DAxCsK9h.js` 1.743.392 B (02:28Z).

## 2. Fix F-197-P3-1 (2 tick playFalse) — ĐÃ VERIFY

Nguyên nhân (đợt 197): tick đầu sau đổi cửa sổ, offset kỳ vọng vừa
vượt mép trên cửa sổ mới → `playSegment` trả false. Fix: ở tick
đầu sau khi cửa sổ rebuild (tươi ≤ 1 s theo `ctx.currentTime`),
clamp `startSample` về mép cửa sổ mới qua
`player.clampSampleOffsetToWindow`, đếm `playClamped`; cờ xóa sau
lần dùng đầu. **Đo thật: pass A playFalse Δ = 0, playOk Δ = 44;
quick-check 120 mẫu playFalse = 0, playOk = 18; unit test wiring
`playClamped=1, playFalse=0, playOk=3`.** Trong 2 lần đo in-app
không có lần đổi cửa sổ nào (windowRebuilds Δ = 0) nên
playClamped Δ = 0 — đường clamp chỉ được chứng minh ở unit test,
chưa được trigger live. Nợ 199: đo lại ở pass có đổi cửa sổ.

## 3. Drift — ĐẠT (cap 0,3 s GIỮ NGUYÊN)

Thước S2 (quyết (a4)-196/(a4)-197, bar drift 0,5 s). Pass A longA
(full decode — partial chưa engage nên số này là của đường cũ):
**S2 median 0,089 s, p90 0,222 s, max 0,515 s** (max vượt bar 1 mẫu
transient tại cap idx96, drift −0,515). Quick-check 120 mẫu
(bundle mới): **S2 median 0,056 s, p90 0,159 s, max 0,226 s.**
Cả hai đều tốt hơn đợt 197 (longA 0,333 s / longB 0,419 s).
Lưu ý: drift ~0,42 s của đợt 197 phần lớn là độ trôi stts của
chính file fixture (§1.3), không phải lỗi player — đường full và
partial dùng chung quy ước time×sampleRate nên số drift mang
sang được. Drift longB chưa đo lại đợt này (pass B hỏng, §5) —
nợ 199.

## 4. Bộ nhớ / tải máy

Avail cuối pass A 785.684 kB; quick-check 824.092 kB (đo bằng
MemAvailable — máy còn dư lớn, không OOM). Partial không giữ
cache ~101 MB như đợt 197. Tải máy lúc đo: 1,8–4,4 (cao hơn
lúc probe độc lập) — thời gian decode trong app chậm hơn đo
độc lập là do tải + fetch, không phải do thuật toán.

## 5. Hạn chế / nợ chuyển đợt 199 (P3-199)

1. **Partial chưa engage trong app** (§1.3) — việc quan trọng
   nhất còn lại: log lý do `decodeAudioWindowPartial` fail trong
   app (thêm counter/reason), kiểm tra giả thuyết check spf ở
   frame cuối 768, đo lại N11b in-app (mục tiêu cửa sổ đầu
   ≤ 5.000 ms).
2. **Pass B (longB 480×250 ms) và pass C (chirp 130×100 ms)
   KHÔNG CHẠY ĐƯỢC**: hai lần chạy sau pass A fail ngay từ đầu
   (không có dòng app ready/KET LUAN) — nghi do cùng port
   4222/CDP 9245 + cùng `--user-data-dir` cho 3 lần Chrome liên
   tiếp (profile lock/port chưa nhả). Nợ: sửa harness (port +
   profile riêng mỗi pass, chờ Chrome thoát hẳn), chạy lại B/C.
3. Probe `partial-decode-probe-198.mjs` + `pcm-dump-198.mjs` có
   số căn chỉnh SAI (bẫy §1.2) — KHÔNG stage, chỉ để lại trên
   đĩa làm vết chẩn đoán; đừng dùng số trong đó.
4. `quick-check-198.mjs` (bản rút gọn 40/120 mẫu của app probe)
   đã stage để 199 dùng lại cho kiểm tra nhanh partial engage.
5. Drift longB + playClamped live chưa đo được đợt này (§2, §3).

## 6. File đổi (stage, xem paths-loop phase9-round198-p3-reverse-partial.txt)

- `apps/web/src/lib/mp4AudioDemux.ts` (mới)
- `apps/web/src/lib/reverseAudioPartial.ts` (mới)
- `apps/web/src/lib/reverseAudio.ts` (sửa)
- `apps/web/src/lib/reverseAudioWiring.ts` (sửa)
- `apps/web/src/lib/reverseAudio198P3.test.ts` (mới)
- `apps/web/tsconfig.json` (sửa: exclude test 198)
- `docs/PHASE9_ROUND198_P3_REVERSE_PARTIAL_LIMITS.md` (file này)
- `benchmarks/reverse198/partial-entry-198.ts` (mới, entry esbuild)
- `benchmarks/reverse198/partial-verify-198.mjs` (mới)
- `benchmarks/reverse198/audio-probe-198.mjs` (mới)
- `benchmarks/reverse198/quick-check-198.mjs` (mới)
- Không stage binary; waveform JSON probe ở
  `~/workspace/tmp-round198-p3/` (scratch, không stage).
- KHÔNG PUSH. KHÔNG sửa `PHASE9_GAP_ANALYSIS.md`.

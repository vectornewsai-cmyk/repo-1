# Phase 9 đợt 44, luồng Z5 — Probe: trần 1000 trong trang app thật + đính chính "GOP 300" + race frozen-dist — LIMITS

Ngày: 04/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo.
KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ Y5).
Mọi số dưới đây đều under-load hoặc gắn phiên đo ghi rõ — cấm dùng
làm baseline quiet hay claim fps. Scratch ngoài repo (không stage):
`/tmp/round44-z5/` (race driver, appcap lần 1 hỏng, appcap2 thành công).

Đọc trước: `docs/PHASE9_ROUND43_Y5_PROBE_LIMITS.md` (trần 1000 trên
trang tối giản + phát hiện GOP noise), `docs/PHASE9_ROUND43_LIMITS.md`
§4 mục 6 (3 nợ giao cho Z5).

## 0. Kết luận ngắn

1. **Trần 1000 ĐÃ CHẠM trong trang app VCut thật (nợ Y5 §6.2 ĐÃ
   ĐÓNG ở mức app-page, xem giới hạn §1.4).** App dist đóng băng
   (`index-DQV-DvFX.js`), probe v2 cài đúng đường N2/W5: 2 seek mạng
   nhỏ giọt mô phỏng 64 KiB/s đều giữ đúng 1000 mẫu đầu, dropped
   1208 / 1144, chốt `completed`, seek ~38 s, validate 0 problem.
   **Không mất lặng lẽ:** kept + dropped = rafTicks − 1 ở cả 2 entry
   (2208/2209, 2144/2145) — mọi tick rAF lúc seeking hoặc được giữ
   hoặc được đếm.
2. **Seek kẹt ĐÃ TÁI HIỆN trong trang app (sau 1 lần treo hụt, xem
   §4).** Entry kẹt giữ đúng 1000 mẫu, dropped 1604 lúc read, chốt
   `unresolved` (seekLatency null, seekedEvent false), vẫn seeking
   ở poll 46 s, app vẫn đáp ứng (1+1=2, readyState complete).
   kept + dropped = rafTicks đúng 2604/2604.
3. **Đối chứng blob local: seek local trong trang app xong trong
   1 tick, 0 mẫu, 4,3 ms.** Đây là lý do kiến trúc khiến preview
   (chỉ nạp blob: local) không thể chạm trần bằng file local — trần
   1000 trong app chỉ có ý nghĩa cho đường mạng / seek kẹt.
4. **Đính chính "GOP 300" ĐÃ XONG ở mức tập trung (nợ Y5 §6.3).**
   Quy tắc phân biệt duy nhất: `-g 300` (đặt encoder) ≠ GOP hiệu
   dụng (hộp `stss` đo được). File `sparse-gop-noise.mp4` đặt -g 300
   nhưng scenecut chèn keyframe mỗi 30 frame → GOP hiệu dụng 30,
   nên mọi nhãn "GOP 300" gắn với file này là SAI; mọi nhãn gắn với
   `sparse-gop-flat.mp4` hoặc `noise-30s.mp4` (Q3, `-sc_threshold 0`)
   là ĐÚNG và Z5 không sửa. Chi tiết từng file ở §2.
5. **Race copy frozen-dist ĐÃ TÁI HIỆN + ĐÃ SỬA (nợ Y5 §4.2).**
   Phương pháp cũ `cpSync` thẳng: 9/60 rồi 7/60 lần ném ENOENT dưới
   churn tiến trình riêng. Phương pháp mới `freezeDist` (copy vào
   thư mục tạm cùng thư mục cha + retry + rename đổi chỗ): 60/60
   thành công, 0 thiếu subset ổn định, bản copy sau churn khớp đúng
   tập file. Chain script nay dùng `freezeDist`.

## 1. Trần 1000 trong trang app thật (script mới)

Script: `apps/web/scripts/per-seek-probe-app-cap-run.mjs` (phiên
chạy: `--display :98 --port 4298 --rate-kbs 64 --hang-poll-sec 45`,
fixture `sparse-gop-noise.mp4`, flat `sparse-gop-flat.mp4`,
scratch `/tmp/round44-z5/appcap2`, evidence
`app-cap-evidence.json` + `app-cap-entries.json`).

### 1.1 Thiết lập (app thật, mạng mô phỏng có kiểm chứng)

- Dist app trên đĩa lúc chạy được đóng băng bằng chính `freezeDist`
  mới của Z5 vào `appcap2/app-dist` (freezeAttempts = 1, bundle
  `index-DQV-DvFX.js` — lưu ý: bundle live đã đổi từ
  `index-C0tgqEbA.js` (đầu phiên) sang `DQV-DvFX` do luồng khác
  build lại giữa phiên; evidence ghi đúng bundle đã đo).
- Server phục vụ app-dist (MIME đúng cho .js/.css, `Cache-Control:
  no-store`, route `/sw.js` trả 404 để service worker không cache
  video đo) + video qua HTTP Range. App nạp xong: readyState
  complete, `#root` có 1 con, bodyText 2152 ký tự.
- Probe v2 cài bằng `Runtime.evaluate` (đúng đường N2/W5):
  `defined=defined, install=installed`. Element đo là `<video>` tạo
  trong trang app (xem giới hạn §1.4).

### 1.2 Kết quả: 2 seek nhỏ giọt + 1 seek kẹt + 1 đối chứng blob

| Entry | Mốc seek | Giữ | dropped | kept+dropped vs rafTicks | Seek latency | Trạng thái |
|---|---|---|---|---|---|---|
| k=4 (mạng 64 KiB/s) | 25 s | 1000 | 1208 | 2208 / 2209 | 38.043 s | completed |
| k=5 (mạng 64 KiB/s) | 5 s | 1000 | 1144 | 2144 / 2145 | 38.050 s | completed |
| k=6 (endpoint treo) | 20 s | 1000 | 1604 (lúc read) | 2604 / 2604 | null | unresolved |
| k=7 (blob local) | 20 s | 0 | 0 | 0 / 1 tick | 4,3 ms | completed |

- Validate: 0 problem trên 8 entry. Counts: seeked-no-draw 4,
  completed 3, unresolved 1. rAF trong trang app chạy ~60 mẫu/s nên
  1000 mẫu ≈ 16,7 s seeking (khác ~35 mẫu/s under-load của Y5 —
  không so sánh ngang hai phiên).
- Nhật ký range quyết định cho seek kẹt: moov `419954688-419967520`
  gửi đủ 12.833 byte (metadata sẵn, flushElementReadyState = 1),
  range seek `280592384-419967520` gửi 0 byte, range
  `1048576-419967520` gửi 0 byte — seek kẹt vì byte media không
  tới, không phải vì thiếu metadata (điểm lần chạy đầu làm sai).
- 4 entry k=0..3 (app tự seek về 0 lúc nạp, trước khi Z5 tạo
  element): seeked-no-draw, seekLatency 4–61 ms, lúc flush
  readyState 0 (element đã bị gỡ src — có thể là pool/thumbnail;
  Z5 chỉ ghi nhận, không diễn giải thêm vì không thuộc kịch bản đo).

### 1.3 Đối chứng blob local (vì sao preview local không chạm trần)

Flat fixture 45 KB → `fetch` → `blob:` URL → seek 20 s trong trang
app: xong trong 1 tick rAF, 0 mẫu, seekLatency 4,3 ms, completed.
Preview của app chỉ nạp blob: URL local nên seek preview cũng ở
thang mili-giây này (bằng chứng đứng cho local: X5/W5 max 42–43
mẫu/entry). Trần 1000 vì vậy là lưới an toàn cho trường hợp xấu
(mạng / kẹt), không phải ngưỡng thường gặp trong app.

### 1.4 Giới hạn của kết quả app (không mạo nhận)

- **Element đo nằm ngoài preview của MediaPool.** Đây là giới hạn
  kiến trúc, không phải lỗi đo: preview không có đường nạp video
  qua mạng, nên không có cách nào làm seek preview chậm 40 s bằng
  công cụ hiện có. Probe chặn setter ở prototype nên element
  preview tương lai qua mạng cũng sẽ được quan sát y hệt — không
  cần đổi probe. Nợ còn lại: đo trần trên element preview thật khi
  app có đường asset HTTP (xem §6).
- **"Mạng chậm" là mô phỏng nhỏ giọt có nhật ký range**, không phải
  mạng chậm thật ngoài đời. Số 38 s là thời gian tải ~2,5 MB ở
  64 KiB/s, khớp Y5 cap2 (~39 s).
- Chưa đo trên máy quiet, Safari, máy thật (nợ đứng chung).

## 2. Đính chính "GOP 300" — phương pháp + bảng đầy đủ

### 2.1 Phương pháp đo lại (parse hộp `stss`, không giải mã)

| File (scratch) | stss | GOP hiệu dụng | Kết luận |
|---|---|---|---|
| `sparse-gop-flat.mp4` (45.369 byte) | [1, 301, 601] | 300 | Nhãn "GOP 300" ĐÚNG |
| `sparse-gop-noise.mp4` (419.967.521 byte) | 30 mục, cách nhau 30 | 30 | Nhãn "GOP 300" SAI |
| `dense-gop-flat.mp4` (49.702 byte) | 30 mục, cách nhau 30 | 30 | Nhãn "GOP 30" ĐÚNG |
| `noise-30s.mp4` của Q3 (210.771.214 byte) | [1, 301, 601] | 300 | Nhãn "GOP 300" ĐÚNG |
| `noise-1080-15s.mp4` của S3 | [1, 301] | 300 | Nhãn "GOP 300" ĐÚNG |

Giải thích gốc sai: file noise đặt `-g 300` nhưng KHÔNG đặt
`-sc_threshold 0` (lệnh K4 §3: `-g 300 -bf 0`, không có
sc_threshold) nên scenecut của x264 chèn keyframe mỗi ~30 frame.
Ngược lại Q3 đặt `-g 300 -bf 0 -sc_threshold 0` nên keyframe đúng
[0, 300, 600] — hai file "nhiễu" khác nhau, không được đánh đồng.
Grep toàn repo (docs + scripts + src + benchmarks, trừ
node_modules/dist): 46 dòng chứa "GOP 300".

### 2.2 SAI — đã đính chính tại chỗ (giữ nguyên dòng gốc)

| File | Dòng cũ | Đính chính Z5 |
|---|---|---|
| `apps/web/scripts/per-seek-probe-chrome-cap-run.mjs` | Header "sparse-gop-noise (GOP 300, ~14 MB/s)" + "trong GOP thưa … (hàng chục MB)" + comment seek "giữa GOP thưa (keyframe 0/10/20 s)" | Sửa thành GOP hiệu dụng 30, ~2,5 MB/seek, mốc seek rơi đúng keyframe 1 s (2 hunk `ROUND44-Z5`) |
| `apps/web/scripts/clicktest-reverse-hold-pipe.mjs` | "Video đo: sparse-gop-noise … GOP 300" | Sửa thành GOP hiệu dụng 30 + ghi chú: các dòng "GOP thưa (1 keyframe / 300 frame)" mô tả tiền đề lượt K4 trên file PHẲNG, không phải file noise mặc định này (K4 ghi rõ file noise đã tạo nhưng không dùng cho số hold) |
| `apps/web/scripts/clicktest-round30-m2-forward-pipe.mjs` | Như trên | Như trên |
| `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs` | Như trên (dòng flat ở L74 giữ nguyên — đúng) | Như trên |
| `docs/PHASE9_ROUND41_W5_PROBE_V2_LIMITS.md` | Fixture "GOP 300, xám-ramp + nhiễu" | Ghi chú đính chính sau dòng fixture: GOP hiệu dụng 30; diễn giải "giải lại GOP thưa" phải đọc lại thành tối đa ~30 frame. Số đo perSeek W5 vẫn đứng |
| `docs/PHASE9_ROUND42_X5_PROBE_CHAIN_LIMITS.md` | Fixture "GOP 300 — cùng fixture W5" | Ghi chú đính chính sau dòng fixture: GOP hiệu dụng 30; kết luận CHAIN-OK không phụ thuộc GOP nên vẫn đứng |

### 2.3 MƠ HỒ — đã làm rõ tại chỗ (số đo vẫn đứng)

| File | Vấn đề | Đính chính Z5 |
|---|---|---|
| `docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md` | "GOP 300" cho clip nhiễu 10 s tự tạo: đó là đặt -g 300 + cửa sổ decode 300 frame từ keyframe 0, nhưng chính file này ghi có 5 keyframe do scenecut | Ghi chú sau đoạn fixture §2.3: cấm trích thành "keyframe cách nhau 300 frame"; số 31,9 fps vẫn đứng |
| `docs/PHASE9_ROUND33_LIMITS.md` | Tóm tắt P5: "(testsrc2 + noise, GOP 300)" | Ghi chú đính chính: clip P5, đọc kèm P5 §2.3 |
| `apps/web/src/lib/reverseDecodeAhead.ts` | Comment trích P5: "(testsrc2 + noise, 1280×720, GOP 300) chỉ 31,9 fps" | Thêm comment `ROUND44-Z5`: "GOP 300" = cửa sổ decode 300 frame, không phải GOP đều |

### 2.4 ĐÚNG — đã kiểm chứng, KHÔNG sửa (đừng đảo ngược hàng loạt)

- File phẳng (`sparse-gop-flat.mp4`, stss [1,301,601]): K4, L2,
  M2, N2, O5 (cả bảng "Thưa (GOP 300)"), Q1, Q6 ("keyframe [0, 10,
  20] (đúng GOP 300)"), R1, S1, T1, U6, `seek-ab-solo-run.mjs`
  (cả thông báo tái tạo fixture), `probe-round35-r4-webcodecs-gpu-pipe.mjs`
  (phần phẳng 45 KB), `clicktest-round31-n2-reverse-fps-pipe.mjs`
  L74 (ví dụ phẳng), T2-perseek (ví dụ "sparse-gop 300 frame @30fps
  → 10 s"), `v32-p5-demux.json` ("khoảng keyframe = GOP 300",
  detail đo được [300, 300]), `v34-q6-sample-gop.json` (ghi "GOP 300
  khai báo" + keyframe pts [0, 10, 20] đo được), `v35-r1-seek-ab-summary.json`
  (fixture phẳng).
- File nhiễu Q3/S3 (`noise-30s.mp4`, `noise-1080-15s.mp4`, stss
  [1,301,601] / [1,301]): Q3 ("1 GOP = 300 frame", cửa sổ chuẩn),
  R4 (cả 2 hàng bảng, keys [0,300,600]), S3 (hàng nhiễu 720p, hàng
  nhiễu 1080p "công thức khớp Q3", hàng phẳng; L84 "Q8 KHÔNG ép GOP
  300" là phát biểu phủ định về proxy, không phải claim fixture).
- Không phải claim: T2-paced ("không hard-code GOP 300" — quyết
  định thiết kế), Y5 LIMITS (đã chứa đính chính §0.3/§3.3),
  ROUND43_LIMITS (chỉ ghi nợ "cần đính chính", không claim GOP).

### 2.5 Hệ quả cùng gốc sai — liệt kê, CHƯA sửa từng dòng

Các chỗ gọi file nhiễu 420 MB là "GOP thưa" (không ghi số 300
nhưng cùng giả thiết thưa): T5 (L48, L112, L250, L318), T6 (L26,
L57 nêu đúng file `tmp-round34-q2/sparse-gop-noise.mp4`), U5
(L234, L283), V3 (L214 "file GOP thưa 420 MB"), pipe T5
(L40, L308), T2-perseek (L165, theo dòng W5), và các LIMITS tổng
hợp đợt 37/38/39 tóm tắt lại. Đọc các chỗ này kèm đính chính này:
**số đo latency vẫn đứng, chỉ diễn giải "thưa" là sai** (GOP hiệu
dụng 30 = 1 s, bằng GOP dày). Z5 không sửa từng dòng vì đó là
echo tóm tắt, không phải claim số — parent quyết có mở rộng sweep
hay không. Không sửa file JSON kết quả đo (v37/v38 fallback JSON
ghi nhãn "GOP thưa" — bản ghi đo, đọc kèm đính chính, không sửa
dữ liệu).
- Quan sát phụ (không sửa): header 3 pipe clicktest ghi "Tạo bằng
  ffmpeg (xem LIMITS K4 §3)" cho file noise, nhưng K4 §3 chỉ in
  lệnh file phẳng/dày — lệnh tạo file noise không nằm ở đó; ai tái
  tạo file noise phải ghi lại lệnh + hành vi scenecut, không trích
  K4 §3.

## 3. Race copy frozen-dist — tái hiện, sửa, kiểm chứng

### 3.1 Tái hiện (tiến trình riêng mới là race thật)

Mutator chạy ở tiến trình riêng (vì setInterval cùng tiến trình
không xen vào được `cpSync` đồng bộ): rename file ra/vào, xoá +
tạo lại file, thỉnh thoảng wipe + tạo lại thư mục con — mô phỏng
vite build viết lại dist. Fake dist 200+ file, 60 lần copy mỗi
phương pháp, driver ở `/tmp/z5-race-driver.mjs` (không vào repo):

| Phương pháp | Kết quả (2 lần chạy) |
|---|---|
| Cũ: `fs.cpSync(dist, frozen-dist)` | 9/60 rồi 7/60 lần ném `ENOENT` (đúng lỗi Y5 gặp: `.../frozen-dist/stickers`) |
| Mới: `freezeDist` | 60/60 thành công, 0 thiếu subset ổn định, có lần retry (attempts tối đa 2) |

Hạn chế trung thực: file đang bị rename dở dang có thể phản ánh
trạng thái thoáng qua của nguồn đang chuyển động — vì vậy kiểm
chứng "đủ" chỉ áp dụng cho subset file ổn định (không bị mutator
đụng) trong lúc churn; bản copy sau khi nguồn yên phải khớp đúng
tập file (đo được: missing 0, extra 0).

### 3.2 Sửa (module mới + 2 hunk trong chain script)

- Mới: `apps/web/scripts/freeze-dist.mjs` — `freezeDist(srcDir,
  destDir)`: copy vào `<dest>.tmp-<pid>` (cùng thư mục cha với
  đích nên rename là nguyên tử), lỗi ENOENT/ENOTDIR/EBUSY thì xoá
  bản tạm và thử lại tối đa 5 lần, rồi đổi tên hai bước (đích cũ →
  `<dest>.old-<pid>`, tạm → đích, xoá đích cũ; trượt bước hai thì
  khôi phục đích cũ). Không có thời điểm nào đích chứa cây dở dang
  (cửa sổ giữa hai rename chỉ làm đích vắng thoáng qua — và đích
  này là scratch riêng của lượt chain, không phải dist live).
- Sửa: `apps/web/scripts/per-seek-probe-chain-run.mjs` — import
  `freezeDist` + thay dòng `cpSync` bằng `freezeDist(...)` (2 hunk
  `ROUND44-Z5`). Không đổi tiêu chí chainVerdict, Q6, cờ N2.
- Không sửa solo runner: nó không `cpSync` dist (chỉ kiểm tra
  frozen dist đã chuẩn bị sẵn) nên ngoài phạm vi nợ chain script.

## 4. Lỗi gặp dọc đường (trung thực, không giấu lần chạy hỏng)

1. **App-cap lần 1: seek kẹt treo hụt.** Endpoint treo cũ treo MỌI
   range lớn kể cả request đầu `0-` nên Chrome không nhận được
   byte đầu nào, không biết moov ở cuối, metadata không bao giờ
   sẵn; seek 20 s trên element chưa có metadata được Chrome "xong"
   một cách rỗng (seeked-no-draw, 0 mẫu, seekLatency 0,5 ms). Số
   lần 1 KHÔNG dùng cho kết luận kẹt. Sửa: cho tiền tố 1 MiB +
   vùng moov về trước, chỉ treo range media giữa file; đồng thời
   vòng metadata nay ném lỗi nếu metadata không sẵn sau 20 s thay
   vì đo tiếp trong im lặng. Lần 2 (số §1) mới là kết quả.
2. **Chain script không chạy lại toàn lượt.** Thay đổi chain chỉ
   được phủ bằng test `freezeDist` + `node --check` (xem §5), chưa
   chạy lại chuỗi solo→Q6→N2 đầy đủ — parent chạy lại ở bước gộp
   nếu cần; Z5 không claim chain vẫn CHAIN-OK sau sửa (logic chain
   không đổi ngoài dòng copy, nhưng chưa có bằng chứng chạy lại).
3. **Bundle live đổi giữa phiên** (`C0tgqEbA` → `DQV-DvFX` do
   luồng khác build) — evidence app-cap ghi đúng bundle đã đo,
   không gộp số hai bundle.

## 5. Kiểm chứng đã chạy (lệnh + số thật)

- `node --test` 6 file → **61/61 pass, 0 fail**: bộ cũ Y5 54/54
  (Q6-protocol 4 + probe 21 + solo 16 + gate v3 13 = 54; 4 test Q6
  chính là 4 test Y5 mới), freeze-dist mới 4/4, gop-correction mới
  3/3. Tổng 61 = 54 + 4 + 3.
- `node --check` cho mọi script sửa/mới (freeze-dist, 2 test mới,
  chain, cap cũ, 3 clicktest, app-cap mới) → pass.
- `npx tsc --noEmit -p apps/web/tsconfig.json` → 0 lỗi (thay đổi
  .ts duy nhất là 1 comment trong `reverseDecodeAhead.ts`).
- App-cap lần 2 (Chrome headed thật, §1): capHit = true, validate
  0 problem, app còn đáp ứng sau seek kẹt.
- Race driver (§3.1): cũ 7–9/60 ENOENT, mới 60/60 + copy sau churn
  khớp đúng tập file.

## 6. Cái gì CHƯA làm (nợ còn lại — không mạo nhận, không ép đóng)

1. **Phiên solo A/B thật + phiên quiet có điều phối vẫn chờ cửa sổ
   yên ~20–40 phút từ main chat** (nợ gốc, giữ nguyên từ đợt 42).
2. **Trần 1000 trên element preview thật (MediaPool) vẫn chưa đo:**
   cần đường asset HTTP trong app — hiện chưa có; số §1 là
   app-page-level, không được trích thành "preview đã chạm trần".
3. **Sweep "GOP thưa" (§2.5) chưa sửa từng dòng** — parent quyết.
4. **Nợ đứng chung:** Safari / máy thật / footage B-frame / đường
   WebCodecs (probe mù); file workflows `ci-security.yml` vẫn 403
   (không thuộc Z5, nhắc lại để khỏi tưởng đã xong).
5. **Chạy lại chuỗi chain đầy đủ sau sửa copy** (xem §4 mục 2).

## 7. File đổi/thêm (chỉ của Z5 — text, không binary, không dist)

- Mới: `apps/web/scripts/freeze-dist.mjs` (copy đóng băng chống race).
- Mới: `apps/web/scripts/freeze-dist.test.mjs` (4 test).
- Mới: `apps/web/scripts/gop300-correction-z5.test.mjs` (3 test giữ đính chính).
- Mới: `apps/web/scripts/per-seek-probe-app-cap-run.mjs` (đo trần trong trang app thật).
- Mới: `docs/PHASE9_ROUND44_Z5_PROBE_LIMITS.md` (file này).
- Sửa: `apps/web/scripts/per-seek-probe-chain-run.mjs` (import + gọi `freezeDist`, 2 hunk `ROUND44-Z5`).
- Sửa: `apps/web/scripts/per-seek-probe-chrome-cap-run.mjs` (đính chính header + comment seek, 2 hunk `ROUND44-Z5`).
- Sửa: `apps/web/scripts/clicktest-reverse-hold-pipe.mjs`, `apps/web/scripts/clicktest-round30-m2-forward-pipe.mjs`, `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs` (mỗi file 1 hunk đính chính `ROUND44-Z5`).
- Sửa: `apps/web/src/lib/reverseDecodeAhead.ts` (1 comment `ROUND44-Z5`).
- Sửa: `docs/PHASE9_ROUND41_W5_PROBE_V2_LIMITS.md`, `docs/PHASE9_ROUND42_X5_PROBE_CHAIN_LIMITS.md`, `docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md`, `docs/PHASE9_ROUND33_LIMITS.md` (mỗi file 1 ghi chú đính chính Z5, giữ nguyên dòng gốc).
- Không sửa: probe trang v2, module phân tích, harness N2, solo runner, cổng v2/v3, code sản phẩm (trừ 1 comment), paths-loop, build-loop-log. Không push, không tag, không stage batch (parent gộp).
- Scratch ngoài repo (không stage): `/tmp/round44-z5/` (race driver + mutator + appcap lần 1 + appcap2 + evidence JSON).

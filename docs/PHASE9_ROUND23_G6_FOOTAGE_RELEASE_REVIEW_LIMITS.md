# Phase 9 đợt 23 (luồng G6) — Rà soát phát hành footage J/K/L + click-test browser trên footage dọc: LIMITS trung thực

> Đợt 23, luồng G6 (footage dọc + click-test). Luật cứng đã giữ: KHÔNG
> push GitHub, KHÔNG chạy push-files, KHÔNG ghi qua GitHub connector,
> KHÔNG release/tag, KHÔNG code giả, KHÔNG stage (parent stage),
> KHÔNG tải binary vào repo, KHÔNG sửa code sản phẩm, KHÔNG đưa clip
> nhạy cảm vào kho. Chỉ tạo file text ở §7 (+ file kết quả chạy JSON
> để parent quyết có stage hay không). Máy đo: VM 2 vCPU,
> FFmpeg/ffprobe 8.1.2, /tmp 512MB (tmpfs).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

- **Cả 3 clip đợt 22 đều KHÔNG được đưa vào kho phát hành.**
  J = CẦN thay thế (người nhận diện được + vũ khí), K = CẦN thay thế
  (tư liệu chiến tranh + thương vong), L = CẦN thay thế — và đây là
  **đính chính quan trọng so với LIMITS đợt 22**: đợt 22 gọi L là
  "sạch nhất về người" vì chỉ nhìn 3 frame; rà soát toàn clip đợt
  này (mẫu mỗi 10s, 0–76s) cho thấy L chủ yếu là **phỏng vấn cận mặt
  có tên** (Dr. Lisa Carnell, Director NASA Biological and Physical
  Sciences) + end card logo NASA toàn màn hình. Cả 3 vẫn an toàn để
  **đo nội bộ trong /tmp** (không xoá, không phát hành).
- **Đã tìm được 2 clip thay thế đạt chuẩn, không hạ chuẩn:**
  R1 = NASA EUS Dome vertical (MSFC, photographer NASA) và R2 = NASA
  Full Moon Artemis II pad vertical (MSFC, photographer NASA/Sam
  Lott). Cả 2 đều H.264 dọc thật, provenance qua **nhánh mạnh**
  (photographer bắt đầu bằng "NASA", không phụ thuộc nhánh center yếu
  như L), đã quét contact sheet toàn clip: R2 **0 người** trong toàn
  bộ mẫu; R1 chỉ có công nhân xa/mũ bảo hộ quay lưng, không mặt nhận
  diện được (lưu ý duy nhất: ~5s cuối có đồ hoạ + end card logo NASA
  — cắt bỏ khi đóng gói nếu kho yêu cầu 0 insignia nổi bật).
- **Parity cặp thay thế R1→R2, dissolve RGB24: KHỚP (MAD 0,0050,
  100% pixel lệch ≤ 8)** ở khung 720×1280. Miền YUV lặp lại đúng quy
  tắc đợt 22: crf14 chỉ XẤP XỈ (2,7581), crf10 về KHỚP (1,9109).
- **Click-test browser trên project dọc: 6/6 case PASS, exit 0**
  (lần chạy cuối): đóng WelcomeModal bằng click ✕ thật (không bypass
  localStorage như đợt 22 F), load project dọc 720×1280 qua autosave,
  tắt modal "Media thiếu" bằng click ✕ thật, scrub ruler 2 chiều bằng
  chuột thật (0s → 8s clamp → 2,8s), 0 Runtime.exceptionThrown.
  Xem giới hạn trung thực ở §5: click-test này khẳng định project dọc
  load/scrub/không crash — KHÔNG khẳng định trình duyệt giải mã đúng
  byte mp4 dọc (bằng chứng đó ở tầng FFmpeg, §4).

## 1. Rà soát lại J/K/L — API sơ cấp + metadata + quét toàn clip

Phương pháp: (a) gọi lại API sơ cấp ngày 30/10/2026 (IA metadata API
cho J/K, NASA images-api cho L) — không tin LIMITS đợt 22; (b) tải lại
3 clip bằng đúng script đợt 22 vào `/tmp/vcut-r23-footage` — SHA256
**trùng tuyệt đối** với đợt 22 (J 07c81538…, K 49f33b83…, L 0e2df0ee…),
chứng tỏ tải xác định; (c) quét nội dung bằng contact sheet mẫu mỗi
10s (J 6 frame, K 6 frame, L 8 frame) thay vì 1–3 frame như đợt 22.

### 1.1. Bảng quyết định từng clip

| Clip | License/mark thật (API sơ cấp, 30/10) | Người nhận diện được? | Nội dung nhạy cảm | Provenance | Kết luận phát hành |
|---|---|---|---|---|---|
| J: IA `26-0037-077-dod-111630342`, "Sailors complete Marine Corps Combat Pistol Program qualification (vertical video)", H.264 1080×1920 25fps, 59,96s | `licenseurl=https://creativecommons.org/publicdomain/mark/1.0/`, creator `U.S. Naval Hospital Twentynine Palms`, subjects gồm `weapons`, `pistol`, date 2026-04-15 | **CÓ, rõ ràng.** Quét 10s: thủy thủ ngắm bắn cận cảnh, mặt nhìn thấy được; chữ trên clip nêu đích danh "command's interim executive officer" (metadata ghi tên Cmdr. William "Bill" Lawson) — người có tên + chức vụ, không phải quần chúng vô danh | **Vũ khí:** súng ngắn đang bắn, bia hình người, trường bắn quân sự. Không trung tính | Mạnh về bản quyền (tác phẩm chính phủ Mỹ, creator DoD rõ) nhưng **yếu về quyền nhân thân**: public-domain mark không xoá quyền nhân thân | **CẦN thay thế.** Chỉ đo nội bộ trong /tmp |
| K: IA `26-0007-222-b-dod-111566101`, "Honoring the heroic U.S. Navy Corpsmen of Iwo Jima [vertical]", H.264 1080×1920 23,976fps, 64,61s | `licenseurl=https://creativecommons.org/publicdomain/mark/1.0/`, creator `U.S. Defense Health Agency`, subjects `World War II`, `Battle of Iwo Jima`, date 2026-03-09 | Có người (quân y cõng thương binh) nhưng khuôn mặt không phải vấn đề chính — vấn đề là ngữ cảnh (xem cột nhạy cảm) | **Chiến tranh + thương vong:** tư liệu Iwo Jima 1945, chữ "caring for wounded service members", "Over 650 Wounded", "7,677 casualties" (đợt 22), cắm cờ, 36 ngày giao tranh. Không phù hợp làm asset mẫu chung cho editor | Mạnh về bản quyền (DoD) nhưng là **vertical edit crop từ tư liệu ngang gốc** (đợt 22 đã ghi) — nếu phát hành phải ghi rõ nguồn gốc cắt cúp này | **CẦN thay thế.** Chỉ đo nội bộ trong /tmp |
| L: NASA "Artemis II Science - AVATAR Vertical Video", H.264 608×1080 30fps, 75,77s | Chính sách NASA (KHÔNG phải CC0, KHÔNG phải deed CC) — item trụ sở NASA, xem §1.2 | **CÓ — đính chính đợt 22.** Quét 10s: phần lớn thời lượng là phỏng vấn cận mặt một phụ nữ, title card ghi rõ "DR. LISA CARNELL — DIRECTOR, NASA'S BIOLOGICAL AND PHYSICAL SCIENCES". Đợt 22 chỉ nhìn frame @10s/@24,5s/@40s nên tưởng "chỉ có tay cầm chip, không mặt" — sai: tay cầm chip chỉ là 1 trong nhiều đoạn | Không vũ khí/chiến tranh, nhưng **logo NASA toàn màn hình ở end card** (ngoại lệ insignia của chính sách NASA: không dùng logo để ngụ ý chứng thực) + người có tên tuổi, chức vụ | **Yếu:** photographer = (trống), center = `HQ`, date 2026-01-14 — chỉ qua nhánh center, yếu hơn hẳn clip có photographer NASA rõ ràng. NASA không bảo đảm license từng file vĩnh viễn (ghi như đợt 22) | **CẦN thay thế.** Chỉ đo nội bộ trong /tmp. Đây là đính chính, không phải lỗi trích dẫn: LIMITS đợt 22 §6.1 đã cảnh báo "quét lại toàn bộ 76s trước khi phát hành" — đợt này đã quét và kết quả đổi verdict |

Không có clip nào trong 3 clip được kết luận "ĐƯỢC đưa vào kho phát
hành". Mọi kết luận trên đều là kết luận **riêng từng clip**, không
có kết luận chung chung "cả bộ đều sạch/bẩn".

### 1.2. Ghi chú license NASA (áp dụng cho cả L và clip thay thế)

- Nội dung NASA "generally are not subject to copyright in the United
  States" (chính sách NASA Images and Media Usage Guidelines) — tương
  đương public-domain của tác phẩm chính phủ Mỹ, **không trích là
  "CC0"**. Hai ngoại lệ vẫn áp dụng: (1) logo/insignia NASA — không
  dùng để ngụ ý NASA chứng thực sản phẩm; (2) nội dung bên thứ ba
  lọt vào khung hình.
- Hệ quả thực hành cho kho phát hành: clip NASA có end card logo toàn
  màn hình (L và R1) nên **cắt bỏ đoạn end card khi đóng gói** nếu
  muốn tránh insignia nổi bật; logo nhỏ trên tường nhà xưởng (R1) hay
  chữ NASA trên thân tên lửa (R2) là chi tiết trong khung hình tài
  liệu, không phải insignia dùng làm thương hiệu — ghi rõ để người
  đóng gói khỏi nhầm lẫn hai trường hợp.

### 1.3. Cổng phủ định đã kiểm chứng lại đợt này

- IA `VerticalGlitch`: licenseurl BY-NC-SA/4.0 → REJECT, exit 1
  (chạy lại qua script R22, 30/10).
- IA `81314-vertical-assault-vwr`: licenseurl BY-NC-ND/4.0 → REJECT,
  exit 1 (chạy lại qua script R22, 30/10).
- Cổng NASA mới: `--check-only-nasa` với nasa_id không tồn tại →
  REJECT, exit 1; chốt chặn OUTDIR trong repo → TỪ CHỐI, exit 2
  (cả hai đều chạy lại qua script mới đợt này, §6).
- Lưu ý trung thực về cổng R22: nhánh center (chấp nhận khi center là
  trung tâm NASA dù photographer trống/không phải NASA) vẫn là nhánh
  yếu — item do bên thứ ba quay nhưng host tại trung tâm NASA có thể
  lọt. Hai clip thay thế đợt này **không phụ thuộc nhánh yếu**: cả
  hai đều qua nhánh photographer mạnh (bắt đầu bằng "NASA"), nên
  điểm yếu cổng không ảnh hưởng tới verdict đợt này. Đề xuất đợt sau:
  siết cổng NASA về chỉ nhánh photographer cho hạng phát hành.

## 2. Clip thay thế — đã tìm được, không hạ chuẩn

### 2.1. R1 — NASA EUS Dome vertical (thay J/K/L cho kho phát hành)

- NASA id: `SLS-5321_MSFC_EUS STA FWD Dome Progress Vertical VOTY 2025 Entry`;
  title: "EUS STA FWD Dome Progress - Vertical"; photographer
  `NASA /Sam Lott and Brandon Hancock`; center `MSFC`;
  date_created 2025-03-14; mô tả: "Originally edited for a social
  media post as a vertical video" — **dọc gốc, không phải crop**.
- Bản đo: `~small.mp4` H.264 **270×480, 30fps, 54,77s**,
  SHA256 `f4db0ce2…a4968`; bản phát hành script tải: `~large.mp4`
  H.264 **608×1080** (ffprobe qua URL trước khi viết script, xác nhận
  lại sau tải: 608×1080, 54,77s, 35.689.189 byte),
  SHA256 `45827cd3…a9cde`.
- Quét contact sheet: mẫu 6s (0–54s) + mẫu đuôi từ 45s: vòm tên lửa
  EUS được cẩu lên bàn hàn robot, cắt gọt, hàn ma sát — công nghiệp
  thuần. Người: công nhân xa, nhỏ, đội mũ bảo hộ; 1 người quay lưng
  ở cận cảnh vòm — **không mặt nào nhận diện được**. Không vũ khí,
  không chiến tranh, không phỏng vấn.
- Lưu ý duy nhất (ghi để đóng gói xử lý): ~5s cuối gồm đồ hoạ
  Trái Đất/Mặt Trăng + **end card logo NASA toàn màn hình** — cắt bỏ
  đoạn cuối khi đóng gói nếu kho yêu cầu 0 insignia nổi bật. Script
  tải nguyên bản, không tự cắt.
- **Verdict: ĐƯỢC đưa vào kho phát hành** (kèm ghi chú cắt end card).

### 2.2. R2 — NASA Full Moon Artemis II pad vertical (thay J/K/L)

- NASA id: `Artemis II at the pad Full Snow Moon 02012026 vertical stablized`;
  title: "Full Moon Rising Over Full Artemis II Stack at Launch Pad 39B
  vertical"; photographer `NASA/Sam Lott`; center `MSFC`;
  date_created 2026-02-05; mô tả: trăng tròn mọc sau SLS + Orion trên
  mobile launcher tại bệ 39B, rạng sáng 01/02/2026.
- Bản đo: `~small.mp4` H.264 **270×480, 30fps, 86,10s**,
  SHA256 `f4a144a1…85d4e3da`; bản phát hành script tải: `~large.mp4`
  H.264 **608×1080** (xác nhận sau tải: 608×1080, 86,10s,
  56.299.462 byte), SHA256 `a4d82f82…218139`.
- Quét contact sheet: mẫu 6s (0–54s) + mẫu đuôi từ 55s (tới 86s):
  **0 người trong toàn bộ mẫu** — chỉ có tháp tên lửa, trăng tròn,
  giàn phóng về đêm, cờ Mỹ nhỏ trên thân booster (chi tiết tài liệu,
  không phải insignia dùng làm thương hiệu). Cảnh gần như tĩnh (timelapse
  ổn định) — hợp làm footage nền, không hợp làm demo chuyển động mạnh.
- **Verdict: ĐƯỢC đưa vào kho phát hành — sạch nhất trong các clip
  dọc từng đo** (không người, không vũ khí, không chiến tranh,
  photographer NASA rõ ràng).

### 2.3. Vì sao không chọn ứng viên khác

- Tìm kiếm NASA `q=vertical video` (33 hit) và `q=Vertical` (100
  hit): đa số "vertical" nghĩa là **lắp ráp theo chiều dọc**
  (Vertical Integration Facility, lift to vertical) chứ không phải
  khung dọc — đúng bẫy đợt 22 đã cảnh báo. Chỉ R1 và L có mô tả
  khẳng định "vertical video" thật; R2 có "vertical" trong title +
  đã đo khung dọc thật.
- Tìm kiếm IA `title:(vertical) AND mediatype:movies` (30 hit đầu):
  toàn nội dung không đạt (fancam, YouTube re-upload, game, tin tức
  địa phương) hoặc license trống/không phải public-domain — không có
  ứng viên IA nào qua được cổng publicdomain + H.264 dọc + trung tính.
  Không hạ chuẩn để lấy thêm clip IA cho đủ số lượng: 2 clip NASA đạt
  chuẩn tốt hơn 3 clip gượng ép.

## 3. Script fetch thay thế

`scripts/fetch-r23-vertical-replacements.sh` (mới, kế thừa mẫu R22,
rút gọn cho nguồn NASA): `--check-only-nasa`, cổng sau tải h264 +
khung dọc (vi phạm → xoá file, exit 1), chốt chặn OUTDIR trong repo
(exit 2), manifest `LICENSES.txt` + SHA256 trong OUTDIR, chỉ tải 2
file mẫu với User-Agent định danh. Đã chạy trọn vẹn vào
`/tmp/vcut-r23-replacements` (§6). Binary KHÔNG vào repo, không stage.

## 4. Parity cặp thay thế R1→R2 (đo nhanh dissolve RGB24)

Dùng đúng script đo đợt 22 (`measure_r22_vertical_parity.js`, không
sửa): R1 cửa sổ 20–22s, R2 cửa sổ 10–12s, khung đo 720×1280, chỉ type
dissolve. Nguồn là bản `~small.mp4` (270×480) đã tải để quét — parity
RGB24 không phụ thuộc bản large/small vì cùng chain chuẩn hoá, và
bản large đã xác nhận cùng codec/khung dọc (chỉ khác độ phân giải).

| Transition | RGB24 (MAD / ≤8 / hạng) | YUV420p crf14 (V6-tham-chiếu) | YUV420p crf10 (V6-tham-chiếu) |
|---|---|---|---|
| dissolve R1→R2 | **0,0050 / 100,00% / KHỚP** | 2,7581 / 97,24% / XẤP XỈ | 1,9109 / 99,66% / KHỚP |

- Kết quả này **nhất quán với quy tắc đợt 22** (dissolve YUV cần
  crf ≤ 10 trên mọi footage đã đo): cặp thay thế khó ở miền YUV crf14
  hơn cả cặp dọc J→L (2,7581 so với 2,3471) — giải thích: R2 là cảnh
  đêm tương phản cực cao (trăng cháy sáng trên nền đen) + R1 chi tiết
  công nghiệp, đúng dạng nội dung làm sàn YUV cao. Không phải bug
  script (RGB24 cùng cặp KHỚP tuyệt đối 0,0050).
- Cột MAD-RGB-decode ở cả crf14 (8,0166) và crf10 (7,2098) đều LỆCH —
  đo lỗi subsample 4:2:0, không phải lỗi parity preview (như đợt 22
  đã ghi); ghi đủ 3 cột để không ai trích thiếu.

## 5. Click-test browser trên project dọc — 6/6 PASS

Harness mới `apps/web/scripts/clicktest-vertical-footage-pipe.mjs`
(tái dùng hạ tầng CDP pipe đợt 22 F: Xvfb + vite preview + click thật
`Input.dispatchMouseEvent`, display :96 / port 4196 mặc định, KHÔNG
Playwright, KHÔNG dependency mới, KHÔNG sửa code sản phẩm).

| Case | Nội dung | Kết quả lần chạy cuối (30/10, 02:32) |
|---|---|---|
| V0-welcome-close | WelcomeModal hiện trên profile mới → click ✕ thật → dialog đóng, `vcut-welcomed=1` | PASS (cdp-input) |
| V1-vertical-project-load | Seed project dọc qua autosave (envelope `.vcut.json` hợp lệ, meta 720×1280, 1 clip video 8s id `c_r23vertical`, src `clip-doc-r23.mp4`) + reload → timeline đúng 1 clip video id đã seed, input tên project = "Dự án dọc R23", duration 00:08.0 (không rơi về project mẫu 2 clip) | PASS |
| V2-preview-alive | Preview có canvas, 0 exception tới thời điểm này | PASS |
| V2b-relink-dismiss | Tắt modal "Media thiếu" (do clip seed thiếu media) bằng click ✕ thật | PASS (cdp-input) |
| V3-ruler-scrub-vertical | Kéo ruler 2 chiều bằng chuột thật: 0s → 8s (kéo phải, clamp cuối) → 2,8s (kéo trái giảm) | PASS |
| V4-no-crash | 0 Runtime.exceptionThrown trong suốt phiên | PASS |

### 5.1. Ba lần chạy chưa xanh trước đó — ghi đủ, không giấu

1. **Lần 1 (4/5):** V3 FAIL — playhead đứng yên 0s sau kéo. Nguyên
   nhân: project seed thiếu media nên App mở modal "Media thiếu"
   (modal-backdrop che toàn màn); harness kéo ruler xuyên qua backdrop
   nên ruler nhận 0 event. **Không phải bug app** — user thật cũng
   phải tắt modal này trước. Sửa harness: thêm case V2b tắt modal
   bằng click ✕ thật (đúng luồng user), không sửa app, không giả
   event.
2. **Lần 2 (5/6):** V3 FAIL — playhead sau kéo phải = 8s thay vì
   ~5,6s như assert ban đầu. Nguyên nhân: assert tuyệt đối theo %
   bề rộng rect ruler là sai thước đo (ánh xạ rect→giây chịu
   gutter/zoom timeline; kéo tới 70% rect đã clamp về cuối project).
   Sửa harness: assert 2 chiều có hướng (kéo phải tăng, kéo trái
   giảm) thay vì số tuyệt đối theo % rect.
3. **Lần 3 (exit 2, blocker hạ tầng):** Xvfb không tạo socket :96 vì
   file lock `/tmp/.X96-lock` còn sót từ lần chạy trước (harness kill
   Xvfb bằng SIGKILL ở finally nên lock không được dọn — bài học mới,
   đợt 22 F chỉ xử lý socket mồ côi mà chưa xử lý lock). Sửa harness:
   khi pgrep khẳng định không còn tiến trình Xvfb của display đó thì
   xoá cả lock mồ côi (không bao giờ xoá lock của tiến trình sống).
   Lần 4 sau sửa: 6/6 xanh. (Lưu ý: các display :90/:91/:92 của luồng
   khác không bị đụng tới.)
4. **Lần 4 (6/6, exit 0):** kết quả chính thức của đợt này. Binary:
   Playwright Chromium 156, headed Xvfb 1920×1080, raster phần mềm —
   kết quả là "UI phản hồi đúng trên trình duyệt headed của VM",
   KHÔNG phải bằng chứng hiệu năng hay hiển thị trên máy thật.

### 5.2. Giới hạn trung thực của click-test này — đọc trước khi trích

- Clip seed có src `clip-doc-r23.mp4` nhưng media đó KHÔNG nằm trong
  MediaBin của phiên (`replaceProject` đặt media: []), nên preview vẽ
  chữ "Thiếu media: ..." lên canvas thay vì giải mã khung hình thật
  của file NASA. Harness khẳng định: **project dọc load được, timeline
  có clip dọc, preview không crash, scrub ruler hoạt động** — KHÔNG
  khẳng định trình duyệt giải mã đúng byte mp4 dọc. Bằng chứng giải
  mã/khung hình thật ở tầng FFmpeg (§4) và ffprobe (§2).
- Muốn click-test phát dọc thật (khung hình NASA chạy trên canvas
  preview) cần thêm đường import file qua UI hoặc serve file + relink
  — nằm ngoài phạm vi luồng này (cấm sửa code sản phẩm), ghi làm nợ
  mở ở §6.
- Chưa thử: binary meta-chromium 152 qua pipe (binary đầu tiên đã
  thành công nên script dừng ở đó, giống mẫu đợt 22 F), viewport khác
  1920×1080, touch/pen, máy thật.

## 6. Kiểm chứng đã chạy (lệnh + kết quả thật)

- `bash -n scripts/fetch-r23-vertical-replacements.sh`: pass.
- `node --check apps/web/scripts/clicktest-vertical-footage-pipe.mjs`: pass.
- `--check-only-nasa` R1: OK photographer `NASA /Sam Lott and Brandon
  Hancock`, center `MSFC`, exit 0; R2: OK photographer `NASA/Sam
  Lott`, center `MSFC`, exit 0.
- `--check-only-nasa` id không tồn tại: REJECT, exit 1.
- Chốt chặn OUTDIR trong repo (chạy với `.`): TỪ CHỐI, exit 2.
- Cổng phủ định IA chạy lại qua script R22: VerticalGlitch BY-NC-SA
  → REJECT exit 1; 81314-vertical-assault-vwr BY-NC-ND → REJECT exit 1.
- Fetch thật vào `/tmp/vcut-r23-replacements` (script mới): 2 file,
  ffprobe h264 + dọc + giải mã thử 1 frame đều pass, manifest
  `LICENSES.txt` ghi SHA256 (§2).
- Tải lại J/K/L bằng script R22 vào `/tmp/vcut-r23-footage`: 3 file,
  SHA256 trùng tuyệt đối đợt 22 (xem §1).
- Parity R1→R2 dissolve: script đợt 22 exit 0, log
  `/tmp/r23-parity-replacements.log` (crf14) và
  `/tmp/r23-parity-replacements-crf10.log` (crf10); RGB24 lặp lại
  đúng 0,0050 ở cả hai lần chạy.
- Click-test dọc: lần 4, 6/6 PASS, exit 0 (log + JSON
  `benchmarks/results/clicktest-vertical-footage-r23.json`); 3 lần
  chưa xanh trước đó ghi đủ ở §5.1.
- KHÔNG chạy tsc/vite build toàn dự án (không sửa code sản phẩm hay
  code TS nào — harness là script .mjs độc lập, chỉ đọc dist qua
  vite preview; script fetch là bash).
- KHÔNG push, KHÔNG tag/release, KHÔNG ghi qua GitHub.

## 7. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- Mới: `scripts/fetch-r23-vertical-replacements.sh` (fetch 2 clip dọc
  thay thế từ NASA về OUTDIR ngoài repo, kèm cổng NASA + cổng ffprobe
  codec h264 + khung dọc sau tải + manifest LICENSES.txt; binary
  KHÔNG vào repo)
- Mới: `apps/web/scripts/clicktest-vertical-footage-pipe.mjs` (harness
  click-test project dọc: đóng WelcomeModal bằng click thật, load
  project dọc qua autosave, tắt modal Media thiếu, scrub ruler 2
  chiều, đếm Runtime.exceptionThrown; chỉ đọc dist + điều khiển
  Chrome, không sửa gì khác)
- Mới: `docs/PHASE9_ROUND23_G6_FOOTAGE_RELEASE_REVIEW_LIMITS.md` (file này)
- Mới (file chạy): `benchmarks/results/clicktest-vertical-footage-r23.json`
  (kết quả lần chạy cuối 6/6 pass + log đầy đủ; parent quyết có stage
  hay không)

KHÔNG ĐỔI (cố tình, theo phân công luồng):

- Mọi file sản phẩm (`store.ts`, `Timeline.tsx`, `preview.tsx`,
  `projectRepo.ts`, `video-spec`, i18n, panel) — kể cả khi click-test
  phát hiện modal Media thiếu che timeline (đó là hành vi đúng, user
  phải tắt trước — harness đã xử lý bằng click thật, không cần sửa app).
- `apps/web/dist/` — chỉ đọc qua `vite preview`, không build lại.
- Không push, không tag/release, không ghi qua GitHub, không stage
  paths-loop, không sửa build-loop-log.md (parent gộp).
- Không cài dependency, không thêm Playwright, không đưa binary vào repo.

## 8. Nợ còn lại (không mạo nhận)

- **Kho phát hành dọc vẫn chỉ có 2 clip (R1, R2)** — đủ thay J/K/L
  về mặt "có clip dọc sạch", nhưng đa dạng còn mỏng (cả 2 đều NASA
  vũ trụ, R2 gần như tĩnh). Cần thêm clip dọc trung tính ngoài vũ trụ
  (thiên nhiên, đô thị, con người vô danh từ xa) nếu muốn kho mẫu
  dùng được cho nhiều template — đợt sau tìm tiếp, không hạ chuẩn.
- **Chưa có click-test phát dọc thật trên canvas preview** (byte mp4
  dọc giải mã trong trình duyệt): cần đường import/relink file qua UI
  hoặc serve file trong harness — xem §5.2.
- **Chưa cắt end card logo** khỏi R1 (và L nếu ai đó vẫn muốn dùng
  nội bộ): quyết định đóng gói, không thuộc luồng này.
- **Cổng NASA nhánh center vẫn yếu** (§1.3): đề xuất siết về chỉ
  nhánh photographer cho hạng phát hành ở đợt sau.
- **Ánh xạ ruler→giây chưa được đo tuyệt đối** (§5.1 lần 2): scrub
  chỉ được khẳng định theo hướng (tăng/giảm), chưa có bảng % rect →
  giây; cần đo pxPerSec/gutter nếu muốn assert số tuyệt đối.
- Clip J/K/L vẫn nằm ở `/tmp` (đo nội bộ được) nhưng /tmp là tmpfs
  512MB, không bền vững — ai cần đo lại thì chạy lại script R22
  (SHA256 đã ghi, tải xác định).

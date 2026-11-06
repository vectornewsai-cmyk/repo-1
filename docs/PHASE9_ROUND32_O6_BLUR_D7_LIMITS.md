# Phase 9 đợt 32, luồng O6 — Blur coverage + điều tra D7 autosave top-level style — LIMITS

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo, KHÔNG sửa
> file i18n, KHÔNG sửa preview.tsx hay seek.ts. Parent stage batch,
> không phải luồng này. Mọi claim dưới đây đều có test/số đo thật
> kèm theo; chỗ nào chưa đo thì ghi CHƯA ĐO, không suy diễn thành số.

## 0. Kết luận ngắn (đọc trước khi trích)

**D7 — ĐÃ ĐÓNG bằng fix + test khóa.** Nguyên nhân đã quy kết chắc
chắn cho một lớp code cụ thể: `loadAutosave()` trong
`apps/web/src/lib/projectRepo.ts` — không phải cổng load, không phải
chuẩn hóa K1, không phải lớp ghi autosave. Bằng chứng tách lớp (§2):
load chuẩn hóa đúng (pass), ghi autosave giữ style (pass), nhưng
file autosave bền vững sau `loadAutosave()` vẫn là seed cũ (FAIL
trước fix, PASS sau fix). Fix: `loadAutosave()` ghi lại spec đã
chuẩn hóa khi K1 thực sự sửa (`textStyleFixes.length > 0`).
Test khóa mới `textStyle32O6D7`: trước fix 4/6 (2 test lớp (3) fail),
sau fix **6/6**.

**Blur — KHÔNG có MAD app-vs-tham-chiếu mới, badge KHÔNG đổi.**
Luồng này là subagent nên không có live-browser delegation, vì vậy
không chạy được harness headed Chromium của M6 và không được bịa
MAD cho các ô p/mode/weights khác. Thay vào đó, luồng này giao:
(a) lưới kỳ vọng + phân tích độ nhạy/suy biến từng ô (để đợt
browser sau không đo ô vô nghĩa), (b) chứng minh kế hoạch blend
bằng đúng code sản phẩm, (c) lượng hóa sai số harness nếu tái dùng
kỳ vọng /3 của M6 cho weights không đều (số này là sai số giữa hai
kỳ vọng, KHÔNG phải MAD của app), và (d) đặc tả chạy browser đầy đủ
cho parent (§3.5). Mọi ô blur mới trong bảng §3 đều ghi CHƯA ĐO.

## 1. D7: truy vết từng lớp (không đoán)

M5 (đợt 30) đo trên browser thật: sau reload, `localStorage` vẫn
`topHasStyle=false` trong khi exception đã về 0. Điểm mấu chốt mà
M5 chưa tách: script M5 đọc **localStorage** (file autosave bền
vững), không đọc spec trong store. Vì vậy "autosave sau load không
gắn style" có thể là (i) load không gắn, (ii) ghi autosave làm mất,
hoặc (iii) không ai ghi lại sau load. Test khóa tách cả 3 lớp trên
cùng seed M5 (top-level `D7-TOP` không style + leaf nested
`leaf-text-d7` kiểu TEXT-BLOCKED-LEAF):

| Lớp | Probe | Trước fix | Kết luận |
|---|---|---|---|
| (1) Cổng load | `parseProjectText(seed)` → clip top-level có style? | PASS (style đầy đủ, `animation "none"`, `textStyleFixes ≥ 1`) | Cổng load + chuẩn hóa K1 **vô can** |
| (2) Ghi autosave | `autosaveNow(spec đã load)` → đọc lại localStorage thô, style còn? | PASS (`fontSize 64` giữ nguyên) | Lớp serialize/ghi **vô can** |
| (3) Autosave sau load | Seed localStorage → `loadAutosave()` → đọc LẠI localStorage thô, style có? | **FAIL** (top-level và leaf đều vẫn thiếu style) | **Đây là lớp lỗi** |

Cơ chế lớp (3), đối chiếu code thật:

- `App.tsx` lúc khôi phục (dòng ~182): `loadAutosave()` →
  `replaceProject(auto.spec)` → `markSaved(auto.spec)`. Không có
  `autosaveNow` nào ở đây.
- Subscribe autosave (`App.tsx` dòng ~221) chỉ chạy khi `s.spec !==
  prev.spec` **sau khi** effect đăng ký; effect khôi phục chạy trước
  effect đăng ký subscribe, nên lần replace đầu tiên không kích
  autosave (debounce 5s cũng không được lên lịch).
- Đường mở file (`ProjectMenu.onFile`) thì khác: `clearAutosave()` +
  `autosave(...)` sau mở nên file đó tự ghi lại spec đã chuẩn hóa
  sau 5s — vì vậy D7 chỉ lộ ở đường **khôi phục autosave**, không
  lộ ở đường mở file. Đây cũng là lý do K1 test pass mà M5 probe
  vẫn thấy `topHasStyle=false`: spec trong bộ nhớ đã đúng, chỉ file
  bền vững là cũ.
- Hệ quả thực tế trước fix (thấp nhưng thật): mỗi lần reload lại đọc
  seed cũ, lại chuẩn hóa lại, lại toast "Đã điền style…" — sửa không
  bao giờ bền vững nếu user đóng tab mà không sửa gì thêm (vì
  `markSaved` làm `isDirty` false nên không có gì nhắc lưu). Preview
  thì vẫn an toàn nhờ guard `drawTextClip` + chuẩn hóa trong bộ nhớ,
  nên D7 gốc (exception) đã hết — chỉ còn tính bền vững của sửa.

Không có lớp "autosave ghi đè": không tìm thấy đường nào ghi spec
chưa chuẩn hóa đè lên sau load (chỉ có `loadAutosave` là caller
duy nhất theo grep toàn repo ngoài chính `projectRepo.ts`; các
`autosaveNow` khác đều ghi spec từ store, vốn đã chuẩn hóa).

## 2. D7: fix + kiểm chứng

Fix duy nhất trong `apps/web/src/lib/projectRepo.ts`
(`loadAutosave`, sau `parseProjectText` thành công):

```ts
if ((res.textStyleFixes?.length ?? 0) > 0) autosaveNow(res.spec, res.name);
```

Lựa chọn lớp fix (ghi rõ để parent phản biện):

- Sửa ở `loadAutosave` thay vì `App.tsx` vì đây là choke point duy
  nhất của đường khôi phục, khóa được bằng test Node (App.tsx cần
  render React nên test Node không khóa được hành vi của nó), và
  tránh đụng `App.tsx` — file chung mà các luồng đợt 32 khác có thể
  đang sửa.
- Chỉ ghi khi K1 thực sự sửa: seed đã sạch thì `savedAt` gốc giữ
  nguyên (test "không ghi thừa" khóa điều này), nên lần khôi phục
  bình thường không bị ghi đè vô cớ.
- `autosaveNow` đã tự nuốt lỗi quota/storage nên lần ghi này không
  làm hỏng khôi phục nếu storage đầy.
- Không mở rộng sang motion migration: sửa motion ở cổng load cũng
  chịu cùng mẫu "không ghi lại sau khôi phục", nhưng đó là nợ ngoài
  phạm vi D7 (text style) — ghi ở §5, không lén sửa kèm.

Kiểm chứng:

- `textStyle32O6D7.test.ts`: trước fix **4 pass / 2 fail** (đúng 2
  test lớp (3)/(3b)), sau fix **6 pass / 0 fail**.
- Hồi quy: `textStyle27K1` 6/6, `projectRepo` 10/10,
  `projectRepoNested22` 7/7, `projectRepoRound26J5` 15/15,
  `transitionPreview` 31/31, `previewEngine` 14 test passed.
- `tsc --noEmit` (apps/web): **0 lỗi** sau khi sửa kiểu
  `res.textStyleFixes` (field này là optional trong `LoadResult`
  nên phải dùng `?.length ?? 0`; lần chạy tsc đầu báo đúng 1 lỗi này
  ở dòng fix, đã sửa xong mới xanh).
- `node --check` script đo blur mới: pass.
- Ngoại lệ hồi quy duy nhất, KHÔNG phải do luồng này:
  `saveToast31` 14/15 — test "blob: clip trong nested không được
  quét" fail vì code hiện tại **đã** quét blob trong nested (trả về
  1 item `inner`), trong khi test khóa kỳ vọng cũ là "không quét"
  (muốn `[]`). Test này không gọi `loadAutosave`/`autosaveNow`
  (grep 0 kết quả), và luồng này không đụng `findBlobWarningItems`
  hay bất kỳ hàm nào test đó dùng — nên đây là assertion stale do
  một thay đổi khác (quét nested) gây ra, không phải hồi quy của
  fix D7. Parent gộp quyết định cập nhật test đó hay revert hành vi
  quét; luồng này không tự sửa test của luồng khác.

## 3. Blur coverage

### 3.1 Vì sao chưa có MAD mới (trung thực về giới hạn subagent)

Harness M6 là click-test trên Chromium headed (Xvfb + CDP + ruler
click + seed autosave + video thật). Subagent không có live-browser
delegation nên không chạy được harness đó; chạy lại bằng
Chromium/Playwright qua exec sẽ là vận hành browser trực tiếp,
vượt quyền của luồng này. Vì vậy §3.2–§3.4 là công việc chuẩn bị
đo có số thật (không phải số MAD), và §3.5 là đặc tả để parent
chạy browser trong main chat.

### 3.2 Lưới kỳ vọng (trọng số N6) + độ nhạy từng ô

Alpha dip lấy từ nút hiệu chuẩn đợt 31 N6 (đọc trực tiếp
`FADE_DIP_KNOTS_A/B` từ `transitionPreview.ts`, nội suy tuyến tính
y hệt `fadeDipWeights`, khóa bằng 5 neo: `bAlpha(0,5)=0,3435`,
`bAlpha(0,12)=0`, `aAlpha(0,2)=0`, `aAlpha(0,1)=0,4497`,
`bAlpha(0,75)=0,7419` — khớp đúng số đã ghim đợt 31).

| Ô (thang M6: KHỚP = MAD ≤ 2 và ≥ 99% ≤ 8) | alpha | Kết quả browser | Ghi chú độ nhạy |
|---|---|---|---|
| FW-IN fadewhite p=0,25 | 0,0562 | CHƯA ĐO | YẾU: sai số blur bị nén >5×, chỉ làm ô phụ |
| FW-IN fadewhite p=0,5 | 0,3435 | CHƯA ĐO (M6 đã đo ở trọng số cũ: MAD 0,624/0,487 KHỚP) | Phân biệt được; cần đo lại với trọng số N6 |
| FW-IN fadewhite p=0,75 | 0,7419 | CHƯA ĐO | Phân biệt được, nhạy nhất họ IN |
| FW-IN fadeblack p=0,25 / 0,5 / 0,75 | 0,0562 / 0,3435 / 0,7419 | CHƯA ĐO | Như fadewhite; kỳ vọng qua `singleClipDipPixel(..., "black")`, không phải công thức trắng 255 của M6 |
| FW-IN fadegrays p=0,25 / 0,5 / 0,75 | 0,0562 / 0,3435 / 0,7419 | CHƯA ĐO | Kỳ vọng qua `singleClipDipPixel(..., "gray")` (mean kênh); không dùng công thức trắng |
| FW-OUT fadewhite p=0,1 | 0,4497 | CHƯA ĐO | Phân biệt được — đây là ô OUT đáng đo nhất |
| FW-OUT fadewhite p=0,15 | 0,1329 | CHƯA ĐO | YẾU (alpha < 0,2), ô phụ |
| FW-OUT fadewhite p=0,25 / 0,5 | 0 | CHƯA ĐO (và KHÔNG NÊN đo) | **SUY BIẾN**: `aAlpha=0` từ p=0,2 trở đi nên kỳ vọng = màu dip thuần, không phân biệt được blur đúng/sai — đo cũng chỉ ra MAD ≈ 0 giả tạo |
| FW-IN weights [2,1,1] / [1,1,2], frames 3 | 0,3435 (p=0,5) / 0,7419 (p=0,75) | CHƯA ĐO | Phải dùng kỳ vọng có trọng số (§3.4), không tái dùng /3 |
| Frames 2 [1,1] / frames 4 [1,1,1,1] / [3,1,1,1] | như trên theo p | CHƯA ĐO | Harness M6 chỉ scrub 2 bước trước target (đủ frames 3); frames 4 cần scrub thêm 1 bước (target−3/30) thì ring mới đủ bóng |

### 3.3 Kế hoạch blend = trung bình có trọng số (code sản phẩm thật)

Dùng CHÍNH `motionBlurBlendPlan` import từ `previewEngine.ts`
(không cài lại công thức): mô phỏng compositing alpha tuần tự
trên pixel tổng hợp so với tổng trọng số trực tiếp, sai số tối đa
~1,4×10⁻¹⁴ (sai số float, coi như bằng 0) ở mọi bộ weights:

| Weights | Chuẩn hóa | blendAlpha tuần tự |
|---|---|---|
| [1,1,1] | [1/3, 1/3, 1/3] | [1, 0,5, 0,3333] |
| [2,1,1] | [0,5, 0,25, 0,25] | [1, 0,3333, 0,25] |
| [1,1,2] | [0,25, 0,25, 0,5] | [1, 0,5, 0,5] |
| [1,1] frames 2 | [0,5, 0,5] | [1, 0,5] |
| [3,1,1,1] frames 4 | [0,5, 1/6, 1/6, 1/6] | [1, 0,25, 0,2, 0,1667] |
| [1,1,1,1] frames 4 | [1/4 × 4] | [1, 0,5, 0,3333, 0,25] |

Thứ tự weights đã xác nhận theo code: `weights[0]` = frame cũ nhất
trong cửa sổ, `weights[-1]` = frame hiện tại (plan duyệt snapshot
cũ → mới rồi mới tới current). Script đo dùng đúng thứ tự này;
harness browser sau phải giữ cùng thứ tự khi dựng kỳ vọng.

### 3.4 Sai số harness nếu tái dùng kỳ vọng /3 của M6 (KHÔNG phải MAD app)

`pageMeasureBlur` của M6 tính kỳ vọng = trung bình đều 3 frame rồi
dip trắng — đúng chỉ khi weights đều. Trên frame thật FFmpeg từ
đúng footage M6 (K19/K11, scale 270×480 để đo nhanh, vùng mẫu giữa
15%–85%, step 8 như M6; số này KHÔNG so trực tiếp được với MAD
full-res của M6), MAD **giữa kỳ vọng đều và kỳ vọng có trọng số**
(cùng dip trắng qua CHÍNH `singleClipDipPixel`) là:

| Footage / p (FW-IN trắng) | motionMean (thang này) | Bias [2,1,1] (MAD / le8) | Bias [1,1,2] (MAD / le8) |
|---|---|---|---|
| K19 p=0,5 | 10,04 | 1,15 / 100,00% | 0,58 / 100,00% |
| K19 p=0,75 | 1,32 | 0,33 / 100,00% | 0,16 / 100,00% |
| K11 p=0,5 | 4,49 | 0,51 / 99,90% | 0,26 / 100,00% |
| K11 p=0,75 | 3,00 | 0,74 / 98,81% | 0,37 / 100,00% |

Kiểm chứng nội bộ: ô [1,1,1] cho bias đúng 0,00 / 100% ở mọi hàng
(kỳ vọng đều so với chính nó) — pipeline không tự sinh sai số.
Đọc đúng: bias này là **phần MAD giả tạo** mà một lần chạy browser
tái dùng /3 sẽ cộng thêm vào MAD thật của app. Với K19 p=0,5
weights [2,1,1], bias 1,15 đã chiếm hơn nửa ngân sách KHỚP (MAD ≤
2) trước khi tính sai số thật của app — nên các ô weights không
đều **bắt buộc** dùng kỳ vọng có trọng số (trung bình theo
`motionBlurBlendPlan`, rồi `singleClipDipPixel` theo mode), không
được tái dùng /3. Bias phụ thuộc motion cục bộ của cửa sổ đo chứ
không chỉ alpha (K19 p=0,75 alpha lớn hơn nhưng motion nhỏ hơn nên
bias nhỏ hơn p=0,5) — vì vậy không ngoại suy một con số bias cho
mọi cửa sổ.

### 3.5 Đặc tả chạy browser cho parent (để đo các ô CHƯA ĐO ở §3.2)

1. Vá `pageMeasureBlur` trong script M6 (không viết harness mới
   chưa kiểm chứng): thêm tham số `weights` (chuẩn hóa theo
   `motionBlurBlendPlan`) và `mode`; kỳ vọng = trung bình có trọng
   số 3 frame control rồi `singleClipDipPixel(avg, alpha, mode)`
   (white/black/gray) thay cho công thức `/3` + trắng 255 hiện tại.
   Riêng fadeblack: kiểm tra lại đường nền đen của preview (dip đen
   ≡ nền đen) trước khi chốt kỳ vọng, vì M6 chỉ đo fadewhite.
2. `runCase`: FW-OUT dùng `alpha = aAlpha(pOut)` theo quy ước M6;
   chỉ đo OUT ở p=0,1 (và 0,15 làm ô phụ), bỏ các ô OUT p≥0,25 vì
   suy biến (§3.2).
3. Frames 4: scrub thêm `target−3/30` trước khi đo để ring đủ 3 bóng.
4. Chạy lại ô M6 gốc (FW-IN p=0,5 weights [1,1,1]) trên cùng bundle
   mới làm neo hồi quy trước khi đọc các ô mới — vì trọng số dip đã
   đổi ở đợt 31 N6 (bAlpha(0,5): 0,3466 cũ → 0,3435 mới), số M6 cũ
   không còn là baseline trực tiếp.
5. Badge motion-blur vẫn giữ `≈` (như M6 đã quyết): không đổi badge
   chỉ vì các ô mới, cho tới khi có MAD browser thật.

## 4. File đổi/thêm (đường dẫn tương đối từ repo root)

- Sửa: `apps/web/src/lib/projectRepo.ts` — `loadAutosave()` ghi lại
  spec đã chuẩn hóa khi `textStyleFixes.length > 0` (fix D7, §2).
- Sửa: `apps/web/tsconfig.json` — thêm test mới vào exclude (theo
  quy ước repo cho test Node trực tiếp).
- Mới: `apps/web/src/lib/textStyle32O6D7.test.ts` — test khóa D7
  (6 test: 2 lớp vô can + 2 test lớp lỗi + không ghi thừa + null).
- Mới: `server/render/src/measure_r32_o6_blur_coverage.js` — lưới
  kỳ vọng + chứng minh blend + đo sai số harness trên footage thật
  (chỉ đọc file TS sản phẩm + FFmpeg, không sửa code sản phẩm).
- Mới: `benchmarks/results/v32-o6-blur-coverage.json` — kết quả
  script trên (lưới, plan, bias; ghi rõ không chứa MAD app).
- Mới: `docs/PHASE9_ROUND32_O6_BLUR_D7_LIMITS.md` — file này.
- KHÔNG đụng: `preview.tsx`, `seek.ts`, mọi file i18n, mọi file của
  luồng khác. Không push, không binary (frame trung gian chỉ ở /tmp,
  script tự xóa; footage đọc từ `~/workspace/tmp-round30-m6/` ngoài
  repo, không copy vào repo).

## 5. Nợ còn lại (không mạo nhận)

1. **MAD browser thật cho các ô §3.2 vẫn CHƯA ĐO** — cần parent
   chạy theo đặc tả §3.5 trong main chat. Badge motion-blur giữ
   nguyên cho tới lúc đó.
2. **Kiểm chứng D7 đầu-cuối trên browser thật chưa làm:** fix đã
   khóa bằng test Node + đối chiếu đường code App, nhưng probe M5
   (đọc localStorage sau reload) cần chạy lại trên bundle mới để
   thấy `topHasStyle=true` ngoài đời thật, không chỉ trong test.
3. **Motion migration cũng chịu mẫu "không ghi lại sau khôi phục":**
   `migrateProjectMotion` ở cổng load sửa spec trong bộ nhớ nhưng
   file autosave bền vững vẫn cũ cho tới lần sửa tiếp theo — cùng
   họ với D7 nhưng ngoài phạm vi text-style của luồng này; nếu muốn
   đóng thì mở rộng điều kiện ghi lại trong `loadAutosave` sang
   "có sửa nào từ load" thay vì chỉ `textStyleFixes`, kèm test
   tương ứng (không làm lén trong luồng này).
4. **saveToast31 14/15 (stale assertion, §2):** parent gộp quyết
   định cập nhật test hay revert hành vi quét blob nested — ngoài
   phạm vi luồng này.
5. **Blur fadeblack/fadegrays chưa từng đo trên browser** (M6 chỉ đo
   fadewhite); kỳ vọng cho 2 mode này trong §3.2 lấy từ
   `singleClipDipPixel` nhưng đường nền/dip-behind của preview cho
   fadeblack cần đối chiếu lại trước khi chạy (§3.5 mục 1).
6. Safari / máy thật / dpr > 1 cho blur vẫn chưa đo (nợ đứng từ M6).

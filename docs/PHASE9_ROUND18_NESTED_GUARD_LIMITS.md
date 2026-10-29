# Phase 9 đợt 18 — Luồng nested guard: guard nguồn của cha cho updateNestedInnerClip tầng 1 (R5) — LIMITS

Ngày: 2026-10-28. Luồng nested guard trong đợt lớn round 18.
KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist.
KHÔNG tự tạo file stage paths-loop (parent gộp batch).

Đóng nợ đợt 17 (xem docs/PHASE9_ROUND17_N3_NESTED_SPEED_LIMITS.md §3):
- "updateNestedInnerClip (R5, tầng 1) không có guard nguồn của cha như
  hàm deep mới: thu ngắn lá duy nhất của một nested 1 tầng vẫn có thể
  làm lệch duration/trim của cha mà không bị chặn."

## 1. Việc đã làm

### 1a. Guard đặt trong store action, không đụng hàm thuần

Phạm vi cố tình hẹp: chỉ hàm `updateNestedInnerClip` trong
`apps/web/src/store.ts` (+ file test mới). KHÔNG sửa `nestUtils.ts`,
`NestedClipPanel.tsx`, hay render worker — tránh xung đột với các luồng
khác trong đợt 18.

Guard chạy TRƯỚC khi gọi hàm thuần R5, tính TRIỂN VỌNG từ patch (chưa
qua làm tròn 2 chữ số của hàm thuần): độ dài nguồn mới = clip kết thúc
muộn nhất trên MỌI track của subSpec cha, với clip đích thay bằng
`end = (patch.start ?? start cũ) + (patch.duration ?? duration cũ)`.
Ngữ nghĩa copy đúng hàm deep đợt 17 N3 (`updateNestedDeepInnerClip`,
cha ở đây là nested ngoài cùng vì R5 chỉ sửa clip con trực tiếp):

- Cha ghi trim tường minh: chỉ cấm khi `trim.out > nguồn mới + 1e-9`
  (nguồn dài thêm thì trim vẫn nằm trong nguồn, cha vẫn hợp lệ).
- Cha không ghi trim (= "phát toàn bộ", duration cha bằng đúng độ dài
  nguồn / speed): cấm khi `|nguồn mới − nguồn cũ| > 1e-9` — nguồn đổi
  theo hướng nào cũng lệch duration cha.
- Patch chỉ đổi text → end mới bằng end cũ → nguồn không đổi → luôn
  qua cả hai nhánh (không cần trường hợp riêng).
- Lookup thất bại (track/clip không có) → bỏ qua guard, để hàm thuần
  trả error như cũ; patch NaN → so sánh sai (NaN) nên cũng rơi về hàm
  thuần như cũ. Không đổi hành vi nào ngoài hai nhánh chặn trên.
- Bị chặn → trả `{ ok: false, curveDropped: 0 }` TRƯỚC `execCommand`
  nên spec không đổi và KHÔNG sinh entry undo (test G9 chứng minh:
  undo 1 lần sau lệnh bị chặn quay về trạng thái trước lệnh hợp lệ
  trước đó, không dừng ở entry no-op).

Ví dụ số (test qua store thật): cha trim [0,4), lá duy nhất [0,4)
thu còn 2 → chặn (nguồn mới 2 < trim.out 4); cùng cha đó nhưng track
khác vẫn end ở 4 → cho qua, lá còn 2. Cha không trim, lá sau [2,4)
thu còn 1 (end 3) → chặn (nguồn 4 → 3); dời lá ngắn 0 → 1 (end 3,
max vẫn 4 nhờ track khác) → cho qua.

### 1b. Test mới qua store thật

`apps/web/src/store.nestedGuard.test.ts` (9 case, bundle esbuild như
mẫu `.store.test.ts` đợt 16/17 — store.ts dùng import không đuôi mở
rộng mà chỉ Vite mới phân giải):

| Case | Kết quả |
|---|---|
| G1: trim [0,4), lá duy nhất 4→2 → chặn, spec không đổi; hàm thuần R5 vẫn cho qua (guard ở tầng store) | pass |
| G2: trim [0,4), lá 4→2 nhưng track khác end 4 → cho qua, validate rỗng | pass |
| G3: không trim, lá duy nhất 4→2 → chặn, spec không đổi | pass |
| G4: không trim, lá sau [2,4) thu còn 1 (end 3) → chặn | pass |
| G5: không trim, dời lá ngắn 0→1 (max vẫn 4) → cho qua, validate rỗng | pass |
| G6: trim [0,4), patch text-only → cho qua, text đổi | pass |
| G7: không trim, patch text-only → cho qua | pass |
| G8: trim [0,4), lá đầu [0,2) thu còn 1 (max vẫn 4) → cho qua, validate rỗng | pass |
| G9: sửa hợp lệ rồi sửa bị chặn, undo 1 lần quay về trước sửa hợp lệ | pass |

## 2. Kiểm chứng thật

| Kiểm chứng | Kết quả |
|---|---|
| Test mới `store.nestedGuard.test.ts` (esbuild bundle) | **9 pass, 0 fail** |
| Hồi quy `nestUtils.test.ts` (node trực tiếp) | 28 pass, 0 fail |
| Hồi quy `nestedSpeedcurve.test.ts` (đợt 14 R5) | 22 pass, 0 fail |
| Hồi quy `nestedDeep.test.ts` (đợt 15 T3) | 16 pass, 0 fail |
| Hồi quy `nestedStore.test.ts` (đợt 16 H2) | 11 pass, 0 fail |
| Hồi quy `nestedDeepSpeed.test.ts` (đợt 17 N3) | 16 pass, 0 fail |
| Hồi quy `nestedStore.store.test.ts` (đợt 16 H2, bundle) | 8 pass, 0 fail |
| Hồi quy `nestedDeepSpeed.store.test.ts` (đợt 17 N3, bundle) | 8 pass, 0 fail |
| Hồi quy `splitPatch.store.test.ts` (đợt 15 T4, bundle) | 12 pass, 0 fail |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** (file test mới viết sạch kiểu nên KHÔNG cần thêm vào exclude của tsconfig — khác với các file `.test.ts` trước; nếu đợt sau sửa test này mà tsc kêu thì mới cân nhắc thêm exclude theo quy ước cũ) |
| `vite build` (apps/web) | **pass** (built in 4.36s; chỉ warning chunk > 500kB có sẵn từ trước) |

## 3. Giới hạn trung thực — những gì CHƯA xong / chưa sạch

- **Hàm thuần R5 vẫn không có guard** (cố tình, theo phạm vi luồng):
  caller nào gọi trực tiếp `updateNestedInnerClip` từ `nestUtils.ts`
  vẫn sửa được lá phá bất biến cha. Guard chỉ bảo vệ đường đi qua
  store action — hiện là đường duy nhất của UI (NestedClipPanel).
  Muốn khóa triệt để thì đợt sau phải dời guard xuống hàm thuần (khi
  đó deep path chain rỗng và R5 sẽ chung một guard, đúng gợi ý cuối
  của N3) — nhưng đổi đó sẽ chạm file của luồng khác nên không làm
  trong đợt này.
- **Cha vốn đã invalid thì guard chặn cả patch text-only**: nếu trim.out
  của cha từ trước đã vượt độ dài nguồn (clip cha không qua
  validateNestedClip), thì nguồn mới (= nguồn cũ, patch text không đổi
  hình học) vẫn nhỏ hơn trim.out nên bị chặn. Đây là hành vi y hệt
  hàm deep N3 (cùng công thức so sánh), không phải lỗi riêng của luồng
  này — cách gỡ là sửa trim/duration của cha trước rồi sửa lại lá.
- **Over-block vi mô dưới 0.01s**: guard tính từ giá trị patch chưa
  làm tròn, còn hàm thuần R5 làm tròn start/duration về 2 chữ số.
  Thu ngắn 4 → 3.996s trên lá duy nhất không trim sẽ bị chặn dù kết
  quả sau làm tròn vẫn là 4.00. Chấp nhận được vì thay đổi cỡ đó
  không có ý nghĩa trên timeline; ngược lại, tính từ giá trị đã làm
  tròn sẽ có nguy cơ chặn sai patch text-only trên spec chưa làm tròn
  (xem §1a) nên hướng triển vọng là lựa chọn đúng.
- **Không có thông báo riêng cho user khi bị guard chặn**: store action
  vẫn giữ hợp đồng cũ chỉ trả `{ ok }` (không có chuỗi error), nên
  NestedClipPanel chỉ hiện thông báo lưu thất bại chung
  (`nested.innerSaveFail`), không nói rõ "nguồn cha co dưới trim.out"
  hay "sửa duration/trim của cha trước". Muốn thông báo riêng thì cần
  đổi hợp đồng trả về của action + sửa panel — thuộc luồng UI, ngoài
  phạm vi luồng này.
- **Guard chỉ xét độ dài nguồn, không xét gì khác**: không kiểm tra
  speed của cha (không cần — speed cha không đổi trong patch lá nên
  nguồn đổi là duration lệch), không kiểm tra đè clip kề hay biên
  (hàm thuần R5 lo), không áp cho `splitNestedClip`/`trimNestedClip`
  hay `patchClip` đổi duration/trim của cha, và không thay đổi guard
  đã có của action deep (chain rỗng của deep vẫn là đường riêng).
- **Chưa đo ở tầng render**: guard là logic store thuần + test store;
  không có render MP4 mới vì không đụng render pipeline — tính đúng
  đắn của bất biến duration/trim đã được khóa bằng validateNestedClip
  trong các case cho qua (G2/G5/G8) và bằng test render của N3 cho
  đường deep tương đương.
- `dist/` tái tạo bởi vite build là build artifact, KHÔNG đưa vào
  batch stage.

## 4. File đổi/thêm (để parent gộp batch — KHÔNG tự tạo file stage)

- `apps/web/src/store.ts`: guard nguồn của cha trong action
  `updateNestedInnerClip` (duy nhất hàm này được sửa trong file).
- `apps/web/src/store.nestedGuard.test.ts`: test mới qua store thật
  (9 case).
- `docs/PHASE9_ROUND18_NESTED_GUARD_LIMITS.md`: file này.

KHÔNG ĐỔI (cố tình):
- `apps/web/src/components/nested/nestUtils.ts`,
  `apps/web/src/components/nested/NestedClipPanel.tsx`, render worker,
  `apps/web/tsconfig.json`, file stage trong
  `~/workspace/repo-1-push/paths-loop/` và `build-loop-log.md` (parent
  gộp/log).
- Không push, không tag/release, không ghi qua GitHub.

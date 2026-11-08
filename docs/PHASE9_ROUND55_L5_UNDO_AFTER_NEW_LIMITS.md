# PHASE 9 — Đợt 55, luồng L5: LIMITS (undo sau "Dự án mới")

> Ngày: 2026-11-07. Luồng L5. Repo làm việc local `~/workspace/repo-1`.
> KHÔNG push, KHÔNG release/tag.
> Nợ gốc: M10/M12–M15 từ đợt 54 K4 §3 — M9 reset clip về 0 (PASS),
> M10 undo không khôi phục (clip vẫn 0) → M12–M15 không có clip để
> thao tác. Nợ này nay ĐÃ ĐÓNG (xem §2).

## 1. Nguyên nhân gốc (đã xác minh bằng test đỏ-trước)

`store.ts` `newProject()` gọi `clearHistory()` → `CommandStack.clear()`
xoá sạch undo stack → `undoDepth = 0`, `undo()` là no-op. Không liên
quan dialog discard-confirm / D1, và cũng không liên quan `isDirty` /
`markSaved`: action `undo()` không hề đọc cờ dirty (đã kiểm tra code —
giả thuyết "undo bị chặn bởi isDirty" trong task là SAI, ghi lại để
khỏi điều tra lại).

Các đường gọi `newProject()` trong sản phẩm: menu Tệp → Dự án mới
(`ProjectMenu.tsx:97`, qua `desktop.ts:276`), WelcomeModal
(`WelcomeModal.tsx:103`), và `openProjectFlow.ts:156` (mở archive —
đường này gọi tiếp `replaceProject()` nên entry chuyển đổi bị xoá
ngay, xem §3.2).

## 2. Đã sửa gì

### 2.1 `apps/web/src/lib/commands.ts` — `CommandStack.resetWithTransition()`

Phương thức mới: xoá toàn bộ history cũ rồi push đúng 1 entry
`before → after` (label, selection trước/sau). Undo 1 lần khôi phục
project trước đó; undo lần 2 không còn gì (không undo xuyên qua nhiều
project — giữ quy ước cũ của `clear()`); redo quay lại spec mới.

### 2.2 `apps/web/src/store.ts` — `newProject()`

Chụp `spec` + `selection` TRƯỚC khi đổi, rồi:

- Spec cũ còn clip → `history.resetWithTransition("Dự án mới",
  prevSpec, nextSpec, prevSelection, [])` (undo khôi phục đúng project
  cũ: đủ clip + timeline + selection; redo về project trống).
- Spec cũ đã trống (không clip) → `clearHistory()` như cũ để nút Undo
  không bật vì một entry rỗng.

`replaceProject()` (mở file) và `loadSample()` vẫn `clearHistory()` —
KHÔNG đổi (xem nợ mở §4). Comment ở `clearHistory()` và doc của
`newProject` đã cập nhật theo hành vi mới.

### 2.3 Test cũ khóa hành vi cũ — ĐỔI CÓ CHỦ ĐÍCH

`apps/web/src/desktopMenuActions53J2.test.ts` có U13 khóa hành vi cũ
("undo sau new-project KHÔNG khôi phục project cũ (clearHistory)").
Hành vi đó chính là bug mà đợt này được lệnh sửa (task L5: "sau
new-project, undo 1 lần khôi phục đúng project trước đó"), nên U13
được cập nhật thành khóa hành vi MỚI: undo → 3 clip, redo → 0 clip.
Đây không phải "sửa test để né bug" — test cũ khẳng định thiết kế đã
bị bãi bỏ, và test mới `store.undoAfterNew55L5.test.ts` đã chứng minh
bug đỏ-trước trên code chưa sửa (xem §3.1).

Hai chỗ khác trong cùng file test cũng phải thích ứng (giữ nguyên ý
định của case, không đổi kỳ vọng):

- `reset()`: gọi `newProject()` 2 lần thay vì 1 — lần 1 từ sample có
  clip để lại entry chuyển đổi, lần 2 trên project đã trống thì clear
  thường → history thật sự rỗng rồi mới đặt sample. Không làm vậy thì
  entry stale (before = spec trước reset) còn nằm trong stack và một
  lần undo muộn có thể nhảy về spec trước reset.
- U7 ("undo khi history rỗng"): `newProject()` 2 lần sau `reset()`
  để có 0 clip + history thật rỗng, rồi undo/redo vẫn no-op như cũ.

## 3. Kết quả đo (số thật)

### 3.1 Test mới `store.undoAfterNew55L5.test.ts` — 10/10 PASS

Chạy bằng esbuild bundle + `node` (mẫu như `store.nestedGuard`):
`node_modules/.bin/esbuild apps/web/src/store.undoAfterNew55L5.test.ts
--bundle --platform=node --format=cjs
--outfile=/tmp/store.undoAfterNew55L5.test.cjs && node ...`

RED-BEFORE (ghi lại trên code chưa sửa): 2 pass / 8 fail — U1a
(`undoDepth` sau newProject nhận 0, muốn 1), U1b/U1c, U2a/U2b/U2c,
U3, U5 đều fail đúng như bug mô tả; U4/U6 pass cả trước lẫn sau.
Sau sửa: **10 pass / 0 fail** (chạy lại lần cuối trên cây hiện tại
sau mọi sửa: 10/10).

| Case | Nội dung |
|---|---|
| U1a–U1c | newProject → clip 0, undoDepth 1, label "Dự án mới" → undo khôi phục đủ 3 clip + tên + selection → redo về 0 clip |
| U2a–U2c | Trên clip đã khôi phục: copy→paste 3→4, duplicate 4→5, delete 5→4 (nợ M12–M15 ở tầng store) |
| U3 | newProject trên project trống → undoDepth 0, undo no-op |
| U4 | newProject 2 lần → undo chỉ về project ngay trước đó, undo lần 2 no-op |
| U5 | Thêm chữ rồi newProject → undo khôi phục cả clip vừa thêm |
| U6 | `replaceProject` vẫn xoá history (nợ mở, khóa bằng test) |

### 3.2 Suite liên quan chạy lại — đều xanh

| Suite | Kết quả |
|---|---|
| `desktopMenuActions53J2.test.ts` (đã cập nhật U7/U13/reset) | ALL PASS (trước cập nhật: 2 FAILURES — U7 + U13 khóa hành vi cũ) |
| `store.nestedGuard.test.ts` | 9 pass, 0 fail |
| `store.loadSampleDirty54K2.test.ts` | 3 pass, 0 fail |
| `store.nestedCurve21T4.test.ts` | 11 pass, 0 fail |
| `lib/clipboard.test.ts` | 18 pass, 0 fail |
| `lib/projectHistory.test.ts` | 15 pass, 0 fail |
| `desktopSaveAs53J4.test.ts` | ALL PASS |

### 3.3 `tsc` + `vite build` apps/web

- `tsc --noEmit`: **0 lỗi** (chạy lần cuối trên cây hiện tại sau mọi
  sửa). Lưu ý: lần chạy đầu báo 1 lỗi `TS6192` ở
  `lib/gopRangeFetch39T3.ts:161` — đó là lúc một luồng song song khác
  đang sửa file đó giữa chừng (mtime 02:45:21 trong lúc tsc chạy);
  chạy lại sau đó thì 0 lỗi. File đó KHÔNG phải của luồng này, không
  chạm vào.
- `vite build`: **pass** (227 modules, `✓ built in 20.37s` ở lần chạy
  cuối; cảnh báo chunk > 500 kB có sẵn từ trước).

### 3.4 Kiểm chứng headed thật (Xvfb :155, dev-electron + vite dev :5173)

Lệnh (xem bằng chứng §5): `VCUT_DESKTOP_DEV=1 node
apps/desktop/scripts/click-test-menu.mjs --binary
…/h9/r54k4/electron-dev.sh --only menu --display 155 --cdp-port 9355
--out …/h9/r55l5-verify --userdata /tmp/h9-r55l5-userdata --testdir
/tmp/h9-r55l5-test`. Vite dev chạy riêng (`--host 127.0.0.1`, 200 OK
trước khi launch; lần đầu vite chỉ bind `[::1]` nên curl 127.0.0.1
trả 000 — đã khởi động lại với `--host 127.0.0.1`).

Kết quả toàn lượt menu: **18 passed / 12 failed**. Nợ M10/M12–M15
nay PASS trên app thật:

| Case | Kết quả |
|---|---|
| M9 Dự án mới | PASS — clips 3 → 0 |
| **M10 Hoàn tác sau Dự án mới** | **PASS — clips về lại 3, labels đúng ["mau-1.webm", "mau-2.webm", "Xin chào! Đây là VCut Studio"]** |
| M11 Làm lại | PASS — clips về 0 |
| M12 Chọn tất cả + Xóa | PASS — 3 → 0, undo về 3 |
| M13 Sao chép + Dán | PASS — 3 → 6 |
| M14 Cắt | PASS — 3 → 0 |
| M15 Nhân bản | PASS — 3 → 6 |

12 FAIL còn lại đều là nợ cũ đã ghi ở K4 §4, KHÔNG do đợt này:
M4/M5 (gõ GTK, nợ J1), M8 (zombie window che menu bar), M18–M26
(fullscreen/ngôn ngữ/DevTools/thu nhỏ/Giới thiệu/Phím tắt/Báo lỗi/
Tài liệu/Thoát — cửa sổ/role, giới hạn Xvfb không WM). Dọn dẹp sau
lượt chạy: vite :5173 + Xvfb :155 + electron đã tắt, cổng 5173/9355
trống (đã kiểm tra).

## 4. Nợ mở / edge case chưa xử lý

- **Undo KHÔNG khôi phục media bin.** Entry history chỉ lưu spec +
  selection; `newProject()` vẫn xoá `media: []`. Sau undo, clip
  khôi phục nhưng media item đã mất (clip trỏ `src` cũ sẽ báo thiếu
  nếu user phát/xuất mà không import lại). Muốn khôi phục cả media
  phải mở rộng `HistoryEntry` mang snapshot media — thay đổi kiến
  trúc CommandStack, ngoài phạm vi đợt này. Harness M10–M15 chỉ đếm
  clip nên vẫn pass; đây là giới hạn thật cần nói rõ.
- **Undo sau mở file (`replaceProject`) vẫn không khôi phục** (U6
  khóa bằng test). Muốn có thì áp cùng mẫu `resetWithTransition`
  cho `replaceProject`/`loadSample` — nhưng mở file còn đổi cả
  `currentPath`/recent/autosave nên cần suy nghĩ thêm, để đợt sau.
- **Undo nhiều lần qua nhiều lần new-project:** chỉ lùi được 1 bước
  (về project ngay trước lần new gần nhất); undo tiếp là no-op. Đây
  là thiết kế có chủ đích (giữ quy ước "không undo xuyên qua nhiều
  project"), không phải bug sót.
- **Undo sau load file / sau template / sau autosave-restore:** chưa
  xử lý (cùng nhóm với `replaceProject` ở trên).
- **Playhead không được khôi phục theo undo** (undo chỉ trả spec +
  selection — hành vi chung của mọi undo, không riêng new-project).

## 5. File đã chạm + bằng chứng

- `apps/web/src/lib/commands.ts` — thêm `resetWithTransition()`.
- `apps/web/src/store.ts` — `newProject()` ghi entry chuyển đổi +
  comment/doc cập nhật. (Lưu ý cho parent khi gộp: không thấy marker
  đợt 55 của luồng khác trong file này; số dòng 3145 → 3169 khớp
  đúng phần thêm của luồng này.)
- `apps/web/src/store.undoAfterNew55L5.test.ts` — mới, 10 case.
- `apps/web/src/desktopMenuActions53J2.test.ts` — cập nhật U7/U13 +
  `reset()` (xem §2.3).
- `docs/PHASE9_ROUND55_L5_UNDO_AFTER_NEW_LIMITS.md` — file này.
- KHÔNG sửa `ProjectMenu.tsx`/`TopBar.tsx` (của L1), không sửa
  `vi.json`/`en.json` (của L1). Không push, không release/tag.
- Bằng chứng (không stage, chỉ để trong hidden_files):
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l5/` —
  `h9-report-menu-r55l5.json` (18/12), `harness-menu-r55l5.log`,
  `unit-store-undoAfterNew55L5.log` (10/10),
  `unit-desktopMenuActions53J2.log` (ALL PASS).
- File paths đã stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round55-l5-undo-after-new.txt`
  (5 entry, NUL-delimited, chỉ text — xem §6).

## 6. Stage (KHÔNG push)

Batch `phase9-round55-l5-undo-after-new.txt`, 5 file text:

1. `apps/web/src/lib/commands.ts`
2. `apps/web/src/store.ts`
3. `apps/web/src/store.undoAfterNew55L5.test.ts`
4. `apps/web/src/desktopMenuActions53J2.test.ts`
5. `docs/PHASE9_ROUND55_L5_UNDO_AFTER_NEW_LIMITS.md`

Không có binary. Đã verify bằng read-back (xem file paths).

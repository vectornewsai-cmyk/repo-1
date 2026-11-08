# Phase 9 đợt 58 — TỔNG HỢP GỘP (LIMITS)

Ngày: 2026-11-07. Parent gộp đợt 58 (8 luồng O1–O8) + wiring + kiểm chứng
lại trên cây đã gộp. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết quả gộp dict — số thật

- Trước gộp: `vi.json` == `en.json` == **1937 key lá** (đếm thật bằng script).
- Đã gộp fragment O3 (4 key `preview.nestedSkipped*` /
  `preview.effectSkipped*`) + O5 (1 key `captions.translatedTrack`).
- Sau gộp: `vi.json` == `en.json` == **1942 key lá** (1937 + 5; vi/en cùng
  tập key, placeholder `{n}`/`{first}`/`{code}` khớp toàn bộ). Script gộp
  `/tmp/merge58.py`: deep-merge, cấm ghi đè key cũ — đã verify sau ghi.
- Snapshot test khóa số key: 8 file assert đã sửa `1937` → `1942` (giữ
  dòng lịch sử đợt 57, thêm dòng đợt 58); 4 file chỉ comment đã cập nhật
  mốc. Không còn assert nào khóa 1937 trong `apps/web/src` (chỉ còn dòng
  lịch sử "gộp lên 1937").

## 1. Sửa assert M2 lỗi thời hậu-gộp (parent, ở bước gộp)

- `i18nAudit56M2.test.ts` đỏ 1/14 từ trước đợt (O7/O8 đều ghi nhận, không
  do luồng nào gây ra): assert "fragment không trùng key cũ" lỗi thời vì
  fragment M2 (156 key) đã gộp hết vào dict từ đợt 56 — kiểm chứng: cả
  156 key đều đã có trong vi.json/en.json với giá trị đúng từng chữ
  fragment.
- Đã đổi sang ngữ nghĩa post-merge (mẫu N4 đợt 57 §4): key fragment đã có
  trong dict phải khớp đúng giá trị fragment (khóa tính trung thực của lần
  gộp), thay vì assert không trùng. Test nay **14/14 pass**.

## 2. Đối chiếu đĩa (baseline round58-baseline.sha256)

- Hợp 8 batch luồng = **77 file duy nhất**, khớp chính xác 77 file
  đổi/mới trên đĩa so với baseline (60 file đổi + 17 file mới): 0 file lạ,
  0 file thiếu, không binary/dist/`__pycache__`.
- File chung nguyên vẹn: `tsconfig.json` đủ cả 3 dòng exclude mới
  (O1 welcomeEscape58O1, O4 modalCard58O4, O6 gopTrialDecode58O6);
  `vi.json`/`en.json` chỉ đổi do gộp fragment của parent (O3 đã khôi phục
  đúng 1937 key sau lần merge tạm để đo headed — verify sha256 trước khi
  parent gộp); `store.ts` đủ hunk O2? — không, O2 chỉ sửa `sample.ts`.
- Lỗi tsc thoáng qua mà O2 thấy ở file test O3/O6 giữa đợt đã hết ở bước
  gộp (tsc cuối = 0).

## 3. Kiểm chứng lại trên cây đã gộp (số thật, parent chạy lại độc lập)

- `tsc` apps/web: **0 lỗi**; `tsc` apps/desktop: **0 lỗi**;
  `vite build` apps/web: **pass, 6.83s** (cảnh báo chunk >500kB có sẵn).
- Test mới 8 luồng (chạy lại bằng esbuild bundle + node; lưu ý cách chạy:
  file có top-level await — gopTrialDecode58O6, rehydrate36S5 — phải bundle
  `--format=esm` + outfile `.mjs`, bundle cjs gãy):
  O1 9/9, O2 rehydrate 27/27, O3 13/13, O4 24/24, O5 12/12, O6 18/18,
  O7 7/7, O8 L2 20/20, M2 14/14 (sau sửa post-merge).
- Hồi quy: nestedPreview 46, subtitles 14/14, projectRepo 10/10,
  GOP M10 28/28, L8 23/23, I6 25/25, T3 10/10,
  snapshot ở mốc 1942 (D4 3/3, B6 8/8, Z6 10/10, E2 3/3, L1 6/6,
  saveToast31 15/15, structuredNotes32 12/12, N4 14/14), M5 21/21.
- KHÔNG chạy lại ở bước gộp: mọi phép đo browser headed/FPS của các luồng
  (O1 Escape 3/3, O2 reload 5/5, O3 badge headed, O4 modal 4/4, O6 decode
  headed) — đó là số đo của luồng, đã đối chiếu LIMITS + bằng chứng trên đĩa.

## 4. Tóm tắt từng luồng (số đã kiểm chứng lại)

| Luồng | Việc | Test chạy lại |
|---|---|---|
| O1 | Escape đóng WelcomeModal (keydown tự chứa, đúng đường đóng của nút "Để sau") | 9/9 + headed 3/3 (luồng) |
| O2 | Reload sạch KHÔNG tái hiện mất media mẫu (bin trống là đúng thiết kế rehydrate theo spec); bug thật kề bên: media mẫu thiếu `file` trong phiên đầu → export bị chặn tới khi reload — đã sửa 1 dòng `sample.ts` | rehydrate 27/27 + headed 5/5 (luồng) |
| O3 | Badge thường trực dưới preview + toast cho `flat.skipped`/`skippedReasons` (4 key mới) | 13/13 + headed PASS (luồng) |
| O4 | BeatSyncModal + SceneModal đổi `modal-card` → `modal` đã định nghĩa (mẫu N1) | 24/24 + headed 4/4 (luồng) |
| O5 | Recognition track phụ đề khớp cả hai tiền tố "Phụ đề"/"Subtitles"; key `captions.translatedTrack` | 12/12 |
| O6 | Timeout trial-decode scale theo kích thước (0,3 ms/KiB trên 256 KiB, trần 2500 ms); keyframe 4K nhiễu 4,1 MiB decode-ok 662,7 ms thay vì fail-open | 18/18 |
| O7 | `webglLut.test.ts` chạy được: bỏ `import.meta.url`, resolve từ `process.cwd()` | 7/7 |
| O8 | Thống nhất chính tả Hủy → Huỷ: 141 occurrence / 50 file (9 chuỗi UI + 132 nội bộ) | L2 20/20 |

## 5. Đính chính / lưu ý gộp

- O2 đính chính quan sát N9: bin trống sau reload KHÔNG phải bug rehydrate
  mà là autosave mang spec đã xóa clip — dữ liệu không mất (manifest
  IndexedDB vẫn đủ). Nợ thiết kế còn lại: media import rồi xóa hết clip
  khỏi timeline cũng biến mất khỏi bin sau reload (cần quyết định đổi
  thiết kế rehydrate mới giữ được).
- O1 ghi tsconfig 146 entry, O4 ghi 145 — chỉ là thứ tự ghi: cuối đợt đủ
  cả 3 dòng exclude mới, không mất dòng nào.
- O8: 7 occurrence giữ nguyên có chủ đích ("nguyên thủy" đúng chính tả +
  6 assertion phủ định trong L2). Bản copy build (`release/*`, `dist-web/`)
  còn "Hủy" cũ — tái sinh khi build/packaging, không sửa tay.
- O3: badge `whiteSpace: nowrap` có sẵn từ J1 — text gộp dài có thể tràn
  trên preview hẹp (title hover vẫn đọc đủ).
- O6: keyframe thật bị zero 1 MiB giữa vẫn decode OK — trial-decode không
  bắt được lớp này; timeout mới 1327 ms có thể không đủ verdict → fail-open.

## 6. Nợ mở (cho đợt 59)

1. **O2:** thiết kế bin theo spec (media import rồi xóa hết clip → biến
   mất khỏi bin sau reload); toast "đã điền style mặc định cho 1 text
   clip…" lặp lại mỗi lần reload (chưa điều tra).
2. **O1:** TourCard / TemplatePackModal / TemplatePicker cũng chưa đóng
   bằng Escape — cần thống nhất pattern cho 3 modal này.
3. **O3:** `skippedReasons` chỉ sinh khi có layer adjustment; chuỗi lý do
   effect không nêu tên type (key N4 `unknownEffectType` thiếu var
   `{type}`); đường vẽ từng frame vẫn chỉ console.warn.
4. **O4:** còn class chưa định nghĩa khác: `caption-modal`
   (CaptionModal), `modal-x`/`modal-label`/`modal-hint`/`modal-err`
   (SilenceModal); `<p className="error">` top-level của BeatSyncModal
   vẫn không có style.
5. **O5:** chưa click-test headed nhãn "Subtitles (EN)" + xuất SRT/VTT;
   false-positive track user tự đặt tên trùng tiền tố (giới hạn có sẵn).
6. **O6:** sample > 8 MiB stream-mode vẫn bỏ qua; chưa đo Safari/Firefox;
   keyframe zero-giữa vẫn lọt trial-decode.
7. **O7:** Node type-stripping vẫn không chạy được suite webglLut (cần
   `allowImportingTsExtensions` hoặc vitest).
8. **O8:** bản copy build còn "Hủy" cũ; docs lịch sử `PHASE9_ROUND5*.md`
   còn nhắc "Hủy" trong văn bản tường thuật (giữ nguyên như hồ sơ).
9. **Nợ cũ chưa đụng:** N6 hoán đổi delta stts vẫn lọt (quyết định giữ
   nguyên); N5 bản dịch EN template chưa qua người bản ngữ.

## 7. Stage (KHÔNG push)

Batch closing: `~/workspace/repo-1-push/paths-loop/phase9-round58-closing.txt`
(NUL-delimited, verify read-back, 14 entry):
dict đã gộp (vi.json, en.json); 11 file snapshot/comment đã cập nhật mốc
1942 (trừ `i18nAudit55L2.test.ts` — đã nằm trong batch O8, nội dung cuối
đi theo batch đó); `i18nAudit56M2.test.ts` (sửa post-merge của parent);
LIMITS tổng hợp này.

Tổng chờ push: **656 entry** = 561 (sau đợt 57) + 81 (đợt 58, 8 batch)
+ 14 (closing). Các đợt 1–50 đã push xong (HEAD e2cb35e1).

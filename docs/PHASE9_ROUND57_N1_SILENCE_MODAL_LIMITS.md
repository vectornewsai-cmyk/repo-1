# Phase 9 đợt 57, luồng N1 — SilenceModal tràn viewport: LIMITS

Sửa bug thật từ LIMITS đợt 56 §4.1 (b): SilenceModal tràn viewport — nút
Cancel/Analyze dưới fold, không thấy ở lần vẽ đầu. **Đã sửa + đo headed
trước/sau ở cả 2 viewport, PASS cả hai.**

## 1. Nguyên nhân gốc (đo thật trước sửa — tái hiện đúng 100% số đợt 56)

`SilenceModal.tsx` dùng class `modal-overlay` + `modal-card`, nhưng **cả hai
class đều không được định nghĩa ở bất cứ file CSS nào** (`styles.css`,
`mobile.css` đều không có). Kết quả: overlay/card là `position: static`,
`display: block`, nằm trong luồng tài liệu thường thay vì fixed + căn giữa:

| Đo trước sửa (bước config) | 1440×900 | 1280×720 |
|---|---|---|
| Viewport thực (headed Chromium) | 1439×699 | 1280×520 |
| Modal | 1439×391, top 394 → bottom 785 | 1280×391, top 394 → bottom 785 |
| Nút Huỷ / Phân tích | y 723–753, **dưới fold** | y 723–753, **dưới fold** |
| Verdict | FAIL | FAIL |

Ngoài ra `.modal-actions` nằm **trong** `.modal-body` ở cả 4 bước, nên kể cả
khi modal vừa viewport thì nút vẫn cuộn theo nội dung thay vì đứng yên.

## 2. Cách sửa (chỉ `apps/web/src/components/SilenceModal.tsx`)

1. `modal-overlay` → `modal-backdrop`, `modal-card` → `modal`: dùng class
   **đã định nghĩa sẵn** trong `styles.css` (cùng mẫu `CaptionModal.tsx`):
   `.modal-backdrop` fixed inset 0, flex căn giữa, z-index 100;
   `.modal` rộng 640px, `max-height: calc(100vh - 60px)`, flex column,
   `overflow: hidden`. **Không sửa `styles.css`, không thêm CSS mới.**
2. Đưa `.modal-actions` ra khỏi `.modal-body` thành con trực tiếp của
   `.modal` ở cả 4 bước (config / running / review / done) — footer nút
   luôn thấy, `.modal-body` (`overflow-y: auto`) cuộn nội bộ khi dài.
   Review step có `.silence-list` vốn đã `max-height: 300px` + cuộn riêng.
3. **Không đổi key i18n / literal:** vẫn đúng 25 key, 28 call site `t()`
   như trước sửa (test khóa bằng set-equality). Không sửa `vi.json`/`en.json`.

## 3. Đo headed SAU sửa (cùng harness, cùng 2 viewport)

Harness riêng đợt này (scratch, không stage): vite dev đóng băng (tắt HMR +
watcher, theo mẫu M9) + Chromium headed qua Xvfb display :161 + CDP Node
thuần. Mở modal thật qua nút TopBar "🔇 Cắt lặng" sau khi import WAV mẫu
3s (tone–im lặng–tone) qua store thật + `addMediaAtPlayhead`. Đo hình học
ở lần vẽ đầu, **không scroll, không click trong modal**.

| Đo sau sửa (bước config) | 1440×900 | 1280×720 |
|---|---|---|
| Viewport thực | 1439×699 | 1280×520 |
| Modal | 640×397, top 151 → bottom 548, **căn giữa** | 640×397, top 61 → bottom 459, **căn giữa** |
| Nút Huỷ bottom | 531 (< 699) | 442 (< 520) |
| Nút Phân tích bottom | 531 (< 699) | 442 (< 520) |
| `actionsInsideBody` | false | false |
| Verdict | **PASS** | **PASS** |

Bằng chứng (scratch, không stage): `~/scratch-round57-n1/n1-report-before-1440x900.json`,
`n1-report-before-1280x720.json`, `n1-report-after-1440x900.json`,
`n1-report-after-1280x720.json` + screenshot `n1-config-<tag>.png` tương ứng.
Harness: `~/scratch-round57-n1/clicktest-57n1-silence-modal.mjs`
(+ `vite.57n1.config.mjs` đóng băng, tái dùng pattern CDP của M9 đợt 56).

## 4. Test mới — `apps/web/src/lib/silenceModal57N1.test.ts`: PASS 11/11

Chạy: esbuild bundle `--format=cjs` (theo nhiệm vụ) rồi node —
`./node_modules/.bin/esbuild apps/web/src/lib/silenceModal57N1.test.ts
--bundle --platform=node --format=cjs
--outfile=/tmp/round57-n1/silenceModal57N1.test.cjs &&
node /tmp/round57-n1/silenceModal57N1.test.cjs` → `PASS (11/11)`.

**Phương pháp ghi rõ:** test TĨNH trên source (không render React — repo
không có jsdom trong devDeps, component kéo cả store/i18n nên không bundle
độc lập). Khóa 3 bất biến: (a) dùng class đã định nghĩa + hợp đồng CSS
(`.modal` flex column + `max-height: calc(100vh - 60px)`,
`.modal-backdrop` fixed + căn giữa, `.modal-body` `overflow-y: auto`);
(b) 4 footer `.modal-actions` nằm ngoài 4 `.modal-body`, là sibling kề sau,
mỗi footer còn đúng nút của bước đó; (c) đúng 25 key i18n / 28 call site.
Lưu ý: lần bundle đầu dùng `import.meta.url` đã rớt trên `--format=cjs`
(esbuild cảnh báo empty import-meta) — đã đổi sang resolver theo
`process.cwd()` (chạy từ gốc repo), giống mẫu `importProgress41W3` nhưng
không dùng `import.meta.url`.

## 5. Kiểm chứng khác

- `tsc --noEmit` (apps/web): **4 lỗi, tất cả ở
  `src/lib/gopTrialDecode57N10.test.ts`** (luồng N10 đợt 57 đang sửa dở:
  thiếu export `fetchSampleRemainderChunked`, import `.ts` không bật
  `allowImportingTsExtensions`, thiếu `fetchImpl`). **Không phải file của
  mình, không sửa** — ghi rõ theo nhiệm vụ. File của mình (SilenceModal +
  test mới): 0 lỗi.
- `vite build` (chạy trực tiếp, bỏ qua gate tsc vì lỗi của N10): **pass**,
  230 modules, built in 18.61s. Cảnh báo chunk > 500 kB đã có từ trước.
- `window.onerror` / unhandledrejection trong cả 4 lần đo headed: **0 lỗi**.

## 6. Chưa đo / nợ mở (trung thực)

1. **Bước review với danh sách khoảng lặng dài chưa đo headed** (cần bridge
   thật + `/api/silence` analyze — ngoài phạm vi bước config). Chỉ có lập
   luận cấu trúc: footer đã ra ngoài body + `.silence-list` vốn cuộn riêng
   ở 300px, nên nút Quay lại/Cắt không bị đẩy xuống dưới. Cần đo follow-up
   nếu muốn khóa hẳn.
2. **Bước done + bước running chưa đo headed** (cùng cấu trúc footer mới,
   cùng class `.modal` — suy ra từ cùng phép sửa, chưa có số đo riêng).
3. **Chưa đo ở locale EN** (đo ở vi mặc định; nút EN dài hơn chút
   "🔍 Analyze silence" nhưng modal 640px + footer flex-end vẫn còn dư chỗ
   — chưa có số đo, chỉ là suy luận).
4. **Chưa đo viewport mobile** (mobile.css đã có `.modal` riêng
   `max-height: calc(100dvh - 48px)` + backdrop `align-items: flex-end` —
   chưa kiểm chứng headed).
5. **`BeatSyncModal.tsx` và `SceneModal.tsx` cũng dùng `modal-card` chưa
   định nghĩa** (cùng lỗi latent, nhưng dùng `modal-backdrop` đúng cho
   overlay nên chỉ card là không có style). Ngoài phạm vi luồng này —
   không sửa, ghi lại để luồng sau xử lý nếu parent duyệt.

## 7. Batch đã stage (KHÔNG push)

File paths NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round57-n1-silence-modal.txt` —
3 file text:

- `apps/web/src/components/SilenceModal.tsx` (sha256-16 `0bf14cdac7a43997`)
- `apps/web/src/lib/silenceModal57N1.test.ts` (sha256-16 `15e10b1e593fd7f2`, mới)
- `docs/PHASE9_ROUND57_N1_SILENCE_MODAL_LIMITS.md` (mới — file này)

Không có binary. Harness + report JSON + screenshot chỉ nằm ở
`~/scratch-round57-n1/`, không stage. Không ghi build-loop-log (parent làm).

# Hướng dẫn thêm tay 5 workflow CI qua web GitHub

Ngày: 09/11/2026 (Phase 9 đợt 68, luồng V9 — docs).
Nguồn trạng thái: `docs/PHASE9_ROUND67_U9_CI_SECURITY_LIMITS.md` (U9 §1–§5),
`docs/PHASE9_ROUND66_T10_DOCS_CI_LIMITS.md`,
`docs/PHASE9_ROUND67_LIMITS.md` §7 (U8 bump), LIMITS luồng này
`docs/PHASE9_ROUND68_V9_DOCS_CI_LIMITS.md`.

## 0. Vì sao phải thêm tay

Cả 5 file workflow tồn tại local trong `.github/workflows/` nhưng **chưa bao
giờ lên được GitHub**: App Muse thiếu quyền `workflows:write`, GitHub trả
403 `Resource not accessible by integration` (từ Phase 6, verify lại lần cuối
08/11: `GET .github/workflows` → 404, actions runs `total_count: 0` — repo
hiện **không có lần chạy Actions nào**). Push từ main chat cũng không đẩy
được file `.github/workflows/*` (push #4 đã loại cả 5 file vì lý do này).

Cách duy nhất hiện tại: **user tự tạo file bằng tài khoản GitHub của mình
trên web** (không cần quyền App). Sau khi file đã lên bằng tay, các lần push
sau từ main chat sẽ KHÔNG đụng tới file workflow nữa (batch stage không bao
gồm `.github/workflows/*` trừ khi parent quyết riêng — nếu batch sau có chứa
file workflow thì cứ để file đó ở lại, nội dung trên GitHub đã là bản mới
nhất do user thêm tay).

## 1. Luồng thao tác chung (áp dụng cho cả 5 file)

Chuẩn bị: mở repo `vectornewsai-cmyk/repo-1` trên github.com, đang ở branch
`main`. Nội dung mỗi file lấy từ bản local
`~/workspace/repo-1/.github/workflows/<tên-file>` — **copy nguyên văn, không
sửa** (các file đã được rà soát: `ci-security.yml` khớp repo ở đợt 66 T10 +
đợt 67 U9; `ci-build.yml` đã sửa header stale ở đợt 68 V9 — xem §3).

Các bước (thành phần UI chuẩn của GitHub, tên nút có thể đổi nhẹ theo bản
cập nhật của GitHub):

1. Trên trang repo, bấm nút **Add file** (góc phải, trên danh sách file)
   → chọn **Create new file**.
2. Ở ô tên file, gõ đúng đường dẫn, ví dụ `.github/workflows/ci-build.yml`
   (gõ `.github/` rồi `/` — GitHub tự tạo thư mục; rồi `workflows/`, rồi tên
   file). Nếu GitHub hỏi tạo thư mục, xác nhận.
3. Dán toàn bộ nội dung file local vào ô soạn thảo. Kiểm tra lại dòng đầu
   file có đúng `name:` của workflow đó không (xem bảng §2).
4. Kéo xuống cuối trang, mục **Commit new file**: giữ nguyên
   "Commit directly to the `main` branch", sửa commit message nếu muốn
   (ví dụ: `Add CI Build workflow`), rồi bấm nút xanh **Commit new file**.
5. Kiểm tra: vào tab **Actions** của repo — lần chạy đầu tiên của workflow
   đó phải xuất hiện trong vòng 1–2 phút (trigger `push` trên `main`).
   Bấm vào lần chạy đó xem log từng job (xem §4 cách đọc kết quả lần đầu).
6. Nếu lần chạy không xuất hiện: kiểm tra lại tên file/đường dẫn (phải đúng
   `.github/workflows/<tên>`, không thừa/thiếu ký tự), rồi kiểm tra tab
   Actions có báo lỗi YAML không.

## 2. Bảng 5 file — thêm theo thứ tự nào, kỳ vọng lần chạy đầu ra sao

Thứ tự khuyên dùng: `ci-security` → `ci-build` → `ci-e2e` →
`ci-integration` → `release` (file `release.yml` thêm lúc nào cũng được —
nó chỉ chạy khi có tag, xem §3.5).

| # | File local | Tên workflow (`name:`) | Trigger | Lần chạy đầu kỳ vọng |
|---|---|---|---|---|
| 1 | `ci-security.yml` | CI Security (CVE scan) | push `main` | 🔴 `pip-audit` ĐỎ (tts 39 — xem §3.1); `npm-audit` lần đầu có số |
| 2 | `ci-build.yml` | CI Build | push `main` + PR | ✅ Xanh kỳ vọng (mcp-server đã sửa xong — xem §3.2) |
| 3 | `ci-e2e.yml` | CI E2E Smoke Test | push/PR (chỉ khi `apps/web/**` đổi) + chạy tay + Chủ nhật 02:00 UTC | ✅ Xanh kỳ vọng (smoke test) |
| 4 | `ci-integration.yml` | CI Integration (FFmpeg) | push `main` + PR | ✅ Xanh kỳ vọng (demo render + ffprobe) |
| 5 | `release.yml` | Release | push tag `v*` | ⏸️ Không chạy cho tới khi có tag — thêm file xong chưa có gì để xem |

## 3. Từng file — kiểm tra gì, điều gì sẽ đỏ

### 3.1 `ci-security.yml` — quét CVE (npm audit + pip-audit)

- **2 job:** `npm-audit` (5 step: checkout, setup Node, audit 3 lockfile —
  root, `mcp-server`, `cli`) và `pip-audit` (8 step: checkout, setup Python,
  audit 5 requirements — caption, tts, reframe, bgremove, tracking).
- **Lần chạy đầu sẽ ĐỎ ở job `pip-audit`** — đây là trạng thái đã biết trước,
  không phải lỗi cấu hình:
  - `tts` còn **39 advisory** (toàn bộ ở Pillow 12.3.0 transitive qua cây
    vieneu, fix 13.0.0). **Không bump được lúc này:** vieneu 3.8.3 requires
    gradio ≥5.49.1, mọi gradio 5.49.1→6.31.0 đều kẹp `pillow<13.0` nên
    `vieneu + Pillow 13` cho `ResolutionImpossible` (chứng minh bằng dry-run
    pip, đợt 67 U8). TTS giữ Pillow 12.3.0 tới khi gradio nới cap hoặc
    vieneu bỏ dep gradio.
  - `bgremove` **đã sạch (66 → 0)** sau bump đợt 67 U8 (rembg 2.0.60 →
    2.0.87, Pillow 10.2.0 → 13.0.0, venv rebuild Python 3.12; pip-audit
    sau bump: "No known vulnerabilities found", exit 0).
  - caption / reframe / tracking sạch từ đợt 66 T10.
  - Job được thiết kế fail khi có BẤT KỲ lỗ hổng nào (chặt hơn high/critical
    có chủ ý) — **không nới lỏng thành `continue-on-error` im lặng**.
- **Job `npm-audit` lần đầu có số CVE npm:** quét local trên VM luôn bị chặn
  (403 `policy_denied` ở endpoint npm audit, policy registry nội bộ — verify
  lại 08/11, lần thứ 3 liên tiếp kể từ 20/10; verify lại 09/11 đợt 70 X9,
  lần thứ 4). Đường vòng qua OSV API cũng chưa có số: đợt 69 W1 chạy bulk
  query 3 lockfile (490 name@version) 3 lần đều `ReadTimeout` 300 s ở
  `api.osv.dev:443`, tiến trình chết theo runtime restart — xem
  `hidden_files/round69-w1-osv-npm.txt`. CVE npm chưa có số mới kể từ
  audit 20/10. Chỉ đo được khi chạy trên runner GitHub.
- Muốn lần chạy đầu xanh: xong nợ bump TTS (chờ gradio/vieneu) → chạy lại
  `bash scripts/ci-local.sh` cho tới khi pip-audit 5/5 sạch → theo dõi log
  Actions (xem §4).

### 3.2 `ci-build.yml` — build + typecheck + unit test

- **1 job `build`, matrix Node 20 + 22** (2 lần chạy song song), trigger push
  `main` + PR, hủy run cũ cùng ref khi có push mới.
- **Kiểm tra:** `npm ci` root workspaces → build `apps/web` (tsc strict +
  vite) → typecheck `packages/video-spec` standalone → mirror catalog
  `.js ↔ .ts` (`--check`, mọi Node) + checker differential TS↔JS (chỉ
  Node 22, cần type stripping) → `npm ci` + build `mcp-server` (ngoài
  workspaces) → unit test: mọi file `*.test.mjs` / `*.test.js` trong repo
  bằng `node --test` (tìm bằng `find`, bỏ qua `node_modules`).
- **Cảnh báo "mcp-server build HIỆN ĐANG FAIL" trong header file đã STALE
  và đã sửa ở đợt 68 V9:** hai lỗi cũ (TS2835 import thiếu `.js`,
  TS2459 `Transition` không export) đều đã sửa ở nguồn — video-spec nay
  export bằng import có đuôi `.js`, `Transition` đã export
  (`packages/video-spec/src/index.ts:320`). Kiểm chứng thật 09/11:
  `cd mcp-server && npm run build` → tsc exit 0. **Step mcp-server kỳ vọng
  xanh ở lần chạy đầu; nếu nó đỏ lại thì đó là regression mới**, không phải
  lỗi cũ đã biết.
- **Lưu ý lần chạy đầu:** step unit test chạy MỌI file test trong repo nên
  lần đầu có thể lâu; fail ở step này là fail test thật, không phải lỗi cấu
  hình CI — đọc tên file test trong log để biết mảng nào hỏng.

### 3.3 `ci-e2e.yml` — Playwright smoke test UI

- **1 job `e2e`, Node 20, timeout 20 phút.** Trigger: push/PR **chỉ khi
  `apps/web/**` đổi** (path filter) + chạy tay (`workflow_dispatch`) +
  định kỳ **Chủ nhật 02:00 UTC (09:00 giờ Việt Nam)**.
- **Kiểm tra:** `npm ci` root + web → build web (tsc + vite) → cài
  Playwright + Chromium (`--with-deps`) → `npx playwright test` (smoke
  test `apps/web/e2e/smoke.spec.ts`, `apps/web/playwright.config.ts`).
- Đây là **smoke test UI, KHÔNG test render MP4 thật** (render MP4 thuộc
  `ci-integration.yml`). Artifacts: Playwright report (giữ 7 ngày, luôn
  upload), screenshot/video khi fail (giữ 14 ngày).
- **Lần chạy đầu kỳ vọng xanh.** Nếu đỏ ở bước cài Chromium thì đó là lỗi
  môi trường runner (log ghi rõ) — không phải lỗi code web.

### 3.4 `ci-integration.yml` — demo render FFmpeg + ffprobe

- **1 job `ffmpeg-integration`, timeout 30 phút.** Trigger push `main` + PR
  (không có path filter — chạy mọi lần push).
- **Kiểm tra:** xác minh ffmpeg/ffprobe + filter `lut3d` có trên runner →
  `bash assets/fetch_large_assets.sh` (tải 10 LUT từ cartcut, MIT, kiểm tra
  SHA256; file OGG Kenney không cần cho demo render) → chạy 6 demo của
  render worker (`demo_lut`, `demo_effects`, `demo_sticker`,
  `demo_chroma`, `demo_transitions`, `demo_textfx`) → verify từng MP4 bằng
  ffprobe (codec phải là h264, đủ thời lượng tối thiểu).
- **Lưu ý nhỏ (không cần sửa file):** comment trong workflow ghi "Effects:
  7 file `effect-*.mp4`" là số cũ (nay 16 video FX) — nhưng bước kiểm tra
  dùng glob `effect-*.mp4` nên bao hết mọi file, không sai kết quả.
- **Lần chạy đầu kỳ vọng xanh** (các demo đã chạy thật nhiều lần local).
  Nếu đỏ, đọc log xem demo nào fail / file MP4 nào thiếu — đó là lỗi render
  thật, không phải lỗi cấu hình CI.

### 3.5 `release.yml` — đóng gói release (chỉ chạy khi có tag)

- **1 job `release`. Trigger duy nhất: push tag dạng `v*`.** Thêm file này
  xong sẽ **không có lần chạy nào xuất hiện** cho tới khi có tag — đó là
  bình thường, không phải lỗi.
- **Guard:** tag phải khớp version trong `package.json` (`v0.1.0` ↔
  `"0.1.0"`) — hiện tại root `package.json` đang là `0.1.0`, nên tag đầu
  tiên (nếu có) sẽ là `v0.1.0`; sai thì fail ngay để không phát hành nhầm bản.
- **Kiểm tra:** build `apps/web` (tsc + vite), `mcp-server`, `cli` → đóng
  gói bằng `scripts/build-release.sh` →
  `release/vcut-studio-<version>-linux-<arch>.tar.gz` + `release/SHA256SUMS`
  (kèm `SHA256SUMS.packages` trong tarball) → upload làm workflow artifacts,
  giữ 90 ngày. **Workflow KHÔNG tự tạo GitHub Release / draft release**
  (cần quyền `contents:write` + quyết định phát hành của maintainer).
- ⛔ **RELEASE GATE — KHÔNG tạo tag:** chỉ release khi sản phẩm ngang hoặc
  hơn CapCut thật (user chốt 20/10). **Tuyệt đối không tạo tag `v*` chỉ để
  thử workflow này chạy** — tag là hành động phát hành, không phải thử nghiệm.
  Muốn kiểm chứng đường đóng gói mà không phát hành, chạy
  `bash scripts/build-release.sh` local (không cần tag).

## 4. Theo dõi log lần chạy đầu

1. Tab **Actions** → bấm vào lần chạy (tên workflow + commit) → bấm vào job
   (vd: `build (node 20)`, `pip-audit`, `e2e`) → xem log từng step, step đỏ
   có dấu ✗.
2. Đối chiếu với bảng §2: đỏ đúng chỗ đã dự báo (chỉ `pip-audit` ở
   `ci-security`) thì ghi nhận, không sửa workflow; đỏ ở chỗ khác thì đọc
   log — lỗi thật hay lỗi cấu hình sẽ ghi rõ trong output của step đó.
3. Sau khi sửa code (vd: xong nợ bump TTS), lần chạy CI mới tự trigger ở
   push tiếp theo lên `main` — không cần chạy tay lại workflow (trừ
   `ci-e2e` có nút **Run workflow** để chạy tay ngoài lịch).

## 5. Checklist xác nhận (đánh dấu khi xong)

- [ ] `ci-security.yml` đã lên GitHub (tab Actions có lần chạy "CI Security (CVE scan)")
- [ ] Job `pip-audit` đỏ đúng dự báo (chỉ tts 39; bgremove/caption/reframe/tracking sạch)
- [ ] Job `npm-audit` đã cho số CVE npm lần đầu (ghi số vào SECURITY.md §3.5 ở đợt docs sau)
- [ ] `ci-build.yml` đã lên GitHub, job `build` xanh cả Node 20 + 22 (đặc biệt step mcp-server)
- [ ] `ci-e2e.yml` đã lên GitHub, job `e2e` xanh (hoặc đã chạy tay 1 lần bằng Run workflow)
- [ ] `ci-integration.yml` đã lên GitHub, job `ffmpeg-integration` xanh (6 demo + ffprobe)
- [ ] `release.yml` đã lên GitHub (chưa có lần chạy nào — bình thường; KHÔNG tạo tag để thử)
- [ ] Sau khi đủ 5 file: các lần push sau từ main chat không còn đụng `.github/workflows/*`

## 6. Nợ mở / chưa kiểm chứng được

- Quyền App vẫn 403 (chưa thử lại bằng cách push — và sẽ không thử; cách
  duy nhất biết quyền đã đủ chưa là user thêm tay qua web theo hướng dẫn
  này, hoặc cấp quyền workflows cho App rồi thử push ở lần push sau từ main
  chat).
- `npm audit` local vẫn bị chặn 403 policy — CVE npm chỉ có số sau lần chạy
  `ci-security` đầu tiên trên GitHub.
- TTS 39 advisory tồn dư tới khi gradio nới cap `pillow<13` hoặc vieneu bỏ
  dep gradio (đợt 67 U8 đã chứng minh không bump được).
- Step `pip install pip-audit` trong `ci-security.yml` không pin version
  (ghi nhận từ đợt 66 T10 — quyết định của parent, không sửa trong đợt này).

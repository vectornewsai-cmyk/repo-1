# Đợt 121 T9 — Vite harness: mở rộng workaround ENOSPC (mirror L8) + kiểm kê

Ngày: 16/11/2026 (lượt cron 15:35 +07; làm 08:35–09:30Z). Máy đo: VM này (boot #60/#61, CPU-only, Chromium qua Xvfb).
Phạm vi: CHỈ sửa script harness/test (template vite config trong `apps/web/scripts/`). KHÔNG sửa production (`preview.tsx`, `media.ts`, `apps/web/vite.config.ts`), KHÔNG push, KHÔNG release/tag.
Nợ: LIMITS gộp đợt 120 §10 mục 2 (trần inotify) + docs/PHASE9_ROUND120_T8_G1_LIMITS.md §5 (mirror L8 cho E1/N10).

## 1. Kết luận ngắn

- **Kiểm kê xong toàn repo: 199 harness dùng vite dev.** Trong đó 174 dùng config riêng (`-c`): 30 đã mirror từ trước, **140 do T9 mirror mới**, 4 chỉ tiêu thụ config của harness khác. 25 harness dùng config production mặc định (không `-c`) — **KHÔNG mirror được bằng mẫu T8**, để lại làm nợ (§6). 35 file còn lại không chạy vite dev (chỉ `vite build` / `vite preview` / static server / launcher / lock script).
- **Mirror T9: 140/140 file, mỗi file đúng 1 dòng đổi** (`server: { hmr: false }` → `server: { hmr: false, watch: { ignored: ["**/**"] } }`), cùng mẫu T8 đợt 120. `node --check` 140/140 PASS. Trích template → import config thật: 140/140 cho `server.watch.ignored === ["**/**"]` và `hmr === false`.
- **Đối chứng môi trường (trước/sau mirror):** vite config thường CHẾT `ENOSPC` (errno -28, exit 1) ngay lúc boot; cùng config có mirror thì `VITE v6.4.5 ready in 1688 ms`, trả HTTP, 0 ENOSPC. Trần inotify vẫn đầy (headroom ~434–545, xem T8) — mirror là cách duy nhất chạy được vite dev lúc này.
- **Smoke sweep 140 file: 132 PASS** (vite lên, 0 ENOSPC). 7 file EXIT:2 do **thiếu fixture từ trước** (chưa tới được vite — không liên quan mirror). 1 file TIMEOUT ở mốc 60s nhưng log ghi rõ vite đã lên + lượt 1 chạy đầy đủ exit 0 (xem §5.3). **Vite lên thực tế: 133/140; 0 lỗi ENOSPC trong toàn bộ sweep.**
- **Đường đo không đổi (4 lần chạy đầy đủ, 1/form):** A 58o1 **3/3 pass** (= đợt 58); B 85m1 **D1 MAD 0,3835 khớp tuyệt đối** lịch sử M1/N10/F1; D 77e1-deint-fast **cả 8 mode MAD + gradient khớp tuyệt đối** bảng đợt 77; C 86n3 Chromium **VERDICT PASS** (gate bắn, canvas sáng 118,5 ≈ lịch sử 118–119). Tỉ lệ fps của 85m1 khác cửa sổ lịch sử vì chế độ máy khác (tải), không phải do mirror — xem §5.4.
- **Production không động:** `preview.tsx` md5 `5be5a250…`, `media.ts` md5 `2c384ed1…` — khớp đúng số T8 ghi. E1/N10 md5 khớp đúng note T8 (`9707f27b…` / `cfaf95aa…`).

## 2. Bối cảnh ENOSPC + đối chứng trước/sau

- Trần inotify đã đầy (T8 đo headroom 434–545 watch; vite thường cần ~1.578). Xu hướng rơi đều qua các boot (1511 → 545), reboot không hồi. Nâng trần cần can thiệp host — không làm được từ trong VM.
- Đối chứng trực tiếp lượt này (config viết tay ngoài repo, `/tmp/t9-headroom/`):
  - Config thường (`server: { hmr: false }`): `Error: ENOSPC: System limit for number of file watchers reached`, `errno: -28`, exit 1.
  - Cùng config + `watch: { ignored: ["**/**"] }`: `VITE v6.4.5 ready in 1688 ms`, trả HTTP, 0 ENOSPC trong log.
- Vì sao không đổi đường đo (lập lại luận chứng T8 §5.2): HMR đã tắt từ trước (`hmr: false`) nên `watch.ignored` không mất tính năng nào; probe không dựa vào file-watching (mount app một lần, đo canvas/fps); module phục vụ giống hệt nhau. Đây là workaround hạ tầng, không phải sửa phương pháp đo.

## 3. Mẫu mirror L8 (áp cho 140 file)

Một thay thế chuỗi duy nhất trong template config của mỗi harness (mỗi file đúng 1 lần xuất hiện `hmr: false }`):

```
hmr: false }
→ hmr: false, watch: { ignored: ["**/**"] } }
```

Áp cho cả 4 dạng template gặp trong repo (xem §4.1): A `plugins: [react()]`, B `plugins: [react(), mediaPlugin()]`, C `defineConfig({ server: { host, port, strictPort, hmr: false } })` (webkit), D `export default { server: { hmr: false }, plugins: [{ name: "…-media", configureServer… }] }`. Không thêm/xóa gì khác; diff mỗi file đúng 1 dòng (kiểm bằng diff với backup tại `hidden_files/round121-t9/backup/`).

## 4. Kiểm kê

Phương pháp: quét toàn repo (trừ `node_modules`, `dist`, `.git`, `__pycache__`) tìm file chứa vite dev — theo mẫu: template config (`hmr: false`), biến `VITE_CFG`/`viteCfg`, và mọi lệnh spawn vite dev (kiểm cả tên biến viết thường `viteBin`, cả `--configLoader`, cả spawn qua biến `viteArgs`). Script kiểm kê: `hidden_files/round121-t9/inventory.py` (+ `inventory.json`). Phân loại spawn dev có/không `-c` bằng parser mảng (không regex ẩu — lần quét đầu bằng regex đã khớp oan 102 file do `--configLoader … -c` đứng sau; đã sửa và đếm lại).

### 4.1 Harness dùng vite dev: 199 file

| Nhóm | Số | Ghi chú |
|---|---|---|
| Dùng config riêng (`-c`) | 174 | §4.2 |
| Dùng config production mặc định (không `-c`) | 25 | §6 — KHÔNG mirror được bằng mẫu T8 |
| **Tổng vite dev** | **199** | |

### 4.2 Nhóm dùng config riêng (`-c`): 174 file

| Nhóm | Số | Trạng thái |
|---|---|---|
| Đã mirror trước T9 (đợt 110–120) | 30 | không động vào (md5 E1/N10 khớp note T8) |
| **T9 mirror mới** | **140** | Form A 113 · B 15 · C 5 · D 7 (§4.3) |
| Chỉ tiêu thụ config của harness khác | 4 | thừa hưởng mirror từ harness viết config (§4.4) |

#### Đã mirror trước T9: 30 file

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs`
- `apps/web/scripts/clicktest-87o8-mask-track-headed.mjs`
- `apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs`
- `apps/web/scripts/probe-86n10-config-fps.mjs`
- `apps/web/scripts/probe110l3-frame-parity.mjs`
- `apps/web/scripts/probe110l4-frame-parity.mjs`
- `apps/web/scripts/probe111m1.mjs`
- `apps/web/scripts/probe111m3-frame-parity.mjs`
- `apps/web/scripts/probe111m7-frame-parity.mjs`
- `apps/web/scripts/probe112n1.mjs`
- `apps/web/scripts/probe112n3-frame-parity.mjs`
- `apps/web/scripts/probe112n5-frame-parity.mjs`
- `apps/web/scripts/probe113p1.mjs`
- `apps/web/scripts/probe113p3-frame-parity.mjs`
- `apps/web/scripts/probe113p5-frame-parity.mjs`
- `apps/web/scripts/probe114q1.mjs`
- `apps/web/scripts/probe114q2-frame-parity.mjs`
- `apps/web/scripts/probe114q3-frame-parity.mjs`
- `apps/web/scripts/probe115r1.mjs`
- `apps/web/scripts/probe115r2-frame-parity.mjs`
- `apps/web/scripts/probe115r3-frame-parity.mjs`
- `apps/web/scripts/probe116s1.mjs`
- `apps/web/scripts/probe116s2-frame-parity.mjs`
- `apps/web/scripts/probe116s3-frame-parity.mjs`
- `apps/web/scripts/probe117t2-frame-parity.mjs`
- `apps/web/scripts/probe117t3-frame-parity.mjs`
- `apps/web/scripts/probe118t2-storeheld-diag.mjs`
- `apps/web/scripts/probe118t3-frame-parity.mjs`
- `apps/web/scripts/probe119t1-h3f-ab.mjs`
- `apps/web/scripts/probe119t3-frame-parity.mjs`

#### T9 mirror mới: 140 file

##### Form A — `plugins: [react()]`, 113 file

- `apps/web/scripts/clicktest-58o1-welcome-escape.mjs` (dòng hmr: [161], 13269 B)
- `apps/web/scripts/clicktest-58o2-autosave-sample-reload.mjs` (dòng hmr: [303], 29045 B)
- `apps/web/scripts/clicktest-59p1-bin-persist-toast.mjs` (dòng hmr: [348], 37402 B)
- `apps/web/scripts/clicktest-59p2-escape-modals.mjs` (dòng hmr: [168], 19017 B)
- `apps/web/scripts/clicktest-59p5-captions-headed.mjs` (dòng hmr: [335], 32019 B)
- `apps/web/scripts/clicktest-59p8-enhance-presets.mjs` (dòng hmr: [264], 31524 B)
- `apps/web/scripts/clicktest-60q1-enhance-preview.mjs` (dòng hmr: [345], 33566 B)
- `apps/web/scripts/clicktest-60q10-escape-forms.mjs` (dòng hmr: [185], 21363 B)
- `apps/web/scripts/clicktest-60q3-caption-modal.mjs` (dòng hmr: [339], 29090 B)
- `apps/web/scripts/clicktest-60q7-idb-orphans.mjs` (dòng hmr: [312], 25507 B)
- `apps/web/scripts/clicktest-61r2-enhance-speedblock.mjs` (dòng hmr: [290], 28986 B)
- `apps/web/scripts/clicktest-61r3-combo.mjs` (dòng hmr: [498], 41865 B)
- `apps/web/scripts/clicktest-61r5-modal-headed.mjs` (dòng hmr: [464], 52559 B)
- `apps/web/scripts/clicktest-61r9-idb-cleanup-ui.mjs` (dòng hmr: [369], 31739 B)
- `apps/web/scripts/clicktest-62r1-fps-modal.mjs` (dòng hmr: [380], 35472 B)
- `apps/web/scripts/clicktest-62r10-headed-gaps.mjs` (dòng hmr: [508], 65548 B)
- `apps/web/scripts/clicktest-62r10-proxy-redo.mjs` (dòng hmr: [273], 29254 B)
- `apps/web/scripts/clicktest-62r2-speed-curve-stabblock.mjs` (dòng hmr: [303], 28089 B)
- `apps/web/scripts/clicktest-62r7-idb-xproject.mjs` (dòng hmr: [440], 46776 B)
- `apps/web/scripts/clicktest-63r1-modal-headed.mjs` (dòng hmr: [691], 82650 B)
- `apps/web/scripts/clicktest-63r7-project-id-2tab.mjs` (dòng hmr: [246], 23457 B)
- `apps/web/scripts/clicktest-64r6-project-name-registry.mjs` (dòng hmr: [266], 20980 B)
- `apps/web/scripts/clicktest-64r8-job-note-headed.mjs` (dòng hmr: [339], 26215 B)
- `apps/web/scripts/clicktest-65s10-job-note-locale-headed.mjs` (dòng hmr: [390], 35408 B)
- `apps/web/scripts/clicktest-66t7-legacy-adopt-ui.mjs` (dòng hmr: [280], 23147 B)
- `apps/web/scripts/clicktest-66t8-resume-job-headed.mjs` (dòng hmr: [489], 45215 B)
- `apps/web/scripts/clicktest-67u6-legacy-reopen.mjs` (dòng hmr: [447], 40526 B)
- `apps/web/scripts/clicktest-67u7-job-history-headed.mjs` (dòng hmr: [520], 51952 B)
- `apps/web/scripts/clicktest-68v6-legacy-undo.mjs` (dòng hmr: [346], 31722 B)
- `apps/web/scripts/clicktest-68v8-export-dest-headed.mjs` (dòng hmr: [613], 45453 B)
- `apps/web/scripts/clicktest-74b9-caption-karaoke.mjs` (dòng hmr: [312], 27221 B)
- `apps/web/scripts/clicktest-75c9-escape-classes.mjs` (dòng hmr: [170], 22810 B)
- `apps/web/scripts/clicktest-76d8-codec-probe-debts.mjs` (dòng hmr: [217], 24141 B)
- `apps/web/scripts/clicktest-80h9-clicktest-core.mjs` (dòng hmr: [388], 37396 B)
- `apps/web/scripts/clicktest-82j10-bin-rehydrate-import.mjs` (dòng hmr: [374], 36334 B)
- `apps/web/scripts/clicktest-85m8-proxy-progress-headed.mjs` (dòng hmr: [247], 29328 B)
- `apps/web/scripts/clicktest-86n9-proxy-clicktest-headed.mjs` (dòng hmr: [408], 39595 B)
- `apps/web/scripts/parity-62r8-sharpen-noise-headed.mjs` (dòng hmr: [338], 27951 B)
- `apps/web/scripts/parity-63r8-sharpen-noise-headed.mjs` (dòng hmr: [341], 28205 B)
- `apps/web/scripts/parity-65s7-rail-clamp-headed.mjs` (dòng hmr: [341], 28200 B)
- `apps/web/scripts/parity-66t4-sharpen-chroma-headed.mjs` (dòng hmr: [345], 28712 B)
- `apps/web/scripts/parity-67u3-sharpen-floor-headed.mjs` (dòng hmr: [348], 28897 B)
- `apps/web/scripts/parity-67u3-within-decoder-headed.mjs` (dòng hmr: [348], 27604 B)
- `apps/web/scripts/probe100b3.mjs` (dòng hmr: [185], 40137 B)
- `apps/web/scripts/probe100b4-frame-parity.mjs` (dòng hmr: [331], 35255 B)
- `apps/web/scripts/probe100b5-frame-parity.mjs` (dòng hmr: [341], 35023 B)
- `apps/web/scripts/probe101c3.mjs` (dòng hmr: [187], 41742 B)
- `apps/web/scripts/probe101c4-frame-parity.mjs` (dòng hmr: [331], 35255 B)
- `apps/web/scripts/probe101c5-frame-parity.mjs` (dòng hmr: [351], 39904 B)
- `apps/web/scripts/probe102d3-frame-parity.mjs` (dòng hmr: [351], 39904 B)
- `apps/web/scripts/probe102d4-frame-parity.mjs` (dòng hmr: [334], 36023 B)
- `apps/web/scripts/probe102d6.mjs` (dòng hmr: [187], 41818 B)
- `apps/web/scripts/probe103e4-frame-parity.mjs` (dòng hmr: [356], 41072 B)
- `apps/web/scripts/probe103e5.mjs` (dòng hmr: [192], 44596 B)
- `apps/web/scripts/probe103e6-frame-parity.mjs` (dòng hmr: [336], 36049 B)
- `apps/web/scripts/probe104f4-frame-parity.mjs` (dòng hmr: [359], 41447 B)
- `apps/web/scripts/probe104f5.mjs` (dòng hmr: [192], 44638 B)
- `apps/web/scripts/probe104f6-frame-parity.mjs` (dòng hmr: [341], 37023 B)
- `apps/web/scripts/probe105g7-frame-parity.mjs` (dòng hmr: [343], 37292 B)
- `apps/web/scripts/probe106h3-frame-parity.mjs` (dòng hmr: [431], 45994 B)
- `apps/web/scripts/probe106h4-frame-parity.mjs` (dòng hmr: [343], 37292 B)
- `apps/web/scripts/probe107i4-frame-parity.mjs` (dòng hmr: [440], 46885 B)
- `apps/web/scripts/probe107i5-frame-parity.mjs` (dòng hmr: [343], 37292 B)
- `apps/web/scripts/probe107i8-frame-parity.mjs` (dòng hmr: [343], 37348 B)
- `apps/web/scripts/probe108j3-frame-parity.mjs` (dòng hmr: [473], 55833 B)
- `apps/web/scripts/probe108j4-frame-parity.mjs` (dòng hmr: [343], 37292 B)
- `apps/web/scripts/probe108j5-frame-parity.mjs` (dòng hmr: [343], 37348 B)
- `apps/web/scripts/probe109k3-frame-parity.mjs` (dòng hmr: [473], 57082 B)
- `apps/web/scripts/probe109k4-frame-parity.mjs` (dòng hmr: [343], 37348 B)
- `apps/web/scripts/probe89q5-seek-latency.mjs` (dòng hmr: [254], 42729 B)
- `apps/web/scripts/probe90r2-playhead-canvas-sync.mjs` (dòng hmr: [184], 31068 B)
- `apps/web/scripts/probe91s2-playhead-sawtooth.mjs` (dòng hmr: [184], 31062 B)
- `apps/web/scripts/probe92t3-canvas-stale.mjs` (dòng hmr: [207], 36177 B)
- `apps/web/scripts/probe93u3-stall-evidence.mjs` (dòng hmr: [209], 36389 B)
- `apps/web/scripts/probe94v2-stall-evidence.mjs` (dòng hmr: [209], 36719 B)
- `apps/web/scripts/probe94v4-rvfc-fallback.mjs` (dòng hmr: [147], 15374 B)
- `apps/web/scripts/probe95w3-frame-parity.mjs` (dòng hmr: [307], 28163 B)
- `apps/web/scripts/probe95w5-velocity.mjs` (dòng hmr: [209], 39112 B)
- `apps/web/scripts/probe96x4.mjs` (dòng hmr: [178], 38145 B)
- `apps/web/scripts/probe96x4b.mjs` (dòng hmr: [179], 38245 B)
- `apps/web/scripts/probe96x5-frame-parity.mjs` (dòng hmr: [364], 32730 B)
- `apps/web/scripts/probe96x5b-frame-parity.mjs` (dòng hmr: [368], 35774 B)
- `apps/web/scripts/probe97y4.mjs` (dòng hmr: [182], 39052 B)
- `apps/web/scripts/probe97y5-frame-parity.mjs` (dòng hmr: [423], 40474 B)
- `apps/web/scripts/probe97y6-frame-parity.mjs` (dòng hmr: [331], 32960 B)
- `apps/web/scripts/probe97y7-frame-parity.mjs` (dòng hmr: [331], 32940 B)
- `apps/web/scripts/probe98z3.mjs` (dòng hmr: [186], 39834 B)
- `apps/web/scripts/probe98z4-frame-parity.mjs` (dòng hmr: [500], 45294 B)
- `apps/web/scripts/probe98z5-frame-parity.mjs` (dòng hmr: [331], 33136 B)
- `apps/web/scripts/probe98z5-y5blind.mjs` (dòng hmr: [418], 39019 B)
- `apps/web/scripts/probe98z6-frame-parity.mjs` (dòng hmr: [335], 33360 B)
- `apps/web/scripts/probe99a3.mjs` (dòng hmr: [185], 39743 B)
- `apps/web/scripts/probe99a4-watchdog-paused.mjs` (dòng hmr: [581], 52556 B)
- `apps/web/scripts/probe99a5-frame-parity.mjs` (dòng hmr: [331], 35251 B)
- `apps/web/scripts/probe99a5-y5blind.mjs` (dòng hmr: [418], 39915 B)
- `apps/web/scripts/probe99a6-frame-parity.mjs` (dòng hmr: [337], 34174 B)
- `apps/web/scripts/r71y2-headed-capture.mjs` (dòng hmr: [312], 25192 B)
- `apps/web/scripts/r74b1-headed-capture.mjs` (dòng hmr: [379], 30738 B)
- `apps/web/scripts/r75c1-fps.mjs` (dòng hmr: [218], 19616 B)
- `apps/web/scripts/r77e9-fullpixel-headed.mjs` (dòng hmr: [366], 29871 B)
- `apps/web/scripts/r78f6-fullpixel-headed.mjs` (dòng hmr: [392], 32208 B)
- `apps/web/scripts/r78f7-headed-capture.mjs` (dòng hmr: [430], 34436 B)
- `apps/web/scripts/r79g5-fullpixel-headed.mjs` (dòng hmr: [403], 33522 B)
- `apps/web/scripts/r79g6-headed-capture.mjs` (dòng hmr: [430], 34859 B)
- `apps/web/scripts/r80h3-fullpixel-headed.mjs` (dòng hmr: [407], 33867 B)
- `apps/web/scripts/r80h4-headed-capture.mjs` (dòng hmr: [432], 35002 B)
- `apps/web/scripts/r81i4-headed-capture.mjs` (dòng hmr: [437], 35341 B)
- `apps/web/scripts/r82j4-headed-capture.mjs` (dòng hmr: [440], 35572 B)
- `apps/web/scripts/r82j5-headed-capture.mjs` (dòng hmr: [439], 35452 B)
- `apps/web/scripts/r82j7-fullpixel-headed.mjs` (dòng hmr: [402], 33262 B)
- `apps/web/scripts/r83k4-headed-capture.mjs` (dòng hmr: [445], 35958 B)
- `apps/web/scripts/r84l2-clean-scale2-headed.mjs` (dòng hmr: [395], 32452 B)
- `apps/web/scripts/r84l5-effect-canvas-probe-headed.mjs` (dòng hmr: [504], 40695 B)

##### Form B — `plugins: [react(), mediaPlugin()]`, 15 file

- `apps/web/scripts/clicktest-61r3-fps-cal-run1.mjs` (dòng hmr: [442], 44567 B)
- `apps/web/scripts/clicktest-61r3-fps-cal.mjs` (dòng hmr: [679], 67545 B)
- `apps/web/scripts/clicktest-64r3-fps-long.mjs` (dòng hmr: [490], 47687 B)
- `apps/web/scripts/clicktest-75c8-deint-preview.mjs` (dòng hmr: [383], 40036 B)
- `apps/web/scripts/clicktest-76d4-deint-fps.mjs` (dòng hmr: [420], 57025 B)
- `apps/web/scripts/measure-65r8-presented-fps.mjs` (dòng hmr: [453], 37207 B)
- `apps/web/scripts/measure-67u4-app-rvfc-probe.mjs` (dòng hmr: [347], 27647 B)
- `apps/web/scripts/measure-68v4-gate-ab.mjs` (dòng hmr: [356], 28143 B)
- `apps/web/scripts/measure-78f2-gate-harness.mjs` (dòng hmr: [543], 59809 B)
- `apps/web/scripts/probe-78f1-tick-time.mjs` (dòng hmr: [425], 55638 B)
- `apps/web/scripts/probe-79g1-tick-time.mjs` (dòng hmr: [437], 56567 B)
- `apps/web/scripts/probe-82j9-draw-cost.mjs` (dòng hmr: [402], 32962 B)
- `apps/web/scripts/probe-84l3-combo-fps.mjs` (dòng hmr: [385], 34726 B)
- `apps/web/scripts/probe-85m1-60fps-fps.mjs` (dòng hmr: [382], 35123 B)
- `apps/web/scripts/probe-85m1-combo-fps.mjs` (dòng hmr: [385], 35587 B)

##### Form C — `defineConfig` webkit, 5 file

- `apps/web/scripts/clicktest-81i7-webkit-loop-wire.mjs` (dòng hmr: [353], 23111 B)
- `apps/web/scripts/clicktest-84l10-webkit-loop-w1.mjs` (dòng hmr: [463], 29324 B)
- `apps/web/scripts/clicktest-85m4-webkit-w7.mjs` (dòng hmr: [521], 31797 B)
- `apps/web/scripts/clicktest-86n2-webkit-w7.mjs` (dòng hmr: [580], 35844 B)
- `apps/web/scripts/clicktest-86n3-seek-skip-render.mjs` (dòng hmr: [275], 17034 B)

##### Form D — media-plugin `configureServer`, 7 file

- `apps/web/scripts/probe-75c8-deint.mjs` (dòng hmr: [298], 21501 B)
- `apps/web/scripts/probe-76d4-deint.mjs` (dòng hmr: [330], 23614 B)
- `apps/web/scripts/probe-76d4b-inline-scale.mjs` (dòng hmr: [235], 15308 B)
- `apps/web/scripts/probe-76d4c-halfres.mjs` (dòng hmr: [247], 16258 B)
- `apps/web/scripts/probe-77e1-deint-fast.mjs` (dòng hmr: [290], 19332 B)
- `apps/web/scripts/probe-79g1-deint-source.mjs` (dòng hmr: [249], 18419 B)
- `apps/web/scripts/probe-80h6-bbb-sameframe.mjs` (dòng hmr: [227], 16186 B)

### 4.3 Phân loại 140 file T9 theo form

| Form | Số | Đặc điểm |
|---|---|---|
| A | 113 | Template `export default { plugins: [react()], server: { hmr: false } }`, ghi bằng `writeFileSync`/`writeFileEpermRetry` |
| B | 15 | Như A nhưng `plugins: [react(), mediaPlugin()]` (cần endpoint media `/r…-media`) |
| C | 5 | `defineConfig({ plugins: [react()], server: { host, port, strictPort, hmr: false } })` — harness WebKit (81i7, 84l10, 85m4, 86n2, 86n3) |
| D | 7 | Config media-plugin viết tay (`configureServer` serve thư mục media/output) — 75c8, 76d4, 76d4b, 76d4c, 77e1-deint-fast, 79g1-deint-source, 80h6 |

### 4.4 File chỉ tiêu thụ config của harness khác: 4 file (không sửa trực tiếp)

| File tiêu thụ | Config lấy từ | Thừa hưởng mirror? |
|---|---|---|
| `apps/web/scripts/measure-65r8-perf-overlay.mjs` | `/tmp/round65-r8/vite.r8-presented.config.mjs` do `measure-65r8-presented-fps.mjs` viết | **Có** — file viết đã mirror trong T9 (Form B) |
| `apps/web/scripts/probe-82j3-sample-load.mjs` | `/tmp/round77-e1/vite.e1.headed.config.mjs` do E1 viết | **Có** — E1 đã mirror đợt 120 T8 |
| `apps/web/scripts/clicktest-68v2-stab-toggle-headed.mjs` | `hidden_files/round68-v2/vite.config.cjs` (file đứng riêng, ngoài repo) | **KHÔNG** — file config này vẫn `server: { hmr: false }` (269 B, 08/11), không nằm trong repo nên không stage được; muốn chạy lại 68v2 phải mirror tay file đó (1 dòng, cùng mẫu) |
| `apps/web/scripts/clicktest-57n9-timeline-core-ops.mjs` | `/tmp/round57-n9/vite.n9.config.mjs` (ghi chú trong code: “xem file đó”) | **KHÔNG BIẾT** — file `/tmp/round57-n9/` hiện không tồn tại (mất sau reboot); 57n9 không chạy được cho tới khi có người viết lại config đó |

### 4.5 File không chạy vite dev: 35 file (không cần mirror)

- `vite preview` (serve dist, không watch): `clicktest-81i8-install-prompt.mjs`, `check-proxy-auto.mjs` (chế độ preview-dist), các file `*-pipe.mjs` (10 lệnh `vite preview` qua npx) — `preview` không dùng file watcher.
- Chỉ `vite build` (không watch): `clicktest-46b1-*`, `clicktest-47c1-*`, `clicktest-48d6-*`, `clicktest-49e6-*`, `clicktest-50f5/50f6-*`, `bench-preview-fps.mjs` (chờ vite dev ngoài), các `measure-v19/v20/v21/v22/v23/v24-*-pipe.mjs` (static server `http.createServer` + build).
- Launcher (chỉ spawn harness con, không tự spawn vite): 5 file `measure-68v4/70x2/71y3/72z3/77e2-*-launcher.mjs` — mirror thừa hưởng từ harness con.
- Lock script (chỉ khóa/kill tiến trình vite, không viết config): `vcut-vite-lock.sh`, `vcut-vite-lock-v2.sh` (v1 có nhắc `watch.ignored` trong comment §5).
- Test spawn harness con: `test_round78_f2_gate_harness.test.mjs` (gate harness đã mirror trong T9, Form B).
- `server/bridge/src/index.js` chỉ nhắc vite dev :5173 trong comment CORS — không phải harness.
- Không có harness vite dev nào trong `benchmarks/`, `scripts/`, `server/`, `cli/` (đã quét; chỉ có `vite build` và file vendored trong `server/tts/.venv2/` — không đụng).

## 5. Kiểm chứng

### 5.1 `node --check`: 140/140 PASS

Chạy `node --check` trên từng file sau sửa (script `hidden_files/round121-t9/nodecheck.sh`, kết quả `nodecheck.json`). 0 lỗi cú pháp.

### 5.2 Trích template → import config thật: 140/140 PASS

Script `hidden_files/round121-t9/eval-configs.mjs` + `eval-configs2.mjs`: trích đúng template literal chứa `hmr: false` từ mỗi harness (scanner tôn trọng backtick escaped `\`` trong code media-plugin; 32 file Form B/D cần xử lý riêng), evaluate với stub (`ROOT`, `WEB_DIR`, `DEV_PORT`, `MEDIA_DIR`, `SCRATCH`, …), ghi config thật ra thư mục tạm dưới `apps/web/scripts/.t9-cfgcheck-tmp/` (để resolve được `vite`/`@vitejs/plugin-react`), rồi dynamic-import từng config và assert `server.watch.ignored === ["**/**"]` và `server.hmr === false`. **140/140 import OK** (108 lượt 1 + 32 lượt 2). Thư mục tạm đã xóa sau kiểm chứng.

### 5.3 Smoke sweep: chạy ngắn từng harness — 132 PASS, 0 ENOSPC

Driver `hidden_files/round121-t9/smoke-sweep.py`: chạy tuần tự từng harness (`node <file>`, cwd repo), kill ngay khi thấy marker vite lên (`vite dev đã lên` / `vite dev sẵn sàng` / `ready in`), tối đa 60s/file; log từng file tại `hidden_files/round121-t9/smoke/<tên>.log`, tổng hợp `smoke-summary.json`. Lượt 1 phát hiện 2 lỗi driver (marker `HARNESS LỖI` quá rộng → phân loại sai 76d8; race đọc log sau khi process exit → bỏ sót vite-up của 86n3/97y7/107i4/107i8) — đã sửa driver và chạy lại lượt retry cho 13 file chưa PASS.

- **PASS (vite lên, 0 ENOSPC): 132/140**
- **EXIT:2 — 7 file, tất cả đều lỗi pre-vite do thiếu fixture từ trước (chưa tới được vite, không liên quan mirror):**
  - `clicktest-76d8-codec-probe-debts.mjs` — at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
  - `r80h4-headed-capture.mjs` — [2026-11-16T09:17:45.424Z] HARNESS LỖI: không thấy media /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round80-h4/media/blend-tp-ocean-a50.
  - `clicktest-81i7-webkit-loop-wire.mjs` — [2026-11-16T09:17:52.890Z] HARNESS LỖI: không thấy clip /tmp/round81-i7/i7-clip-10s.mp4
  - `r81i4-headed-capture.mjs` — [2026-11-16T09:17:59.420Z] HARNESS LỖI: không thấy media /home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round81-i4/media/blend-tp-slov-a085.
  - `clicktest-84l10-webkit-loop-w1.mjs` — [2026-11-16T09:19:12.189Z] HARNESS LỖI: không thấy clip /tmp/l10/clips/h_h264_320x180_30s.mp4
  - `clicktest-85m4-webkit-w7.mjs` — [2026-11-16T09:19:19.276Z] HARNESS LỖI: không thấy clip /tmp/m4/clips/h_h264_320x180_30s.mp4
  - `clicktest-86n2-webkit-w7.mjs` — [2026-11-16T09:19:26.015Z] HARNESS LỖI: không thấy clip /tmp/n2/clips/h_h264_320x180_30s.mp4
- **TIMEOUT — 1 file (`probe-82j9-draw-cost.mjs`):** lượt retry bị kill ở mốc 60s vì harness chạy đủ bộ (~48s+). Log retry ghi rõ `vite dev + media probe 206 đã lên`; **lượt 1 chạy đầy đủ exit 0, ghi JSON kết quả đầy đủ** (`round82-j9/probe-draw-cost/probe-82j9-draw-cost.json`: phase1/phase2/phase3 + loadBefore/loadEnd). Tính là vite-up: **tổng vite lên thực tế 133/140; 7 file còn lại chưa tới được vite vì thiếu fixture.**
- **0 lần ENOSPC trong toàn bộ sweep** (grep toàn bộ 140 log). 67 file config đã sinh ra trên đĩa (`/tmp/round*/vite.*.config.mjs`) đều chứa `watch: { ignored }`, 0 file không chứa — bằng chứng runtime rằng template đã sửa sinh ra config đã mirror.
- Lưu ý sweep: mỗi harness chỉ chạy tới lúc vite lên rồi kill (không đo đủ bộ) — trừ 82j9 (chạy đủ) và 4 lần baseline §5.4. Các harness cũ (đợt 58–119) vẫn chạy được trên VM hiện tại sau mirror; lỗi duy nhất gặp là thiếu fixture/bridge (từ trước).

### 5.4 Đường đo không đổi — 4 lần chạy đầy đủ (1/form), đối chiếu baseline

Log đầy đủ tại `hidden_files/round121-t9/baseline/`. Scratch riêng cho lượt này (không ghi đè evidence đợt cũ, trừ 86n3 — xem caveat).

| Form | Harness chạy đầy đủ | Kết quả lượt này | Baseline lịch sử | Đối chiếu |
|---|---|---|---|---|
| A | `clicktest-58o1-welcome-escape.mjs` (exit 0, ~21s) | click-test headed **3/3 pass** (E1 modal hiện, E2 Escape đóng + `welcomed=1`, E3 0 lỗi trang) | Đợt 58: **3/3 pass** sau sửa | **Khớp** |
| B | `probe-85m1-60fps-fps.mjs` (exit 0, ~72s) | D1 **MAD deint-vs-baseline 0,3835 (5,77% đổi)**, hook tap=true; D2 tỉ lệ 1,23/1,06/1,18/1,11/1,02 → mean **1,12×**, baseline 10,81 fps, load 5,32 | D1 MAD **0,3835** (M1/N10/R6→F1, giống hệt); D2 cửa sổ đợt 85: 1,00/0,88/0,94/0,62/0,73, mean 0,834 | **Pixel khớp tuyệt đối**; tỉ lệ fps khác vì chế độ máy khác (xem dưới) |
| D | `probe-77e1-deint-fast.mjs` (exit 0, ~37s) | interlaced s=1,13: shift MAD 1,215; halfHigh/halfLow/halfMed 0,962; tap2 0,993; blur1 1,859; qtrH 1,698; qtr 1,703; vgrad giữ 104/59/53/30/38/52%, hgrad giữ 100/91/91/52/91/54% | Bảng đợt 77: MAD 1,215 / 0,962 / 0,993 / 1,859 / 1,698 / 1,703; vgrad 104/59/53/30/38/52%; hgrad 100/91/91/52/91/54% | **Khớp tuyệt đối cả 8 mode** (MAD 3 chữ số thập phân + gradient từng %) |
| C | `clicktest-86n3-seek-skip-render.mjs` (exit 0, ~36s, `N3_ENGINE=chromium`, Xvfb :181) | **VERDICT PASS** — gateFired=true, playingOn=true, notBlack=true, errors=0; gate 1→13→17 tick; canvas sáng 118,5 | Đợt 86 N3: **Chromium PASS** — gate 1→22→25 tick; canvas sáng ~118–119 | **Khớp verdict + độ sáng**; số tick khác do thời điểm scrub/tải (xem dưới) |

- **Tỉ lệ fps 85m1 (1,12× vs 0,834× đợt 85) KHÔNG phải do mirror:** tỉ lệ fps là hàm của chế độ máy (G1 đã chứng minh, Pearson −0,317). Lượt này máy tải (load 5,32, baseline chỉ 10,81 fps — dưới ngưỡng yên 10 fps sát nút), còn cửa sổ đợt 85 đo trong điều kiện khác. Bằng chứng đường đo không đổi là D1 MAD 0,3835 khớp tuyệt đối — pixel không đổi thì module phục vụ không đổi; fps chỉ phản ánh tải. Đừng trích 1,12× như tốc độ deint.
- **Số tick gate 86n3 (13→17 vs 22→25 đợt 86) KHÔNG phải do mirror:** tick đếm số lần skip trong lúc scrub — phụ thuộc thời điểm scrub và tải máy; verdict PASS + canvas sáng 118,5 (trong khoảng lịch sử 118–119) + playhead chạy tiếp sau seek mới là bất biến cần đối chiếu. Clip dùng cho lần này được tái tạo bằng ffmpeg (xem §8) — preset/CRF gốc không được ghi trong doc N3 nên clip không bit-identical; so sánh ở mức hành vi, không phải từng mili-giây.
- **WebKit không chạy được trong lượt baseline form C:** MiniBrowser lỗi `libevent-2.1.so.7: cannot open shared object file` (chỉ có `libevent_core-2.1.so.7` trên VM) + harness N3 launch headed mà không tự spawn Xvfb (cần DISPLAY ngoài). Vì vậy chỉ chạy được nhánh Chromium (dưới Xvfb :181 tự dựng). WebKit của 86n3/84l10/85m4/86n2/81i7 vẫn chưa có số đối chiếu sau mirror — nợ (§7).

### 5.5 Kiểm chứng khác

- Diff từng file vs backup: đúng 1 dòng đổi / file, 0 file lệch.
- E1/N10 (mirror đợt 120) md5 không đổi so với note T8 — T9 không động vào.
- `preview.tsx` / `media.ts` md5 trước = sau (khớp số T8). `apps/web/vite.config.ts` (production) không động.
- Không process mồ côi của T9 sau đo: bridge đã dừng, Xvfb :181 đã dừng, 2 vite mồ côi của 86n3 đã kill (`vite.n3.config.mjs` — xem §8).

## 6. Harness KHÔNG mirror được + nợ còn lại

### 6.1 Dùng config production mặc định — 25 file (KHÔNG mirror bằng mẫu T8)

Các file này spawn vite dev với `cwd=apps/web` và KHÔNG `-c` → vite tự load `apps/web/vite.config.ts` (production: chỉ `react()` + port 5173, không có `watch.ignored`). Mirror chúng cần 1 trong 2 việc — cả 2 đều vượt mẫu T8 và T9 không tự làm: (a) sửa `vite.config.ts` production (**cấm** — đổi hành vi dev của app thật); (b) viết thêm khối ghi config riêng + thêm `-c` vào từng harness (đổi đường serve của harness — cần parent quyết vì config tự viết phải replicate đúng production + media plugin nếu harness cần).

- `apps/web/scripts/c3-round13-clicktest.cjs`
- `apps/web/scripts/check-proxy-auto.mjs`
- `apps/web/scripts/clicktest-51h6-keyframe-panel.mjs`
- `apps/web/scripts/clicktest-52i2-audio-null-badge.mjs`
- `apps/web/scripts/clicktest-53j5-proxy-persist.mjs`
- `apps/web/scripts/clicktest-53j5-tick-null-gain.mjs`
- `apps/web/scripts/clicktest-54k7-proxy-toolbar-stale.mjs`
- `apps/web/scripts/clicktest-55l1-i18n-projectmenu-topbar.mjs`
- `apps/web/scripts/clicktest-68v8-export-dest-electron.mjs`
- `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs`
- `apps/web/scripts/gopHeaded46B4.mjs`
- `apps/web/scripts/gopHeaded47C5.mjs`
- `apps/web/scripts/gopHeaded48D4.mjs`
- `apps/web/scripts/gopHeaded49E2.mjs`
- `apps/web/scripts/p5-round11-clicktest.cjs`
- `apps/web/scripts/probe-53j5-playhead-drift.mjs`
- `apps/web/scripts/probe-54k7-geo.mjs`
- `apps/web/scripts/probe-54k9-audio-reseek.mjs`
- `apps/web/scripts/probe-55l6-audio-drift.mjs`
- `apps/web/scripts/probe-cpu-profile.mjs`
- `apps/web/scripts/probe-media-clock.mjs`
- `apps/web/scripts/probe-trace.mjs`
- `apps/web/scripts/r14-round14-clicktest.cjs`
- `apps/web/scripts/t5-round12-clicktest.cjs`
- `apps/web/scripts/v10-parity-clicktest.cjs`

Trong đó `check-proxy-auto.mjs` chỉ dùng config mặc định ở chế độ thường; chế độ `CHECK_PROXY_PREVIEW_DIST=1` dùng `vite preview` (không bị ENOSPC). `clicktest-68v8-export-dest-electron.mjs` dùng `--configLoader runner` nhưng vẫn không `-c` nên vẫn load config mặc định.

Hệ quả thực tế: 25 file này **sẽ chết ENOSPC khi headroom < ~1.578** cho tới khi được xử lý — giống hệt E1 trước mirror đợt 120 (chết 8/8). Đợt sau: hoặc parent quyết nâng trần host, hoặc viết config riêng + `-c` cho từng file (kèm chạy đầy đủ đối chiếu như §5.4).

### 6.2 Nợ khác

1. **Trần inotify vẫn đầy** — nâng trần cần can thiệp host; T9 chỉ mở rộng workaround, không sửa gốc.
2. **68v2 config ngoài repo** (`hidden_files/round68-v2/vite.config.cjs`, vẫn `hmr: false` không mirror) — mirror tay 1 dòng nếu muốn chạy lại 68v2.
3. **57n9 config đã mất** (`/tmp/round57-n9/vite.n9.config.mjs` không tồn tại) — 57n9 không chạy được cho tới khi viết lại config.
4. **7 harness thiếu fixture từ trước** (smoke EXIT:2): 76d8 (`/tmp/round76-d8/hevc-a.mp4`), r80h4 + r81i4 (media `blend-tp-*.mp4` trong `hidden_files/round80-h4` / `round81-i4`), 81i7 / 84l10 / 85m4 / 86n2 (clip `.mp4` trong `/tmp/...` đã mất sau reboot). Khôi phục fixture là việc riêng, không thuộc mirror.
5. **WebKit headed không launch được trên VM hiện tại** (thiếu `libevent-2.1.so.7`) — 5 harness Form C chưa có số đối chiếu sau mirror; nhánh Chromium của 86n3 đã PASS (§5.4).
6. **82j9 chạy đủ bộ nhưng chậm** (~48s+ dưới tải hiện tại) — sweep 60s kill ở lượt retry; bằng chứng lượt 1 đã đủ (exit 0 + JSON).

## 7. Giới hạn — đọc trước khi trích số

1. **Mirror ≠ nâng trần.** 140 harness đã mirror chạy được; 25 harness config mặc định vẫn chết ENOSPC. Đừng nói “mọi harness đã hết ENOSPC”.
2. **Smoke sweep chỉ chứng minh vite lên, không chứng minh harness đo đúng.** Chỉ 4 lần chạy đầy đủ (§5.4) + 82j9 đối chiếu được đường đo. Các harness còn lại: đúng ở mức config hợp lệ (import OK) + vite boot được — không khẳng định từng case đo của chúng vẫn pass (chúng vốn là harness cũ, nhiều cái có thể đã bit-rot vì fixture/API đổi — xem mục 4 §6.2).
3. **Tỉ lệ fps không phải hằng số.** Chỉ pixel/MAD/verdict mới đối chiếu được tuyệt đối; fps ratio phụ thuộc tải máy (§5.4).
4. **Chromium dùng cho smoke là 1254 qua symlink 1248** (xem §8) — khác version playwright mà harness cũ ghi. Chỉ ảnh hưởng đường chrome, không ảnh hưởng vite/config.
5. **Số đo chỉ đúng trên VM này** trong giờ vòng lặp 9–10 luồng song song (load là biến số lớn nhất).
6. **Không kiểm lại TTS 39; không thử birefnet; không sửa production; không push.**

## 8. Ghi chú môi trường + tác dụng phụ (trung thực)

- **Symlink `~/.cache/ms-playwright/chromium-1248 → chromium-1254`** (tạo lượt này, ngoài repo): 222 chỗ trong `apps/web/scripts` ghi cứng `chromium-1248` nhưng thư mục đó không tồn tại (chỉ có 1187/1254) — harness cũ chết ngay ở bước kiểm tra chrome trước cả khi tới vite. Symlink để smoke sweep chạy được; chrome thực thi là bản 1254. Giữ nguyên symlink (giúp các đợt sau), không xóa.
- **Bridge local `:8787`**: đã start (`node server/bridge/src/index.js --port 8787`, health ok, caption available) để retry 61r5, rồi **đã dừng** sau khi xong (port 8787 trả tự do). Disk lúc đo chỉ còn **0,49 GB trống** (bridge health) — VM sắp hết đĩa, không phải do T9.
- **Clip N3 tái tạo**: `/tmp/n3/clips/w6_h264_30s_g250_640.mp4` đã mất sau reboot; tái tạo bằng `ffmpeg -f lavfi -i testsrc2=size=640x360:rate=30:duration=30 -c:v libx264 -g 250 -pix_fmt yuv420p` — kiểm chứng keyframe đúng 0 / 8,33 / 16,67 / 25,0s như doc N3. Preset/CRF gốc không được ghi nên clip không bit-identical với file gốc.
- **86n3 ghi đè report đợt 86**: harness viết report về đúng đường cũ `hidden_files/round86-n3/headed/n3-seek-skip-report.json` (không có env đổi đường) — file report gốc của đợt 86 đã bị ghi đè bằng lần chạy T9; số gốc vẫn còn trong doc `PHASE9_ROUND86_N3_W6_SEEK_LIMITS.md` (§2 + §"Chromium PASS"). Lần chạy T9: `startedAt 2026-11-16T09:25:40Z`.
- **86n3 rò vite**: harness không kill vite khi thoát (cả khi exit 2 lẫn exit 0) — 2 vite mồ côi (`vite.n3.config.mjs`, cổng 5901/5902) đã kill tay sau đo. File `apps/web/vite.n3.config.mjs` (236 B, do harness sinh ra trong `apps/web/`, đã có mirror) để nguyên — harness tự ghi lại mỗi lần chạy; không đưa vào batch stage (file sinh ra lúc chạy, không phải source).
- **Driver sweep đã sửa 2 lỗi trong lúc chạy** (marker quá rộng; race đọc log) — kết quả cuối là sau khi sửa + retry; log lượt 1 vẫn giữ nguyên trong `smoke/*.log` (file log bị ghi đè ở lượt retry — chỉ giữ bản cuối).

## 9. Cách chạy lại

```bash
# Kiểm kê lại (quét toàn repo):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round121-t9/inventory.py
# node --check 140 file đã sửa:
bash ~/workspace/goals/capcut-clone-video-editor/hidden_files/round121-t9/nodecheck.sh
# Trích template -> import config thật (140/140):
node ~/workspace/goals/capcut-clone-video-editor/hidden_files/round121-t9/eval-configs.mjs
node ~/workspace/goals/capcut-clone-video-editor/hidden_files/round121-t9/eval-configs2.mjs
# Smoke 1 harness (kill khi vite len; can 60s):
node apps/web/scripts/clicktest-58o1-welcome-escape.mjs   # can timeout 60, cho 'vite dev da len'
# Chay day du 4 dai dien (doi SCRATCH moi lan neu muon giu evidence cu):
O1_SCRATCH=<dir-moi> node apps/web/scripts/clicktest-58o1-welcome-escape.mjs
M1_60FPS_SCRATCH=<dir-moi> node apps/web/scripts/probe-85m1-60fps-fps.mjs
E1_SCRATCH=<dir-moi> node apps/web/scripts/probe-77e1-deint-fast.mjs
Xvfb :181 -screen 0 1440x900x24 & DISPLAY=:181 N3_ENGINE=chromium node apps/web/scripts/clicktest-86n3-seek-skip-render.mjs
# Doi chung vite thuong vs mirror (can 25s):
#   config thuong -> ENOSPC exit 1; config + watch.ignored -> ready, 0 ENOSPC
```

## 10. Nợ cho đợt sau

1. Mirror 25 file config mặc định (§6.1) — cần parent quyết: nâng trần host hay viết config riêng + `-c` cho từng file.
2. Mirror tay `hidden_files/round68-v2/vite.config.cjs` + viết lại config `/tmp/round57-n9/vite.n9.config.mjs` (hoặc ghi rõ 2 harness này đã bỏ).
3. Khôi phục fixture cho 7 harness EXIT:2 (§6.2 mục 4) rồi smoke lại chúng.
4. WebKit headed: cài `libevent-2.1.so.7` (hoặc xác nhận cách T4 chạy WebKit O8) rồi chạy đầy đủ 5 harness Form C đối chiếu số.
5. Chạy đầy đủ thêm các harness fps/parity quan trọng còn lại (probe-95w3/96x5/97y5… frame-parity) khi có cửa sổ yên — smoke chỉ mới chứng minh vite lên.
6. G1 vẫn MỞ chờ user quyết; ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; birefnet chỉ thử lại khi RAM đổi.

## Phụ lục — file stage

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round121-t9-viteharness.txt` — 141 file (LIMITS này + 140 harness). **45 file > 37.768 B** (44 harness + chính LIMITS này, 39.437 B) → lúc push cần `ENABLE_PRIVSEP=0` cho các file đó. Không binary. Chi tiết kiểm kê đầy đủ: `hidden_files/round121-t9/inventory.json`, `missing-classified.json`, `inventory-appendix.md`; backup file gốc trước sửa: `hidden_files/round121-t9/backup/`; log edit: `edit-log.json`.

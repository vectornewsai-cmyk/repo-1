# Phase 9 đợt 40, luồng V1 — Solo runner + perSeek wiring — LIMITS

Ngày: 03/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào batch.
Luồng này CHỈ sửa runner solo + test của nó + LIMITS này — không
sửa cổng v2/v3, probe Q6, harness N2, code sản phẩm, hay file của
luồng khác trong đợt 40.

Đọc trước khi làm: `docs/PHASE9_ROUND39_LIMITS.md` §5 nợ 1,
`docs/PHASE9_ROUND39_T1_SOLO_AB_LIMITS.md`,
`docs/PHASE9_ROUND38_U6_SOLO_RUNNER_LIMITS.md` §3.3 (spec probe),
`docs/PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md` §5 (nợ solo).

## 0. Kết luận ngắn

1. **Đã nối perSeek thật vào solo runner (nợ 39 §5.1 nửa (a)).**
   Chuỗi hardcode `perSeekProbe: "absent — …"` trong
   `runOneVariant` đã bị thay bằng `extractPerSeekReport(raw)` —
   runner giờ đọc `perSeekEnabled`/`perSeek` từ chính
   forward-hold.json của lượt đó và ghi vào JSON lượt solo.
   Khi cờ tắt hoặc forward-hold cũ, báo `absent` rõ ràng; khi
   cờ bật mà không có entries, báo `enabled-but-missing` (không
   im lặng coi như absent, không bịa entry).
2. **Đã xác nhận N2_PERSEEK=1 chảy qua solo → Q6 → N2 bằng 1 lượt
   solo KHÔ (nợ 39 §5.1 nửa (b))** — bằng unit test của env
   solo + audit chuỗi code Q6/N2 + fixture forward-hold (xem §2).
   Đây là xác nhận mức khô, KHÔNG phải bằng chứng runtime
   headed: chưa có lượt headed nào chạy qua cả 3 tầng trong
   luồng này, và luồng này KHÔNG chạy phiên solo thật.
3. **CẤM TUYỆT ĐỐI đã tuân thủ: không chạy phiên solo A/B thật,
   không claim khóa <10%, không chốt v3, không đổi ngưỡng/cổng
   nào.** Máy cron đang chạy 6 luồng song song nên mọi số
   timing đều under-load; dry-run exit 0 dưới đây chỉ nói "tiền
   kiểm đạt tại thời điểm chạy", không phải baseline quiet.
   Fail-closed giữ nguyên (dry-run lúc bận vẫn exit 2 theo thiết
   kế T1 — trong lượt này dry-run gặp đúng lúc máy thoáng nên
   exit 0, xem §3).

## 1. Cái gì đã sửa (trước → sau)

### 1.1 `apps/web/scripts/seek-ab-solo-run.mjs`

- **Mới, export `extractPerSeekReport(raw)`** (hàm thuần — seam
  test được mà không cần browser): phân biệt đúng 3 trạng thái
  - `present`: `perSeekEnabled=true` và `perSeek.entries` là mảng
    (kể cả 0 entry — 0 entry trên đường WebCodecs là đúng, vì
    đường đó không gán `currentTime`, xem LIMITS T2 §1).
    Copy nguyên vẹn: `entries` thô, `marks`, `counts`,
    `summaryAll`, `summaryReverse` do N2 tính, kèm `version`,
    `gopSeconds`, `entryCount`. Không tóm tắt, không suy diễn
    cơ chế thêm — nhãn cơ chế trong `summaryReverse` vẫn là
    heuristic mô tả của T2, không phải cổng nhận/loại.
  - `absent`: cờ tắt hoặc forward-hold cũ không có trường này
    (giữ đúng ý nghĩa chuỗi hardcode cũ, giờ có cấu trúc).
  - `enabled-but-missing`: cờ bật nhưng không có
    `perSeek.entries` — probe bật mà không trả dữ liệu; phiên
    sau gặp trạng thái này phải kiểm tra log N2 trước khi đọc
    bất kỳ kết luận cơ chế nào.
- **Mới, export `buildProbeEnv({fixture, scratch, display, port,
  distDir})`**, và `runOneVariant` spawn probe Q6 qua hàm này
  thay cho object env viết tay. Hàm chỉ spread `process.env`
  rồi ghi đè đúng 6 khóa `Q6_*` — KHÔNG đặt, KHÔNG xóa, KHÔNG
  ghi đè `N2_PERSEEK` hay `N2_PERSEEK_GOP_SEC`. Giá trị 6 khóa
  `Q6_*` giữ nguyên y hệt bản cũ (đối chiếu từng khóa trước khi
  sửa) nên hành vi spawn không đổi ngoài việc tách hàm.
- **`runOneVariant`**: `perSeekProbe` giờ là
  `extractPerSeekReport(raw)` thay cho chuỗi hardcode. Không
  đổi logic cổng, ngưỡng, thứ tự xen kẽ, điều kiện dừng, hay
  fail-closed nào của runner.
- **Comment đầu file** về probe per-seek cập nhật: từ "chưa có
  trong harness N2" thành trạng thái sau T2 + V1 (đã cài, đã
  nối, chờ phiên thật).

### 1.2 `apps/web/scripts/seek-ab-solo-run.test.mjs` (+5 test mới)

- present: copy thật entries + `summaryReverse` (2 entry giả,
  `byMechanism: {mixed: 2}`).
- present 0 entry: vẫn `present`, `entryCount 0` (đường
  WebCodecs).
- absent: cờ tắt, forward-hold cũ (không có trường), và
  `null` đều `absent`, không có `entries`.
- enabled-but-missing: `perSeek: null` và `perSeek` thiếu
  `entries` đều ra trạng thái này, không bị đọc thành
  present hay absent.
- `buildProbeEnv`: với `N2_PERSEEK=1` +
  `N2_PERSEEK_GOP_SEC=10` đặt ở môi trường ngoài, env trả về
  giữ nguyên cả hai + đủ 6 khóa `Q6_*` (`Q6_PORT` dạng chuỗi
  `"4191"` như cũ); khi không đặt, env KHÔNG chứa `N2_PERSEEK`
  (runner không tự sinh cờ, đường đo mặc định vẫn TẮT). Test
  khôi phục env cũ trong `finally`.

## 2. Xác nhận luồng cờ N2_PERSEEK=1 solo → Q6 → N2 (lượt solo khô)

Chuỗi kế thừa env, kiểm chứng bằng đọc code + test, KHÔNG cần
chạy headed (chạy headed sẽ là phiên đo thật, bị cấm trong
luồng này):

| Tầng | Bằng chứng | Kết quả |
|---|---|---|
| solo → Q6 | `buildProbeEnv` spread `process.env`, chỉ ghi đè 6 khóa `Q6_*`; unit test §1.2 chứng minh `N2_PERSEEK=1` + `N2_PERSEEK_GOP_SEC=10` đi qua nguyên vẹn | PASS |
| Q6 → N2 | `probe-round34-q6-measure-protocol.mjs` dòng env spawn có `...process.env`; grep toàn file: KHÔNG có dòng nào gán `N2_PERSEEK` (chỉ ghi đè `N2_SCRATCH`, `K4_VIDEO`, `N2_DIST`, `K4_DISPLAY`, `K4_PORT`) | PASS (audit code) |
| N2 đọc cờ | `clicktest-round31-n2-reverse-fps-pipe.mjs` dòng 76: `PERSEEK_ENABLED = process.env.N2_PERSEEK === "1"` | PASS (audit code) |
| solo đọc lại | Fixture forward-hold tổng hợp (shape T2) chạy qua đúng hàm `extractPerSeekReport` mà `runOneVariant` dùng: file bật → `present, entryCount 2, summaryReverse {mixed: 2}`; file tắt → `absent` | PASS |

Fixture nằm ở scratch ngoài repo (không stage):
`~/workspace/tmp-round40-v1/forward-hold-perseek-on.json` và
`forward-hold-perseek-off.json`, cả hai đều ghi rõ trong file
là TỔNG HỢP, không phải số đo browser thật.

**Giới hạn của xác nhận này (trung thực):** tầng Q6 → N2 và N2
ghi forward-hold chỉ được audit bằng đọc code (đúng code T2 đã
chạy headed thật ở đợt 39 với `N2_PERSEEK=1` trực tiếp, nhưng
chưa có lượt nào chạy cờ qua đúng đường solo → Q6). Bằng chứng
runtime đầu tiên qua đủ 3 tầng sẽ là phiên solo thật từ main
chat — phiên đó phải kiểm tra `perSeekProbe.status` trong JSON
lượt đầu tiên trước khi chạy tiếp (nếu ra `absent` trong khi
đã đặt cờ thì dừng và xem log N2, đừng chạy hết 48 lượt rồi
mới phát hiện).

## 3. Kiểm chứng đã chạy (lệnh + số thật, không browser headed)

- `node --check` runner + test sau sửa → pass.
- `node --test apps/web/scripts/seek-ab-solo-run.test.mjs` →
  **16 pass, 0 fail** (11 cũ đợt 39 + 5 mới đợt 40 V1).
- Hồi quy cổng v3 (không sửa v3, chỉ chạy lại):
  `node --test apps/web/scripts/seek-ab-gate-v3.test.mjs` →
  **13 pass, 0 fail**.
- Hồi quy probe T2 (không sửa, chỉ chạy lại):
  `node --test apps/web/scripts/per-seek-probe.test.mjs` →
  **10 pass, 0 fail**.
- `node apps/web/scripts/seek-ab-solo-run.mjs --self-test` →
  **exit 0**, `ok: true`, `failures: []` (phân loại mẫu cũ + cặp
  R1 + khóa/drift như T1 đã công bố).
- `node apps/web/scripts/seek-ab-solo-run.mjs --dry-run` với
  `N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10` đặt ở môi trường ngoài →
  **exit 0**, `ok: true`, `problems: []` tại thời điểm chạy
  (máy thoáng đúng lúc đó: chromePre = 0, load < 2,0 — xem
  `~/workspace/tmp-round40-v1/dry-run-perseek.json`). Lưu ý:
  dry-run KHÔNG tiêu thụ cờ `N2_PERSEEK` (nó chỉ kiểm tra tiền
  điều kiện, không spawn Q6/N2) nên exit 0 này không tự nó chứng
  minh cờ chảy — chứng minh cờ chảy là bảng §2, không phải
  dry-run. Dry-run lúc máy bận vẫn exit 2 fail-closed theo
  thiết kế (T1 đã chứng minh; lượt này không chạy lại trường
  hợp bận vì không cần cho wiring).
- Không chạy: `tsc` / `vite build` (luồng không sửa TypeScript
  hay code sản phẩm — chỉ script .mjs đo lường); không chạy
  chế độ `run` của runner; không chạy browser headed nào.

## 4. Cái gì CHƯA làm (nợ còn lại — không mạo nhận)

1. **Phiên solo A/B thật vẫn chờ cửa sổ yên liên tục ~20–40 phút
   từ main chat** (nợ gốc T1, giữ nguyên). Phiên đó chạy với
   `N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10` ở môi trường ngoài, và
   lượt đầu phải kiểm tra `perSeekProbe.status == "present"`
   trong JSON lượt trước khi chạy tiếp (xem §2). Chỉ sau phiên
   đó mới được bàn khóa <10% và chốt v3 — luồng này KHÔNG khóa,
   KHÔNG chốt, KHÔNG đổi ngưỡng/cổng nào.
2. **Đường code `runOneVariant` từ spawn Q6 tới
   `extractPerSeekReport` chưa từng được thực thi** (thực thi
   nó đồng nghĩa chạy browser headed = phiên đo thật, bị cấm ở
   đây). Phần đã thực thi là seam thuần `extractPerSeekReport`
   + `buildProbeEnv` qua unit test và fixture; phần spawn/đọc
   file trong `runOneVariant` chỉ được đối chiếu bằng đọc code
   (đường đọc `forward-hold.json` và ghi JSON lượt là code cũ
   từ đợt 38, không đổi trong luồng này ngoài trường
   `perSeekProbe`).
3. **Q6 labeled vẫn chưa mang perSeek** (nửa sau của nợ T2 §5
   mục 2 — cần copy tường minh nếu muốn labeled mang bằng
   chứng cơ chế; Q6 hiện chỉ pick field cũ). Nằm ngoài phạm vi
   luồng V1 (chỉ giao solo runner), để luồng sở hữu Q6 quyết.
4. **Cờ `near-threshold-load5` vẫn chưa tự ghi trong runner**
   (ghi chú T1 §4.1, giữ nguyên — tính từ
   `verifySolo.loadSignals.load5Max` khi phân tích phiên sau).
5. **Probe v2 vẫn mở** (T2 §5 mục 4): elementId + ghi
   src/readyState lúc flush unresolved, lấy mẫu decoded trong
   lúc seeking, hook đường WebCodecs — phiên solo có perSeek v1
   vẫn chỉ tách được presentation sau seeked, chưa tách
   seek-scheduling khỏi decode stall (bằng chứng T2 §4.2).
6. **Nợ đứng chung:** Safari / máy thật / GPU thật / footage
   B-frame / độ phân giải khác / đường `asset:` — vẫn chưa đo.

## 5. File đổi/thêm (chỉ của V1 — text, không binary, không dist)

- Sửa: `apps/web/scripts/seek-ab-solo-run.mjs`
  (thêm export `extractPerSeekReport` + `buildProbeEnv`;
  `runOneVariant` spawn qua `buildProbeEnv` và ghi
  `perSeekProbe` từ `extractPerSeekReport(raw)`; cập nhật
  comment đầu file).
- Sửa: `apps/web/scripts/seek-ab-solo-run.test.mjs` (+5 test:
  present, present 0 entry, absent, enabled-but-missing,
  buildProbeEnv giữ/không sinh cờ).
- Mới: `docs/PHASE9_ROUND40_V1_SOLO_PERSEEK_LIMITS.md` (file này).
- Không sửa: cổng v2/v3, probe Q6, harness N2, code sản phẩm,
  file của luồng khác, paths-loop, build-loop-log. Không push,
  không tag, không tạo batch paths (theo lệnh luồng). Scratch
  ngoài repo (không stage): `~/workspace/tmp-round40-v1/`
  (2 fixture forward-hold tổng hợp, `self-test.json`,
  `dry-run-perseek.json`).

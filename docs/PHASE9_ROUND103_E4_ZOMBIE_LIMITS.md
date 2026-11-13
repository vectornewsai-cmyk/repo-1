# PHASE 9 — Đợt 103, luồng E4: Zombie tick stale-frame (đường vẽ) + độ trễ owner-kill trực tiếp

**Trạng thái: FIX ĐÃ LAND (bản mở rộng v2) — 0 frame stale trên mọi bằng chứng đo được (tick + draws + caps), độ trễ kill trực tiếp đo được trung vị 0,10–0,20 ms.**

- Cây đo: `~/workspace/repo-1`, boot `9576eac3` (reboot #27 ~05:26:18Z 13/11/2026). RAM ~1,2 GB — birefnet không chạy.
- Cây fix đo chính: `apps/web/src/preview.tsx` md5 `4e954101` (gate v2). Cây hiện tại lúc viết file này: md5 `c2251e39` — một luồng khác sửa preview.tsx 2 lần trong/sau lượt e4y2 (xem §6); code E4 còn nguyên vẹn trong file hiện tại (đã verify marker), hồi quy chạy lại trên cây hiện tại vẫn xanh.
- KHÔNG push. Batch đã stage: `~/workspace/repo-1-push/paths-loop/phase9-round103-e4-zombie.txt`.

## 1. Nợ 1 — đường tick vẽ 1 frame stale ở tick đầu sau nhảy: ĐÃ FIX (v2)

### 1.1 Baseline (hồi cứu trên dữ liệu D3 đợt 102, code trước E4)

- Phương pháp: tick record ghi frame thực sự được vẽ (`videoFrameIndex(element.currentTime)`); stale nếu lệch > 12 frame (~0,4 s) so với playhead nội suy từ state100. Cap "STALE-CANVAS" chỉ chứng minh canvas giữ frame cũ — chỉ tick record mới chứng minh một lần VẼ stale.
- **Tick-confirmed: 10 stale draws / 60 biên seek-across** (d3x0 0/11, d3x1 1/10, d3x2 1/10, d3c1 0/10, d3x3 1/8, **d3x4 7/11**).

### 1.2 Cơ chế (đã xác nhận bằng đọc code + dữ liệu)

Ở tick 1 sau nhảy, element tái dùng (không fresh) có drift > 0,35 s nhưng overCount mới 0→1 nên chưa phát seek, `seeking=false`, gate N3 (`shouldSkipRenderWhileSeeking`, chỉ chặn khi seeking=true) không chặn được — `drawVideoClip` vẽ frame cũ còn sót (ct 2,1–2,9 s). Tick 2 phát seek → seeking=true → N3 tiếp quản. Cửa sổ này là 1 tick logic nhưng có thể dài hàng trăm ms wall-clock khi rAF bị đói (d3x1 k=4: +813 ms, frame 90).

### 1.3 Fix v1 — chỉ chặn tick xác nhận đầu: CHƯA ĐỦ (không land bản này)

Gate E4-1: skip render ở tick mà element video xuôi lệch target mà chưa phát seek (`prevOver===0 && overCount===1`). Kết quả đo v1 (preview.tsx `110a51b9`):
- Tick-record: e4x1 **0/7**, e4x2 **0/10** → 0/17.
- Draws (kiểm chéo, bắt cả direct path clip lẻ — clip lẻ không có tick record): e4x1 0/14, e4x2 **2/23 STALE** — k=3 (+101 ms, ct=2,7223, kỳ vọng ~0,30) và k=23 (+290 ms, ct=2,8777, kỳ vọng ~0,57). Cả hai đều tới được canvas (mainDraw theo sau).
- Kết luận v1: gate chỉ chặn tick 0→1 để lọt cửa sổ ân hạn. Theo quy định nhiệm vụ §4, bản v1 KHÔNG được land nguyên trạng — đã mở rộng thay vì revert (mở rộng là hoàn thiện cùng một gate, không phải fix nửa vời khác).

### 1.4 Cơ chế lọt của v1 — grace W5/X4/Y4 giữ seek

Đọc dữ liệu thô e4x2 k=3 (seekRel 7765, nhảy tới 9,15): gate bắn ở tick đầu (e4skip 2→3), nhưng draws stale ct=2,7223 ở +101..+139 ms (4 draw), ct=2,8874 ở +297 ms, ct=2,9884 ở +402 ms, kèm mainDraw 7874/7904/8083/8175 — element PHÁT stale tới cuối nguồn (3,0 s) rồi restart H5 mới cứu (ct 0,667 ở +715 ms). Chuỗi nhân quả duy nhất khớp code (`shouldIssueForwardReseek`, `playheadPacing.ts:147`): **grace giữ overCount ở confirmTicks−1 → seek bị hoãn nhiều tick liền trong khi element vẫn lệch target 2,42 s**. k=23 cùng mẫu (gate bắn 1 lần, stale draw +290..+494 ms, 3 tick). Trần grace: watch/tail 5000 ms (`PLAYHEAD_RESUME_STALL_MAX_MS` / `PLAYHEAD_RESUME_STALL_GRACE_TAIL_MAX_MS`).

### 1.5 Fix v2 — mở rộng gate: ĐÃ LAND, 0 stale

Thay đổi duy nhất so với v1: điều kiện ghi pending từ `prevOver===0 && overCount===1` thành **`!decision.seek && decision.overCount >= 1`** (theo cấu trúc `shouldIssueForwardReseek` thì overCount ≥ 1 ⟺ drift vượt ngưỡng ở tick này mà seek không phát, không seeking, không vừa hoàn tất seek) — bao cả (a) tick xác nhận đầu và (b) tick bị grace giữ. `graceActive103E4` tách thành biến riêng (truyền vào helper như cũ, hành vi không đổi). Không đụng `shouldIssueForwardReseek` / `playheadPacing.ts` / logic seek-grace.

**Kết quả đo v2 (preview.tsx `4e954101`):**

| Lượt | Tick stale | Draws stale | Kill latency (n) | e4skip |
|---|---|---|---|---|
| e4y1 (thường) | 0/10 | **0/23** | median 0,20 ms, max 2,40 (n=12) | 207* |
| e4y2 (sysload 2) | 0/11 | **0/23** | median 0,10 ms, max 6,20 (n=12) | 23 |
| **Tổng v2** | **0/21** | **0/46** | **median 0,10–0,20 ms** | — |

\* e4skip 207 ở e4y1 tập trung ở **clip 18: +185 tick trong 1 đợt** (các clip khác đúng 1 tick/biên). Đợt này: element kẹt sau nhảy tới 54,15 (decoder stall — không tick record, không draw nào trong 3,1 s), playhead bị R2 hold giữ ở 54,2 suốt đợt (không lệch A/V), gate + N3 cùng skip 185 tick, phục hồi sạch ở ct=0,2. Canvas đóng băng 3,1 s trong khi playhead cũng đứng — đây là stall của element, gate chỉ chọn "đóng băng" thay vì "vẽ frame sai" trong lúc stall. Không phải hồi quy của gate: chi phí bình thường của gate là đúng 1 tick/biên.

- Cap "STALE-CANVAS" 23/23 mỗi lượt: đều là frame GIỮ trước nhảy trên canvas ~10–86 ms sau nhảy (tick 1 bị skip nên canvas chưa kịp vẽ frame mới) — hành vi giữ đúng, không phải draw stale. Sampler cap cũng không bắt được draw stale của v1 (bộ lọc |ctGap| ≤ 0,5 s loại đúng các draw này) — phương pháp draws mới là bằng chứng quyết định cho clip lẻ.
- Zombie Δ = 0 mọi biên (y1 + y2); skip-clip-inactive = 0 (cả 2 lượt); pixel parity đứng: clip lẻ C 91–100%, D = 0, out = 0 (y1 + y2).

### 1.6 Giới hạn còn lại của fix v2 (ghi rõ)

- Gate (b) có thể kéo dài tới trần grace 5000 ms trong trường hợp xấu nhất — canvas đóng băng (giữ frame trước nhảy) thay vì vẽ frame sai; đo thực tế: ~300–500 ms (k=3/k=23 v1) và 1 đợt stall 3,1 s ở e4y1 clip 18 (playhead cũng bị giữ, không lệch A/V). Đây là trade-off có chủ ý, cùng mẫu N3 — nhưng nếu grace bị giữ dài mà playhead KHÔNG bị giữ (trường hợp chưa quan sát được), canvas sẽ đóng băng trong khi âm thanh tiếp tục. Chưa có cơ chế cắt ngắn gate theo thời gian; nếu đợt sau quan sát được trường hợp đó thì cân nhắc trần skip (vd tối đa N tick liên tiếp) — nhưng trần đó sẽ mở lại một phần cửa sổ stale, cần đo lại từ đầu.
- Fix chỉ chặn đường VẼ của tick; không thay đổi thời điểm seek phát (grace vẫn hoãn seek như trước) — thời gian tới frame đúng sau nhảy không đổi (first correct draw +24..+494 ms sau seek, trừ đợt stall clip 18: +3103 ms).

## 2. Nợ 2 — độ trễ owner-kill trực tiếp: ĐÃ ĐO

- Phương pháp: production ghi `performance.now()` tại điểm kill vào `window.__vcut103e4SeekKills` (ring buffer 200 entry `{t, clipId, ph}`, chỉ đo — không đổi hành vi); probe ghi `tSeekRaw` = performance.now() ngay trước `setPlayhead` (cùng đồng hồ); latency = killTs − tSeekRaw; khớp biên bằng ph (tolerance 0,05 — playhead snap frame R1-055: target 3,15 → kill ph 3,1667).
- **e4x1: n=7, min 0,10 / median 0,20 / max 0,30 / mean 0,20 ms. e4x2: n=12, median 0,20 / max 6,70 / mean 0,70 ms (1 outlier 6,70 ms ở k=13 — cả setPlayhead cũng chậm 6,7 ms dưới sysload). e4y1: n=12, median 0,20 / max 2,40. e4y2: n=12, median 0,10 / max 6,20.**
- Đối chiếu C5 (gián tiếp qua check A6): **23–123 ms** → kill đồng bộ nay nhanh hơn ~100–600× (trung vị 0,10–0,20 ms). Khe early-return đã đóng ở mức đo trực tiếp.
- Chỉ biên lẻ có kill entry (biên chẵn clip cũ không blur nên không có pump để kill) — n=7–12/lượt là đúng thiết kế, không phải thiếu mẫu.
- Proxy "cửa sổ phơi" (first pump event sau seek) KHÔNG dùng được: clip lẻ không có pump nên first pump sau seek là pump của clip blur KẾ (+2,7–4,0 s) — không phải thời điểm callback của pump cũ. Không báo số này.

## 3. Code đã đổi (marker E4/103E4)

- `apps/web/src/preview.tsx` — 6 điểm: import predicate `shouldSkipRenderWhileDriftConfirmPending`; khai báo set `forwardDriftConfirmPendingThisTick` + counter; xóa set đầu mỗi `syncMedia`; nhánh forward: tách `graceActive103E4`, điều kiện pending `!decision.seek && decision.overCount >= 1 && VIDEO`; cuối `syncMedia`: OR gate E4 với N3, đếm `window.__vcut103e4DriftConfirmSkips`; `rvfcKillPumpsOutsidePlayhead`: ghi timestamp kill vào `window.__vcut103e4SeekKills`.
- `apps/web/src/lib/driftConfirmSkip103E4.ts` (mới) — predicate thuần `shouldSkipRenderWhileDriftConfirmPending(reversePlayback, actives, pendingEls)`: true iff có active VIDEO xuôi trong pending set; false với reverse/audio/clip ngược.
- `apps/web/src/lib/driftConfirmSkip103E4.test.ts` (mới) — 12/12 PASS. Đã thêm vào `apps/web/tsconfig.json` exclude (theo mẫu `d6.test.ts`).
- `apps/web/scripts/probe103e4-frame-parity.mjs` (mới) — probe đo frame parity (copy probe102d3 + tSeekRaw/tSetMs, state100 e4skip, kill/driftConfirm counters; draws giữ 2000).

## 4. Hồi quy sau fix (cây fix 4e954101, chạy lại trên cây hiện tại c2251e39 — đều xanh)

- `npx tsc --noEmit`: **0 lỗi** (cả 2 cây).
- `npx vite build`: **PASS** (14,17 s trên cây fix; 6,81 s trên cây hiện tại).
- Hold 75/75, Pacing54K9 19/19, previewEngine 27/27, seek 21/21, seekSkip86N3 9/9, previewLoop 20/20, ghostBlend 15/15, rvfcClipWindow102D3 21/21, driftConfirmSkip103E4 12/12, `test-preview-engine.sh` **354 assertions pass**.
- D3 markers còn nguyên (rvfcClipWindow import, sync kill, `__vcut102d3SeekKills`, pump-creation gate); C4 pad-oldest còn nguyên (10 dòng); E4 markers còn nguyên (30 dòng).

## 5. Ghi chú probe (trung thực về số đo)

- Lần chạy đầu (06:07Z): cả 2 lượt lỗi `ERR_CONNECTION_REFUSED` — vite lên rồi chết ENOSPC (hết inotify watchers, burst nhiều vite sibling cùng lúc). `sysctl -w fs.inotify.max_user_watches` bị từ chối (read-only fs, dù uid 0). Đo sau: chỉ 4784/63747 watch đang dùng → burst thoáng qua. Chạy lại thì được.
- e4x1 chỉ bắn 14/23 driver seek: playhead nhảy burst (+0,6–0,9 s giữa 2 mẫu state100 25 ms) qua cửa sổ poll 150 ms của driver (k=15..23) — các biên này vẫn qua tick-by-tick, sync kill vẫn bắn. Không phải lỗi probe hay fix.
- e4y2 `mtimeChanged=true`: preview.tsx đổi md5 trong/sau lượt (4e954101 → c965135a lúc 06:37:05, rồi c2251e39 lúc 06:38:03) do luồng khác sửa. Đo y2 vẫn dùng được: không có page reload nào (relPlay đơn điệu 9→58109, không reset), e4skip=23 đúng 1 tick/biên (gate sống suốt lượt), draws 0/23 — khớp y1 (cây sạch, mtimeChanged=false). File hiện tại đã verify: code E4 còn nguyên, D3/C4 còn nguyên, tsc 0 + toàn bộ suite xanh.
- **Va chạm cần parent/E9 lưu ý:** marker E3 đã BIẾN MẤT khỏi preview.tsx hiện tại (0 lần "E3"/"103 E3", trước đó 12 dòng) — luồng khác đã sửa/xóa phần E3 trong lúc E4 đo. E4 không đụng code luồng khác và không tự khôi phục E3; E9 kiểm chứng độc lập cần xác nhận trạng thái E3.

## 6. Nợ mở (cho đợt sau)

- G1 deinterlace vẫn mở chờ user quyết metric (nợ chung đợt 102 §4, không thuộc E4).
- Trần skip cho gate (b) nếu quan sát được grace dài mà playhead không bị giữ (xem §1.6).
- birefnet 0 lần thành công — chỉ thử lại khi RAM đổi (u2net là fallback chính thức).
- EPERM probe, ci-security.yml 403, TTS 39 CẤM kiểm lại, WebKit clip D — nợ chung đợt 102, không thuộc E4.

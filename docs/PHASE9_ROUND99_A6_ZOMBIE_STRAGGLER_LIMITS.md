# PHASE9_ROUND99_A6_ZOMBIE_STRAGGLER_LIMITS — check clip-active trong rvfcCallback chặn straggler tiền-seek

> Luồng A6, đợt 99. Lượt cron 00:35 +07 13/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> Nợ: LIMITS gộp đợt 98 §4 mục 7 / Z6 §4–§5 (zombie pump — tàn dư 0–1 capture straggler tiền-seek).
> Boot 99338d31 (reboot ~17:26Z trước lượt); RAM khả dụng 534–2775 MB trong lượt; load cao kéo dài do 10 luồng đợt 99 chạy song song (có lúc load1 15,48 lúc phát).

## 0. Tóm tắt verdict

**ĐÃ LÀM + ĐÃ ĐO — check clip-active trong `rvfcCallback` đã cài và chứng minh có tác dụng bằng fault-injection; tàn dư straggler tiền-seek ĐÃ ĐÓNG (0/13 biên, kể cả 4 biên Z6).** Check mới (`skip-clip-inactive`, marker "Đợt 99 A6" ×5): playhead trong store đã ra khỏi cửa sổ timeline của clip thì kill pump ngay trong callback, không chờ kill draw-path. Fault-injection (tắt kill draw-path bằng hook test): zombie Δ **+25 (đối chứng) → 0 (check bật)**, `skip-clip-inactive` bắn đúng **3/3 biên** blur→noblur, gồm 1 lần bắt đúng mẫu straggler tiền-seek frame 89. Đường chạy bình thường: check không bắn lần nào (owner-kill của Z6 bắn trước — đúng thiết kế, check là lưới an toàn cho khe kill-bị-trễ), zombie Δ 0/0/0, lastFrame 89/89/89, pixel parity đứng, test suite toàn xanh.

**Kết luận khảo sát (quan trọng hơn cả code): "sàn lý thuyết 0–1 capture" của Z6 §4 là thận trọng thừa — theo cơ chế event-loop thì sàn là 0.** Callback rVFC là task JS: callback dispatch trước tick vượt biên thì chạy TRƯỚC tick đó (capture tiền-biên hợp lệ, frame cuối clip cũ chính chủ — state100 zombie Δ = 0 đã chứng minh); callback sau tick vượt biên thì pump đã bị kill ở tick đó (cancel + `pump.active=false` → `skip-inactive` chặn cả trường hợp callback đã dispatch). Khe duy nhất còn lại là tick vượt biên KHÔNG chạy syncMedia/draw (early-return/idle) — đúng khe check mới bịt. Bằng chứng: 0 capture tiền-seek (frameIdx≥85) nào rơi vào cửa sổ clip kế ở cả 4 lượt đợt này (9 biên blur→noblur) + 4 biên Z6 = **0/13 biên**, kể cả lượt đối chứng đã tắt kill draw-path (22 capture zombie toàn là post-seek frameIdx<45).

## 1. Cơ chế + phương án đã chọn

### 1.1 Khảo sát tín hiệu có trong `rvfcCallback` lúc straggler bắn

| Tín hiệu | Giá trị lúc straggler bắn | Bắt được straggler? |
|---|---|---|
| `useStore.getState().playhead` | Giá trị tick gần nhất — vẫn TRONG cửa sổ clip cũ nếu callback bắn trước tick vượt biên; RA NGOÀI cửa sổ chỉ khi callback bắn sau tick vượt biên | Chỉ bắt được trường hợp sau (kill draw-path bị trễ) |
| `el.currentTime` / `metadata.mediaTime` | Tiền-seek: frame 85–89, vẫn trong range media của clip cũ | Không — frame là chính chủ clip cũ |
| `rvfcElementOwner` (bản ghi chủ Z6) | Vẫn là clip cũ (draw/sync chưa chạy) | Không |
| `pump.lastWantedMs` | Tươi (khẳng định ở tick trước) | Không |
| `pump.active` | `true` cho tới khi tick vượt biên kill | Đã chặn trường hợp callback dispatch sau kill (`skip-inactive`) |

Hệ quả: **không có check nào trong callback phân biệt được capture tiền-biên hợp lệ (frame 89 trước tick vượt biên) với "straggler"** — vì chúng là cùng một sự kiện, chỉ khác nhau ở mốc state100 tới trước hay sau nó trong lượng tử ±100–500 ms. Cái duy nhất check được là callback bắn SAU tick vượt biên mà kill chưa chạy — và đó chính là check đã cài.

### 1.2 Check đã cài

- **Cửa sổ trên pump:** `RvfcPumpState` thêm `clipStart`/`clipDuration` (giây, hệ playhead); `ensureRvfcPump` nhận thêm 2 field từ call-site duy nhất `drawVideoClip` (`clip.start`/`clip.duration` — cùng giá trị hook Z6 dùng), đặt lúc tạo pump + cập nhật mỗi lần khẳng định (trim/edit lúc phát cũng đúng).
- **Check trong `rvfcCallback`:** ngay sau stale-check 1500 ms, TRƯỚC register-first (để kill xong thì không đăng ký lại): nếu `clipDuration > 0` và playhead hữu hạn và playhead ngoài `[clipStart, clipStart+clipDuration)` → kill pump theo đúng mẫu zombie (`rvfcKillPump(clipId, "clip-inactive")` + xoá khỏi `rvfcPumps` + hồi dead nếu chưa chết vì lý do khác — mirror `rvfcKillZombiePumpsOnElement`) + `pumpEvent("skip-clip-inactive")` + return. Cửa sổ nửa mở khớp điều kiện draw của `drawVideoClip` (t đúng bằng biên = clip đã hết active).
- **An toàn phát lại:** kill không để lại dead (trừ clip vốn đã dead vì watchdog — không hồi sinh pump từng bị watchdog kill, mirror Y7/Z6). Pump chết vì stale vẫn qua đường cũ (không đụng `rvfcDeadClips`). Phát ngược/stepping không tạo pump (`steppingNow` chặn ở call-site) nên check không bao giờ gặp pump ngược. Chồng lấn/PiP: cửa sổ là của từng clip — vùng chồng lấn thì cả hai pump đều pass.
- **Chi phí:** 1 lần `useStore.getState().playhead` + so sánh range mỗi callback (~µs, cùng bậc với freshness guard đã có).
- **Hook test (mặc định tắt, không ảnh hưởng production — mirror `__vcutDisableRvfc`):** `window.__vcut99a6DisableOwnerKill = true` → `rvfcNoteVideoElementOwner` chỉ ghi nhận chủ, không kill (mô phỏng kill draw-path bị trễ/mất); `window.__vcut99a6DisableClipActiveCheck = true` → tắt check mới (đo đối chứng).

### 1.3 Vì sao không chọn phương án khác

- **Ước playhead theo wall-clock trong callback** (playhead_store + (now − lastTick) × tốc độ): BỊ BÁC — playhead bị đóng băng bởi giữ R2/S2 (hold) trong khi wall-clock vẫn chạy; ước lượng sẽ tuyên clip hết active oan giữa lúc hold rồi kill pump đang cần → hồi quy blur sau seek. Store playhead (dù stale 1 tick) là nguồn duy nhất tôn trọng hold.
- **Check `el.currentTime` so với range media:** BỊ BÁC — frame tiền-seek nằm trong range clip cũ nên không phân biệt được; chỉ bắt được frame đã seek (vốn đã là zombie post-seek, kill draw-path xử lý rồi).
- **Kill sớm hơn ở draw path:** không còn sớm hơn được — Z6 đã kill ở tick đầu clip mới; check mới chỉ bịt khe tick đó không chạy.

## 2. Đo trước/sau (probe99a6, kế thừa probe98z6: Chromium; config mới scroll-mixed-alt, 6 clip × 3 s: clip chẵn blur, clip lẻ KHÔNG blur → 3 biên blur→noblur/lượt)

| Chỉ số | base chr-mixedalt-a6base (trước sửa, build 848d21c0) | ctrl chr-mixedalt-a6ctrl (kill TẮT + check TẮT) | check chr-mixedalt-a6check (kill TẮT + check BẬT) | final chr-mixedalt-a6final (kill BẬT + check BẬT, build efce65dd) |
|---|---|---|---|---|
| Load lúc phát / RAM khả dụng | 1,97 / 1182 MB | 1,22 / 1479 MB | 15,48 / 1240 MB | 2,54 / 2775 MB |
| mtimeChanged / pageErrs | false / 0 | false / 0 | false / 0 | false / 0 |
| Zombie Δ state100 (3 biên blur→noblur) | **0 / 0 / 0** | **+12 / +5 / +8** (tổng +25) | **0 / 0 / 0** | **0 / 0 / 0** |
| Capture trong cửa sổ clip lẻ (post-seek <45 / pre-seek ≥85) | 0 / 0 (cả 3 cửa sổ) | 22 / 0 (11+4+7 / 0) | 0 / 0 | 0 / 0 |
| `skip-clip-inactive` | 0 | 0 | **3** (1/biên) | 0 |
| dbgFinal caps c0/c2/c4 | 6 / 7 / 8 | 28 / 27 / 24 | 7 / 5 / 16 | 20 / 51 / 13 |
| dbgFinal lastFrame c0/c2/c4 | 89 / 71 / 89 | 35 / 28 / 33 | 89 / 81 / 86 | 89 / 89 / 89 |
| dbgFinal fb c0/c2/c4 | clip-change ×3 | '' ×3 | clip-inactive ×3 | clip-change ×3 |
| Pump events (capture / skip-stale-frame) | 21 / 5 (n=26) | 76 / 14 (n=97) | 28 / 12 (n=43) | 84 / 14 (n=98) |
| Độ trễ kill fbAt − b_k | 0 / −32 / 0 ms | — (không kill) | −25 / −169 / −122 ms | −23 / −66 / −6 ms |

Đọc thêm:

- **Đối chứng phơi đúng zombie (ctrl):** tắt kill draw-path → zombie quay lại ngay: Δ +12/+5/+8, 22 capture post-seek (frameIdx 6–35 — frame của clip kế bị capture vào ring clip cũ), `lastFrame` bị ghi đè 89→35/28/33, fb không bao giờ set, pump sống tới stale (`skip-stale` ×3). Đây là bằng chứng fault-injection hoạt động — không phải check "tự dưng" cho 0.
- **Check bắt đúng 3/3 biên (check):** zombie về 0, `skip-clip-inactive` = 3, fb `clip-inactive` ×3. Ba lần bắn: relPlay 4813 frameIdx 6 (frame clip kế — zombie post-seek bị chặn), relPlay 11840 frameIdx 84 (frame cuối clip cũ nhưng element chưa seek xong), relPlay 18115 frameIdx 89 (**straggler tiền-seek đúng nghĩa** — frame cuối clip cũ trình sau khi playhead đã qua biên — bị chặn). Đây là lần đầu tiên mẫu straggler tiền-seek được quan sát trực tiếp — và nó chỉ xuất hiện khi kill draw-path bị tắt; ở đường chạy bình thường nó không tồn tại (xem §0).
- **Đường chạy bình thường không đổi (final vs base):** zombie 0/0/0 ở cả hai; check không bắn lần nào ở final (owner-kill bắn trước, fb `clip-change`); lastFrame 89/89/89 (final dày hơn base: caps 20/51/13 so với 6/7/8); không mất frame đầu clip mới (ringFirstAt offset wall 1686/1998/2629 ms — nhiễu mật độ capture dưới tải, như Z6).
- **Độ trễ kill âm là lượng tử sampler, không phải kill sớm:** fbAt − b_k = −6…−169 ms ở cả check lẫn final — b_k là mẫu state100 ĐẦU TIÊN thấy ph qua biên, mà state100 dưới tải chỉ có 77–1200 mẫu/lượt (interval giãn tới ~500 ms), nên mốc b_k tới sau tick vượt biên thật tới 1 khoảng mẫu; fbAt (sampler 10 ms + rAF) ghi đúng lúc kill hơn. Z6 đo dày hơn cho +3/0/+1 ms — cùng kết luận "kill bắn ở tick đầu clip mới" trong lượng tử đo.
- **lastFrame < 89 ở lượt thưa là nhiễu mật độ, không phải check:** base c2 = 71, check c2 = 81, c4 = 86 — các lượt này pump chỉ capture được 5–7 frame trong cả cửa sổ 3 s (callback thưa dưới tải); check chỉ bắn SAU biên nên không thể xoá capture tiền-biên. Final dày (caps 51 ở c2) thì lastFrame 89/89/89.

## 3. Không hồi quy: pixel parity + test suite

- **Tâm dải gStdRatio** (baseline noblur W3, cùng cách tính X5b/Y7/Z6 — analyze mới key theo frameIdx vì cùng file stripes cho mọi clip). Mean theo dải, base → ctrl → check → final:
  A 0,444/0,440/0,438 → 0,438/0,436/0,436 → 0,441/0,436/0,438 → 0,439/0,440/0,436;
  B 0,759/0,751/0,759 → 0,767/0,773/0,764 → 0,767/0,762/0,772 → 0,768/0,768/0,769;
  C 0,998/0,997/1,002 → 1,001/0,998/0,998 → 1,003/0,997/1,004 → 1,000/1,004/1,003;
  D 0,305 (c4) → 0,306/—/0,303 → 0,307/0,303/0,305 → 0,306 (c0).
  Tâm dải không đổi trong ±0,01 so với Y7/Z6 (A 0,438; B ~0,77; C 1,000; D ~0,306) → pixel parity đứng ở cả 4 lượt, kể cả lượt check.
- **Tỉ lệ mix:** clip lẻ (không blur) C 88–100% ở mọi lượt (đúng kỳ vọng); clip chẵn A chiếm đa số khi lượt dày (final c2 A 63%). Tỉ lệ D/B dao động theo mật độ capture (n nhỏ ở lượt thưa) — tâm dải mới là bằng chứng parity.
- **Test suite trên build đã sửa (efce65dd):** tsc web **0 lỗi**; vite build **PASS 37,36 s**; previewEngine **25/25**; playheadHold90R2 **56/56**; playheadPacing54K9 **19/19**; seek **21/21**; test-preview-engine.sh **354 assertions pass**.
- Ghi chú harness (lỗi sẵn, không do A6): `state100` bị cap 1200 mẫu (splice trong sampler) — lượt dài + chờ yên 90 s trước phát làm mẫu tiền-phát chiếm chỗ; mẫu trong lúc phát vẫn đủ (b_k xác định được cả 5 biên mọi lượt). Analyze A6 neo cửa sổ theo b_k quan sát được thay vì cửa sổ cố định 3000 ms của Z6 — cửa sổ cố định gán sai capture tiền-biên thành zombie khi playhead chạy 0,25–0,76× wall (Z6 §6 đếm frame 89 ở relPlay 3831 là "straggler" trong khi mốc biên thật là 3928 — capture đó xảy ra TRƯỚC biên).

## 4. Tàn dư + nợ còn lại

1. **Straggler tiền-seek: ĐÃ ĐÓNG.** 0/13 biên có capture tiền-seek rơi vào cửa sổ clip kế (9 biên đợt này + 4 biên Z6); check mới là lưới an toàn đã chứng minh bắn được khi kill draw-path bị tắt. Không cần probe thêm trừ khi quan sát được tick vượt biên early-return ngoài đời.
2. **Check không bắn ở đường bình thường (0 lần/final):** đúng thiết kế (owner-kill bắn trước) — giá trị của nó chỉ nằm ở khe kill-bị-trễ, chưa có mẫu ngoài đời. Nếu muốn đo tần suất khe đó, cần fault-injection sâu hơn (ép tick early-return) — ngoài phạm vi luồng này.
3. **Hook test `__vcut99a6DisableOwnerKill` / `__vcut99a6DisableClipActiveCheck`:** chỉ dùng cho harness, mặc định tắt (mirror `__vcutDisableRvfc`); có thể dọn ở đợt cleanup sau — giữ lại hiện tại để đợt sau đo lại được.
4. **Va chạm song song đợt 99 (đã ghi, không mất mát):** A2 (expose ring snapshots, marker "Đợt 99 A2" ×8) sửa `preview.tsx` TRƯỚC khi A6 đo baseline (md5 848d21c0 lúc 17:44:32Z) — baseline chạy trên cây đã có A2 (đúng cây "trước A6"); A2 không đụng vùng pump/draw-hook/syncMedia của A6 (marker đếm lại còn nguyên sau edit A6: Z6 ×5, A2 ×8). Cả 4 probe đều ghi mtimeChanged=false; md5 sau edit A6 là efce65dd, không đổi trong suốt quá trình test + probe hậu-sửa.
5. **Không đụng:** TTS 39, birefnet, `.github/workflows/*`, cloud/collab, nhạc bản quyền.

## 5. Kiểm chứng + batch đã stage (KHÔNG push)

- Harness: `apps/web/scripts/probe99a6-frame-parity.mjs` (copy probe98z6, chỉ đổi scratch → round99-a6 + thêm config `scroll-mixed-alt`: clip chẵn blur / clip lẻ không blur, `--nclips 6` → 3 biên blur→noblur/lượt; `clipOf` tổng quát theo NCLIPS; cờ `--disable-owner-kill` / `--disable-clip-check` set hook test) + `hidden_files/round99-a6-analyze.py` (copy Z6 + cửa sổ neo theo b_k quan sát được + đếm `skip-clip-inactive` + phân loại pre/post-seek trong cửa sổ clip lẻ).
- Dữ liệu: `hidden_files/round99-a6/` — chr-mixedalt-a6base, chr-mixedalt-a6ctrl, chr-mixedalt-a6check, chr-mixedalt-a6final (+ log driver, log test).
- Log luồng: `hidden_files/round99-a6.md`.
- Batch stage: `phase9-round99-a6-zombie.txt` — 3 entry, read-back OK, 0 binary, 0 workflow:
  - `apps/web/src/preview.tsx`
  - `apps/web/scripts/probe99a6-frame-parity.mjs`
  - `docs/PHASE9_ROUND99_A6_ZOMBIE_STRAGGLER_LIMITS.md` (file này)

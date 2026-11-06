# Phase 9 đợt 22 — Đóng nợ đợt 21: toast clip-aware, cổng hai tầng, preview ngủ, footage dọc, transition tầng ngoài — LIMITS TỔNG HỢP (parent)

Ngày: 2026-10-29 (lượt cron 20:03). Đợt lớn, 6 luồng song song, KHÔNG push,
KHÔNG tag/release, KHÔNG binary, KHÔNG dist. Batch stage (không push) ở
`~/workspace/repo-1-push/paths-loop/phase9-round22-closing-debts21.txt`.

## 0. Chốt chặn + bối cảnh

- `round-in-progress.md` KHÔNG tồn tại → lượt chạy bình thường.
- Trước đợt: 0 batch chờ push (đợt 5–21 đã push xong chiều 29/10).
- Chủ đề chọn từ nợ mở đợt 21 §3 (không trùng batch đã stage): toast
  chưa clip-aware, reason cổng hai tầng lẫn tiếng Việt hardcode, cổng lấy
  mẫu có thể sót đỉnh bezier, tab ẩn/hiện lúc preview ngủ chưa đo, scrub
  chuột automation chưa truy nguyên, chưa có clip dọc H.264, transition
  tầng ngoài chưa biết curve, click-test browser cho nested ramp chưa có.

## 1. Việc đã làm theo luồng

### A — Toast clip-aware + i18n reason cổng hai tầng
- Store notify + NestedClipPanel sang `nestedSpeedRejectionMessageForClip`:
  toast tách/trim nested nay pinpoint đúng case từng clip (reverse /
  curveEmpty / curveShape / curveRange / curveIntegral / curveWindow /
  ramp hợp lệ → không toast). Đường Timeline chính gọi cùng notify nên
  toast từ Timeline cũng đã clip-aware.
- I18n hóa reason cổng hai tầng bằng mapper `translateTwoLevelReason`
  (dịch ở tầng hiển thị, không sửa `nestUtils.ts`): 18 key
  `nested.twoLevel*` mới vi+en; wording vi bằng đúng chuỗi cổng cũ từng
  ký tự; parity dict 805/805, vi-only [], en-only [] (parent kiểm lại).
- Test mới 22A: 38 pass; hồi quy T3: 31 pass (S6 đổi có chủ đích: assertion
  cũ khóa hành vi "toast nêu lý do chung" — chính hành vi đợt này thay
  bằng lý do chi tiết).

### B — Cổng lấy mẫu tốc độ hợp chặt hơn
- Lá trực tiếp: giữ tập mẫu cũ (257 điểm + knot) và cộng cực trị bezier
  giải đúng (B'(p)=0 → đa thức bậc 2) + chia nhỏ thích ứng (lệch dây
  cung > 1e-4, sâu 10, ngân sách 100.000 đánh giá).
- Lá sâu: cộng cặp trong-cùng × lá bằng bộ lấy mẫu trực tiếp + lấy mẫu
  toàn chuỗi qua τ hợp; cố tình KHÔNG chặn cặp tầng-trung-gian × ngoài
  (render không kiểm tra riêng cặp đó, chặn sẽ chặn oan).
- Fast path nội bộ `FastCurve` (normalize 1 lần): stress 121-keyframe
  bezier 60s chỉ 269ms (trước fast path > 120s chưa xong).
- Test mới: 12 pass, gồm B1 đỉnh bezier hẹp ≈ 5.08 (cổng cũ cho qua,
  cổng mới chặn) và B9 đỉnh tương tác tích ≈ 5.86 (bằng chứng riêng cho
  chia nhỏ); hồi quy nestedCurveG2/nestUtils/twoLevelCurve… đều 0 fail.

### C — Preview ngủ: tab ẩn/hiện + truy nguyên scrub chuột
- Truy nguyên scrub chuột: KHÔNG phải bug app. Click CDP đầu tiên trên
  profile mới rơi vào backdrop của WelcomeModal (chưa có
  `vcut-welcomed`), ruler nhận 0 event — đó là lý do mọi click-test
  automation trước đây "scrub chuột thất bại". Giả thuyết cũ của T5
  (CDP không tạo đủ PointerEvent) đã chứng minh sai: sau khi đóng modal,
  click đơn ruler 50% đúng playhead 00:07.0, kéo 30%→70% đúng 11
  pointermove, clamp đúng duration 8s. Không sửa app để chiều automation;
  harness sau này phải đóng WelcomeModal trước.
- Tab ẩn/hiện: baseline đã đúng nhưng do may mắn (không có listener
  visibility nào). Đã thêm handler `visibilitychange` + `pageshow` vào
  `preview.tsx`: tab hiện lại mà vòng đang ngủ thì ép vẽ lại đúng frame
  cũ rồi ngủ lại. Sau sửa: ẩn ticks đóng băng 143 → hiện 150, sleeping
  = true ở 1s và 4s sau hiện, px hash không đổi.
- Hồi quy: Space phát/dừng, ArrowRight +1 frame, phím L +5s rồi ngủ lại.

### D — Footage dọc H.264 license sạch + parity
- 3 clip dọc đã xác minh qua API sơ cấp từng file (không tin nhãn):
  J (IA, public-domain mark, H.264 1080×1920 25fps), K (IA,
  public-domain mark, H.264 1080×1920 23,976fps), L (NASA, chính sách
  NASA, H.264 608×1080 30fps). Cổng phủ định hoạt động: IA BY-NC-SA và
  BY-NC-ND đều REJECT; clip NASA mô tả "vertical" nhưng đo 640×360
  ngang đã loại. Binary chỉ ở /tmp, stage chỉ script fetch.
- Parity (khung đo 720×1280, frame 45, p=0.5): cặp J→K dissolve RGB24
  0,0029 KHỚP, native dọc dissolve 0,0032 / circleopen 0,4972 KHỚP;
  cặp J→L dissolve RGB24 0,0027 KHỚP.
- Phát hiện mới: ngưỡng dissolve YUV crf ≤ 14 (R20) / ≤ 12 (R21) KHÔNG
  chuyển sang footage dọc — cặp J→L cần crf ≤ 10 mới KHỚP (crf14
  2,3471 XẤP XỈ, crf12 2,1117 XẤP XỈ, crf10 1,9464 KHỚP). Quy tắc mới
  trên mọi footage đã đo: dissolve YUV cần crf ≤ 10; circleopen vẫn
  KHỚP ở crf14 mọi cặp. Sàn YUV crf0 phụ thuộc nội dung (0,59 vs 1,63),
  không phải 0,0000 như test pattern R20.

### E — Transition tầng ngoài biết curve
- Khảo sát đính chính tiền đề: preview (`flattenForPreview`) ĐÃ đúng
  với nested ramp thường gặp (đối chiếu render ground truth từng số)
  nên không sửa logic preview, chỉ khóa bằng 4 test hồi quy E1–E4.
- Bug thật ở `flattenNested` placement-only của video-spec: nested ramp
  (start 10 dur 4, linear 1→3) cho placement tuyến tính sai hoàn toàn
  (L2 start 12 dur 6 thay vì start 11,4641 dur 2,5359). Đã sửa sang
  time-map hàm hợp thành (tầng hằng affine, tầng ramp τ chia đôi 80
  vòng, ngoại suy tuyến tính; curve hằng gộp chính xác về tốc độ hằng),
  mirror `.js` viết tay song song. Test video-spec 64/64, preview R3 21/21.

### F — Click-test browser cho nested ramp bằng CDP pipe
- Harness mới `clicktest-nested-ramp-pipe.mjs`, không dependency mới,
  không Playwright: tự bật Xvfb + vite preview, click chuột thật qua
  CDP `Input.dispatchMouseEvent`, 8/8 case pass, 2 lần chạy xanh liên
  tiếp (project mẫu load → multiselect → gộp nested → tạo curve hằng
  1× của T4 → đổi chế độ giữ-trim → 0 Runtime.exceptionThrown).
- Phát hiện sản phẩm quan trọng (parent đã vá ở §2, luồng F cố tình
  không chạm code sản phẩm): xem §2.

## 2. Sửa của parent ở bước gộp (duy nhất, ngoài các luồng)

- **Bug validator nested (phát hiện F, parent tự xác minh bằng code):**
  `validateClipDeep` trong `apps/web/src/lib/projectRepo.ts` không có
  nhánh `kind: "nested"` nên mọi project chứa nested clip đều bị từ
  chối ("kind không hỗ trợ: nested") và cổng load rơi về project mẫu —
  tức autosave/file có nested không mở lại được. Parent đã vá: nhánh
  nested chấp nhận kind, kiểm tra nông speed [0.25, 4] + trim in < out,
  validate đệ quy subSpec qua `validateSpecDeep` với chặn vòng lặp bằng
  tập spec tổ tiên sao chép theo nhánh (không chặn oan subSpec dùng
  chung ở hai clip anh em). Test parent mới
  `projectRepoNested22.test.ts`: 7 pass, gồm parseProjectText thật chấp
  nhận project có nested, nested 2 tầng, thiếu subSpec, lá trong subSpec
  hỏng, speed ngoài khoảng, và vòng lặp subSpec (không treo).
- Không sửa logic nào khác của các luồng; xung đột file chung gộp sạch
  (store.ts A, nestUtils.ts B, preview.tsx C, nested.ts E, i18n A).
  File tạm `probe22*.tmp.ts` / `tmp/fastcheck22.ts` mà các luồng báo
  trong lúc chạy đã không còn trên đĩa ở bước gộp — không đưa vào batch.

## 3. Kiểm chứng gộp của parent (chạy lại độc lập)

- tsc 0 lỗi (sau khi thêm test parent vào exclude theo quy ước repo),
  vite build pass (4,32s, chỉ warning chunk cũ).
- Test chạy lại: projectRepo 10/10, projectRepoNested22 (parent) 7/7,
  store 22A (esbuild) 38/38, T3 31/31, gate sampling B 12/12,
  nestedPreviewR3 21/21, video-spec nested (node --test) 64/64.
- Script: bash -n fetch script + node --check các script đo/harness đều
  pass; parity i18n 805/805 sạch, 18 key twoLevel mỗi bên.
- KHÔNG chạy lại ở bước gộp: đo headed của C (3 run) và harness F
  (2 run 8/8) — đó là số đo của luồng, ghi rõ trong LIMITS riêng; đo
  parity footage D đầy đủ cũng là số của luồng (parent chỉ kiểm tra
  script + kết quả log /tmp).

## 4. Những gì CHƯA xong — nợ mở cho đợt sau (không mạo nhận)

- Mapper i18n của A là cầu nối khớp chuỗi: nếu luồng sau đổi wording
  cổng mà không đổi mapper, nhánh đó fallback về reason gốc (en lại lẫn
  tiếng Việt; test 22A sẽ đỏ ngay). Đề xuất bền: cổng trả thêm
  `reasonCode` thay vì mapper khớp chuỗi.
- 8 nhánh cổng lá đã dịch nhưng chưa có caller UI sống nào toast chúng;
  `nestedCurveCreate.ts` vẫn trả chuỗi tiếng Việt nội bộ (panel đã dịch
  tại điểm toast).
- Cổng B vẫn có thể sót đỉnh tương tác tích hẹp hơn bề rộng tối thiểu
  của chia nhỏ (~khoảng gốc/1024); đỉnh của một thừa số đơn lẻ nay bắt
  đúng bằng cực trị bezier. Render vẫn là chốt chặn cuối.
- `flattenNested` vẫn không áp shift/fade biên (spec chuẩn không có
  field transitionIn/Out); `composeNestedLeafWindow` vẫn tuyến tính-only,
  bỏ qua speedKeyframes — cần đợt riêng nếu muốn nó biết curve.
- Chưa đo: tab ẩn lâu (discard canvas), tab ẩn lúc đang phát, bfcache
  restore thật (pageshow=0 trong các run đo), scrub tay người thật /
  touch / pen, máy thật (mọi số headed đều là VM Xvfb, raster phần mềm
  — cấm trích thành FPS máy user); native cặp dọc 2, fade/4K dọc,
  click-test browser trên footage dọc.
- Cảnh báo phát hành của D: J có người nhận diện được + vũ khí (trường
  bắn), K là tư liệu chiến tranh nhạy cảm, L provenance yếu (center HQ,
  photographer trống) — chỉ dùng để đo trong /tmp là an toàn, đưa vào
  kho phát hành cần rà soát lại.
- Ba tầng 1→2 đều nhau vẫn không hợp được (giới hạn định dạng từ R1);
  attachment thời gian dưới ramp vẫn fail-fast cả preview lẫn render.

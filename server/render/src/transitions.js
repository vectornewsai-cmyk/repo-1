/**
 * transitions.js — Catalog transition + builder filter xfade cho render worker.
 *
 * Mọi transition ở đây đều được triển khai bằng filter `xfade` CÓ SẴN của FFmpeg
 * (không cần shader custom, không cần OpenGL). Mỗi entry đã được kiểm chứng
 * bằng video MP4 render thật — xem TRANSITIONS_LIMITS.md.
 *
 * NGUYÊN TẮC TRUNG THỰC: chỉ liệt kê transition đã render thật thành công.
 * Transition chưa test được thì KHÔNG có mặt trong catalog này.
 *
 * Cách dùng trong render.js (agent chính tích hợp):
 *   const { buildXfadeFilter } = require("./transitions");
 *   // thay dòng xfade=transition=fade... hiện tại bằng:
 *   fc.push(`${cur.label}${seg.label}` + buildXfadeFilter(tr.type, T, cur.duration - T) + `[${x}]`);
 */
"use strict";

/** Format số cho filter FFmpeg (mirror num() trong render.js). */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

/**
 * Catalog đầy đủ. `xfade: null` nghĩa là "không phải hiệu ứng xfade"
 * (vd "none" — không có transition).
 *
 * @type {Array<{type:string, xfade:string|null, expr?:string, label:string, description:string, category:string}>}
 */
const TRANSITIONS = [
  {
    type: "none",
    xfade: null,
    label: "Không",
    description: "Cắt cứng, không hiệu ứng chuyển cảnh",
    category: "none",
  },
  {
    type: "fade",
    xfade: "fade",
    label: "Mờ dần",
    description: "Hai cảnh hòa vào nhau (crossfade cổ điển)",
    category: "fade",
  },
  {
    type: "fadeblack",
    xfade: "fadeblack",
    label: "Mờ qua đen",
    description: "Mờ dần qua màn hình đen rồi hiện cảnh mới",
    category: "fade",
  },
  {
    type: "fadewhite",
    xfade: "fadewhite",
    label: "Mờ qua trắng",
    description: "Mờ dần qua màn hình trắng rồi hiện cảnh mới",
    category: "fade",
  },
  {
    type: "wipeleft",
    xfade: "wipeleft",
    label: "Quét sang trái",
    description: "Cảnh mới quét từ phải sang, đẩy cảnh cũ sang trái",
    category: "wipe",
  },
  {
    type: "wiperight",
    xfade: "wiperight",
    label: "Quét sang phải",
    description: "Cảnh mới quét từ trái sang, đẩy cảnh cũ sang phải",
    category: "wipe",
  },
  {
    type: "wipeup",
    xfade: "wipeup",
    label: "Quét lên trên",
    description: "Cảnh mới quét từ dưới lên, đẩy cảnh cũ lên trên",
    category: "wipe",
  },
  {
    type: "wipedown",
    xfade: "wipedown",
    label: "Quét xuống dưới",
    description: "Cảnh mới quét từ trên xuống, đẩy cảnh cũ xuống dưới",
    category: "wipe",
  },
  {
    type: "slideleft",
    xfade: "slideleft",
    label: "Trượt sang trái",
    description: "Hai cảnh trượt ngang cùng nhau sang trái",
    category: "slide",
  },
  {
    type: "slideright",
    xfade: "slideright",
    label: "Trượt sang phải",
    description: "Hai cảnh trượt ngang cùng nhau sang phải",
    category: "slide",
  },
  {
    type: "dissolve",
    xfade: "dissolve",
    label: "Hòa tan",
    description: "Cảnh cũ tan thành hạt li ti, cảnh mới hiện dần",
    category: "fx",
  },
  {
    type: "circleopen",
    xfade: "circleopen",
    label: "Vòng tròn mở",
    description: "Cảnh mới hiện ra từ một vòng tròn nở dần ở giữa",
    category: "fx",
  },
  {
    type: "radial",
    xfade: "radial",
    label: "Xoay tỏa tròn",
    description: "Cảnh mới xoay tỏa ra như cánh quạt",
    category: "fx",
  },
  // ============ R1-073 (Batch G): 15 transition mới ============
  {
    type: "smoothleft",
    xfade: "smoothleft",
    label: "Trượt mượt sang trái",
    description: "Cảnh mới trượt mượt từ phải sang, có làm mờ biên",
    category: "slide",
  },
  {
    type: "smoothright",
    xfade: "smoothright",
    label: "Trượt mượt sang phải",
    description: "Cảnh mới trượt mượt từ trái sang, có làm mờ biên",
    category: "slide",
  },
  {
    type: "smoothup",
    xfade: "smoothup",
    label: "Trượt mượt lên trên",
    description: "Cảnh mới trượt mượt từ dưới lên, có làm mờ biên",
    category: "slide",
  },
  {
    type: "smoothdown",
    xfade: "smoothdown",
    label: "Trượt mượt xuống dưới",
    description: "Cảnh mới trượt mượt từ trên xuống, có làm mờ biên",
    category: "slide",
  },
  {
    type: "slideup",
    xfade: "slideup",
    label: "Trượt lên trên",
    description: "Hai cảnh trượt dọc cùng nhau lên trên",
    category: "slide",
  },
  {
    type: "slidedown",
    xfade: "slidedown",
    label: "Trượt xuống dưới",
    description: "Hai cảnh trượt dọc cùng nhau xuống dưới",
    category: "slide",
  },
  {
    type: "circleclose",
    xfade: "circleclose",
    label: "Vòng tròn khép",
    description: "Vòng tròn khép dần từ ngoài vào, lộ cảnh mới",
    category: "fx",
  },
  {
    type: "circlecrop",
    xfade: "circlecrop",
    label: "Cắt vòng tròn",
    description: "Cảnh cũ co dần thành vòng tròn rồi biến mất",
    category: "fx",
  },
  {
    type: "rectcrop",
    xfade: "rectcrop",
    label: "Cắt chữ nhật",
    description: "Cảnh cũ co dần thành hình chữ nhật rồi biến mất",
    category: "fx",
  },
  {
    type: "pixelize",
    xfade: "pixelize",
    label: "Điểm ảnh hóa",
    description: "Cảnh cũ vỡ thành ô vuông pixel rồi chuyển sang cảnh mới",
    category: "fx",
  },
  {
    type: "hblur",
    xfade: "hblur",
    label: "Mờ ngang",
    description: "Cảnh cũ mờ nhòe theo chiều ngang rồi chuyển cảnh",
    category: "fx",
  },
  {
    type: "distance",
    xfade: "distance",
    label: "Khoảng cách",
    description: "Cảnh mới tiến lại gần từ xa như hiệu ứng zoom",
    category: "fx",
  },
  {
    type: "vertopen",
    xfade: "vertopen",
    label: "Mở dọc",
    description: "Cảnh mới mở ra từ giữa theo chiều dọc",
    category: "wipe",
  },
  {
    type: "horzopen",
    xfade: "horzopen",
    label: "Mở ngang",
    description: "Cảnh mới mở ra từ giữa theo chiều ngang",
    category: "wipe",
  },
  {
    type: "diagtl",
    xfade: "diagtl",
    label: "Chéo góc trái-trên",
    description: "Cảnh mới quét chéo từ góc trái-trên",
    category: "wipe",
  },
  // ============ TransitionHarvest (Batch H+): 30 transition xfade còn thiếu ============
  // Tất cả đã kiểm chứng bằng MP4 render thật (ffmpeg 8.1.2, testsrc2+smptebars).
  {
    type: "vertclose",
    xfade: "vertclose",
    label: "Khép dọc",
    description: "Hai nửa trên-dưới khép lại vào giữa, lộ cảnh mới",
    category: "wipe",
  },
  {
    type: "horzclose",
    xfade: "horzclose",
    label: "Khép ngang",
    description: "Hai nửa trái-phải khép lại vào giữa, lộ cảnh mới",
    category: "wipe",
  },
  {
    type: "diagtr",
    xfade: "diagtr",
    label: "Chéo góc phải-trên",
    description: "Cảnh mới quét chéo từ góc phải-trên",
    category: "wipe",
  },
  {
    type: "diagbl",
    xfade: "diagbl",
    label: "Chéo góc trái-dưới",
    description: "Cảnh mới quét chéo từ góc trái-dưới",
    category: "wipe",
  },
  {
    type: "diagbr",
    xfade: "diagbr",
    label: "Chéo góc phải-dưới",
    description: "Cảnh mới quét chéo từ góc phải-dưới",
    category: "wipe",
  },
  {
    type: "hlslice",
    xfade: "hlslice",
    label: "Cắt lát ngang trái",
    description: "Cảnh mới hiện qua các lát cắt ngang từ trái",
    category: "fx",
  },
  {
    type: "hrslice",
    xfade: "hrslice",
    label: "Cắt lát ngang phải",
    description: "Cảnh mới hiện qua các lát cắt ngang từ phải",
    category: "fx",
  },
  {
    type: "vuslice",
    xfade: "vuslice",
    label: "Cắt lát dọc lên",
    description: "Cảnh mới hiện qua các lát cắt dọc từ dưới lên",
    category: "fx",
  },
  {
    type: "vdslice",
    xfade: "vdslice",
    label: "Cắt lát dọc xuống",
    description: "Cảnh mới hiện qua các lát cắt dọc từ trên xuống",
    category: "fx",
  },
  {
    type: "fadegrays",
    xfade: "fadegrays",
    label: "Mờ qua xám",
    description: "Mờ dần qua tông xám rồi hiện cảnh mới",
    category: "fade",
  },
  {
    type: "wipetl",
    xfade: "wipetl",
    label: "Quét góc trái-trên",
    description: "Cảnh mới quét từ góc trái-trên theo đường chéo",
    category: "wipe",
  },
  {
    type: "wipetr",
    xfade: "wipetr",
    label: "Quét góc phải-trên",
    description: "Cảnh mới quét từ góc phải-trên theo đường chéo",
    category: "wipe",
  },
  {
    type: "wipebl",
    xfade: "wipebl",
    label: "Quét góc trái-dưới",
    description: "Cảnh mới quét từ góc trái-dưới theo đường chéo",
    category: "wipe",
  },
  {
    type: "wipebr",
    xfade: "wipebr",
    label: "Quét góc phải-dưới",
    description: "Cảnh mới quét từ góc phải-dưới theo đường chéo",
    category: "wipe",
  },
  {
    type: "squeezeh",
    xfade: "squeezeh",
    label: "Ép ngang",
    description: "Cảnh cũ bị ép dẹt theo chiều ngang, cảnh mới giãn ra",
    category: "fx",
  },
  {
    type: "squeezev",
    xfade: "squeezev",
    label: "Ép dọc",
    description: "Cảnh cũ bị ép dẹt theo chiều dọc, cảnh mới giãn ra",
    category: "fx",
  },
  {
    type: "zoomin",
    xfade: "zoomin",
    label: "Zoom vào",
    description: "Cảnh mới zoom phóng to dần từ giữa",
    category: "fx",
  },
  {
    type: "fadefast",
    xfade: "fadefast",
    label: "Mờ nhanh",
    description: "Hòa vào nhau với tốc độ nhanh ở đầu",
    category: "fade",
  },
  {
    type: "fadeslow",
    xfade: "fadeslow",
    label: "Mờ chậm",
    description: "Hòa vào nhau với tốc độ chậm rãi",
    category: "fade",
  },
  {
    type: "hlwind",
    xfade: "hlwind",
    label: "Gió ngang trái",
    description: "Cảnh mới thổi vào từ trái như cơn gió ngang",
    category: "slide",
  },
  {
    type: "hrwind",
    xfade: "hrwind",
    label: "Gió ngang phải",
    description: "Cảnh mới thổi vào từ phải như cơn gió ngang",
    category: "slide",
  },
  {
    type: "vuwind",
    xfade: "vuwind",
    label: "Gió dọc lên",
    description: "Cảnh mới thổi vào từ dưới lên như cơn gió",
    category: "slide",
  },
  {
    type: "vdwind",
    xfade: "vdwind",
    label: "Gió dọc xuống",
    description: "Cảnh mới thổi vào từ trên xuống như cơn gió",
    category: "slide",
  },
  {
    type: "coverleft",
    xfade: "coverleft",
    label: "Phủ sang trái",
    description: "Cảnh mới phủ lên từ phải, che dần cảnh cũ sang trái",
    category: "slide",
  },
  {
    type: "coverright",
    xfade: "coverright",
    label: "Phủ sang phải",
    description: "Cảnh mới phủ lên từ trái, che dần cảnh cũ sang phải",
    category: "slide",
  },
  {
    type: "coverup",
    xfade: "coverup",
    label: "Phủ lên trên",
    description: "Cảnh mới phủ lên từ dưới, che dần cảnh cũ lên trên",
    category: "slide",
  },
  {
    type: "coverdown",
    xfade: "coverdown",
    label: "Phủ xuống dưới",
    description: "Cảnh mới phủ lên từ trên, che dần cảnh cũ xuống dưới",
    category: "slide",
  },
  {
    type: "revealleft",
    xfade: "revealleft",
    label: "Hé lộ sang trái",
    description: "Cảnh cũ trượt sang phải, hé lộ cảnh mới bên trái",
    category: "slide",
  },
  {
    type: "revealright",
    xfade: "revealright",
    label: "Hé lộ sang phải",
    description: "Cảnh cũ trượt sang trái, hé lộ cảnh mới bên phải",
    category: "slide",
  },
  {
    type: "revealup",
    xfade: "revealup",
    label: "Hé lộ lên trên",
    description: "Cảnh cũ trượt xuống, hé lộ cảnh mới bên trên",
    category: "slide",
  },
  {
    type: "revealdown",
    xfade: "revealdown",
    label: "Hé lộ xuống dưới",
    description: "Cảnh cũ trượt lên, hé lộ cảnh mới bên dưới",
    category: "slide",
  },
  // ============ P5 (Phase 7): 9 transition custom expr ============
  // FFmpeg 8.1.2 chỉ có 58 transition xfade built-in (đã dùng hết ở trên).
  // 9 transition này dùng xfade transition=custom + expr (chỉ tính toán trên
  // từng pixel: X, Y, W, H, A, B, P) — KHÔNG cần shader, KHÔNG cần gltransition.
  // Mỗi expr đã render thật bằng ffmpeg + kiểm chứng pixel (xem test_p5_transitions.py):
  // frame giữa transition khác cả 2 frame gốc, và blinds/bars có pattern xen kẽ đúng.
  // LƯU Ý QUOTING: expr chứa dấu phẩy nên PHẢI bọc trong '...' khi build filter
  // (xem buildXfadeFilter) — nếu không, dấu phẩy bị parser hiểu là tách filter.
  // ROUND14 R1: mọi expr dưới đây viết theo p-preview (tăng 0→1); buildXfadeFilter
  // dịch P→(1-P) vì FFmpeg 8.1.2 đánh giá P custom giảm 1→0 (đo thật, xem LIMITS
  // đợt 14 R1). Đừng "sửa" literal theo P-FFmpeg — sẽ đảo ngược 2 lần.
  {
    type: "blinds-h",
    xfade: "custom",
    expr: "if(lt(mod(Y,H/8),P*H/8),B,A)",
    label: "Mành ngang",
    description: "Cảnh mới hiện qua các lá mành ngang mở dần",
    category: "wipe",
  },
  {
    type: "bars-v",
    xfade: "custom",
    expr: "if(lt(mod(X,W/8),P*W/8),B,A)",
    label: "Thanh dọc",
    description: "Cảnh mới hiện qua các thanh dọc mở dần",
    category: "wipe",
  },
  {
    type: "checker",
    xfade: "custom",
    expr: "if(gt(P*4,mod(floor(X/(W/8))+floor(Y/(H/8)),4)),B,A)",
    label: "Bàn cờ",
    description: "Cảnh mới hiện dần theo các ô bàn cờ lan chéo",
    category: "fx",
  },
  {
    type: "diamond",
    xfade: "custom",
    expr: "if(lte(abs(X-W/2)+abs(Y-H/2),P*(W+H)/2),B,A)",
    label: "Hình thoi",
    description: "Cảnh mới nở ra từ hình thoi ở giữa",
    category: "fx",
  },
  {
    type: "plus",
    xfade: "custom",
    expr: "if(lte(min(abs(X-W/2),abs(Y-H/2)),P*min(W,H)/2),B,A)",
    label: "Dấu cộng",
    description: "Cảnh mới hiện theo hình dấu cộng lan ra",
    category: "fx",
  },
  {
    type: "grid",
    xfade: "custom",
    expr: "if(lte(max(mod(X,min(W,H)/8),mod(Y,min(W,H)/8)),P*min(W,H)/8),B,A)",
    label: "Lưới ô vuông",
    description: "Cảnh mới hiện qua các ô lưới vuông nở dần",
    category: "fx",
  },
  {
    type: "clock",
    xfade: "custom",
    expr: "if(lt(atan2(Y-H/2,X-W/2),-PI+2*PI*P),B,A)",
    label: "Quét đồng hồ",
    description: "Cảnh mới quét tròn như kim đồng hồ",
    category: "fx",
  },
  {
    type: "circle-soft",
    xfade: "custom",
    // ROUND14 R1 — LITERAL ĐÃ SỬA (đổi hệ số A/B so với bản gốc):
    // Bản gốc A*(1-clip(...))+B*clip(...) mô tả B ở NGOÀI vòng tròn
    // (B xâm nhập từ ngoài vào, tâm không bao giờ thành B — probe pixel
    // thật: frame cuối tâm vẫn đỏ 254,0,0, góc đã xanh từ frame 33),
    // ngược với mô tả "vòng tròn mở" và preview (B nở từ tâm ra, r=p*R).
    // Bản mới A*clip(...)+B*(1-clip(...)) mô tả đúng B trong đĩa bán
    // kính p*R với viền mềm 0.15R ở ngoài mép đĩa. Cùng với phép dịch
    // P→(1-P) của buildXfadeFilter, render sau sửa: tâm xanh sớm, góc
    // xanh muộn, frame cuối toàn B (xem LIMITS đợt 14 R1). Viền mềm vẫn
    // là xấp xỉ so với preview biên cứng — MAD so với preview biên cứng
    // sẽ cao hơn các type khác, đó là bản chất tính năng, không phải bug
    // hướng (đo soft-aware riêng trong LIMITS).
    expr: "A*clip((sqrt(pow(X-W/2,2)+pow(Y-H/2,2))-P*sqrt(pow(W/2,2)+pow(H/2,2)))/(0.15*sqrt(pow(W/2,2)+pow(H/2,2))),0,1)+B*(1-clip((sqrt(pow(X-W/2,2)+pow(Y-H/2,2))-P*sqrt(pow(W/2,2)+pow(H/2,2)))/(0.15*sqrt(pow(W/2,2)+pow(H/2,2))),0,1))",
    label: "Vòng tròn mềm",
    description: "Vòng tròn mở với viền mờ mềm (không cắt cứng)",
    category: "fx",
  },
  {
    type: "bars-fade",
    xfade: "custom",
    expr: "if(lt(mod(X,W/8),P*W/8),B,A*(1-P)+B*P)",
    label: "Thanh dọc + mờ",
    description: "Thanh dọc mở dần trên nền crossfade",
    category: "fx",
  },
  // ============ V3 (Phase 9 đợt 10): 14 transition custom expr mới ============
  // Cùng cơ chế P5 (xfade=custom + expr trên X, Y, W, H, A, B, P).
  // Mỗi expr đã render thật bằng ffmpeg + kiểm chứng pixel
  // (server/render/test_v10_transitions.py, 14/14 pass): frame giữa khác cả
  // 2 frame gốc và probe điểm đúng pattern hình học của từng hiệu ứng.
  // Lưu ý: expr chỉ CHỌN/TRỘN pixel A/B tại cùng tọa độ — không remap tọa độ,
  // nên không làm được xoay/zoom/morph (xem TRANSITIONS_LIMITS.md §V3).
  {
    type: "diamondclose",
    xfade: "custom",
    expr: "if(lte(abs(X-W/2)+abs(Y-H/2),(1-P)*(W+H)/2),A,B)",
    label: "Hình thoi khép",
    description: "Cảnh cũ co dần thành hình thoi ở giữa, lộ cảnh mới",
    category: "fx",
  },
  {
    type: "squareopen",
    xfade: "custom",
    expr: "if(lte(max(abs(X-W/2),abs(Y-H/2)),P*max(W,H)/2),B,A)",
    label: "Vuông mở",
    description: "Cảnh mới nở ra từ hình vuông ở giữa",
    category: "fx",
  },
  {
    type: "squareclose",
    xfade: "custom",
    expr: "if(lte(max(abs(X-W/2),abs(Y-H/2)),(1-P)*max(W,H)/2),A,B)",
    label: "Vuông khép",
    description: "Cảnh cũ co dần thành hình vuông ở giữa, lộ cảnh mới",
    category: "fx",
  },
  {
    type: "checker-alt",
    xfade: "custom",
    expr: "if(eq(mod(floor(X/(W/8))+floor(Y/(H/8)),2),0),if(gt(P,0.25),B,A),if(gt(P,0.75),B,A))",
    label: "Bàn cờ xen kẽ",
    description: "Ô bàn cờ chẵn hiện trước, ô lẻ hiện sau — giữa transition là bàn cờ rõ",
    category: "fx",
  },
  {
    type: "blinds-diag",
    xfade: "custom",
    expr: "if(lt(mod(X+Y,H/8),P*H/8),B,A)",
    label: "Mành chéo",
    description: "Cảnh mới hiện qua các dải mành chéo mở dần",
    category: "wipe",
  },
  {
    type: "split-h",
    xfade: "custom",
    expr: "if(lt(Y,H/2),if(lt(X,P*W),B,A),if(gt(X,W-P*W),B,A))",
    label: "Tách ngang",
    description: "Nửa trên quét từ trái, nửa dưới quét từ phải, gặp nhau ở giữa",
    category: "wipe",
  },
  {
    type: "split-v",
    xfade: "custom",
    expr: "if(lt(X,W/2),if(lt(Y,P*H),B,A),if(gt(Y,H-P*H),B,A))",
    label: "Tách dọc",
    description: "Nửa trái quét từ trên, nửa phải quét từ dưới, gặp nhau ở giữa",
    category: "wipe",
  },
  {
    type: "barn-h",
    xfade: "custom",
    expr: "if(lt(min(X,W-X),P*W/2),B,A)",
    label: "Cửa chuồng ngang",
    description: "Cảnh mới khép vào từ hai mép trái-phải như cửa chuồng",
    category: "wipe",
  },
  {
    type: "barn-v",
    xfade: "custom",
    expr: "if(lt(min(Y,H-Y),P*H/2),B,A)",
    label: "Cửa chuồng dọc",
    description: "Cảnh mới khép vào từ hai mép trên-dưới như cửa chuồng",
    category: "wipe",
  },
  {
    type: "rings",
    xfade: "custom",
    expr: "if(lt(mod(sqrt(pow(X-W/2,2)+pow(Y-H/2,2)),sqrt(pow(W/2,2)+pow(H/2,2))/4),P*sqrt(pow(W/2,2)+pow(H/2,2))/4),B,A)",
    label: "Vòng đồng tâm",
    description: "Cảnh mới hiện qua các vòng tròn đồng tâm mở dần",
    category: "fx",
  },
  {
    type: "corners",
    xfade: "custom",
    expr: "if(lte(min(min(pow(X,2)+pow(Y,2),pow(W-X,2)+pow(Y,2)),min(pow(X,2)+pow(H-Y,2),pow(W-X,2)+pow(H-Y,2))),pow(P*sqrt(pow(W/2,2)+pow(H/2,2)),2)),B,A)",
    label: "Bốn góc",
    description: "Cảnh mới nở ra đồng thời từ bốn góc màn hình",
    category: "fx",
  },
  {
    type: "star",
    xfade: "custom",
    expr: "if(lte(sqrt(pow(X-W/2,2)+pow(Y-H/2,2)),P*sqrt(pow(W/2,2)+pow(H/2,2))*(1+0.4*cos(5*atan2(Y-H/2,X-W/2)))/0.6),B,A)",
    label: "Ngôi sao",
    description: "Cảnh mới nở ra theo hình sao 5 cánh (xấp xỉ — xem TRANSITIONS_LIMITS.md)",
    category: "fx",
  },
  {
    type: "clock-ccw",
    xfade: "custom",
    expr: "if(gt(atan2(Y-H/2,X-W/2),PI-2*PI*P),B,A)",
    label: "Quét đồng hồ ngược",
    description: "Cảnh mới quét tròn ngược chiều kim đồng hồ",
    category: "fx",
  },
  {
    type: "spiral",
    xfade: "custom",
    expr: "if(lt(mod(atan2(Y-H/2,X-W/2)+PI+sqrt(pow(X-W/2,2)+pow(Y-H/2,2))*0.03,2*PI),2*PI*P),B,A)",
    label: "Xoắn ốc",
    description: "Cảnh mới quét tròn với cánh xoắn theo bán kính",
    category: "fx",
  },
];

/** @type {Map<string, object>} */
const BY_TYPE = new Map(TRANSITIONS.map((t) => [t.type, t]));

/**
 * Lấy metadata của một transition theo type.
 * @param {string} type
 * @returns {object|null} entry trong catalog, hoặc null nếu không tồn tại
 */
function getTransition(type) {
  return BY_TYPE.get(type) || null;
}

/**
 * Transition này có render được thật không?
 * ("none" cũng trả về true — nghĩa là "hợp lệ, không cần render gì".)
 * @param {string} type
 * @returns {boolean}
 */
function isSupportedTransition(type) {
  return BY_TYPE.has(type);
}

/**
 * Danh sách transition dùng được trong UI (bỏ "none").
 * @returns {Array<object>}
 */
function listTransitions() {
  return TRANSITIONS.filter((t) => t.type !== "none");
}

/**
 * Dựng filter xfade cho một cặp clip.
 *
 * @param {string} type       transition type trong catalog (phải khác "none")
 * @param {number} duration   độ dài transition T (giây, > 0)
 * @param {number} offset     offset của xfade tính từ đầu input THỨ NHẤT (giây).
 *                            Theo ngữ nghĩa của render worker: offset = duration_của_clip_A - T
 *                            (T giây cuối của A crossfade với T giây đầu của B).
 * @returns {string} filter expression, vd "xfade=transition=wipeleft:duration=1:offset=3"
 * @throws {Error} nếu type không hỗ trợ hoặc duration/offset không hợp lệ
 */
function buildXfadeFilter(type, duration, offset) {
  const t = getTransition(type);
  if (!t) throw new Error(`transition không tồn tại: "${type}"`);
  if (!t.xfade)
    throw new Error(`transition "${type}" không phải hiệu ứng xfade (không cần filter)`);
  if (!(duration > 0))
    throw new Error(`duration phải > 0, nhận được: ${duration}`);
  if (!(offset >= 0))
    throw new Error(`offset phải >= 0, nhận được: ${offset}`);
  let f = `xfade=transition=${t.xfade}:duration=${num(duration)}:offset=${num(offset)}`;
  if (t.expr) {
    // P5: expr chứa dấu phẩy (if(a,b,c)) nên PHẢI bọc trong '...' — nếu không
    // parser filtergraph sẽ hiểu dấu phẩy là tách filter và render lỗi.
    if (t.expr.includes("'"))
      throw new Error(`expr của transition "${type}" chứa dấu ' — không quote được`);
    // ROUND14 R1 — ĐẢO HƯỚNG P CỦA CUSTOM EXPR (đo thật, FFmpeg 8.1.2):
    // FFmpeg đánh giá expr custom với P GIẢM 1→0 qua các frame transition,
    // trong khi built-in và preview (transitionPreview.ts) tăng 0→1 — bằng
    // chứng: probe lavfi đỏ/xanh, duration=0.4/offset=1/fps=30: wipeleft
    // (built-in) B% tăng 0→99.5%, còn 22/23 type custom B% giảm 100→0%
    // (xem docs/PHASE9_ROUND14_R1_PDIRECTION_LIMITS.md). Giả thuyết "A/B
    // bị hoán đổi" đã bị loại bằng expr thăm dò không phụ thuộc P
    // (if(lt(X,W/2),B,A) cho nửa trái = xanh đúng, không đỏ).
    // Catalog expr viết theo p-preview (tăng 0→1, đúng như preview map),
    // nên ở đây dịch mọi token P độc lập thành (1-P) trước khi đưa cho
    // FFmpeg. Regex \bP\b KHÔNG chạm tới PI/pow/clip/... (P đứng một mình
    // mới khớp; PI có I theo sau nên không khớp). CẢNH BÁO PHIÊN BẢN:
    // phép dịch này gắn với hành vi P giảm của FFmpeg 8.1.2; nếu FFmpeg
    // đổi chiều P ở bản sau, phải bỏ phép dịch và đo lại toàn bộ 23 type.
    // Ngoại lệ duy nhất là circle-soft: literal của nó đã được sửa ở
    // catalog (đổi hệ số A/B, xem ghi chú tại entry đó) nên vẫn dịch
    // thống nhất như mọi type khác — KHÔNG có ngoại lệ trong hàm này.
    const ffExpr = t.expr.replace(/\bP\b/g, "(1-P)");
    f += `:expr='${ffExpr}'`;
  }
  return f;
}

module.exports = {
  TRANSITIONS,
  getTransition,
  isSupportedTransition,
  listTransitions,
  buildXfadeFilter,
};

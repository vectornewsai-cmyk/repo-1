// seekSkipRender86N3.ts — Đợt 86, luồng N3 (W6): quyết định có bỏ qua
// lần vẽ renderFrame của tick đang phát khi một clip video xuôi đang
// seeking hay không.
//
// Bối cảnh: M4 đợt 85 chứng minh drawImage element đang seeking là
// thành phần duy nhất làm seek chậm (~+270 ms/seek, 3–11×); probe 86n3
// đo tiếp trên cả 2 engine:
//   - Vẽ frame GIỮ mỗi tick lúc seeking (held) chỉ khá hơn draw trên
//     Chromium GOP 250 (213 vs 1025 ms) và WebKit GOP 250 (888 vs
//     1181 ms), nhưng BẰNG draw trên WebKit GOP 30 (902 vs 902 ms).
//   - KHÔNG VẼ GÌ lúc seeking (skip — canvas giữ nguyên nội dung cũ)
//     nhanh nhất: WebKit GOP 30 120 vs 902 ms (~7,5×), GOP 250 783 vs
//     1181 ms; Chromium GOP 250 285 vs 1025 ms (~3,6×).
//   - Vẽ giữ ĐÚNG 1 lần mỗi seek (heldonce) cũng nhanh (WebKit GOP 30
//     142 ms ≈ skip 120 ms) — chi phí nằm ở drawImage LẶP LẠI mỗi
//     tick trong lúc seek, không phải ở 1 lần vẽ.
// Vì renderFrame xóa nền mỗi tick nên "không vẽ clip đang seeking"
// trong drawVideoClip sẽ thành đen; cách duy nhất giữ được frame cũ
// mà không tốn drawImage nào là BỎ QUA CẢ LẦN RENDER của tick đó
// (canvas giữ nguyên frame trước seek — đúng nội dung frame giữ).
// Hàm này thuần để unit-test được; syncMedia trả cờ này về, nhánh
// playing trong preview.tsx bỏ qua renderFrame + không gán lastDrawn
// khi cờ bật (vòng lặp KHÔNG ngủ khi đang phát — xem
// previewLoopShouldSleep — nên tick sau vẫn chạy và vẽ lại khi seek
// xong; nhánh pause không dùng cờ này vì Seeker đã chờ seeked).
//
// Loại trừ: phát ngược toàn cục (reversePlayback) và clip reverse
// (stepping — element paused + seek từng frame, seeking gần như mọi
// tick; đường stepping đã hold qua stepDrawAllowedWithCompletion nên
// không cần gate này, và gate sẽ đóng băng canvas vĩnh viễn nếu áp).
// Chỉ element VIDEO xuôi mới gate (audio không vẽ gì).
export interface SeekSkipRenderActive {
  /** HTMLElement.tagName của element ("VIDEO" | "AUDIO"). */
  tag: string;
  /** Element có đang seeking không (HTMLMediaElement.seeking). */
  seeking: boolean;
  /** Clip có đang reverse/stepping không (ActiveMedia.reverse). */
  reverse: boolean;
}

/**
 * true = tick phát này nên bỏ qua renderFrame (có clip video xuôi
 * đang seeking — vẽ lúc này chỉ làm seek chậm thêm mà frame vẽ ra
 * vẫn là frame cũ).
 */
export function shouldSkipRenderWhileSeeking(
  reversePlayback: boolean,
  actives: readonly SeekSkipRenderActive[],
): boolean {
  if (reversePlayback) return false;
  for (const a of actives) {
    if (a.tag === "VIDEO" && !a.reverse && a.seeking) return true;
  }
  return false;
}

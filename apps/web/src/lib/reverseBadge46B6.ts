// reverseBadge46B6.ts — Phase 9 đợt 46, luồng B6 (compat i18n + badge).
//
// Tiếp nối A6 (đợt 45): A6 để lại 3 nợ mà B6 xử lý ở đây —
//  (1) wording badge failed mượn key element-missing (đã đóng bằng
//      key riêng badgeElementFailed/titleElementFailed ở i18n vi/en,
//      xem reverseBadge45A6.ts — module này KHÔNG sửa lại display đó);
//  (2) headed cho effect đổi lang lúc pause + badge failed (script
//      clicktest-round46-b6-badge-pipe.mjs, mức helper — xem LIMITS);
//  (3) badge từng track (phần dưới đây).
//
// VÌ SAO CHƯA TÁCH BADGE THEO TỪNG TRACK TRONG preview.tsx
// (thiết kế + chứng minh, không claim tách khi chỉ đổi label):
//
// Preview có ĐÚNG MỘT phần tử badge (.preview-reverse-engine-badge,
// một ref, một vị trí góc dưới-trái) và vòng lặp ghi đè textContent
// của nó mỗi tick. Khối tick của A6 duyệt track theo thứ tự, gặp
// clip stepping đầu tiên đã failed thì dừng (break) — nên khi 2
// clip ở 2 track cùng chồng nhau tại playhead, badge chỉ báo track
// đầu tiên, track thứ hai (dù failed hay không) vô hình. Đó là
// sụp đổ "nhiều track -> 1 badge", không phải lỗi logic resolve.
//
// Tách thật đòi đồng thời cả 3 thứ, không thứ nào là "gọn":
//  (a) Vùng neo riêng từng track trong khung preview: preview là
//      MỘT canvas đã composite — các track chỉ là lớp z chồng nhau,
//      không có làn (lane) riêng trên khung preview để gắn badge vào.
//      Làn track chỉ tồn tại ở panel Timeline, không phải preview.
//  (b) Nhãn track cho user đọc được: track.id nội bộ (vd "track-…")
//      không phải tên hiển thị; badge xếp chồng ở góc mà không có
//      tên track thì user không biết badge nào thuộc track nào.
//  (c) Plumbing DOM: badge hiện tại cố tình ghi DOM trực tiếp để
//      tránh re-render React mỗi frame; một pool N badge theo tick
//      là plumbing mới trong vòng lặp preview (tạo/xóa div theo
//      số track đang stepping), không phải sửa 1 dòng, và phải đi
//      kèm test headed trên app thật — ngoài phạm vi luồng này.
//
// Vì vậy module này chỉ cung cấp TẦNG THUẦN có thể tách được
// (collectReverseTrackBadges: một badge mỗi clip stepping tại
// playhead, giữ thứ tự track) + hàm mô tả đúng hành vi hiện tại
// (renderSingleBadgeFromTracks: lấy entry đầu tiên — chính là cái
// preview.tsx đang làm). Test 46B6 khóa: collect cho ra 2 badge
// khác kind với 2 track chồng nhau, nhưng single chỉ giữ 1 —
// chứng minh nợ vẫn mở, và khi nào preview có (a)+(b)+(c) thì chỉ
// cần thay điểm render bằng collect mà không sửa lại logic resolve.
//
// Hàm này KHÔNG được preview.tsx gọi (cố tình): gọi mà không đổi
// render thì chỉ là code chết mạo nhận đã tách.

import {
  resolveReverseEngineBadge45A6,
  type ReverseEngineBadge45A6,
} from "./reverseBadge45A6";
import type { ReverseEngineDetail } from "./reversePlayback";

export interface ReverseTrackBadgeInput {
  trackId: string;
  /** Thứ tự track trong spec (0 = track đầu tiên duyệt). */
  trackIndex: number;
  clipId: string;
  /** Clip có nằm tại playhead không (start <= t < start + duration). */
  atPlayhead: boolean;
  /** Clip này có đang stepping không (reverse toàn cục hoặc reverse). */
  stepping: boolean;
  detailed: ReverseEngineDetail;
  controllerFailed: boolean;
}

export interface ReverseTrackBadge {
  trackId: string;
  trackIndex: number;
  clipId: string;
  badge: ReverseEngineBadge45A6;
}

/**
 * Một badge mỗi clip stepping tại playhead, giữ thứ tự track.
 * Trả về [] khi không có clip nào stepping tại playhead (badge ẩn).
 * Không lọc theo kind: cả webcodecs lẫn element đều là thông tin
 * của track đó; việc ẩn/hiện do caller quyết như tick hiện tại
 * (badge null khi không stepping / opt-in tắt đã nằm trong resolve).
 */
export function collectReverseTrackBadges(
  inputs: ReverseTrackBadgeInput[],
): ReverseTrackBadge[] {
  const out: ReverseTrackBadge[] = [];
  const sorted = [...inputs].sort((a, b) => a.trackIndex - b.trackIndex);
  for (const it of sorted) {
    if (!it.atPlayhead || !it.stepping) continue;
    const badge = resolveReverseEngineBadge45A6(
      it.detailed,
      it.stepping,
      it.controllerFailed,
    );
    if (!badge) continue;
    out.push({
      trackId: it.trackId,
      trackIndex: it.trackIndex,
      clipId: it.clipId,
      badge,
    });
  }
  return out;
}

/**
 * Hành vi render HIỆN TẠI của preview.tsx (1 phần tử DOM): chỉ
 * entry đầu tiên (track duyệt trước) được hiển thị; các entry sau
 * bị mất — kể cả khi entry sau failed còn entry đầu vẫn webcodecs.
 * Hàm này tồn tại để test khóa sự sụp đổ đó, không phải để dùng
 * làm "tách badge" (dùng nó mà gọi là tách là claim sai).
 */
export function renderSingleBadgeFromTracks(
  perTrack: ReverseTrackBadge[],
): ReverseTrackBadge | null {
  return perTrack.length > 0 ? perTrack[0] : null;
}

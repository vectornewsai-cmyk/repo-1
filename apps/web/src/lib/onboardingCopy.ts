/**
 * onboardingCopy.ts — chuỗi riêng cho Onboarding / Tour / Template Pack (R1, Phase 9).
 *
 * Đợt 56 M8: 45 literal VI/EN đã dời khỏi file này sang fragment RIÊNG
 * `i18n/fragments/round56-m8.json`, rồi parent gộp 3 nhóm `welcome` /
 * `tour` / `pack` vào `vi.json` / `en.json` (đã verify: giá trị gộp khớp
 * từng chữ fragment). Vì vậy `ot()` giờ chỉ là bí danh của `t()` — caller
 * (WelcomeModal, TourCard, TemplatePackModal) giữ nguyên `ot("...")`,
 * không phải sửa gì. Ngữ nghĩa fallback giữ nguyên (ngôn ngữ hiện tại →
 * `vi` → key), vì `t()` dùng đúng cơ chế đó.
 */
import { t } from "../i18n";

/** Bí danh của `t()` — giữ API cũ cho 3 caller onboarding. */
export const ot = t;

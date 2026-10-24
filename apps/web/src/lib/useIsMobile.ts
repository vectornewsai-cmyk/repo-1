/**
 * Q6 (Phase 8) — Detect màn hình hẹp để chuyển editor sang layout mobile
 * (bottom sheet cho MediaBin/Inspector). Nghe thay đổi matchMedia để xoay
 * điện thoại hoặc resize cửa sổ đều cập nhật, không cần reload.
 */
import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 768): boolean {
  const [mobile, setMobile] = useState<boolean>(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia !== "undefined"
      ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);

  return mobile;
}

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { TopBar } from "./TopBar";
import { t, useLang } from "./i18n";
import { MediaBin } from "./MediaBin";
import { Inspector } from "./Inspector";
import { Timeline } from "./Timeline";
import { ExportPanel } from "./ExportPanel";
import { PreviewCanvas } from "./preview";
import { RelinkPanel } from "./components/RelinkPanel";
import { CaptionModal } from "./components/CaptionModal";
import { SilenceModal } from "./components/SilenceModal";
import { TemplatePicker } from "./components/TemplatePicker";
import { WelcomeModal, isWelcomed } from "./components/onboarding/WelcomeModal";
import { TourCard } from "./components/onboarding/TourCard";
import { TemplatePackModal } from "./components/onboarding/TemplatePackModal";
import { Toasts } from "./components/Toasts";
import { PerfOverlay } from "./components/PerfOverlay";
import { pushToast } from "./lib/toast";
import { useIsMobile } from "./lib/useIsMobile";
import { togglePreviewFullscreen } from "./preview";
import { autosave, autosaveNow, binMediaFromMedia, collectSpeedCurveWarnings, loadAutosave, markSaved, persistSessionPlayhead } from "./lib/projectRepo";
// Đợt 36 S5: nạp lại media bin từ AssetStore sau reload (trước checkMissingMedia).
import { AssetStore } from "./lib/assetStore";
import { rehydrateMediaItems } from "./lib/rehydrate36S5";
// Đợt 61 R9 — duy trì refCount thật của AssetStore (đóng nợ 60 Q7 §5.5):
// đồng bộ debounce mỗi khi spec/media đổi để lưới `remove()` từ chối
// khi còn tham chiếu có tác dụng thật.
import { syncAssetRefCounts, recordCurrentProjectRefs } from "./lib/idbCleanup61R9";
import { notifyProjectRefsChanged } from "./lib/projectAssetRefs62R7";
// Đợt 63 R7 — khóa sổ tham chiếu theo projectId ổn định thay cho tên.
import { projectKeyForId } from "./lib/projectId63R7";
// Đợt 53 J5 — origin bridge hiện tại để rehydrate ghép proxyUrl đầy đủ
// từ proxyPath trong manifest (cổng bridge có thể đổi giữa các phiên).
import { BRIDGE_URL } from "./lib/bridgeUrl";
// Đợt 54 K7 — kiểm tra proxy còn sống khi rehydrate (file proxy mất
// trên bridge → gỡ URL chết + đánh dấu stale thay vì giữ).
import { checkProxyAlive } from "./lib/proxy";
// Đợt 75 C6 — probe lại codec lúc rehydrate (badge cảnh báo sống qua reload).
import { probeImportedFileCodec } from "./lib/codecProbe";
import { saveCurrentProject, saveNotesLines } from "./components/project/ProjectMenu";
// Phase 10 G5 — cầu nối menu Electron (chỉ có tác dụng trong app desktop).
import { initDesktopMenuBridge, isDesktopMenuShortcut } from "./desktop";
// Phase 10 G4 — kéo-thả file từ file manager (chỉ có tác dụng trong app desktop).
import { initNativeDrop } from "./lib/nativeFiles";
// Phase 9 đợt 27 K5 (load report): chỉ vùng này thuộc K5 — panel xem lại
// warnings J5 sau khi toast đóng, strip mở lại + badge. Không đụng logic khác.
import { LoadReportPanel } from "./components/project/LoadReportPanel";
// Đợt 66 T7 — UI nhận mảnh legacy mơ hồ thủ công + adopt chuỗi legacy lúc khôi phục autosave.
import { LegacyHistoryAdoptModal } from "./components/project/LegacyHistoryAdoptModal";
import { adoptLegacyHistoryChain } from "./lib/projectHistory";
import { queueAmbiguousFromAdoptResult } from "./lib/legacyAdoptUi";
import {
  buildLoadReport,
  clearLastLoadReport,
  formatFixEntryChanges,
  formatOverflowLine,
  formatStructuredNote,
  formatWarningTranslated,
  getLastLoadReport,
  refreshLoadReportAfterFix,
  resolveUnsalvageableReason,
  setLastLoadReport,
  subscribeLoadReport,
  type LoadReport,
  type LoadReportFixHandler,
} from "./lib/loadReport";
// Phase 9 đợt 29 L4 (sửa riêng từng dòng của load report): xác nhận +
// tóm tắt dùng hàm thuần của luồng K2 đợt 27 + bản dịch theo locale
// hiện tại (changeItems / summary đã dịch); store action per-line mới
// fixOneSpeedCurveViolation chỉ sửa đúng clip ở dòng vừa bấm.
import {
  formatSanitizeSummaryLocalized,
  sanitizeOneKeyframe,
  sanitizeOneSpeedCurve,
  sanitizeSpecSpeedCurves,
} from "./lib/curveFix";

export default function App() {
  useLang(); // re-render khi đổi ngôn ngữ (splash + modal)
  const ready = useStore((s) => s.ready);
  const missingAssets = useStore((s) => s.missingAssets);
  const [exportOpen, setExportOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [silenceOpen, setSilenceOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  // R1 (Phase 9): onboarding — màn chào lần đầu, tour 5 bước, pack 1 chạm.
  const [welcomeOpen, setWelcomeOpen] = useState(() => !isWelcomed());
  const [tourOpen, setTourOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  // Q6 (Phase 8): mobile — MediaBin/Inspector thành bottom sheet, mặc định đóng
  // để preview + timeline chiếm màn hình; desktop giữ layout cũ nguyên vẹn.
  const isMobile = useIsMobile();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  // Đợt 27 K5: báo cáo lần load gần nhất + trạng thái mở panel.
  // Đợt 28 L4: đã nối onFixWarning thật (handleFixWarning dưới đây).
  const [loadReport, setLoadReportState] = useState<LoadReport | null>(() => getLastLoadReport());
  const [loadReportOpen, setLoadReportOpen] = useState(false);

  // Đợt 29 L4: hai nút sửa của LoadReportPanel, đều có confirm liệt kê
  // thay đổi + 1 bước undo + quét lại báo cáo sau sửa (warning đã sửa
  // biến mất, còn lại ở lại — kể cả curve không cứu được / track
  // khóa) + autosave ngay (đóng cửa sổ debounce 5s của autosave
  // thường). Tóm tắt sau sửa và từng dòng thay đổi trong confirm đều
  // dịch theo locale HIỆN TẠI (changeItems / summary đã dịch); chuỗi
  // tiếng Việt gốc trong curveFix giữ nguyên để fallback + test cũ.
  const lookup = (k: string, vars?: Record<string, string>): string => t(k, vars);
  const afterFix = (): void => {
    const after = useStore.getState();
    const remaining = collectSpeedCurveWarnings(after.spec);
    const current = getLastLoadReport();
    if (current) setLastLoadReport(refreshLoadReportAfterFix(current, remaining));
    // Đợt 36 S5: giữ session playhead khi ghi autosave ngay sau sửa.
    // Đợt 59 P1: ghi ngay cũng phải mang theo manifest bin hiện tại —
    // nếu không, lần ghi này sẽ ghi đè mất binMedia trong envelope và
    // reload sau đó mất bin (đúng nợ đang đóng).
    // Đợt 63 R7: ghi ngay cũng phải mang theo projectId — nếu không
    // envelope autosave mất id và reload sau migration sinh id khác.
    autosaveNow(after.spec, after.spec.meta.name, { playhead: after.playhead }, binMediaFromMedia(after.media), after.projectId);
  };
  // Nút "Sửa dòng này": CHỈ sửa curve của đúng clip ở dòng vừa bấm
  // (store fixOneSpeedCurveViolation + sanitizeOneSpeedCurve). Clip
  // có nhiều warning thì sửa một lần hết các vi phạm của clip đó;
  // clip khác không đụng tới dù cùng nằm trong báo cáo.
  const handleFixWarning: LoadReportFixHandler = (w) => {
    const st = useStore.getState();
    const preview = sanitizeOneSpeedCurve(st.spec, w.path);
    if (preview.fixed.length === 0) {
      pushToast(formatSanitizeSummaryLocalized(preview, lookup), "info");
      return;
    }
    const lines: string[] = [
      t("loadReport.fixLineConfirmTitle", { clip: w.clipId, path: w.path }),
    ];
    for (const f of preview.fixed) {
      lines.push(`• "${f.clipId}" (${f.path}):`);
      for (const c of formatFixEntryChanges(f, lookup)) lines.push(`    - ${c}`);
    }
    for (const u of preview.unsalvageable) {
      lines.push(`• "${u.clipId}" (${u.path}): ${t("loadReport.fixConfirmUnsalvageable", { reason: resolveUnsalvageableReason(u, lookup) })}`);
    }
    for (const s of preview.skippedLocked) {
      lines.push(`• "${s.clipId}" (${s.path}): ${t("loadReport.fixConfirmLocked")}`);
    }
    lines.push(t("loadReport.fixConfirmTiming"));
    if (!window.confirm(lines.join("\n"))) return;
    st.fixOneSpeedCurveViolation(w.path, formatSanitizeSummaryLocalized(preview, lookup));
    afterFix();
  };
  // Đợt 30 M4 — nút "Sửa keyframe này": CHỈ sửa keyframe có chỉ số
  // của dòng vừa bấm (store fixOneKeyframeViolation + sanitizeOneKeyframe).
  // Dòng không có keyframeIndex không có nút này (panel tự ẩn). Không
  // sửa được gì (keyframe đã hợp lệ / không cứu được / track khóa) thì
  // chỉ toast tóm tắt đã dịch, không confirm thừa, không push undo —
  // cùng mẫu handleFixWarning. Confirm liệt kê ĐÚNG MỘT thay đổi của
  // keyframe đó (không nhắc keyframe khác của cùng clip).
  const handleFixKeyframe: LoadReportFixHandler = (w) => {
    if (w.keyframeIndex === null) return;
    const st = useStore.getState();
    const preview = sanitizeOneKeyframe(st.spec, w.path, w.keyframeIndex);
    if (preview.fixed.length === 0) {
      pushToast(formatSanitizeSummaryLocalized(preview, lookup), "info");
      return;
    }
    const lines: string[] = [
      t("loadReport.fixKeyframeConfirmTitle", { index: String(w.keyframeIndex), clip: w.clipId, path: w.path }),
    ];
    for (const f of preview.fixed) {
      lines.push(`• "${f.clipId}" (${f.path}):`);
      for (const c of formatFixEntryChanges(f, lookup)) lines.push(`    - ${c}`);
    }
    for (const u of preview.unsalvageable) {
      lines.push(`• "${u.clipId}" (${u.path}): ${t("loadReport.fixConfirmUnsalvageable", { reason: resolveUnsalvageableReason(u, lookup) })}`);
    }
    for (const s of preview.skippedLocked) {
      lines.push(`• "${s.clipId}" (${s.path}): ${t("loadReport.fixConfirmLocked")}`);
    }
    lines.push(t("loadReport.fixConfirmTiming"));
    if (!window.confirm(lines.join("\n"))) return;
    st.fixOneKeyframeViolation(w.path, w.keyframeIndex, formatSanitizeSummaryLocalized(preview, lookup));
    afterFix();
  };
  // Nút "Sửa tất cả curve vi phạm": giữ hành vi đợt 28 (sửa toàn spec
  // qua store K2), nay nhãn nói rõ là "tất cả" và confirm/tóm tắt đã
  // dịch theo locale hiện tại.
  const handleFixAllWarnings = (): void => {
    const st = useStore.getState();
    const preview = sanitizeSpecSpeedCurves(st.spec);
    if (!preview.changed && preview.fixed.length === 0) {
      pushToast(formatSanitizeSummaryLocalized(preview, lookup), "info");
      return;
    }
    const lines: string[] = [t("loadReport.fixConfirmTitle")];
    for (const f of preview.fixed) {
      lines.push(`• "${f.clipId}" (${f.path}):`);
      for (const c of formatFixEntryChanges(f, lookup)) lines.push(`    - ${c}`);
    }
    for (const u of preview.unsalvageable) {
      lines.push(`• "${u.clipId}" (${u.path}): ${t("loadReport.fixConfirmUnsalvageable", { reason: resolveUnsalvageableReason(u, lookup) })}`);
    }
    for (const s of preview.skippedLocked) {
      lines.push(`• "${s.clipId}" (${s.path}): ${t("loadReport.fixConfirmLocked")}`);
    }
    lines.push(t("loadReport.fixConfirmTiming"));
    if (!window.confirm(lines.join("\n"))) return;
    st.fixSpeedCurveViolations(formatSanitizeSummaryLocalized(preview, lookup));
    afterFix();
  };

  // Khởi tạo: ưu tiên khôi phục autosave; chỉ tải project mẫu khi chưa có autosave.
  // (Không tự ghi đè project đang làm bằng sample khi reload.)
  // Đợt 36 S5: sau replaceProject (media bin rỗng), khôi phục playhead từ
  // session autosave (paused — playing/reverse luôn reset, xem LIMITS S5),
  // rồi nạp lại media bin từ AssetStore TRƯỚC khi checkMissingMedia()
  // chạy — thứ tự này là điểm sửa chính: trước đây checkMissingMedia
  // chạy khi bin còn rỗng nên mọi clip đều hiện panel Relink oan.
  // IndexedDB bị chặn thì rehydrate fail-soft (catch → bin rỗng) và
  // panel Relink hiện như hành vi cũ, không làm hỏng khởi động.
  useEffect(() => {
    const st = useStore.getState();
    const auto = loadAutosave(t);
    if (auto) {
      // Đợt 63 R7 — khôi phục cả projectId từ autosave (file cũ thì
      // loadAutosave đã migration sinh mới); không truyền thì
      // replaceProject sinh id mới mỗi lần reload và sổ tham chiếu
      // phình thêm bản ghi.
      st.replaceProject(auto.spec, auto.projectId);
      st.setProjectName(auto.name);
      markSaved(auto.spec);
      // Đợt 66 T7 — khôi phục autosave cũng nhận chuỗi legacy (nợ đợt 65
      // S9 §5.2): autosave envelope CÓ spec làm bằng chứng nội dung nên
      // chỉ cần nối `opts.spec`. Tên truyền là tên project vì autosave
      // không lưu tên file .vcut gốc — nhận chắc chắn theo hash không
      // ảnh hưởng, chỉ phân loại mơ hồ theo tên là best-effort. Chạy
      // nền (không chặn rehydrate): chuỗi/mảnh mơ hồ → hàng đợi UI
      // nhận thủ công (LegacyHistoryAdoptModal). adopt không bao giờ
      // throw; catch để khỏi unhandled rejection nếu kho lỗi bất ngờ.
      void adoptLegacyHistoryChain(auto.projectId, auto.name, undefined, { spec: auto.spec })
        .then(queueAmbiguousFromAdoptResult)
        .catch(() => { /* lịch sử lỗi không được làm hỏng khởi động */ });
      if (auto.session !== null) st.setPlayhead(auto.session.playhead); // clamp + snap frame trong setPlayhead
      void (async () => {
        try {
          const store = new AssetStore();
          const res = await rehydrateMediaItems(
            {
              listManifests: () => store.list(),
              loadBlob: (id) => store.getBlob(id),
              makeObjectURL: (blob) => URL.createObjectURL(blob),
              // Đợt 53 J5 — ghép proxyUrl từ proxyPath trong manifest với
              // origin bridge HIỆN TẠI (live binding, đúng cả khi desktop
              // đổi cổng bridge 8787 → 8788).
              proxyBaseUrl: BRIDGE_URL,
              // Đợt 54 K7 — HEAD kiểm tra file proxy còn trên bridge không;
              // chỉ 404 chắc chắn mới bị coi là chết (bridge tắt/mất mạng
              // thì giữ proxy như cũ, xem checkProxyAlive).
              checkProxyUrl: checkProxyAlive,
              // Đợt 75 C6 — probe lại codec cho item khôi phục: cờ
              // unsupportedCodec chỉ sống trong phiên import nên reload
              // là mất badge; probe lại từ File đã dựng (fail-open
              // trong rehydrate: lỗi → không gắn cờ, không hỏng khởi
              // động). Chỉ verdict "unsupported" mới trả nhãn codec.
              probeUnsupportedCodec: async (file) => {
                const probe = await probeImportedFileCodec(file);
                return probe && probe.verdict === "unsupported"
                  ? probe.codecLabel
                  : undefined;
              },
            },
            auto.spec,
            // Đợt 59 P1 — manifest bin từ envelope autosave (null =
            // envelope cũ → rehydrate chỉ theo spec như hành vi cũ):
            // media đã import nhưng không còn clip nào tham chiếu vẫn
            // về lại bin sau reload.
            auto.binMedia ?? undefined,
          );
          if (res.items.length > 0) st.restoreMediaBin(res.items);
          // Đợt 54 K7 — proxy chết (file mất trên bridge): xóa proxyPath
          // khỏi manifest để lần sau khỏi kiểm tra lại đường dẫn chết;
          // item đã mang proxyStale nên MediaBin hiện nút tạo lại.
          if (res.staleProxies.length > 0) {
            for (const s of res.staleProxies) {
              try {
                await store.setProxy(s.assetId, null);
              } catch {
                // best-effort: chỉ mất dọn manifest, item vẫn báo stale
              }
            }
            pushToast(
              t("app.proxyStaleToast", {
                names: res.staleProxies.map((s) => `"${s.name}"`).join(", "),
              }),
              "info",
            );
          }
        } catch {
          // IndexedDB không khả dụng → giữ bin rỗng, Relink báo như cũ.
        }
        st.checkMissingMedia(); // R1-033: hiện panel relink nếu media thiếu
        // Đợt 26 J5: autosave khôi phục trước đây nuốt warnings; nay hiện
        // toast như đường mở file (ProjectMenu.warnList), kể cả cảnh báo
        // speedKeyframes fail-soft từ cổng load.
        // Đợt 29 L4: toast này dịch message J5 theo locale HIỆN TẠI qua
        // formatWarningTranslated (thay cho chuỗi tiếng Việt đóng băng
        // lúc load); các lưu ý chuỗi khác giữ nguyên như trước.
        // Đợt 27 K5: giữ báo cáo lần khôi phục này để panel xem lại được
        // sau khi toast đóng (kể cả khi 0 warning — strip chỉ hiện khi >0).
        const autoReport = buildLoadReport(auto, "autosave", auto.name);
        if (auto.warnings.length > 0) {
          // Đợt 31 N4: thêm structuredNotes đã dịch (blob/migration/format/
          // style); otherWarnings nay chỉ còn chuỗi lẻ chưa có dạng cấu trúc.
          const toastLines = [
            ...autoReport.warnings.map((w) => formatWarningTranslated(w, lookup)),
            ...autoReport.structuredNotes.map((n) => formatStructuredNote(n, lookup)),
            ...autoReport.otherWarnings,
          ];
          if (autoReport.atCap)
            toastLines.push(
              autoReport.overflowCount != null
                ? formatOverflowLine(autoReport.overflowCount, lookup)
                : t("loadReport.atCap"),
            );
          pushToast(`${t("loadReport.autosaveRestoredNote")}: ${toastLines.join("; ")}`, "info");
        }
        setLastLoadReport(autoReport);
      })();
    } else {
      void st.loadSample();
    }
  }, []);

  // Đợt 27 K5: đồng bộ báo cáo lần load gần nhất từ module store
  // (ProjectMenu ghi sau mỗi lần mở file / nhập bản nén).
  useEffect(() => subscribeLoadReport(setLoadReportState), []);

  // Autosave (debounce 5s) mỗi khi spec thay đổi.
  // Đợt 36 S5: kèm playhead tại thời điểm spec đổi để autosave mang
  // session (chỉ playhead; playing/reverse không bền — xem LIMITS S5).
  // Đợt 59 P1: media bin đổi (import / xóa khỏi bin / rehydrate khôi
  // phục) cũng phải autosave — KHÔNG thì manifest binMedia trong
  // envelope kẹt ở trạng thái cũ và reload mất đúng media vừa đổi.
  // Bin thay đổi nhưng spec không đổi vẫn ghi (vd: import media rồi
  // chưa thêm clip nào vào timeline).
  useEffect(() => {
    const unsub = useStore.subscribe((s, prev) => {
      if (s.spec !== prev.spec || s.media !== prev.media)
        // Đợt 63 R7 — autosave mang theo projectId (không thì reload
        // migration sinh id mới mỗi lần).
        autosave(s.spec, s.spec.meta.name, { playhead: s.playhead }, binMediaFromMedia(s.media), s.projectId);
    });
    return unsub;
  }, []);

  // Đợt 61 R9 — duy trì refCount thật của AssetStore (đóng nợ 60 Q7
  // §5.5): đồng bộ debounce 1s mỗi khi spec/media đổi. Đây là đường
  // phủ MỌI cách đổi spec/bin (thêm/xóa clip, undo/redo, mở file, load
  // sample, relink) mà không cần móc vào từng action của store — sync
  // tái tính toàn bộ từ trạng thái hiện tại nên không lệch dần. Chỉ
  // ghi IndexedDB (không chạm zustand) nên không tạo vòng lặp; lỗi kho
  // (IDB bị chặn) tự nuốt — refCount chỉ phục vụ lưới an toàn khi xóa
  // bytes, không ảnh hưởng thao tác đang làm. Đồng bộ lần đầu sau mount
  // để refCount cũ từ phiên trước được tính lại (effect đăng ký sau
  // effect khởi tạo nên lần restore autosave đầu có thể đã qua).
  // Đợt 62 R7 — cùng lượt này ghi luôn sổ tham chiếu liên project
  // (recordCurrentProjectRefs: tập asset project hiện tại dùng) để UI
  // dọn kho ở project KHÁC chặn xóa bytes project này còn dùng; chỉ
  // broadcast cho tab khác khi tập asset đổi (tránh quét lại vô ích).
  // Đợt 63 R7 — khóa sổ theo projectId ổn định (`id:<uuid>`, xem
  // projectKeyForId) thay cho tên: hai file trùng tên không còn chung
  // một khóa; ghi kèm expectedGeneration nên lượt sync cũ (đọc gen
  // cũ) bị từ chối stale thay vì ghi đè dữ liệu mới (xem
  // recordCurrentProjectRefs). Sync refCount chạy dưới lock liên tab
  // `vcut-refcount-sync` (navigator.locks, xem syncAssetRefCounts) —
  // hai tab cùng origin không xen kẽ đọc-ghi refCount của nhau.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const runSync = () => {
      timer = null;
      try {
        const st = useStore.getState();
        const store = new AssetStore();
        const locks =
          typeof navigator !== "undefined" && navigator.locks ? navigator.locks : null;
        void syncAssetRefCounts(store, st.spec, st.media, { locks }).catch(() => {
          // bỏ qua lặng lẽ — chỉ mất cập nhật refCount lần này
        });
        void recordCurrentProjectRefs(
          store,
          st.spec,
          st.media,
          projectKeyForId(st.projectId),
          st.spec.meta.name,
          st.projectId,
        )
          .then((rep) => {
            if (rep.recorded && rep.changed) notifyProjectRefsChanged();
          })
          .catch(() => {
            // bỏ qua lặng lẽ — chỉ mất cập nhật sổ lần này
          });
      } catch {
        // IndexedDB không khả dụng — bỏ qua lặng lẽ như trên
      }
    };
    const schedule = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(runSync, 1000);
    };
    const unsub = useStore.subscribe((s, prev) => {
      if (s.spec !== prev.spec || s.media !== prev.media) schedule();
    });
    timer = setTimeout(runSync, 1500);
    return () => {
      unsub();
      if (timer !== null) clearTimeout(timer);
    };
  }, []);

  // Đợt 36 S5: ghi playhead cuối trước khi trang ẩn/kết thúc — bắt trường
  // hợp spec không đổi sau lần seek cuối (debounce spec không kích hoạt)
  // để reload vẫn khôi phục đúng vị trí. Chỉ cập nhật field session
  // (persistSessionPlayhead), KHÔNG viết lại envelope: viết lại sẽ ghi
  // đè spec mới hơn của tab khác và xóa seed kiểm chứng (lỗi phát hiện
  // ở probe pha B — xem LIMITS S5 §4). Ghi localStorage đồng bộ nên
  // kịp chạy trong pagehide; lỗi storage tự nuốt như cũ.
  useEffect(() => {
    const flushSession = () => {
      persistSessionPlayhead(useStore.getState().playhead);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushSession();
    };
    window.addEventListener("pagehide", flushSession);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flushSession);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Phase 10 G5 — cầu nối menu Electron (menu, mở file, đồng bộ ngôn
  // ngữ). Trên trình duyệt thường, initDesktopMenuBridge trả về no-op.
  // Phase 10 G4 — kéo-thả file từ file manager (chỉ chặn drop có File;
  // kéo nội bộ Timeline/MediaBin đi qua như cũ).
  useEffect(() => {
    const cleanBridge = initDesktopMenuBridge({ openExport: () => setExportOpen(true) });
    const cleanDrop = initNativeDrop();
    return () => {
      cleanBridge();
      cleanDrop();
    };
  }, []);

  // phím tắt toàn cục
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }
      // Phase 10 G5 — chạy trong app desktop: các tổ hợp menu đã nhận
      // (Ctrl+S/Z/A/C/V/D) do menu xử lý qua IPC; bỏ qua ở đây để
      // không chạy trùng hai lần. Ctrl+Y không có trong menu nên App
      // vẫn xử lý làm redo như bản web. Ngoài desktop, hàm này luôn false.
      if (isDesktopMenuShortcut(e)) {
        return;
      }
      // R1-107: Esc đóng modal đang mở (setter idempotent — gọi cả 3 an toàn
      // vì hook deps [] giữ closure; chỉ 1 modal mở tại 1 thời điểm)
      if (e.key === "Escape") {
        setExportOpen(false);
        setCaptionOpen(false);
        setSilenceOpen(false);
        setLoadReportOpen(false); // Đợt 27 K5: Esc cũng đóng panel load report.
        return;
      }
      // Ctrl/Cmd+S: lưu project (chặn hành vi lưu trang của trình duyệt)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        // Đợt 31 N4: lưu ý đã dịch qua structuredNotes (cùng helper với
        // nút Lưu trong menu); câu chữ giữ nguyên như trước, chỉ qua key.
        const lines = saveNotesLines(saveCurrentProject());
        if (lines.length > 0) {
          // K5: toast thay window.alert (không chặn luồng làm việc).
          pushToast(t("projectMenu.saveNotes", { notes: lines.join("; ") }), "info");
        } else {
          pushToast(t("projectMenu.saveDone"), "success");
        }
        return;
      }
      const st = useStore.getState();
      // R1-051: Ctrl/Cmd+Z hoàn tác, Ctrl/Cmd+Shift+Z hoặc Ctrl/Cmd+Y làm lại
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        st.redo();
        return;
      }
      // Ctrl/Cmd+A: chọn tất cả clip (R1-052)
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        const sels: { trackId: string; clipId: string }[] = [];
        for (const t of st.spec.tracks)
          for (const c of t.clips) sels.push({ trackId: t.id, clipId: c.id });
        st.selectMany(sels);
        return;
      }
      // K2 (Phase 6): Ctrl/Cmd+C copy, Ctrl/Cmd+V paste, Ctrl/Cmd+D duplicate.
      // (Đã return sớm ở trên khi focus trong input/textarea — copy/paste
      // văn bản gốc của trình duyệt vẫn hoạt động bình thường.)
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        st.copySelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        st.pasteClipboard();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        st.duplicateSelection();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        st.togglePlay();
      } else if (e.key === "s" || e.key === "S") {
        st.splitAtPlayhead();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        st.deleteSelection();
      } else if (e.key === "k" || e.key === "K") {
        // K5: K phát/dừng theo hướng hiện tại (Space cũng vậy). J/L kiểu
        // shuttle từ đợt 27 K4: J = phát ngược toàn cục (playhead lùi
        // từng frame, không audio đồng bộ — xem
        // PHASE9_ROUND27_K4_REVERSE_HOLD_LIMITS.md), L = tua +5s như cũ.
        // Đổi hành vi J: trước đây J tua -5s; tua lùi nay dùng ArrowLeft
        // (từng frame) hoặc kéo playhead — shuttle J chuẩn NLE quan trọng
        // hơn nút tua -5s.
        st.togglePlay();
      } else if (e.key === "j" || e.key === "J") {
        st.toggleReversePlayback();
      } else if (e.key === "l" || e.key === "L") {
        st.setPlayhead(Math.min(st.duration(), st.playhead + 5));
      } else if (e.key === "Home") {
        e.preventDefault();
        st.setPlayhead(0);
      } else if (e.key === "End") {
        e.preventDefault();
        st.setPlayhead(st.duration());
      } else if (e.key === "ArrowLeft") {
        // K5: tua từng frame (không có modifier — tránh xung đột với
        // di chuyển caret trong input, đã được guard ở đầu handler).
        e.preventDefault();
        const fps = st.spec.meta.fps || 30;
        st.setPlayhead(Math.max(0, st.playhead - 1 / fps));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const fps = st.spec.meta.fps || 30;
        st.setPlayhead(Math.min(st.duration(), st.playhead + 1 / fps));
      } else if (e.key === "f" || e.key === "F") {
        // K5: fullscreen preview.
        togglePreviewFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        // Phase 9: thêm marker tại playhead (cùng nút 📍 trên Timeline).
        const n = (st.spec.markers ?? []).length + 1;
        st.addMarkerAtPlayhead(t("timeline.markerDefault", { n: String(n) }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <TopBar onExport={() => setExportOpen(true)} onCaption={() => setCaptionOpen(true)} onSilence={() => setSilenceOpen(true)} onTemplate={() => setTemplateOpen(true)} onWelcome={() => setWelcomeOpen(true)} />
      {/* Đợt 27 K5: strip báo cáo tải — chỉ hiện khi lần load gần nhất
          có warning cấu trúc và panel đang đóng; đóng panel thì strip
          quay lại nên mở lại được, "Bỏ qua" mới xoá hẳn báo cáo.
          Dùng inline style để không đụng styles.css của luồng khác. */}
      {loadReport && loadReport.warnings.length > 0 && !loadReportOpen && (
        <div
          role="status"
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            padding: "6px 14px",
            fontSize: 13,
            background: "rgba(255, 193, 7, 0.12)",
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          <span>{t("loadReport.strip", { n: String(loadReport.warnings.length) })}</span>
          <button type="button" onClick={() => setLoadReportOpen(true)}>
            {t("loadReport.view")}
          </button>
          <button type="button" onClick={() => clearLastLoadReport()}>
            {t("loadReport.dismiss")}
          </button>
        </div>
      )}
      <div className="editor-main">
        {!isMobile && <MediaBin />}
        <div className="preview-col">
          <PreviewCanvas />
        </div>
        {!isMobile && <Inspector />}
      </div>
      <Timeline />
      {isMobile && (
        <div className="m-fabbar" role="group" aria-label="Panel mobile">
          <button
            type="button"
            className={`m-fab${mediaOpen ? " active" : ""}`}
            title={t("app.mediaLibrary")}
            aria-label={t("app.openMediaLibrary")}
            aria-expanded={mediaOpen}
            onClick={() => {
              setMediaOpen(!mediaOpen);
              setInspectorOpen(false);
            }}
          >
            📁
          </button>
          <button
            type="button"
            className={`m-fab${inspectorOpen ? " active" : ""}`}
            title={t("app.clipProps")}
            aria-label={t("app.openInspector")}
            aria-expanded={inspectorOpen}
            onClick={() => {
              setInspectorOpen(!inspectorOpen);
              setMediaOpen(false);
            }}
          >
            ⚙️
          </button>
        </div>
      )}
      {isMobile && mediaOpen && (
        <div className="m-sheet-backdrop" onClick={() => setMediaOpen(false)}>
          <div className="m-sheet" role="dialog" aria-modal="true" aria-label={t("app.mediaLibrary")} onClick={(e) => e.stopPropagation()}>
            <div className="m-sheet-grabber" aria-hidden="true" />
            <div className="m-sheet-head">
              <span className="m-sheet-title">{t("app.mediaLibraryShort")}</span>
              <button type="button" className="m-sheet-close" aria-label={t("app.closeMediaLibrary")} onClick={() => setMediaOpen(false)}>✕</button>
            </div>
            <MediaBin />
          </div>
        </div>
      )}
      {isMobile && inspectorOpen && (
        <div className="m-sheet-backdrop" onClick={() => setInspectorOpen(false)}>
          <div className="m-sheet" role="dialog" aria-modal="true" aria-label={t("app.clipProps")} onClick={(e) => e.stopPropagation()}>
            <div className="m-sheet-grabber" aria-hidden="true" />
            <div className="m-sheet-head">
              <span className="m-sheet-title">{t("app.propsShort")}</span>
              <button type="button" className="m-sheet-close" aria-label={t("app.closeInspector")} onClick={() => setInspectorOpen(false)}>✕</button>
            </div>
            <Inspector />
          </div>
        </div>
      )}
      {welcomeOpen && ready && (
        <WelcomeModal
          onClose={() => setWelcomeOpen(false)}
          onOpenTour={() => {
            setWelcomeOpen(false);
            setTourOpen(true);
          }}
          onOpenPack={() => {
            setWelcomeOpen(false);
            setPackOpen(true);
          }}
        />
      )}
      {tourOpen && <TourCard onClose={() => setTourOpen(false)} />}
      {packOpen && <TemplatePackModal onClose={() => setPackOpen(false)} />}
      {exportOpen && <ExportPanel onClose={() => setExportOpen(false)} />}
      {captionOpen && <CaptionModal onClose={() => setCaptionOpen(false)} />}
      {silenceOpen && <SilenceModal onClose={() => setSilenceOpen(false)} />}
      {templateOpen && <TemplatePicker onClose={() => setTemplateOpen(false)} />}
      {/* K5: chồng toast toàn cục */}
      <Toasts />
      {/* Đợt 66 T7: modal nhận mảnh legacy mơ hồ thủ công — hiện khi
          adopt ở đường mở file / nhập archive / khôi phục autosave gặp
          chuỗi mơ hồ (tên khớp nhưng hash lệch). */}
      <LegacyHistoryAdoptModal />
      {/* Đợt 27 K5: panel báo cáo tải; đợt 28 L4 nối nút "Sửa" thật; đợt 29 L4 tách thành "Sửa dòng này" (riêng từng clip) + "Sửa tất cả". */}
      {loadReportOpen && loadReport && (
        <LoadReportPanel report={loadReport} onClose={() => setLoadReportOpen(false)} onFixWarning={handleFixWarning} onFixAllWarnings={handleFixAllWarnings} onFixKeyframe={handleFixKeyframe} />
      )}
      {missingAssets && missingAssets.length > 0 && (
        <RelinkPanel
          missing={missingAssets}
          onPick={(pick, onProgress) =>
            useStore.getState().relinkMedia(pick.oldSrc, pick.file, onProgress)
          }
          onCleanupAliases={() => useStore.getState().cleanupStaleAliases()}
          onClose={() => useStore.getState().dismissRelink()}
        />
      )}
      {/* R3 (Phase 9): FPS meter — nút nổi góc phải, không chạm preview.tsx */}
      <PerfOverlay />
      {!ready && (
        <div className="splash">
          <div className="splash-card">
            <div className="splash-logo" aria-hidden="true">◧</div>
            <div className="splash-title">{t("app.name")}</div>
            <div className="splash-sub">{t("app.loading")}</div>
          </div>
        </div>
      )}
    </div>
  );
}

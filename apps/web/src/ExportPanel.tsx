/**
 * Panel Export: kiểm tra spec hợp lệ (dùng isVideoSpec + kiểm tra sâu),
 * xem trước JSON, tải xuống file .videospec.json hoặc sao chép.
 *
 * Phase P0-01: thêm xuất MP4 thật qua bridge server (server/bridge/).
 * Bridge nhận spec + file media, chạy render worker, trả về MP4.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { VideoSpec } from "@repo-1/video-spec";
import { isVideoSpec, projectDuration, SPEC_VERSION } from "@repo-1/video-spec";
import { buildSharePage, downloadSharePage, SHARE_EMBED_MAX_BYTES } from "./lib/sharePage";
import { collectSpeedCurveWarnings } from "./lib/projectRepo";
import {
  exportCurveBlockers,
  formatSanitizeSummaryLocalized,
  sanitizeSpecSpeedCurves,
} from "./lib/curveFix";
import {
  formatFixEntryChanges,
  formatWarningTranslated,
  resolveUnsalvageableReason,
} from "./lib/loadReport";
import { getLang, t, useLang } from "./i18n";
import { pushToast } from "./lib/toast";
import { localizedErrorSummary } from "./lib/errorDetailSummary";
import { resolveBridgeApiError } from "./lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web
import { resolveValidationDetails } from "./lib/validationErrors"; // Đợt 63 R5: dịch từng dòng validator
import { resolveJobNote } from "./lib/jobNote64R8"; // Đợt 64 R8: hiển thị job.note (phục hồi sau restart) trong khối tiến trình render
import {
  pickResumeCandidate,
  resumeJobStrings,
  type ResumableRenderJob,
} from "./lib/resumeRenderJob66T8"; // Đợt 66 T8: resume job đang chạy khi mở lại panel (đóng nợ S10 đợt 65)
import {
  gpuProbeDoneText,
  gpuProbeErrorText,
  gpuProbeStatusText,
  gpuProbeStrings,
  type GpuProbeStatus,
} from "./lib/gpuProbe65S4"; // Đợt 65 S4: trạng thái probe GPU + nút "Probe lại GPU" (đóng nợ cache probe đợt 64 R1)
// Phase 10 G4 — trong Electron, chọn đích .mp4 trước khi render rồi
// lưu MP4 đã render xong ra đó (thay vì tải xuống qua trình duyệt).
import { isNativeDesktop, pickExportDestinationNative, saveExportNative } from "./lib/nativeFiles";
import { useStore } from "./store";
import { fmtTime } from "./lib";
import { formatImportProgressText } from "./lib/importProgressText41W3";
import type { ImportFileProgressEvent } from "./lib/ingestProgress39T5";
import {
  EXPORT_PRESETS,
  X264_PRESETS,
  defaultCustomPreset,
  estimateSize,
  formatBytes,
  getPreset,
  presetSummary,
  validateExportPreset,
  type ExportPreset,
  type X264Preset,
} from "./lib/exportPresets";
import { BRIDGE_URL } from "./lib/bridgeUrl";


type RenderStatus = "idle" | "uploading" | "rendering" | "done" | "error" | "cancelled";

/** Đợt 29 L3 — errorDetail đã redact từ bridge (chỉ khi poll kèm ?detail=1).
 *  Đợt 30 M4 — chuỗi UI của khối này đã qua key i18n `exportPanel.*`
 *  (chuỗi cứng tạm của L3 đã thay hết, xem LIMITS đợt 30 M4). */
interface RenderErrorDetail {
  code: string;
  summary: string;
  // Đợt 34 Q4: bridge kèm thêm (additive); payload bridge cũ không có
  // 2 field này thì localizedErrorSummary fallback về summary thô.
  summaryKey?: string;
  summaryParams?: Record<string, string>;
  details: string[];
  detailsOmitted: number;
  redactedTail: string;
  // Đợt 63 R5: dòng validator đã dịch được (additive; payload cũ không có
  // thì hiển thị details thô như trước). Entry { where, code, params }.
  validationDetails?: Array<{
    where: string;
    code: string;
    params: Record<string, string>;
  }>;
  validationDetailsOmitted?: number;
}

/** 1 điểm trajectory từ reframe.py --analyze-only (tọa độ pixel nguồn). */
interface TrajPoint {
  frame: number;
  t: number;
  x0: number;
  y0: number;
  w: number;
  h: number;
  x_center_norm: number;
}

/** Summary JSON của /api/reframe/analyze (Phase 7 P6). */
interface TrajSummary {
  aspect: string;
  source_size: [number, number];
  duration_sec: number;
  detections: { face: number; motion: number; none: number };
  crop_window: [number, number];
  trajectory: TrajPoint[];
  trajectory_points: number;
}

/** R1-083/R1-085: Auto-reframe — crop video theo chủ thể qua bridge /api/reframe. */
function ReframeSection({ media, bridgeUrl }: { media: import("./media").MediaItem[]; bridgeUrl: string }) {
  const videos = media.filter((m) => m.kind === "video" && m.file);
  const [videoName, setVideoName] = useState<string>(videos[0]?.name ?? "");
  const [aspect, setAspect] = useState<string>("9:16");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  // Đợt 41 W3 — tiến trình importFiles của file reframe (như MediaBin V5).
  const [importProgress, setImportProgress] = useState<ImportFileProgressEvent | null>(null);
  // Phase 7 P6: trajectory preview — xem trước quỹ đạo crop trước khi render.
  const [traj, setTraj] = useState<TrajSummary | null>(null);
  const [trajStatus, setTrajStatus] = useState<"idle" | "working" | "error">("idle");
  const [trajError, setTrajError] = useState<string>("");
  const trajCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const previewTrajectory = async () => {
    const item = videos.find((m) => m.name === videoName);
    if (!item?.file || trajStatus === "working") return;
    setTrajStatus("working");
    setTrajError("");
    try {
      const form = new FormData();
      form.append("media", item.file, item.file.name);
      form.append("aspect", aspect);
      const res = await fetch(`${bridgeUrl}/api/reframe/analyze`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(body, t, t("exportPanel.bridgeError", { status: String(res.status) })));
      }
      setTraj((await res.json()) as TrajSummary);
      setTrajStatus("idle");
    } catch (e) {
      setTrajStatus("error");
      setTrajError(
        e instanceof Error
          ? e.message
          : t("exportPanel.bridgeServerDown", { url: bridgeUrl }),
      );
    }
  };

  // Vẽ overlay quỹ đạo: khung nguồn + các crop rect mờ + đường tâm crop.
  useEffect(() => {
    const canvas = trajCanvasRef.current;
    if (!canvas || !traj) return;
    const [W, H] = traj.source_size;
    const cw = 480;
    const ch = Math.max(120, Math.round((480 * H) / W));
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (x: number) => (x * cw) / W;
    const sy = (y: number) => (y * ch) / H;
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);
    const pts = traj.trajectory;
    if (pts.length === 0) return;
    // Crop rect mờ (lấy mẫu tối đa 48 rect để không rối).
    const step = Math.max(1, Math.floor(pts.length / 48));
    ctx.fillStyle = "rgba(76, 195, 138, 0.07)";
    ctx.strokeStyle = "rgba(76, 195, 138, 0.35)";
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i];
      ctx.fillRect(sx(p.x0), sy(p.y0), sx(p.w), sy(p.h));
      ctx.strokeRect(sx(p.x0), sy(p.y0), sx(p.w), sy(p.h));
    }
    // Đường tâm crop (xanh lá) + điểm đầu/cuối.
    ctx.strokeStyle = "#4cc38a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = sx(p.x0 + p.w / 2);
      const y = sy(p.y0 + p.h / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const dot = (p: TrajPoint, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx(p.x0 + p.w / 2), sy(p.y0 + p.h / 2), 5, 0, Math.PI * 2);
      ctx.fill();
    };
    dot(pts[0], "#30a46c");
    dot(pts[pts.length - 1], "#e5484d");
    // Rect đầu/cuối đậm để thấy rõ window bắt đầu/kết thúc ở đâu.
    ctx.strokeStyle = "#30a46c";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx(pts[0].x0), sy(pts[0].y0), sx(pts[0].w), sy(pts[0].h));
    ctx.strokeStyle = "#e5484d";
    ctx.strokeRect(
      sx(pts[pts.length - 1].x0), sy(pts[pts.length - 1].y0),
      sx(pts[pts.length - 1].w), sy(pts[pts.length - 1].h)
    );
  }, [traj]);

  const start = async () => {
    const item = videos.find((m) => m.name === videoName);
    if (!item?.file || status === "working") return;
    setStatus("working");
    setMessage(t("exportPanel.reframeAnalyzing"));
    try {
      const form = new FormData();
      form.append("media", item.file, item.file.name);
      form.append("aspect", aspect);
      const res = await fetch(`${bridgeUrl}/api/reframe`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(body, t, t("exportPanel.bridgeError", { status: String(res.status) })));
      }
      const blob = await res.blob();
      const dot = item.name.lastIndexOf(".");
      const base = dot > 0 ? item.name.slice(0, dot) : item.name;
      const outName = `${base}_${aspect.replace(":", "x")}.mp4`;
      const file = new File([blob], outName, { type: "video/mp4" });
      await useStore.getState().importFiles([file], (ev) => setImportProgress(ev));
      setImportProgress(null);
      setStatus("done");
      setMessage(t("exportPanel.reframeAdded", { name: outName }));
    } catch (e) {
      setStatus("error");
      setMessage(
        e instanceof Error
          ? `❌ ${e.message}`
          : `❌ ${t("exportPanel.bridgeServerDown", { url: bridgeUrl })}`,
      );
    }
  };

  if (videos.length === 0) return null;
  return (
    <div className="reframe-section">
      <div className="panel-head">{t("exportPanel.reframeTitle")}</div>
      <p className="tips">{t("exportPanel.reframeIntro")}</p>
      <div className="preset-row">
        <label htmlFor="reframe-video">Video:</label>
        <select
          id="reframe-video"
          value={videoName}
          onChange={(e) => { setVideoName(e.target.value); setTraj(null); }}
          disabled={status === "working"}
        >
          {videos.map((v) => (
            <option key={v.id} value={v.name}>{v.name}</option>
          ))}
        </select>
        <label htmlFor="reframe-aspect">{t("exportPanel.aspect")}</label>
        <select
          id="reframe-aspect"
          value={aspect}
          onChange={(e) => { setAspect(e.target.value); setTraj(null); }}
          disabled={status === "working"}
        >
          <option value="9:16">9:16 (TikTok/Reels)</option>
          <option value="1:1">1:1 (Instagram)</option>
          <option value="4:5">4:5 (Facebook)</option>
        </select>
        <button onClick={previewTrajectory} disabled={trajStatus === "working" || !videoName}>
          {trajStatus === "working" ? t("exportPanel.reframeWorking") : t("exportPanel.reframePreview")}
        </button>
        <button className="primary" onClick={start} disabled={status === "working" || !videoName}>
          {status === "working" ? t("exportPanel.reframeWorking2") : "🔍 Auto-reframe"}
        </button>
      </div>
      {message && <p className="tips">{message}</p>}
      {importProgress && (
        <p className="tips" role="status" data-import-progress={importProgress.phase}>
          ⏳ {formatImportProgressText(importProgress, (k, vars) => t(k, vars))}
        </p>
      )}
      {trajStatus === "error" && <p className="tips">❌ {trajError}</p>}
      {traj && (
        <div style={{ marginTop: 8 }}>
          <canvas ref={trajCanvasRef} style={{ maxWidth: "100%", borderRadius: 4 }} />
          <p className="tips">
            {t("exportPanel.trajSummary", {
              sw: String(traj.source_size[0]),
              sh: String(traj.source_size[1]),
              cw: String(traj.crop_window[0]),
              ch: String(traj.crop_window[1]),
              aspect: traj.aspect,
              points: String(traj.trajectory_points),
              duration: String(traj.duration_sec),
              face: String(traj.detections.face),
              motion: String(traj.detections.motion),
              none: String(traj.detections.none),
            })}
            {traj.crop_window[0] >= traj.source_size[0] &&
              ` ${t("exportPanel.sourceNarrow")}`}
          </p>
        </div>
      )}
    </div>
  );
}

/** R1-065: format ETA giây → "1:23" / "1:02:03". */
function fmtEta(sec: number | null): string {
  if (sec == null || !isFinite(sec) || sec < 0) return "…";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return (h > 0 ? `${h}:` : "") + `${mm}:${String(r).padStart(2, "0")}`;
}

/**
 * Phase 9 R56 M2 — giữ <code>URL</code> khi câu đã qua key i18n
 * (key chứa {url} = BRIDGE_URL, tách ra để bọc lại bằng <code>).
 */
function codeToken(text: string, token: string): ReactNode {
  const [a, b] = text.split(token);
  if (b === undefined) return text;
  return (
    <>
      {a}
      <code>{token}</code>
      {b}
    </>
  );
}

/** Kiểm tra sâu hơn isVideoSpec: mọi field số phải hợp lệ, clip phải có src... */
function deepValidate(spec: VideoSpec): string[] {
  const issues: string[] = [];
  const m = spec.meta;
  if (!m.name) issues.push(t("exportPanel.specIssueMetaName"));
  if (!(m.width > 0) || !(m.height > 0)) issues.push(t("exportPanel.specIssueMetaSize"));
  if (!(m.fps > 0)) issues.push(t("exportPanel.specIssueMetaFps"));
  for (const tr of spec.tracks) {
    if (!tr.id) issues.push(t("exportPanel.specIssueTrackNoId"));
    if (!["video", "audio", "text", "sticker", "image"].includes(tr.kind)) issues.push(t("exportPanel.specIssueTrackKind", { id: tr.id }));
    if (!Array.isArray(tr.clips)) {
      issues.push(t("exportPanel.specIssueTrackClips", { id: tr.id }));
      continue;
    }
    for (const c of tr.clips) {
      const tag = `Clip ${c.id}`;
      if (!(c.start >= 0)) issues.push(t("exportPanel.specIssueClipStart", { clip: tag }));
      if (!(c.duration > 0)) issues.push(t("exportPanel.specIssueClipDuration", { clip: tag }));
      if (c.kind === "video" || c.kind === "audio") {
        if (!c.src) issues.push(t("exportPanel.specIssueClipSrc", { clip: tag }));
        if (!(c.in >= 0)) issues.push(t("exportPanel.specIssueClipIn", { clip: tag }));
        if (!(c.out > c.in)) issues.push(t("exportPanel.specIssueClipOut", { clip: tag }));
      }
      if (c.kind === "text") {
        if (!c.style || !(c.style.fontSize > 0)) issues.push(t("exportPanel.specIssueFontSize", { clip: tag }));
      }
    }
  }
  return issues;
}

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const lang = useLang(); // re-render khi đổi ngôn ngữ
  const spec = useStore((s) => s.spec);
  const media = useStore((s) => s.media);
  const [copied, setCopied] = useState(false);

  // --- P0-01: state xuất MP4 qua bridge ---
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle");
  const [renderProgress, setRenderProgress] = useState(0);
  // R1-065: ETA (giây, null = chưa đủ dữ liệu) + vị trí hàng đợi
  const [renderEta, setRenderEta] = useState<number | null>(null);
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderErrorDetail, setRenderErrorDetail] = useState<RenderErrorDetail | null>(null);
  // Đợt 64 R8 — ghi chú của job (vd phục hồi sau restart): chuỗi đã
  // localize từ publicJob.noteCode/note, hiện dưới thanh tiến trình
  // trong lúc render; null = job không có note → không hiện gì.
  const [renderNote, setRenderNote] = useState<string | null>(null);
  // Đợt 65 S4 — trạng thái probe GPU (bridge GET /api/gpu-probe, chỉ đọc
  // cache đĩa) + nút "Probe lại GPU" (POST /api/gpu-probe/reprobe).
  // null = chưa tải được (bridge chưa chạy / lần đầu mở panel); msg chỉ
  // hiện sau khi user bấm nút (thành công / lỗi), không ồn khi mở panel.
  const [gpuStatus, setGpuStatus] = useState<GpuProbeStatus | null>(null);
  const [gpuProbing, setGpuProbing] = useState(false);
  const [gpuMsg, setGpuMsg] = useState<string | null>(null);
  const gpuStrings = gpuProbeStrings(lang);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/gpu-probe`);
        if (!res.ok || cancelled) return;
        setGpuStatus((await res.json()) as GpuProbeStatus);
      } catch {
        /* bridge chưa chạy: giữ trạng thái "chưa probe", không ồn */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const reprobeGpu = async () => {
    if (gpuProbing || renderStatus === "uploading" || renderStatus === "rendering") return;
    setGpuProbing(true);
    setGpuMsg(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/gpu-probe/reprobe`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as GpuProbeStatus & { encoder?: string | null };
      setGpuStatus(data);
      setGpuMsg(gpuProbeDoneText(data.encoder ?? null, lang));
    } catch (e) {
      setGpuMsg(gpuProbeErrorText(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setGpuProbing(false);
    }
  };
  const [jobId, setJobId] = useState<string | null>(null);
  // Đợt 66 T8 — resume job: panel đang theo dõi một job được nối lại
  // (không phải job vừa bấm Xuất trong phiên mở này) → hiện nhãn
  // "Đã nối lại…" để user biết tiến trình không phải bắt đầu lại.
  // false lại khi bắt đầu render mới / huỷ (startRender/cancelRender).
  const [resumedJob, setResumedJob] = useState(false);
  // Đợt 66 T8 — retry job lỗi/gián đoạn đang bay (chống bấm đúp).
  const [retrying, setRetrying] = useState(false);
  // Đợt 66 T8 — jobId mà panel đang sở hữu (mirror của state jobId,
  // đọc được trong closure của effect resume): chặn resume đè lên
  // render vừa bấm Xuất trong lúc fetch danh sách job còn bay.
  const activeJobIdRef = useRef<string | null>(null);
  const resumeStrings = resumeJobStrings(lang);
  // Phase 10 G4 — đích .mp4 đã chọn trước khi render (chỉ Electron).
  const [exportDest, setExportDest] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [shareMsg, setShareMsg] = useState<string>("");
  const pollRef = useRef<number | null>(null);

  // --- R1-042: export preset ---
  const [presetId, setPresetId] = useState<string>("1080p");
  const [custom, setCustom] = useState<ExportPreset>(() => defaultCustomPreset());
  // --- Phase 7 P3: normalize loudness (tùy chọn export, áp sau amix) ---
  const [normalize, setNormalize] = useState<"off" | "loudnorm" | "dynaudnorm">("off");
  const [normalizeTarget, setNormalizeTarget] = useState<number>(-14);

  /** Preset đang có hiệu lực (custom lấy từ form tay). */
  const activePreset: ExportPreset =
    presetId === "custom" ? { ...custom, id: "custom" } : getPreset(presetId) ?? getPreset("1080p")!;
  const presetIssues = useMemo(() => validateExportPreset(activePreset), [activePreset]);
  const presetOk = presetIssues.length === 0;

  // Đợt 63 R5: dòng validator đã dịch từ errorDetail.validationDetails
  // (bridge bóc từ stderr worker). Tối đa 5 dòng hiển thị như details cũ;
  // rỗng khi payload cũ không có validationDetails → UI giữ details thô.
  const validationLines = useMemo(
    () => resolveValidationDetails(renderErrorDetail?.validationDetails, t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderErrorDetail, lang],
  );

  const setCustomField = <K extends keyof ExportPreset>(key: K, value: ExportPreset[K]) => {
    setCustom((c) => ({ ...c, [key]: value }));
  };

  /** Lookup dịch cho các helper thuần (cùng mẫu App đợt 29 L4: lib
   *  không import i18n, UI truyền lookup vào). */
  const i18nLookup = (k: string, vars?: Record<string, string>): string => t(k, vars);

  // Phase 9 đợt 27 K2 — kiểm tra curve tốc độ TRƯỚC khi gửi bridge:
  // trước đây spec vi phạm vẫn gửi đi, render worker exit 1, bridge cắt
  // chi tiết stderr nên user chỉ thấy "Render worker thoát với mã 1."
  // (mù). Nay chặn sớm với thông báo nêu rõ clip/curve vi phạm.
  // - curveWarnings: mọi vi phạm J5 (kể cả chỉ lệch đơn điệu — render
  //   vẫn chấp nhận loại này nhờ sort + dedupe, nên chỉ hiện banner).
  // - curveBlocker: chỉ vi phạm render chặn được → chặn nút Xuất.
  const curveWarnings = useMemo(() => collectSpeedCurveWarnings(spec), [spec]);
  const curveBlocker = useMemo(() => exportCurveBlockers(spec, i18nLookup), [spec, lang]);
  const [curveFixMsg, setCurveFixMsg] = useState<string | null>(null);

  /** Nút "Sửa curve vi phạm": xin xác nhận (liệt kê từng thay đổi),
   *  rồi gọi store action — 1 bước undo, curve hợp lệ không đổi.
   *  Đợt 30 M4: confirm + tóm tắt sau sửa đều dịch theo locale hiện
   *  tại, và store action nhận tóm tắt đã dịch (trước đây ExportPanel
   *  gọi không tham số nên toast luôn tiếng Việt ở cả hai locale —
   *  nợ §3.3 của đợt 29 L4, nay đóng). Preview `res` tính trên cùng
   *  spec và confirm là đồng bộ nên tóm tắt truyền vào khớp kết quả
   *  action áp dụng ngay sau đó. */
  const fixCurves = () => {
    const st = useStore.getState();
    const res = sanitizeSpecSpeedCurves(st.spec);
    if (!res.changed && res.fixed.length === 0) {
      setCurveFixMsg(formatSanitizeSummaryLocalized(res, i18nLookup));
      return;
    }
    const lines: string[] = [t("exportPanel.fixConfirmTitle")];
    for (const f of res.fixed) {
      lines.push(`• "${f.clipId}" (${f.path}):`);
      for (const c of formatFixEntryChanges(f, i18nLookup)) lines.push(`    - ${c}`);
    }
    for (const u of res.unsalvageable) lines.push(`• "${u.clipId}" (${u.path}): ${t("loadReport.fixConfirmUnsalvageable", { reason: resolveUnsalvageableReason(u, i18nLookup) })}`);
    for (const s of res.skippedLocked) lines.push(`• "${s.clipId}" (${s.path}): ${t("loadReport.fixConfirmLocked")}`);
    lines.push(t("loadReport.fixConfirmTiming"));
    if (!window.confirm(lines.join("\n"))) return;
    const applied = st.fixSpeedCurveViolations(formatSanitizeSummaryLocalized(res, i18nLookup));
    setCurveFixMsg(formatSanitizeSummaryLocalized(applied, i18nLookup));
    setRenderError(null);
  };

  const { ok, issues, json } = useMemo(() => {
    const list: string[] = [];
    if (!isVideoSpec(spec)) {
      list.push(t("exportPanel.specBadFormat"));
    } else {
      list.push(...deepValidate(spec));
    }
    return { ok: list.length === 0, issues: list, json: JSON.stringify(spec, null, 2) };
  }, [spec, lang]);

  /** Thu thập các file media mà spec đang dùng (theo clip.src). */
  const collectMediaFiles = async (): Promise<{ files: File[]; missing: string[] }> => {
    const needed = new Set<string>();
    for (const t of spec.tracks)
      for (const c of t.clips)
        if ((c.kind === "video" || c.kind === "audio" || c.kind === "sticker") && c.src)
          needed.add(c.src);
    const files: File[] = [];
    const missing: string[] = [];
    for (const name of needed) {
      const item = media.find((m) => m.name === name);
      if (item?.file) files.push(item.file);
      else missing.push(name);
    }
    // K3: LUT user (`user-...`) dùng trong spec → upload file .cube từ
    // IndexedDB kèm theo với tên dành riêng `__lut_<id>.cube` để render
    // worker resolve từ mediaDir của job.
    const userLutIds = new Set<string>();
    for (const t of spec.tracks)
      for (const c of t.clips) {
        const lut = (c as { filter?: { lut?: string } }).filter?.lut;
        if (typeof lut === "string" && lut.startsWith("user-")) userLutIds.add(lut);
      }
    if (userLutIds.size > 0) {
      const { getUserLut, userLutFileName } = await import("./lib/userLut");
      for (const id of userLutIds) {
        const lut = await getUserLut(id);
        if (!lut) {
          missing.push(t("exportPanel.userLutMissing", { name: id }));
          continue;
        }
        files.push(
          new File([lut.text], userLutFileName(id), { type: "text/plain" }),
        );
      }
    }
    return { files, missing };
  };

  const startRender = async () => {
    if (!ok || !presetOk || renderStatus === "uploading" || renderStatus === "rendering") return;
    // Đợt 66 T8: bắt đầu render mới thì job cũ không còn hiệu lực —
    // xoá jobId cũ ngay để nút "Render lại"/tải MP4 không trỏ nhầm
    // job cũ khi lần render này lỗi trước khi POST (vd thiếu media,
    // curve vi phạm). Đặt trước mọi early-return dưới đây.
    setJobId(null);
    activeJobIdRef.current = null;
    setResumedJob(false);
    // Đợt 27 K2 — chặn sớm thay vì gửi spec vi phạm đi rồi nhận lỗi mù
    // từ bridge ("Render worker thoát với mã 1."). Thông báo nêu rõ
    // clip/curve vi phạm + nhắc nút sửa (không tự sửa lén).
    if (curveBlocker !== null) {
      setRenderStatus("error");
      setRenderError(curveBlocker);
      setRenderErrorDetail(null);
      return;
    }
    // Phase 10 G4 — trong Electron, hỏi đích .mp4 TRƯỚC khi render;
    // user huỷ dialog thì không bắt đầu render (không tốn công render
    // rồi mới hỏi). Ngoài Electron, đích là tải xuống qua trình duyệt.
    if (isNativeDesktop()) {
      const dest = await pickExportDestinationNative();
      if (!dest) {
        pushToast(t("nativeFiles.exportCancelled"), "info");
        return;
      }
      setExportDest(dest);
    } else {
      setExportDest(null);
    }
    setRenderError(null);
    setRenderErrorDetail(null);
    setRenderNote(null); // Đợt 64 R8: job mới chưa có note
    setRenderProgress(0);
    setRenderEta(null); // R1-065
    setQueuePos(null);  // R1-065

    const { files, missing } = await collectMediaFiles();
    if (missing.length > 0) {
      setRenderStatus("error");
      setRenderError(t("exportPanel.missingMedia", { files: missing.join(", ") }));
      setRenderErrorDetail(null);
      return;
    }

    setRenderStatus("uploading");
    try {
      // R1-042: clone spec, override meta theo preset (project gốc không đổi).
      const renderSpec: VideoSpec = {
        ...spec,
        meta: {
          ...spec.meta,
          width: activePreset.width,
          height: activePreset.height,
          fps: activePreset.fps,
        },
      };
      const form = new FormData();
      form.append("spec", JSON.stringify(renderSpec));
      form.append("preset", JSON.stringify({
        crf: activePreset.crf,
        x264Preset: activePreset.x264Preset,
        audioBitrateKbps: activePreset.audioBitrateKbps,
        // Phase 7 P3: normalize export (bridge whitelist kiểm tra lại).
        normalize,
        normalizeTarget,
      }));
      for (const f of files) form.append("media", f, f.name);

      const res = await fetch(`${BRIDGE_URL}/api/render`, { method: "POST", body: form });
      // Đợt 62 R5: 429 có mã (RATE_LIMITED / QUEUE_FULL) thì dịch mã,
      // 429 không mã mới dùng bridgeBusy như trước.
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(
          body,
          t,
          res.status === 429
            ? t("exportPanel.bridgeBusy")
            : t("exportPanel.bridgeError", { status: String(res.status) }),
        ));
      }
      const { jobId: id } = await res.json();
      setJobId(id);
      activeJobIdRef.current = id; // Đợt 66 T8: chặn resume đè lên job mới
      setRenderStatus("rendering");
      pollStatus(id);
    } catch (e) {
      setRenderStatus("error");
      setRenderError(
        e instanceof Error
          ? e.message
          : t("exportPanel.bridgeConnHint", { url: BRIDGE_URL }),
      );
    }
  };

  const pollStatus = (id: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        // Đợt 29 L3: poll kèm ?detail=1 để nhận errorDetail đã redact
        // khi job lỗi; job không lỗi thì field này vắng (không đổi hành vi).
        const res = await fetch(`${BRIDGE_URL}/api/render/${id}?detail=1`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        setRenderProgress(data.progress ?? 0);
        // R1-065: ETA + vị trí hàng đợi
        setRenderEta(typeof data.etaSeconds === "number" ? data.etaSeconds : null);
        setQueuePos(typeof data.queuePosition === "number" ? data.queuePosition : null);
        // Đợt 64 R8: ghi chú của job (vd phục hồi sau restart) — resolve
        // theo noteCode (localize) rồi rớt xuống chuỗi note thô; "" → null
        // nên job không có note thì khối tiến trình không hiện gì thêm.
        // Dùng getLang() (đọc locale HIỆN TẠI lúc poll) thay vì biến
        // `lang` trong closure: interval giữ closure cũ từ lúc startRender
        // nên đổi locale giữa chừng vẫn dịch lại note ở poll sau (≤1s).
        setRenderNote(resolveJobNote(data.noteCode, data.note, getLang()) || null);
        if (data.status === "done") {
          stopPolling();
          setRenderStatus("done");
        } else if (data.status === "error") {
          stopPolling();
          setRenderStatus("error");
          // Giữ nguyên error cũ làm thông báo mặc định; detail chỉ là
          // phần mở rộng (summary + dòng lỗi đã redact), không thay error.
          // Đợt 62 R5: chỉ dịch mã bridgeErrors ở dòng chính (vd job phục
          // hồi sau restart) — detail panel đã hiển thị summary nên poll
          // không dịch summary lần nữa (useErrorDetailSummary: false).
          setRenderError(resolveBridgeApiError(data, t, t("errorDetail.summary.unknown"), { useErrorDetailSummary: false }));
          setRenderErrorDetail(
            data.errorDetail && typeof data.errorDetail.summary === "string"
              ? (data.errorDetail as RenderErrorDetail)
              : null,
          );
        } else if (data.status === "cancelled") {
          stopPolling();
          setRenderStatus("cancelled");
        }
      } catch {
        // giữ polling, có thể bridge lag tạm thời
      }
    }, 1000); // R1-065: poll mỗi 1s cho tiến trình mượt hơn
  };

  const stopPolling = () => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
  };

  // --- Đợt 66 T8: resume job khi mở lại panel (đóng nợ S10 đợt 65) ---
  // Trước đây jobId chỉ là state của component: đóng modal là mất,
  // mở lại panel về idle dù bridge vẫn đang render. Nay lúc mount,
  // panel hỏi bridge job mới nhất (GET /api/render, mới nhất trước)
  // rồi nối lại: job đang chạy/xếp hàng → theo dõi tiếp; job lỗi/
  // gián đoạn mới nhất → hiện lỗi + note + nút "Render lại"; còn lại
  // (done/cancelled/không có job) → mở idle như cũ.
  const applyResumedJob = (job: ResumableRenderJob) => {
    setJobId(job.id);
    activeJobIdRef.current = job.id;
    // Note phục hồi (vd JOB_RECOVERED_RESTART) hiện lại như lúc job
    // đang chạy — resolve theo locale hiện tại (mẫu pollStatus R8/S10).
    setRenderNote(resolveJobNote(job.noteCode, job.note, getLang()) || null);
    if (job.status === "running" || job.status === "queued") {
      setRenderStatus("rendering");
      setRenderProgress(typeof job.progress === "number" ? job.progress : 0);
      setRenderEta(typeof job.etaSeconds === "number" ? job.etaSeconds : null);
      setQueuePos(typeof job.queuePosition === "number" ? job.queuePosition : null);
      setRenderError(null);
      setRenderErrorDetail(null);
      setResumedJob(true);
      pollStatus(job.id);
    } else {
      // error / interrupted: hiện trạng thái lỗi + note, không poll
      // (job đã ở trạng thái cuối) — user bấm "Render lại" để chạy tiếp.
      setRenderStatus("error");
      setRenderProgress(typeof job.progress === "number" ? job.progress : 0);
      setRenderEta(null);
      setQueuePos(null);
      setRenderError(resolveBridgeApiError(job, t, t("errorDetail.summary.unknown"), { useErrorDetailSummary: false }));
      const detail = (job as unknown as { errorDetail?: RenderErrorDetail }).errorDetail;
      setRenderErrorDetail(
        detail && typeof detail.summary === "string" ? detail : null,
      );
      setResumedJob(true);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/render?limit=10`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const candidate = pickResumeCandidate(
          Array.isArray(data?.jobs) ? (data.jobs as ResumableRenderJob[]) : [],
        );
        if (!candidate || cancelled) return;
        // User đã bấm Xuất trong lúc fetch còn bay → render mới đã có
        // chủ, không đè bằng job cũ (pollStatus của render mới clear
        // interval cũ nên cuối cùng vẫn đúng — chặn ở đây để khỏi nháy UI).
        if (activeJobIdRef.current !== null || pollRef.current !== null) return;
        // Lấy chi tiết đầy đủ: errorDetail chỉ có ở ?detail=1, và job
        // có thể đã đổi trạng thái giữa 2 lần fetch nên kiểm tra lại
        // trước khi áp (tránh nối nhầm job vừa xong/lỗi khác).
        const detailRes = await fetch(`${BRIDGE_URL}/api/render/${candidate.job.id}?detail=1`);
        if (!detailRes.ok || cancelled) return;
        const job = (await detailRes.json()) as ResumableRenderJob;
        if (cancelled) return;
        if (activeJobIdRef.current !== null || pollRef.current !== null) return;
        if (job.status !== "running" && job.status !== "queued" && job.status !== "error" && job.status !== "interrupted") return;
        applyResumedJob(job);
      } catch {
        // bridge chưa chạy / mất mạng lúc mở panel: mở idle như cũ,
        // không ồn (cùng cách xử lý với fetch gpu-probe ở trên).
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đợt 66 T8 — mở lại panel giữa lúc render thì cuộn tới khối tiến
  // trình / banner lỗi để user thấy ngay trạng thái job: nội dung modal
  // dài nên khối này thường nằm dưới fold ở viewport thấp (ảnh chụp
  // headed lượt chạy 1 cho thấy panel đã resume nhưng progress khuất
  // dưới fold). Chỉ chạy khi resumedJob vừa bật (deps [resumedJob]) —
  // không cuộn lại khi job xong hay khi user tự mở panel lúc idle.
  // Mẫu scrollIntoView đã có ở TourCard.tsx (document.querySelector).
  useEffect(() => {
    if (!resumedJob) return;
    const target =
      document.querySelector(".render-progress") ??
      document.querySelector(".mp4-export .valid-banner.bad");
    target?.scrollIntoView({ block: "center" });
  }, [resumedJob]);

  /** Đợt 66 T8 — chạy lại job lỗi/gián đoạn (endpoint bridge đã có):
   *  POST retry → job về queued → lấy trạng thái mới rồi poll tiếp
   *  như render thường. Lỗi retry (vd thư mục job đã bị dọn → 409
   *  JOB_GONE) hiện như lỗi render thường, không crash. */
  const retryRender = async () => {
    if (!jobId || retrying) return;
    setRetrying(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/render/${jobId}/retry`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(
          body,
          t,
          t("exportPanel.bridgeError", { status: String(res.status) }),
        ));
      }
      const fresh = await fetch(`${BRIDGE_URL}/api/render/${jobId}?detail=1`);
      if (!fresh.ok) throw new Error(`status ${fresh.status}`);
      const job = (await fresh.json()) as ResumableRenderJob;
      setRenderError(null);
      setRenderErrorDetail(null);
      setRenderStatus("rendering");
      setRenderProgress(typeof job.progress === "number" ? job.progress : 0);
      setRenderEta(typeof job.etaSeconds === "number" ? job.etaSeconds : null);
      setQueuePos(typeof job.queuePosition === "number" ? job.queuePosition : null);
      setRenderNote(resolveJobNote(job.noteCode, job.note, getLang()) || null);
      pollStatus(job.id);
    } catch (e) {
      setRenderError(
        e instanceof Error
          ? e.message
          : t("exportPanel.bridgeError", { status: "?" }),
      );
    } finally {
      setRetrying(false);
    }
  };

  const cancelRender = async () => {
    stopPolling();
    setRenderNote(null); // Đợt 64 R8: huỷ render thì dọn note cùng job
    activeJobIdRef.current = null; // Đợt 66 T8: job đã huỷ, không resume
    setResumedJob(false);
    if (jobId) {
      try { await fetch(`${BRIDGE_URL}/api/render/${jobId}`, { method: "DELETE" }); } catch {}
    }
    setRenderStatus("cancelled");
    setJobId(null);
  };

  const downloadMp4 = () => {
    if (!jobId) return;
    // Phase 10 G4 — trong Electron, main stream MP4 đã render về đích
    // đã chọn trước đó (không qua anchor download của trình duyệt).
    if (isNativeDesktop() && exportDest) {
      void saveExportNative(jobId, exportDest);
      return;
    }
    const a = document.createElement("a");
    a.href = `${BRIDGE_URL}/api/render/${jobId}/download`;
    const safe = (spec.meta.name || "project").replace(/[^\w\- ]+/g, "").trim() || "project";
    a.download = `${safe}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /** Q7: Xuất trang chia sẻ HTML tĩnh từ video vừa render xong. */
  const doExportSharePage = async () => {
    if (!jobId) return;
    setShareStatus("working");
    setShareMsg(t("exportPanel.sharePacking"));
    try {
      const res = await fetch(`${BRIDGE_URL}/api/render/${jobId}/download`);
      if (!res.ok) throw new Error(t("exportPanel.shareDownloadFailed", { status: String(res.status) }));
      const blob = await res.blob();
      const title = spec.meta.name || "Video VCut";
      if (blob.size > SHARE_EMBED_MAX_BYTES) {
        // Video lớn: trang linked + nhắc user tải MP4 đặt cạnh.
        const { html, warnings } = buildSharePage({
          title, spec, videoMime: "video/mp4", videoFileName: "video.mp4",
        });
        downloadSharePage(html, title);
        setShareStatus("done");
        setShareMsg(
          t("exportPanel.shareLinked", {
            size: (blob.size / 1048576).toFixed(0),
            warnings: warnings.join(" "),
          }),
        );
        return;
      }
      const buf = new Uint8Array(await blob.arrayBuffer());
      // btoa theo chunk để không tràn stack với video vài chục MB.
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < buf.length; i += CHUNK) {
        binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
      }
      const { html, warnings } = buildSharePage({
        title, spec, videoMime: "video/mp4", videoBase64: btoa(binary),
      });
      downloadSharePage(html, title);
      setShareStatus("done");
      setShareMsg(
        t("exportPanel.shareDone", {
          size: (blob.size / 1048576).toFixed(1),
          warnings: warnings.join(" "),
        }),
      );
    } catch (e) {
      setShareStatus("error");
      setShareMsg(t("exportPanel.shareFailed", { error: (e as Error).message }));
    }
  };

  // Dọn polling khi đóng panel
  const handleClose = () => { stopPolling(); onClose(); };

  const download = () => {
    if (!ok) return;
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safe = (spec.meta.name || "project").replace(/[^\w\- ]+/g, "").trim() || "project";
    a.download = `${safe}.videospec.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const dur = projectDuration(spec);
  const clipCount = spec.tracks.reduce((n, t) => n + t.clips.length, 0);

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("exportPanel.title")}
      >
        <div className="modal-head">
          <span>{t("exportPanel.titleIcon")}</span>
          <button className="icon-btn" onClick={handleClose} title={t("common.close")} aria-label={t("common.close")}>×</button>
        </div>

        <div className={`valid-banner ${ok ? "ok" : "bad"}`}>
          {ok ? (
            <>{t("exportPanel.specValid", { version: String(SPEC_VERSION) })}</>
          ) : (
            <>{t("exportPanel.specInvalid")}</>
          )}
        </div>

        <div className="export-stats">
          <div><span>{t("inspector.duration")}</span><b>{fmtTime(dur)}</b></div>
          <div><span>Track</span><b>{spec.tracks.length}</b></div>
          <div><span>Clip</span><b>{clipCount}</b></div>
        </div>

        {issues.length > 0 && (
          <ul className="issues">
            {issues.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        )}

        {/* --- P0-01: Xuất MP4 qua bridge --- */}
        <div className="mp4-export">
          <div className="panel-head">{t("exportPanel.mp4Title")}</div>

          {/* --- R1-042: Export presets --- */}
          <div className="preset-row">
            <label htmlFor="export-preset">{t("exportPanel.quality")}</label>
            <select
              id="export-preset"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              disabled={renderStatus === "uploading" || renderStatus === "rendering"}
            >
              {EXPORT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {presetId !== "custom" && (
            <p className="tips preset-desc">
              {activePreset.description} — <code>{presetSummary(activePreset)}</code>
            </p>
          )}
          {presetId === "custom" && (
            <div className="preset-grid">
              <label>Width
                <input type="number" min={16} max={7680} step={2}
                  value={custom.width}
                  onChange={(e) => setCustomField("width", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>Height
                <input type="number" min={16} max={7680} step={2}
                  value={custom.height}
                  onChange={(e) => setCustomField("height", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>FPS
                <input type="number" min={1} max={120}
                  value={custom.fps}
                  onChange={(e) => setCustomField("fps", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>{t("exportPanel.crfLabel")}
                <input type="number" min={0} max={51}
                  value={custom.crf}
                  onChange={(e) => setCustomField("crf", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>x264 preset
                <select
                  value={custom.x264Preset}
                  onChange={(e) => setCustomField("x264Preset", e.target.value as X264Preset)}
                >
                  {X264_PRESETS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>Audio (kbps)
                <input type="number" min={32} max={512} step={32}
                  value={custom.audioBitrateKbps}
                  onChange={(e) => setCustomField("audioBitrateKbps", Math.round(Number(e.target.value) || 0))} />
              </label>
            </div>
          )}
          {!presetOk && (
            <ul className="issues">
              {presetIssues.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          )}
          {presetOk && (
            <p className="tips preset-desc">
              {t("exportPanel.willExport")} <code>{presetSummary(activePreset)}</code>
              {presetId !== "custom" || (
                <> {t("exportPanel.presetNote")}</>
              )}
            </p>
          )}
          {/* --- R1-064: ước tính dung lượng file xuất --- */}
          {presetOk && ok && (
            <p className="tips preset-desc">
              {t("exportPanel.sizeEstimate")} <b>{formatBytes(estimateSize(activePreset, dur))}</b>
              {" "}<span title={t("exportPanel.sizeEstimateHint")}>{t("exportPanel.sizeEstimateShort")}</span>
            </p>
          )}

          {/* --- Phase 7 P3: Chuẩn hoá âm thanh (normalize) --- */}
          <div className="preset-row">
            <label htmlFor="export-normalize">{t("exportPanel.normalize")}</label>
            <select
              id="export-normalize"
              value={normalize}
              onChange={(e) => setNormalize(e.target.value as "off" | "loudnorm" | "dynaudnorm")}
              disabled={renderStatus === "uploading" || renderStatus === "rendering"}
            >
              <option value="off">{t("exportPanel.normalizeOff")}</option>
              <option value="loudnorm">{t("exportPanel.normalizeLoudnorm")}</option>
              <option value="dynaudnorm">{t("exportPanel.normalizeDynaudnorm")}</option>
            </select>
          </div>
          {normalize === "loudnorm" && (
            <div className="preset-row">
              <label htmlFor="export-normalize-target">Target (LUFS):</label>
              <input
                id="export-normalize-target"
                type="number" min={-70} max={0} step={1}
                value={normalizeTarget}
                onChange={(e) => setNormalizeTarget(Number(e.target.value) || -14)}
                disabled={renderStatus === "uploading" || renderStatus === "rendering"}
              />
              <p className="tips preset-desc">{t("exportPanel.ebruNote")}</p>
            </div>
          )}

          {/* --- Đợt 65 S4: Encoder GPU — trạng thái probe + nút probe lại.
              Trạng thái lấy từ cache đĩa probe (bridge GET /api/gpu-probe);
              nút bấm xoá cache cũ (kể cả cache lỗi do tháo GPU trong TTL)
              rồi probe lại thật (POST /api/gpu-probe/reprobe). Nếu encoder
              GPU lỗi lúc render, worker tự thử lại bằng libx264 (xem
              server/render/src/render.js bước 7) nên nút này chỉ để kiểm
              tra/chủ động làm mới, không bắt buộc trước mỗi lần render. */}
          <div className="gpu-probe">
            <div className="preset-row">
              <label>{gpuStrings.title}</label>
              <span className="tips">{gpuProbeStatusText(gpuStatus, lang)}</span>
              <button
                onClick={() => void reprobeGpu()}
                disabled={gpuProbing || renderStatus === "uploading" || renderStatus === "rendering"}
                title={gpuStrings.fallbackNote}
              >
                {gpuProbing ? gpuStrings.probing : gpuStrings.reprobe}
              </button>
            </div>
            {gpuMsg && <p className="tips preset-desc">{gpuMsg}</p>}
            <p className="tips preset-desc">{gpuStrings.fallbackNote}</p>
          </div>

          {/* --- R1-083/R1-085: Auto-reframe 9:16 --- */}
          <ReframeSection media={media} bridgeUrl={BRIDGE_URL} />

          {renderStatus === "idle" && (
            <p className="tips">
              {codeToken(t("exportPanel.renderIntro", { url: BRIDGE_URL }), BRIDGE_URL)}
            </p>
          )}
          {(renderStatus === "uploading" || renderStatus === "rendering") && (
            <div className="render-progress" data-job-id={jobId ?? undefined}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.round(renderProgress * 100)}%` }} />
              </div>
              <div className="progress-label">
                {renderStatus === "uploading" ? t("exportPanel.uploading") :
                  queuePos != null && renderProgress <= 0
                    ? t("exportPanel.queued", { pos: String(queuePos) }) // R1-065
                    : t("exportPanel.rendering", { pct: String(Math.round(renderProgress * 100)) }) +
                      (renderEta != null && renderProgress > 0
                        ? t("exportPanel.renderEta", { eta: fmtEta(renderEta) }) // R1-065
                        : "")}
              </div>
              {/* Đợt 66 T8 — job được nối lại khi mở lại panel: báo rõ để
                  user biết tiến trình không phải bắt đầu lại. */}
              {resumedJob && resumeStrings.resumedJob && (
                <p className="tips">{resumeStrings.resumedJob}</p>
              )}
              {/* Đợt 64 R8 — ghi chú của job (vd "Phục hồi sau khi server
                  restart — render lại từ đầu."): chỉ hiện khi job CÓ note;
                  job thường không có note thì khối này không render gì. */}
              {renderNote && (
                <div className="render-note" role="note">{renderNote}</div>
              )}
              <button onClick={cancelRender}>{t("bgremove.cancel")}</button>
            </div>
          )}
          {renderStatus === "done" && (
            <div className="valid-banner ok">
              ✅ Render xong! <button className="primary" onClick={downloadMp4}>{t("exportPanel.downloadMp4")}</button>{" "}
              <button onClick={() => void doExportSharePage()} disabled={shareStatus === "working"}>
                {t("exportPanel.exportShare")}
              </button>
              {shareMsg && (
                <div className={shareStatus === "error" ? "valid-banner bad" : "tips"}>{shareMsg}</div>
              )}
            </div>
          )}
          {/* Đợt 27 K2 — cảnh báo curve tốc độ vi phạm (từ warnings J5):
              chặn export chỉ khi render-fatal (curveBlocker); chỉ lệch
              đơn điệu thì vẫn xuất được nhưng vẫn hiện để user sửa. */}
          {curveWarnings.length > 0 && (
            <div className={curveBlocker !== null ? "valid-banner bad" : "tips"}>
              ⚠️ {t("exportPanel.curveWarningsTitle", { count: String(curveWarnings.length) })}
              <ul>
                {curveWarnings.slice(0, 5).map((w, i) => (
                  <li key={i}>{formatWarningTranslated(w, i18nLookup)}</li>
                ))}
                {curveWarnings.length > 5 && <li>{t("exportPanel.curveWarningsMore", { count: String(curveWarnings.length - 5) })}</li>}
              </ul>
              {curveBlocker !== null && <p>{t("exportPanel.curveBlockerNote")}</p>}
              <button onClick={fixCurves}>🔧 {t("exportPanel.fixCurves")}</button>
              {curveFixMsg && <p>{curveFixMsg}</p>}
            </div>
          )}
          {renderStatus === "error" && renderError && (
            <div className="valid-banner bad">❌ {renderError}</div>
          )}
          {/* Đợt 66 T8 — job lỗi/gián đoạn được nối lại khi mở lại panel:
              hiện note phục hồi (nếu có) để user biết vì sao lỗi, nhãn
              resume, và nút chạy lại. Nút "Render lại" hiện cho mọi lỗi
              có jobId (cả lỗi vừa render xong — endpoint retry của bridge
              nhận mọi job error/interrupted). */}
          {renderStatus === "error" && renderNote && (
            <div className="render-note" role="note">{renderNote}</div>
          )}
          {renderStatus === "error" && resumedJob && resumeStrings.resumedJob && (
            <p className="tips">{resumeStrings.resumedJob}</p>
          )}
          {renderStatus === "error" && jobId && resumeStrings.retryRender && (
            <button onClick={retryRender} disabled={retrying}>
              {resumeStrings.retryRender}
            </button>
          )}
          {/* Đợt 29 L3 — chi tiết lỗi đã redact (chỉ khi bridge trả về):
              mã + summary + tối đa 5 dòng lỗi; không bao giờ in đường
              dẫn tuyệt đối/token (bridge đã redact, xem LIMITS). */}
          {renderStatus === "error" && renderErrorDetail && (
            <div className="tips">
              <div>
                <b>{t("exportPanel.errorDetailTitle", { code: renderErrorDetail.code })}</b> {localizedErrorSummary(renderErrorDetail, t)}
              </div>
              {/* Đợt 63 R5: có validationDetails thì hiển thị từng dòng
                  validator ĐÃ DỊCH (tối đa 5, như details cũ); không có
                  thì giữ details thô như trước — payload bridge cũ. */}
              {validationLines.length > 0 ? (
                <>
                  <ul>
                    {validationLines.slice(0, 5).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  {(renderErrorDetail.validationDetailsOmitted ?? 0) + Math.max(0, validationLines.length - 5) > 0 && (
                    <p>{t("exportPanel.errorDetailMore", { count: String((renderErrorDetail.validationDetailsOmitted ?? 0) + Math.max(0, validationLines.length - 5)) })}</p>
                  )}
                </>
              ) : (
                <>
                  {renderErrorDetail.details.length > 0 && (
                    <ul>
                      {renderErrorDetail.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                  {renderErrorDetail.detailsOmitted > 0 && (
                    <p>{t("exportPanel.errorDetailMore", { count: String(renderErrorDetail.detailsOmitted) })}</p>
                  )}
                  {renderErrorDetail.details.length === 0 && renderErrorDetail.redactedTail && (
                    <pre>{renderErrorDetail.redactedTail}</pre>
                  )}
                </>
              )}
            </div>
          )}
          {renderStatus === "cancelled" && (
            <div className="tips">{t("exportPanel.renderCancelled")}</div>
          )}
          {(renderStatus === "idle" || renderStatus === "error" || renderStatus === "cancelled" || renderStatus === "done") && (
            <button
              className="primary"
              onClick={startRender}
              disabled={!ok || !presetOk}
              title={!presetOk ? t("exportPanel.presetInvalid") : t("exportPanel.exportMp4")}
            >
              {t("exportPanel.exportMp4Size", {
                w: String(activePreset.width),
                h: String(activePreset.height),
              })}
            </button>
          )}
        </div>

        <pre className="json-preview">{json}</pre>

        <p className="tips">{t("exportPanel.jsonNote")}</p>

        <div className="modal-actions">
          <button onClick={copy}>{copied ? t("exportPanel.copied") : t("exportPanel.copyJson")}</button>
          <button className="primary" onClick={download} disabled={!ok}>
            {t("exportPanel.downloadJson")}
          </button>
        </div>
      </div>
    </div>
  );
}

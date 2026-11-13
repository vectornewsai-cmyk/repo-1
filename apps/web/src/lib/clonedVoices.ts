/**
 * clonedVoices.ts — Giọng đã clone LƯU LẠI ĐƯỢC cho TTS local (Phase 9 đợt 84 L8).
 *
 * Bridge đã có clone 1 lần từ R4 (POST /api/tts/clone: upload mẫu + text →
 * WAV, mẫu bị xóa ngay). Luồng này thêm kho giọng bền vững:
 *   GET    /api/tts/cloned-voices        → { voices: [...] }
 *   POST   /api/tts/cloned-voices        multipart { name, refAudio } →
 *          stream NDJSON (phase/progress + ETA + hủy thật) → done
 *          { clonedVoice, downloadUrl } (bản đọc thử câu thăm dò)
 *   DELETE /api/tts/cloned-voices/:id    → { ok, id, name }
 *   POST   /api/tts { text, clonedVoiceId } → tổng hợp bằng giọng đã lưu
 *
 * File này chứa kiểu + helper thuần (test được bằng Node) và các hàm gọi
 * API bridge (fetch). Component TtsButton chỉ nối UI vào các hàm này.
 * Mẫu + registry lưu ở ~/.vcut/cloned-voices trên máy chạy bridge
 * (env BRIDGE_CLONED_VOICES_DIR) — 100% local, không rời khỏi máy.
 */
import {
  AI_JOB_STREAM_DROPPED,
  AiJobCancelledError,
  readAiJobStream,
  resolveAiJobPhaseLabel,
  type AiJobProgressState,
} from "./aiJobStream";
import type { BridgeApiErrorBody } from "./bridgeErrors";

export interface ClonedVoice {
  id: string;
  name: string;
  refExt: string;
  refDurationSec: number | null;
  createdAt: string;
}

export interface PresetVoice {
  name: string;
  gender: string;
  desc: string;
}

/** Giá trị <option> trong select giọng: preset → `preset:<tên>`, clone → `clone:<id>`. */
export function presetSelectValue(name: string): string {
  return `preset:${name}`;
}
export function clonedSelectValue(id: string): string {
  return `clone:${id}`;
}

export type SelectedVoice =
  | { kind: "preset"; name: string }
  | { kind: "cloned"; id: string };

/** Giải mã giá trị select; giá trị lạ → preset mặc định (không crash UI). */
export function parseVoiceSelectValue(value: string, defaultPreset: string): SelectedVoice {
  if (typeof value === "string" && value.startsWith("clone:")) {
    const id = value.slice("clone:".length);
    if (/^[0-9a-f]{16}$/.test(id)) return { kind: "cloned", id };
    // Tiền tố clone nhưng id sai dạng → preset mặc định (không để tên
    // "clone:..." lọt thành tên preset rồi bridge 400 khó hiểu).
    return { kind: "preset", name: defaultPreset };
  }
  if (typeof value === "string" && value.startsWith("preset:")) {
    const name = value.slice("preset:".length);
    if (name) return { kind: "preset", name };
    return { kind: "preset", name: defaultPreset };
  }
  // Tương thích ngược: giá trị cũ chỉ là tên preset trần.
  if (typeof value === "string" && value) return { kind: "preset", name: value };
  return { kind: "preset", name: defaultPreset };
}

/** Nhãn option cho 1 giọng clone: "Tên (clone · 12s)" (không có duration → "Tên (clone)"). */
export function formatClonedVoiceOption(v: ClonedVoice, cloneWord: string): string {
  const dur = formatSampleDuration(v.refDurationSec);
  return `${v.name} (${cloneWord}${dur ? ` · ${dur}` : ""})`;
}

/** "12s" / "1:05" cho thời lượng mẫu; null/không hợp lệ → "". */
export function formatSampleDuration(sec: number | null | undefined): string {
  if (typeof sec !== "number" || !Number.isFinite(sec) || sec <= 0) return "";
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function clonedVoiceById(voices: ClonedVoice[], id: string): ClonedVoice | undefined {
  return voices.find((v) => v.id === id);
}

/** Nhóm option cho <select>: preset trước, giọng đã clone sau (chỉ nhóm nào có dữ liệu). */
export function buildVoiceSelectGroups(
  presets: PresetVoice[],
  cloned: ClonedVoice[],
  labels: { presetGroup: string; clonedGroup: string; cloneWord: string },
): Array<{ label: string; options: Array<{ value: string; label: string }> }> {
  const groups: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [];
  if (presets.length > 0) {
    groups.push({
      label: labels.presetGroup,
      options: presets.map((v) => ({
        value: presetSelectValue(v.name),
        label: `${v.name} (${v.gender})${v.desc ? ` — ${v.desc}` : ""}`,
      })),
    });
  }
  if (cloned.length > 0) {
    groups.push({
      label: labels.clonedGroup,
      options: cloned.map((v) => ({
        value: clonedSelectValue(v.id),
        label: formatClonedVoiceOption(v, labels.cloneWord),
      })),
    });
  }
  return groups;
}

/** Lỗi fetch mang body lỗi bridge (để component dịch qua resolveBridgeApiError). */
export class ClonedVoiceApiError extends Error {
  bridgeBody: BridgeApiErrorBody | null;
  httpStatus: number;
  constructor(message: string, body: BridgeApiErrorBody | null, httpStatus: number) {
    super(message);
    this.name = "ClonedVoiceApiError";
    this.bridgeBody = body;
    this.httpStatus = httpStatus;
  }
}

async function readErrorBody(res: Response): Promise<BridgeApiErrorBody | null> {
  try {
    const j = (await res.json()) as BridgeApiErrorBody;
    return j && typeof j === "object" ? j : null;
  } catch {
    return null;
  }
}

/** GET /api/tts/cloned-voices — danh sách giọng đã lưu (mới nhất trước). */
export async function fetchClonedVoices(baseUrl: string): Promise<ClonedVoice[]> {
  const res = await fetch(`${baseUrl}/api/tts/cloned-voices`);
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ClonedVoiceApiError(
      (body && typeof body.error === "string" && body.error) || `HTTP ${res.status}`,
      body,
      res.status,
    );
  }
  const j = (await res.json()) as { voices?: unknown };
  return Array.isArray(j.voices) ? (j.voices as ClonedVoice[]) : [];
}

/** DELETE /api/tts/cloned-voices/:id — xóa hẳn 1 giọng đã lưu. */
export async function deleteClonedVoice(
  baseUrl: string,
  id: string,
): Promise<{ id: string; name: string }> {
  const res = await fetch(`${baseUrl}/api/tts/cloned-voices/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ClonedVoiceApiError(
      (body && typeof body.error === "string" && body.error) || `HTTP ${res.status}`,
      body,
      res.status,
    );
  }
  const j = (await res.json()) as { id?: unknown; name?: unknown };
  return { id: String(j.id ?? id), name: String(j.name ?? "") };
}

// ---------------------------------------------------------------------------
// Export / backup + import giọng clone — Phase 9 đợt 85 M7.
// Định dạng backup (server): 1 file JSON { format: "vcut-cloned-voice" |
// "vcut-cloned-voices-backup", version: 1, voice(s), refAudioBase64,
// refSha256 } — import lại qua POST /api/tts/cloned-voices/import (bridge
// verify sha + chạy câu thăm dò trước khi ghi registry).
// ---------------------------------------------------------------------------

export interface ClonedVoiceImportEntry {
  name: string;
  reason: string;
}

export interface ClonedVoiceImportSummary {
  imported: ClonedVoice[];
  skipped: ClonedVoiceImportEntry[];
  failed: ClonedVoiceImportEntry[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseImportVoice(v: unknown): ClonedVoice {
  if (!isRecord(v) || typeof v.id !== "string" || typeof v.name !== "string") {
    throw new Error("Kết quả nhập giọng sai định dạng (thiếu id/tên giọng).");
  }
  return {
    id: v.id,
    name: v.name,
    refExt: typeof v.refExt === "string" ? v.refExt : "",
    refDurationSec: typeof v.refDurationSec === "number" ? v.refDurationSec : null,
    createdAt: typeof v.createdAt === "string" ? v.createdAt : "",
  };
}

function parseImportEntries(v: unknown): ClonedVoiceImportEntry[] {
  if (!Array.isArray(v)) throw new Error("Kết quả nhập giọng sai định dạng.");
  return v.map((e) => {
    if (!isRecord(e) || typeof e.name !== "string") {
      throw new Error("Kết quả nhập giọng sai định dạng (mục skipped/failed).");
    }
    return { name: e.name, reason: typeof e.reason === "string" ? e.reason : "" };
  });
}

/** Validate JSON trả về của POST .../import thành summary đã định kiểu. */
export function parseImportSummary(json: unknown): ClonedVoiceImportSummary {
  if (!isRecord(json)) throw new Error("Kết quả nhập giọng sai định dạng.");
  if (!Array.isArray(json.imported)) throw new Error("Kết quả nhập giọng thiếu imported.");
  return {
    imported: json.imported.map(parseImportVoice),
    skipped: parseImportEntries(json.skipped ?? []),
    failed: parseImportEntries(json.failed ?? []),
  };
}

/** URL GET export 1 giọng / export toàn bộ (để component fetch blob). */
export function exportClonedVoiceUrl(baseUrl: string, id: string): string {
  return `${baseUrl}/api/tts/cloned-voices/${encodeURIComponent(id)}/export`;
}
export function exportAllClonedVoicesUrl(baseUrl: string): string {
  return `${baseUrl}/api/tts/cloned-voices/export`;
}

/** Tên file export ở client — cùng thuật toán slug với server (bỏ dấu, kebab). */
export function buildVoiceBackupFilename(name: string, id: string): string {
  const slug = String(name || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 40) || "voice";
  return `vcut-voice-${slug}-${id}.json`;
}

function filenameFromDisposition(cd: string | null, fallback: string): string {
  if (cd) {
    const m = /filename="([^"]+)"/.exec(cd) || /filename=([^;]+)/.exec(cd);
    if (m && m[1]) return m[1].trim();
  }
  return fallback;
}

async function fetchBackupBlob(url: string, fallbackName: string): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ClonedVoiceApiError(
      (body && typeof body.error === "string" && body.error) || `HTTP ${res.status}`,
      body,
      res.status,
    );
  }
  return {
    blob: await res.blob(),
    filename: filenameFromDisposition(res.headers.get("content-disposition"), fallbackName),
  };
}

/** GET export 1 giọng → blob + tên file (tên từ header server). */
export async function fetchClonedVoiceBackup(
  baseUrl: string,
  voice: ClonedVoice,
): Promise<{ blob: Blob; filename: string }> {
  return fetchBackupBlob(
    exportClonedVoiceUrl(baseUrl, voice.id),
    buildVoiceBackupFilename(voice.name, voice.id),
  );
}

/** GET export toàn bộ kho giọng → blob + tên file. */
export async function fetchAllClonedVoicesBackup(
  baseUrl: string,
): Promise<{ blob: Blob; filename: string }> {
  return fetchBackupBlob(
    exportAllClonedVoicesUrl(baseUrl),
    `vcut-voices-backup-${new Date().toISOString().slice(0, 10)}.json`,
  );
}

/**
 * POST /api/tts/cloned-voices/import — nhập file backup JSON (1 giọng hoặc
 * backup toàn bộ). `name` đổi tên khi nhập đúng 1 giọng. Trả summary
 * { imported, skipped, failed }; trùng tên khi nhập 1 giọng → throw
 * ClonedVoiceApiError mang mã TTS_CLONED_VOICE_NAME_DUP.
 */
export async function importClonedVoices(
  baseUrl: string,
  args: { file: File; name?: string; signal?: AbortSignal },
): Promise<ClonedVoiceImportSummary> {
  const form = new FormData();
  form.append("backup", args.file, args.file.name);
  if (args.name) form.append("name", args.name);
  const res = await fetch(`${baseUrl}/api/tts/cloned-voices/import`, {
    method: "POST",
    body: form,
    signal: args.signal,
  });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ClonedVoiceApiError(
      (body && typeof body.error === "string" && body.error) || `HTTP ${res.status}`,
      body,
      res.status,
    );
  }
  return parseImportSummary(await res.json());
}

export interface CreateClonedVoiceResult {
  voice: ClonedVoice;
  /** URL tương đối tới bản đọc thử câu thăm dò (tải 1 lần). */
  downloadUrl: string;
  durationSec: number;
}

export interface CreateClonedVoiceHandlers {
  onPhase?: (phase: string) => void;
  onProgress?: (p: AiJobProgressState) => void;
}

/**
 * POST /api/tts/cloned-voices — tạo giọng mới từ file mẫu.
 * Stream NDJSON như /api/tts (phase load/synth + progress chunk thật +
 * ETA + hủy thật qua signal). Thành công → { voice, downloadUrl } với
 * downloadUrl là bản đọc thử câu thăm dò (nghe được ngay, tải 1 lần).
 * Lỗi validate (400) / TTS chưa sẵn sàng (503) → throw ClonedVoiceApiError
 * mang bridgeBody để component dịch mã lỗi.
 */
export async function createClonedVoice(
  baseUrl: string,
  args: {
    name: string;
    /** File mẫu; null → không gửi field refAudio, server trả 400 đã dịch. */
    file: File | null;
    signal?: AbortSignal;
    onPhase?: CreateClonedVoiceHandlers["onPhase"];
    onProgress?: CreateClonedVoiceHandlers["onProgress"];
    /** Dịch nhãn phase (mặc định trả về chính phase). */
    phaseLabel?: (phase: string) => string;
  },
): Promise<CreateClonedVoiceResult> {
  const form = new FormData();
  form.append("name", args.name);
  if (args.file) form.append("refAudio", args.file, args.file.name);
  const res = await fetch(`${baseUrl}/api/tts/cloned-voices`, {
    method: "POST",
    body: form,
    signal: args.signal,
  });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new ClonedVoiceApiError(
      (body && typeof body.error === "string" && body.error) || `HTTP ${res.status}`,
      body,
      res.status,
    );
  }
  const lookup = (k: string): string => (args.phaseLabel ? args.phaseLabel(k) : k);
  let doneEvt;
  try {
    doneEvt = await readAiJobStream(res, {
      onPhase: (phase) => {
        args.onPhase?.(resolveAiJobPhaseLabel(phase, lookup));
      },
      onProgress: (p) => {
        args.onPhase?.(resolveAiJobPhaseLabel(p.phase, lookup));
        args.onProgress?.(p);
      },
    });
  } catch (e) {
    if (e instanceof AiJobCancelledError) throw e;
    if ((e as Error).message === AI_JOB_STREAM_DROPPED) {
      throw new Error(AI_JOB_STREAM_DROPPED);
    }
    const body = (e as { bridgeBody?: BridgeApiErrorBody }).bridgeBody;
    throw new ClonedVoiceApiError(
      (body && typeof body.error === "string" && body.error) || (e as Error).message,
      body ?? null,
      res.status,
    );
  }
  const voice = (doneEvt as unknown as { clonedVoice?: ClonedVoice }).clonedVoice;
  const downloadUrl = (doneEvt as unknown as { downloadUrl?: string }).downloadUrl;
  const durationSec = (doneEvt as unknown as { durationSec?: number }).durationSec;
  if (!voice || typeof voice.id !== "string" || typeof downloadUrl !== "string") {
    throw new Error("Bridge tạo giọng xong nhưng thiếu thông tin giọng mới.");
  }
  return { voice, downloadUrl, durationSec: typeof durationSec === "number" ? durationSec : 0 };
}

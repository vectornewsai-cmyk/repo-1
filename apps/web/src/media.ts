/**
 * Quản lý media nhập vào editor: probe metadata, thumbnail, và pool
 * các phần tử HTMLVideo/Audio/Image dùng cho preview & phát lại.
 */
import { uid } from "./lib";

export type MediaKind = "video" | "audio" | "image";

export interface MediaItem {
  id: string;
  /** Tên file gốc — cũng là giá trị `src` trong video-spec khi export. */
  name: string;
  kind: MediaKind;
  /** Object URL (blob:) để preview local. */
  url: string;
  /** Thời lượng giây (ảnh = 0, khi thêm vào timeline sẽ dùng độ dài mặc định). */
  duration: number;
  width?: number;
  height?: number;
  /** Ảnh thumbnail dataURL (nếu tạo được). */
  thumbnail?: string;
  /** File gốc — dùng để upload lên bridge server khi xuất MP4 (P0-01). */
  file?: File;
}

function kindOf(file: File): MediaKind | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

function probeVideo(url: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const done = () => {
      resolve({ duration: v.duration || 0, width: v.videoWidth, height: v.videoHeight });
      v.src = "";
    };
    v.onloadedmetadata = done;
    v.onerror = () => reject(new Error("Không đọc được metadata video"));
    v.src = url;
  });
}

function probeAudio(url: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    const a = document.createElement("audio");
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      resolve({ duration: a.duration || 0 });
      a.src = "";
    };
    a.onerror = () => reject(new Error("Không đọc được metadata audio"));
    a.src = url;
  });
}

function probeImage(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Không đọc được ảnh"));
    img.src = url;
  });
}

/** Chụp 1 frame video làm thumbnail (không throw nếu thất bại). */
async function captureVideoThumb(url: string): Promise<string | undefined> {
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    await new Promise<void>((resolve, reject) => {
      v.onloadeddata = () => resolve();
      v.onerror = () => reject(new Error("thumb fail"));
    });
    // tua tới 10% hoặc 0.5s để tránh frame đen đầu video
    const target = Math.min(0.5, (v.duration || 1) * 0.1);
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
      v.currentTime = target;
      // phòng hờ seeked không bắn
      setTimeout(resolve, 800);
    });
    const c = document.createElement("canvas");
    const w = 160;
    const h = Math.max(1, Math.round((w * v.videoHeight) / Math.max(1, v.videoWidth)));
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(v, 0, 0, w, h);
    v.src = "";
    return c.toDataURL("image/jpeg", 0.7);
  } catch {
    return undefined;
  }
}

/** Biến 1 File người dùng chọn thành MediaItem (tên được làm duy nhất ở store). */
export async function fileToMediaItem(file: File): Promise<MediaItem> {
  const kind = kindOf(file);
  if (!kind) throw new Error(`Định dạng không hỗ trợ: ${file.name}`);
  const url = URL.createObjectURL(file);
  const item: MediaItem = { id: uid("m"), name: file.name, kind, url, duration: 0, file };
  try {
    if (kind === "video") {
      const meta = await probeVideo(url);
      item.duration = meta.duration;
      item.width = meta.width;
      item.height = meta.height;
      item.thumbnail = await captureVideoThumb(url);
    } else if (kind === "audio") {
      const meta = await probeAudio(url);
      item.duration = meta.duration;
    } else {
      const meta = await probeImage(url);
      item.width = meta.width;
      item.height = meta.height;
      item.thumbnail = url; // ảnh gốc làm thumbnail luôn
    }
  } catch {
    // probe thất bại vẫn giữ item (duration 0) — preview sẽ bỏ qua nếu không dùng được
  }
  return item;
}

/**
 * Pool phần tử media dùng chung cho preview & phát lại.
 * Mỗi MediaItem chỉ có tối đa 1 phần tử mỗi loại — tránh tạo trùng.
 */
export class MediaPool {
  private videos = new Map<string, HTMLVideoElement>();
  private audios = new Map<string, HTMLAudioElement>();
  private images = new Map<string, HTMLImageElement>();

  videoFor(item: MediaItem): HTMLVideoElement | null {
    if (item.kind !== "video") return null;
    let el = this.videos.get(item.id);
    if (!el) {
      el = document.createElement("video");
      el.src = item.url;
      el.preload = "auto";
      el.playsInline = true;
      this.videos.set(item.id, el);
    }
    return el;
  }

  audioFor(item: MediaItem): HTMLAudioElement | null {
    if (item.kind !== "audio") return null;
    let el = this.audios.get(item.id);
    if (!el) {
      el = document.createElement("audio");
      el.src = item.url;
      el.preload = "auto";
      this.audios.set(item.id, el);
    }
    return el;
  }

  imageFor(item: MediaItem): HTMLImageElement | null {
    if (item.kind !== "image") return null;
    let el = this.images.get(item.id);
    if (!el) {
      el = new Image();
      el.src = item.url;
      this.images.set(item.id, el);
    }
    return el;
  }

  /** Dừng hết mọi phần tử đang phát (khi pause/stop/scrub). */
  pauseAll(): void {
    for (const v of this.videos.values()) v.pause();
    for (const a of this.audios.values()) a.pause();
  }

  /** Duyệt mọi phần tử media (R1-062: để syncPlaying dừng element không còn active). */
  eachMedia(fn: (el: HTMLVideoElement | HTMLAudioElement) => void): void {
    for (const v of this.videos.values()) fn(v);
    for (const a of this.audios.values()) fn(a);
  }
}

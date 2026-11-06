/**
 * ingestProgress39T5.ts — Băm SHA-256 tăng dần + sự kiện tiến trình cho
 * ingest/relink (Phase 9 đợt 39, luồng T5 — đóng nợ §5 mục 6 của
 * docs/PHASE9_ROUND38_LIMITS.md).
 *
 * Vấn đề (đợt 38 U3 §4): `AssetStore.ingest` tính SHA-256 toàn file bằng
 * một lần `crypto.subtle.digest` rồi mới ghi IndexedDB, nên relink file
 * lớn chỉ hiện spinner mù ("Đang đọc…") cho tới khi xong — không có %,
 * không có số byte, không phân biệt đang băm hay đang ghi.
 *
 * Giải pháp: băm tăng dần bằng SHA-256 thuần JS (không phụ thuộc thư
 * viện ngoài), đọc Blob theo lát 8 MiB và báo tiến trình sau mỗi lát.
 * Nhờ đó UI biết chính xác: đang băm bao nhiêu / tổng bao nhiêu byte.
 * Giai đoạn "storing" (ghi IndexedDB) không đo được byte theo thời gian
 * thực vì IDB `put` là nguyên tử — UI phải hiển thị đúng như vậy (số
 * byte đã băm xong + nhãn "đang ghi"), KHÔNG bịa % cho giai đoạn này.
 *
 * Độ đúng của bộ băm: khoá bằng test so với `crypto.subtle.digest` trên
 * dữ liệu ngẫu nhiên + file MP4 thật hàng trăm MB (xem
 * relink39T5.test.ts và docs/PHASE9_ROUND39_T5_RELINK_LIMITS.md).
 * Băm thuần JS chậm hơn WebCrypto (đo thật trong LIMITS) nhưng là cái
 * giá để có tiến trình theo lát; đường ingest cũ không tiến trình
 * (`AssetStore.ingest`) giữ nguyên và vẫn dùng WebCrypto nhanh.
 *
 * Giới hạn trung thực:
 * - Chỉ có tiến trình cho giai đoạn băm (đọc + băm theo lát). Giai đoạn
 *   ghi IDB vẫn là một bước nguyên tử không % — UI hiển thị nhãn pha
 *   chứ không hiển thị % giả.
 * - Bộ nhớ: lát đọc 8 MiB, không giữ toàn file trong bộ nhớ ở phía băm;
 *   nhưng `AssetStore.ingestWithProgress` vẫn phải giữ nguyên Blob gốc
 *   để ghi IDB (Blob đó user đã có sẵn trong bộ nhớ phiên), nên tổng
 *   bộ nhớ đỉnh thấp hơn đường cũ (đường cũ cộng thêm một ArrayBuffer
 *   toàn file cho `subtle.digest`).
 */

/** Một pha của quá trình ingest có thể báo cho UI. */
export type IngestPhase = "hashing" | "storing" | "done";

/**
 * Một sự kiện tiến trình. `bytesDone` trong pha "hashing" là số byte đã
 * băm; trong pha "storing"/"done" là tổng số byte (đã băm xong, đang /
 * đã ghi). `percent` chỉ có ý nghĩa trong pha "hashing"; UI KHÔNG được
 * nội suy % cho pha "storing".
 */
export interface IngestProgressEvent {
  phase: IngestPhase;
  bytesDone: number;
  totalBytes: number;
}

export type IngestProgressCallback = (ev: IngestProgressEvent) => void;

/**
 * Đợt 40 V5 — sự kiện tiến trình của `importFiles` thường: như
 * `IngestProgressEvent` cộng thêm file nào trong đợt import (chỉ số
 * 0-based trong danh sách item đã chốt tên, tổng số item, tên file).
 * Ngữ nghĩa pha/% giữ nguyên đợt 39 T5: % chỉ thật ở pha hashing,
 * pha storing chỉ báo "đang ghi — không có %", không nội suy.
 */
export interface ImportFileProgressEvent extends IngestProgressEvent {
  /** Chỉ số 0-based của file trong đợt import (sau bước làm duy nhất tên). */
  fileIndex: number;
  /** Tổng số item trong đợt import. */
  fileCount: number;
  /** Tên file đã chốt duy nhất (khớp tên media item). */
  fileName: string;
}

export type ImportFileProgressCallback = (ev: ImportFileProgressEvent) => void;

/**
 * ROUND43-Y3 — thời gian hiển thị tối thiểu của banner tiến trình import
 * (tính từ sự kiện tiến trình đầu tiên tới khi chuyển sang pha "storing").
 * Đợt 42 X3 đo thật: file ≤ 64 MiB chỉ có 1 event hashing 100% rồi sang
 * storing ngay, flash chỉ ~1–25 ms — có thật trong DOM nhưng mắt người
 * không đọc được thành tiến trình. 500 ms là ngưỡng đọc được một dòng
 * trạng thái ngắn mà vẫn không gây cảm giác chờ (file lớn băm lâu hơn
 * 500 ms thì không bị pad thêm — xem ingestWithProgress).
 */
export const IMPORT_BANNER_MIN_DISPLAY_MS = 500;

/** Kích thước lát đọc mặc định: 8 MiB (đủ lớn để băm hiệu quả, đủ nhỏ để UI cập nhật mượt). */
export const INGEST_CHUNK_SIZE = 8 * 1024 * 1024;

/**
 * Ngưỡng dùng băm tăng dần: file ≤ 64 MiB dùng WebCrypto một lần
 * (nhanh, ~0,2 s cho 64 MiB) vì tiến trình theo lát không đáng giá so
 * với chi phí băm thuần JS; file lớn hơn mới băm theo lát để UI có %
 * thật. Khi dùng nhánh WebCrypto, callback chỉ nhận MỘT sự kiện hashing
 * chốt ở 100% (báo "đã băm xong", không phải tiến trình từng lát) rồi
 * tới storing/done — UI hiển thị đúng như vậy, không bịa % giữa chừng.
 */
export const INGEST_CHUNKED_THRESHOLD = 64 * 1024 * 1024;

/** Định dạng số byte thành chuỗi "123,4 MB" (locale vi, 1 số lẻ). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  if (u === 0) return `${Math.round(v)} B`;
  return `${v.toFixed(1).replace(".", ",")} ${units[u]}`;
}

/** % đã băm (0–100), làm tròn xuống; total <= 0 → 0. */
export function ingestPercent(ev: IngestProgressEvent): number {
  if (ev.totalBytes <= 0) return 0;
  return Math.min(100, Math.floor((ev.bytesDone / ev.totalBytes) * 100));
}

// ---------------------------------------------------------------------------
// SHA-256 tăng dần (FIPS 180-4), triển khai thuần, không dùng WebCrypto.
// ---------------------------------------------------------------------------

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const SHA256_H0 = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

function rotr32(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/** Bộ băm SHA-256 tăng dần: `update()` nhiều lần rồi `digest()` một lần. */
export class Sha256Incremental {
  private h: number[] = [...SHA256_H0];
  /** Byte lẻ chưa đủ một block 64 byte, chờ đợt update sau. */
  private tail: Uint8Array = new Uint8Array(0);
  private totalBytes = 0;
  private readonly w: number[] = new Array<number>(64);

  private processBlocks(buf: Uint8Array, length: number): void {
    const w = this.w;
    for (let off = 0; off + 64 <= length; off += 64) {
      for (let i = 0; i < 16; i++) {
        const o = off + i * 4;
        w[i] = ((buf[o] << 24) | (buf[o + 1] << 16) | (buf[o + 2] << 8) | buf[o + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = (rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
        const s1 = (rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = this.h[0], b = this.h[1], c = this.h[2], d = this.h[3];
      let e = this.h[4], f = this.h[5], g = this.h[6], h = this.h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) >>> 0;
        const ch = ((e & f) ^ (~e & g)) >>> 0;
        const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
        const S0 = (rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      this.h[0] = (this.h[0] + a) >>> 0; this.h[1] = (this.h[1] + b) >>> 0;
      this.h[2] = (this.h[2] + c) >>> 0; this.h[3] = (this.h[3] + d) >>> 0;
      this.h[4] = (this.h[4] + e) >>> 0; this.h[5] = (this.h[5] + f) >>> 0;
      this.h[6] = (this.h[6] + g) >>> 0; this.h[7] = (this.h[7] + h) >>> 0;
    }
  }

  update(data: Uint8Array): void {
    this.totalBytes += data.length;
    let buf: Uint8Array;
    if (this.tail.length > 0) {
      const merged = new Uint8Array(this.tail.length + data.length);
      merged.set(this.tail, 0);
      merged.set(data, this.tail.length);
      buf = merged;
    } else {
      buf = data;
    }
    const full = buf.length - (buf.length % 64);
    this.processBlocks(buf, full);
    this.tail = buf.slice(full);
  }

  /** Kết thúc băm, trả hex 64 ký tự. Gọi một lần (đối tượng dùng một lần). */
  digest(): string {
    const bitLenLow = (this.totalBytes << 3) >>> 0;
    const bitLenHigh = Math.floor(this.totalBytes / 0x20000000) >>> 0;
    const padLen = (64 - ((this.tail.length + 9) % 64)) % 64; // số byte 0 sau 0x80 để tổng % 64 == 0
    const padded = new Uint8Array(this.tail.length + 1 + padLen + 8);
    padded.set(this.tail, 0);
    padded[this.tail.length] = 0x80;
    for (let i = 3; i >= 0; i--) padded[padded.length - 8 + (3 - i)] = (bitLenHigh >>> (i * 8)) & 0xff;
    for (let i = 3; i >= 0; i--) padded[padded.length - 4 + (3 - i)] = (bitLenLow >>> (i * 8)) & 0xff;
    this.processBlocks(padded, padded.length);
    return this.h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }
}

/**
 * Băm một Blob theo lát, báo tiến trình sau mỗi lát (pha "hashing").
 * Blob rỗng → hash của chuỗi rỗng, vẫn báo một sự kiện done-phần (0/0).
 */
export async function hashBlobIncremental(
  blob: Blob,
  onProgress?: IngestProgressCallback,
  chunkSize: number = INGEST_CHUNK_SIZE,
): Promise<string> {
  const hasher = new Sha256Incremental();
  const total = blob.size;
  let done = 0;
  if (total === 0) {
    onProgress?.({ phase: "hashing", bytesDone: 0, totalBytes: 0 });
    return hasher.digest();
  }
  const step = Math.max(1, Math.floor(chunkSize));
  for (let off = 0; off < total; off += step) {
    const slice = blob.slice(off, Math.min(total, off + step));
    const buf = new Uint8Array(await slice.arrayBuffer());
    hasher.update(buf);
    done += buf.length;
    onProgress?.({ phase: "hashing", bytesDone: done, totalBytes: total });
    // Đợt 42 X3: nhường 1 macrotask sau mỗi sự kiện để React kịp commit
    // banner % từng lát. Không có dòng này, các setState dồn lại và UI
    // chỉ vẽ trạng thái cuối (storing) — click-test headed chứng minh
    // % từng lát không bao giờ hiện dù event đã bắn đủ. Chi phí ~1–4 ms/lát,
    // không đáng kể so với thời gian băm 1 lát 8 MiB.
    await new Promise((r) => setTimeout(r, 0));
  }
  return hasher.digest();
}

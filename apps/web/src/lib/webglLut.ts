/**
 * webglLut.ts — Preview LUT bằng WebGL thật (R5, Phase 9).
 *
 * Vấn đề: preview trước đây chỉ xấp xỉ LUT bằng CSS filter (LUT_CSS trong
 * previewEngine.ts). Sau Phase 8 fit, sai số trung bình còn ~16/255, LUT cong
 * mạnh (solarized...) sai tới ~100/255. Render FFmpeg dùng filter `lut3d`
 * với nội suy trilinear trên lưới 3D thật — preview cần làm đúng phép đó.
 *
 * Cách làm:
 * - File .cube được phục vụ bởi bridge local (GET /api/luts/:id, xem
 *   server/bridge/src/index.js) — KHÔNG bundle ~20MB .cube vào web, KHÔNG
 *   cần mạng ngoài. LUT user (id `user-*`) đọc từ IndexedDB (userLut.ts).
 * - Shader WebGL: lưới 3D đóng gói thành texture 2D (rộng size*size, cao
 *   size; texel (r + g*size, b)), nội suy trilinear thủ công 8 tap với
 *   NEAREST sampling, đúng thứ tự dữ liệu .cube (R nhanh nhất, rồi G, rồi B)
 *   và đúng DOMAIN_MIN/MAX (khớp FFmpeg lut3d).
 * - Fallback: WebGL không khả dụng, context mất, bridge chưa chạy, hoặc
 *   .cube chưa load xong → trả null, caller giữ đường CSS approx cũ.
 *   Trạng thái hiện tại đọc qua getLutBadge() để UI báo rõ chế độ.
 *
 * Module này an toàn khi import trong Node (test): mọi truy cập DOM/WebGL
 * đều nằm trong hàm, không chạy ở top-level.
 */

/** LUT 3D đã parse, kèm dữ liệu RGB (R nhanh nhất, rồi G, rồi B). */
export interface CubeData {
  size: number;
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  /** size^3 * 3 số float, thứ tự [r0,g0,b0, r1,g1,b1, ...]. */
  data: Float32Array;
}

const CUBE_SIZE_MIN = 2;
const CUBE_SIZE_MAX = 256;

/**
 * Parse + validate nội dung .cube (Adobe IRIDAS Cube, chỉ LUT 3D).
 * Quy tắc validate mirror userLut.parseCube (size 2..256, đúng size^3 dòng,
 * giá trị -1..2, từ chối LUT 1D) — khác ở chỗ TRẢ VỀ dữ liệu để dùng thật.
 */
export function parseCubeData(text: string): CubeData {
  if (text.trim().length === 0) throw new Error("File .cube rỗng.");
  let title: string | undefined;
  let size: number | undefined;
  let domainMin: [number, number, number] = [0, 0, 0];
  let domainMax: [number, number, number] = [1, 1, 1];
  const rows: number[] = [];
  let sawData = false;

  const parseTriple = (
    parts: string[],
    what: string,
  ): [number, number, number] => {
    if (parts.length !== 3) {
      throw new Error(`${what} phải có đúng 3 số (nhận được: ${parts.join(" ")}).`);
    }
    const nums = parts.map(Number);
    if (nums.some((n) => !Number.isFinite(n))) {
      throw new Error(`${what} chứa số không hợp lệ: ${parts.join(" ")}.`);
    }
    return nums as [number, number, number];
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const [key, ...rest] = line.split(/\s+/);
    if (!sawData && key === "TITLE") {
      const m = rawLine.match(/TITLE\s+(.*)/);
      title = (m?.[1] ?? "").trim().replace(/^"(.*)"$/, "$1") || undefined;
      continue;
    }
    if (!sawData && key === "LUT_3D_SIZE") {
      const n = Number(rest[0]);
      if (!Number.isInteger(n) || n < CUBE_SIZE_MIN || n > CUBE_SIZE_MAX) {
        throw new Error(
          `LUT_3D_SIZE không hợp lệ: ${rest[0]} (cần số nguyên ${CUBE_SIZE_MIN}..${CUBE_SIZE_MAX}).`,
        );
      }
      if (size !== undefined) throw new Error("File có 2 dòng LUT_3D_SIZE.");
      size = n;
      continue;
    }
    if (!sawData && key === "LUT_1D_SIZE") {
      throw new Error("Chỉ hỗ trợ LUT 3D (LUT_3D_SIZE). File LUT 1D chưa được hỗ trợ.");
    }
    if (!sawData && key === "DOMAIN_MIN") {
      domainMin = parseTriple(rest, "DOMAIN_MIN");
      continue;
    }
    if (!sawData && key === "DOMAIN_MAX") {
      domainMax = parseTriple(rest, "DOMAIN_MAX");
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length !== 3) {
      throw new Error(`Dòng dữ liệu sai định dạng (cần đúng 3 số): "${line.slice(0, 60)}".`);
    }
    const nums = parts.map(Number);
    if (nums.some((n) => !Number.isFinite(n) || n < -1 || n > 2)) {
      throw new Error(`Giá trị màu ngoài khoảng cho phép (-1..2): "${line.slice(0, 60)}".`);
    }
    sawData = true;
    rows.push(nums[0], nums[1], nums[2]);
  }

  if (size === undefined) throw new Error("Thiếu dòng LUT_3D_SIZE trong file .cube.");
  const expected = size * size * size * 3;
  if (rows.length !== expected) {
    throw new Error(
      `Số dòng dữ liệu không khớp LUT_3D_SIZE ${size}: có ${rows.length / 3} dòng, cần ${expected / 3} dòng.`,
    );
  }
  void title;
  return { size, domainMin, domainMax, data: new Float32Array(rows) };
}

/**
 * Nội suy trilinear trên CPU — mirror đúng công thức shader (để test đối
 * chiếu với FFmpeg mà không cần GPU). Input/output trong [0,1].
 */
export function trilinearSample(
  cube: CubeData,
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const { size, domainMin, domainMax, data } = cube;
  const map = (v: number, mn: number, mx: number): number => {
    const d = mx - mn;
    const t = d === 0 ? v : (v - mn) / d;
    return Math.min(1, Math.max(0, t)) * (size - 1);
  };
  const pr = map(r, domainMin[0], domainMax[0]);
  const pg = map(g, domainMin[1], domainMax[1]);
  const pb = map(b, domainMin[2], domainMax[2]);
  const br = Math.min(size - 2, Math.floor(pr));
  const bg = Math.min(size - 2, Math.floor(pg));
  const bb = Math.min(size - 2, Math.floor(pb));
  const fr = pr - br;
  const fg = pg - bg;
  const fb = pb - bb;
  const at = (dr: number, dg: number, db: number): [number, number, number] => {
    const idx = (br + dr + size * (bg + dg + size * (bb + db))) * 3;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };
  const mix = (a: number, c: number, t: number): number => a + (c - a) * t;
  const c000 = at(0, 0, 0);
  const c100 = at(1, 0, 0);
  const c010 = at(0, 1, 0);
  const c110 = at(1, 1, 0);
  const c001 = at(0, 0, 1);
  const c101 = at(1, 0, 1);
  const c011 = at(0, 1, 1);
  const c111 = at(1, 1, 1);
  const out: [number, number, number] = [0, 0, 0];
  for (let ch = 0; ch < 3; ch++) {
    const x00 = mix(c000[ch], c100[ch], fr);
    const x10 = mix(c010[ch], c110[ch], fr);
    const x01 = mix(c001[ch], c101[ch], fr);
    const x11 = mix(c011[ch], c111[ch], fr);
    const y0 = mix(x00, x10, fg);
    const y1 = mix(x01, x11, fg);
    out[ch] = mix(y0, y1, fb);
  }
  return out;
}

/** Áp LUT lên buffer RGBA bằng CPU (dùng cho test đối chiếu FFmpeg). */
export function applyLutToPixels(
  cube: CubeData,
  rgba: Uint8ClampedArray,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const [r, g, b] = trilinearSample(
      cube,
      rgba[i] / 255,
      rgba[i + 1] / 255,
      rgba[i + 2] / 255,
    );
    out[i] = Math.min(255, Math.max(0, Math.round(r * 255)));
    out[i + 1] = Math.min(255, Math.max(0, Math.round(g * 255)));
    out[i + 2] = Math.min(255, Math.max(0, Math.round(b * 255)));
    out[i + 3] = rgba[i + 3];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Phần WebGL (chỉ chạy trong browser; mọi hàm đều guard typeof document).
// ---------------------------------------------------------------------------

export type LutPreviewMode = "webgl" | "loading" | "css" | "unavailable";

function bridgeUrl(): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (env?.VITE_BRIDGE_URL) return env.VITE_BRIDGE_URL;
  } catch {
    /* bỏ qua */
  }
  return "http://127.0.0.1:8787";
}

const VERT_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// uSize: kích thước lưới. Texture LUT: rộng size*size, cao size,
// texel (r + g*size, b). NEAREST + 8 tap thủ công = trilinear chính xác.
const FRAG_SRC = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform sampler2D uLut;
uniform float uSize;
uniform vec3 uDMin;
uniform vec3 uDMax;
vec3 fetchLut(float r, float g, float b) {
  float x = (r + g * uSize + 0.5) / (uSize * uSize);
  float y = (b + 0.5) / uSize;
  return texture2D(uLut, vec2(x, y)).rgb;
}
void main() {
  vec4 src = texture2D(uSrc, vUv);
  vec3 cd = (src.rgb - uDMin) / (uDMax - uDMin);
  cd = clamp(cd, 0.0, 1.0) * (uSize - 1.0);
  vec3 base = floor(cd);
  base = min(base, vec3(uSize - 2.0));
  vec3 f = cd - base;
  vec3 c000 = fetchLut(base.x, base.y, base.z);
  vec3 c100 = fetchLut(base.x + 1.0, base.y, base.z);
  vec3 c010 = fetchLut(base.x, base.y + 1.0, base.z);
  vec3 c110 = fetchLut(base.x + 1.0, base.y + 1.0, base.z);
  vec3 c001 = fetchLut(base.x, base.y, base.z + 1.0);
  vec3 c101 = fetchLut(base.x + 1.0, base.y, base.z + 1.0);
  vec3 c011 = fetchLut(base.x, base.y + 1.0, base.z + 1.0);
  vec3 c111 = fetchLut(base.x + 1.0, base.y + 1.0, base.z + 1.0);
  vec3 x00 = mix(c000, c100, f.x);
  vec3 x10 = mix(c010, c110, f.x);
  vec3 x01 = mix(c001, c101, f.x);
  vec3 x11 = mix(c011, c111, f.x);
  vec3 y0 = mix(x00, x10, f.y);
  vec3 y1 = mix(x01, x11, f.y);
  vec3 outCol = mix(y0, y1, f.z);
  gl_FragColor = vec4(clamp(outCol, 0.0, 1.0), src.a);
}
`;

interface LutTexture {
  tex: WebGLTexture;
  cube: CubeData;
  floatTex: boolean;
}

class WebglLutRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private srcTex: WebGLTexture | null = null;
  private textures = new Map<string, LutTexture>();
  private lost = false;

  private ensureGl(): WebGLRenderingContext | null {
    if (typeof document === "undefined") return null;
    if (this.gl && !this.lost) return this.gl;
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        this.lost = true;
        this.textures.clear();
        this.gl = null;
        this.prog = null;
        this.srcTex = null;
      });
      this.canvas.addEventListener("webglcontextrestored", () => {
        this.lost = false;
      });
    }
    const gl = this.canvas.getContext("webgl", {
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
    }) as WebGLRenderingContext | null;
    if (!gl) return null;
    this.gl = gl;
    this.lost = false;
    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    this.prog = prog;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.srcTex = gl.createTexture();
    return gl;
  }

  ensureLut(id: string, cube: CubeData): boolean {
    const gl = this.ensureGl();
    if (!gl || !this.prog) return false;
    if (this.textures.has(id)) return true;
    const { size, data } = cube;
    // Texture LUT: (size*size) x size, RGBA. Thử float trước (chính xác tuyệt
    // đối); không có OES_texture_float thì lượng tử hoá 8-bit (sai số tối đa
    // 0.5/255 — vẫn nhỏ hơn hẳn CSS approx).
    const floatExt = gl.getExtension("OES_texture_float");
    const tex = gl.createTexture();
    if (!tex) return false;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const w = size * size;
    const h = size;
    let floatTex = false;
    if (floatExt) {
      const rgba = new Float32Array(w * h * 4);
      for (let i = 0; i < size * size * size; i++) {
        rgba[i * 4] = data[i * 3];
        rgba[i * 4 + 1] = data[i * 3 + 1];
        rgba[i * 4 + 2] = data[i * 3 + 2];
        rgba[i * 4 + 3] = 1;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.FLOAT, rgba);
      floatTex = true;
    } else {
      const rgba = new Uint8Array(w * h * 4);
      for (let i = 0; i < size * size * size; i++) {
        rgba[i * 4] = Math.min(255, Math.max(0, Math.round(data[i * 3] * 255)));
        rgba[i * 4 + 1] = Math.min(255, Math.max(0, Math.round(data[i * 3 + 1] * 255)));
        rgba[i * 4 + 2] = Math.min(255, Math.max(0, Math.round(data[i * 3 + 2] * 255)));
        rgba[i * 4 + 3] = 255;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    }
    this.textures.set(id, { tex, cube, floatTex });
    void floatTex;
    return true;
  }

  /** Cho test/debug biết texture LUT đang dùng float hay 8-bit. */
  textureInfo(lutId: string): { floatTex: boolean } | null {
    const lt = this.textures.get(lutId);
    return lt ? { floatTex: lt.floatTex } : null;
  }

  apply(
    source: CanvasImageSource,
    lutId: string,
    outW: number,
    outH: number,
  ): HTMLCanvasElement | null {
    const gl = this.ensureGl();
    if (!gl || !this.prog || !this.canvas || !this.srcTex) return null;
    const lt = this.textures.get(lutId);
    if (!lt) return null;
    if (this.canvas.width !== outW || this.canvas.height !== outH) {
      this.canvas.width = outW;
      this.canvas.height = outH;
    }
    gl.viewport(0, 0, outW, outH);
    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);
    } catch {
      return null;
    }
    gl.uniform1i(gl.getUniformLocation(this.prog, "uSrc"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, lt.tex);
    gl.uniform1i(gl.getUniformLocation(this.prog, "uLut"), 1);
    gl.uniform1f(gl.getUniformLocation(this.prog, "uSize"), lt.cube.size);
    gl.uniform3f(gl.getUniformLocation(this.prog, "uDMin"), ...lt.cube.domainMin);
    gl.uniform3f(gl.getUniformLocation(this.prog, "uDMax"), ...lt.cube.domainMax);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this.canvas;
  }
}

const renderer = new WebglLutRenderer();
const loadedCubes = new Map<string, CubeData>();
const loadingSet = new Set<string>();
const failedAt = new Map<string, number>();
const RETRY_MS = 30_000;

let lastMode: LutPreviewMode = "unavailable";
let lastLutId: string | null = null;

/** Trạng thái LUT của lần áp gần nhất (để UI badge đọc). */
export function getLutBadge(): { mode: LutPreviewMode; lutId: string | null } {
  return { mode: lastMode, lutId: lastLutId };
}

/** Texture info của LUT đã load (null nếu chưa load) — dùng cho test/debug. */
export function getLutTextureInfo(lutId: string): { floatTex: boolean } | null {
  return renderer.textureInfo(lutId);
}

async function loadCube(lutId: string): Promise<CubeData> {
  const cached = loadedCubes.get(lutId);
  if (cached) return cached;
  let text: string;
  if (lutId.startsWith("user-")) {
    // LUT user nằm trong IndexedDB của trình duyệt (không qua bridge).
    const { getUserLut } = await import("./userLut");
    const ul = await getUserLut(lutId);
    if (!ul) throw new Error(`Không tìm thấy LUT user ${lutId}.`);
    text = ul.text;
  } else {
    const res = await fetch(`${bridgeUrl()}/api/luts/${encodeURIComponent(lutId)}`);
    if (!res.ok) throw new Error(`Bridge trả ${res.status} cho LUT ${lutId}.`);
    text = await res.text();
  }
  const cube = parseCubeData(text);
  loadedCubes.set(lutId, cube);
  return cube;
}

/**
 * Áp LUT WebGL lên source, trả canvas kết quả — hoặc null để caller giữ
 * đường CSS approx (LUT chưa load xong / WebGL không khả dụng / load lỗi).
 * Hàm đồng bộ theo thiết kế vòng lặp vẽ: lần đầu gặp LUT mới sẽ kick-off
 * load bất đồng bộ và trả null; các frame sau khi load xong sẽ dùng WebGL.
 */
export function applyWebglLut(
  source: CanvasImageSource,
  lutId: string,
  outW: number,
  outH: number,
): HTMLCanvasElement | null {
  lastLutId = lutId;
  const cube = loadedCubes.get(lutId);
  if (cube) {
    if (renderer.ensureLut(lutId, cube)) {
      const out = renderer.apply(source, lutId, outW, outH);
      lastMode = out ? "webgl" : "unavailable";
      return out;
    }
    lastMode = "unavailable";
    return null;
  }
  const now = Date.now();
  const failed = failedAt.get(lutId);
  if (failed !== undefined && now - failed < RETRY_MS) {
    lastMode = "css";
    return null;
  }
  if (!loadingSet.has(lutId)) {
    loadingSet.add(lutId);
    lastMode = "loading";
    loadCube(lutId)
      .then((c) => {
        failedAt.delete(lutId);
        renderer.ensureLut(lutId, c);
      })
      .catch(() => {
        failedAt.set(lutId, Date.now());
      })
      .finally(() => {
        loadingSet.delete(lutId);
      });
  } else {
    lastMode = "loading";
  }
  return null;
}

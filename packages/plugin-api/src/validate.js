/**
 * validate.ts — kiểm tra manifest plugin và filter FFmpeg plugin chèn vào.
 *
 * Mọi lỗi đều là PluginError với message rõ ràng, fail fast trước khi plugin
 * được load hoặc filter được đưa vào filter_complex.
 */
import { PluginError } from "./types.js";
const HOOKS = [
    "onClipRender",
    "onExportStart",
    "onExportFinish",
    "onTimelineAction",
    "onProjectValidate",
];
const PERMISSIONS = [
    "filter:inject",
    "timeline:observe",
    "export:observe",
    "export:annotate",
];
const CAPABILITY_KINDS = ["effect", "transition", "export-format", "validator", "tool"];
/** Phiên bản Plugin API host hỗ trợ. */
export const HOST_API_VERSION = 1;
const NAME_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
const CAP_ID_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
/**
 * Validate manifest thô (từ plugin export). Ném PluginError nếu sai.
 * Trả về manifest đã chuẩn hóa (clone).
 */
export function validateManifest(raw) {
    if (!raw || typeof raw !== "object")
        throw new PluginError("manifest phải là object");
    const m = raw;
    if (typeof m.name !== "string" || !NAME_RE.test(m.name))
        throw new PluginError(`manifest.name không hợp lệ (kebab-case, 2-63 ký tự): ${JSON.stringify(m.name)}`);
    if (typeof m.version !== "string" || !SEMVER_RE.test(m.version))
        throw new PluginError(`manifest.version phải là semver x.y.z: ${JSON.stringify(m.version)}`);
    if (typeof m.author !== "string" || m.author.trim().length === 0)
        throw new PluginError("manifest.author đang trống");
    if (m.apiVersion !== HOST_API_VERSION)
        throw new PluginError(`manifest.apiVersion không được hỗ trợ (host: ${HOST_API_VERSION}): ${JSON.stringify(m.apiVersion)}`);
    if (!Array.isArray(m.hooks) || m.hooks.length === 0)
        throw new PluginError("manifest.hooks phải là mảng không rỗng");
    for (const h of m.hooks)
        if (!HOOKS.includes(h))
            throw new PluginError(`hook không hỗ trợ: ${JSON.stringify(h)} (hỗ trợ: ${HOOKS.join(", ")})`);
    if (m.permissions !== undefined) {
        if (!Array.isArray(m.permissions))
            throw new PluginError("manifest.permissions phải là mảng");
        for (const p of m.permissions)
            if (!PERMISSIONS.includes(p))
                throw new PluginError(`permission không hỗ trợ: ${JSON.stringify(p)}`);
        if (m.hooks.includes("onClipRender") && !m.permissions.includes("filter:inject"))
            throw new PluginError('hook "onClipRender" yêu cầu permission "filter:inject"');
    }
    else if (m.hooks.includes("onClipRender")) {
        throw new PluginError('hook "onClipRender" yêu cầu permission "filter:inject"');
    }
    if (m.capabilities !== undefined) {
        if (!Array.isArray(m.capabilities))
            throw new PluginError("manifest.capabilities phải là mảng");
        for (const c of m.capabilities)
            validateCapability(c);
    }
    if (m.defaultConfig !== undefined) {
        try {
            JSON.parse(JSON.stringify(m.defaultConfig));
        }
        catch {
            throw new PluginError("manifest.defaultConfig phải là JSON thuần");
        }
    }
    // Clone để plugin không giữ tham chiếu mutable vào object đã validate.
    return JSON.parse(JSON.stringify(m));
}
function validateCapability(c) {
    if (!c || typeof c !== "object")
        throw new PluginError("capability phải là object");
    if (!CAPABILITY_KINDS.includes(c.kind))
        throw new PluginError(`capability.kind không hỗ trợ: ${JSON.stringify(c.kind)}`);
    if (typeof c.id !== "string" || !CAP_ID_RE.test(c.id))
        throw new PluginError(`capability.id không hợp lệ: ${JSON.stringify(c.id)}`);
    if (typeof c.label !== "string" || c.label.trim().length === 0)
        throw new PluginError("capability.label đang trống");
}
// ---------------------------------------------------------------------------
// Validate filter FFmpeg plugin chèn qua onClipRender.
// ---------------------------------------------------------------------------
/** Filter đọc file/tạo nguồn tùy ý — cấm vì có thể đọc file ngoài ý muốn. */
const BANNED_FILTER_PREFIXES = [
    "movie=",
    "amovie=",
    "subtitles=",
    "ass=",
    "textfile=",
    "fontfile=", // fontfile trỏ tới path tùy ý; host tự resolve font
    "loadfont=",
];
/**
 * Kiểm tra 1 filter string plugin trả về. Ném PluginError nếu nguy hiểm.
 * Cho phép: drawtext (text inline), eq, colorbalance, vignette, gblur...
 * Cấm: dấu `;` (tách filtergraph), xuống dòng, stream label [..],
 *      filter đọc file/tạo nguồn.
 */
export function assertSafeFilter(filter) {
    if (typeof filter !== "string" || filter.trim().length === 0)
        throw new PluginError("filter phải là chuỗi không rỗng");
    if (filter.length > 4096)
        throw new PluginError("filter quá dài (> 4096 ký tự)");
    if (/[;\r\n]/.test(filter))
        throw new PluginError("filter chứa ký tự cấm (;/xuống dòng)");
    if (/[\[\]]/.test(filter))
        throw new PluginError("filter chứa stream label [ ] — plugin không được tự nối stream");
    const head = filter.trim().split(/[=(:]/, 1)[0].toLowerCase();
    // Lấy tên filter trước dấu = hoặc (
    const name = filter.trim().match(/^([a-zA-Z0-9_]+)/)?.[1]?.toLowerCase() ?? "";
    void head;
    for (const banned of BANNED_FILTER_PREFIXES) {
        const key = banned.replace("=", "");
        if (name === key)
            throw new PluginError(`filter bị cấm (đọc file/tạo nguồn): ${name}`);
    }
    // Chặn tham số đọc file dù nằm sâu trong chuỗi (vd drawtext=textfile=...).
    const lower = filter.toLowerCase();
    for (const banned of BANNED_FILTER_PREFIXES) {
        if (lower.includes(banned))
            throw new PluginError(`filter chứa tham số đọc file bị cấm: ${banned.replace("=", "")}`);
    }
}
/** Validate toàn bộ filters plugin trả về; trả về mảng đã trim. */
export function validatePluginFilters(filters) {
    if (filters === undefined)
        return [];
    if (!Array.isArray(filters))
        throw new PluginError("onClipRender.filters phải là mảng chuỗi");
    const out = [];
    for (const f of filters) {
        assertSafeFilter(f);
        out.push(f.trim());
    }
    return out;
}

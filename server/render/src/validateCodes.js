/**
 * validateCodes.js — Phân loại thông điệp validator thành mã có cấu trúc
 * (Phase 9 đợt 63, luồng R5 — đóng nợ đợt 62 §4 mục 5, phần server).
 *
 * Bối cảnh: server/render/src/validate.js có 159 literal VI (đếm lại bằng
 * tokenizer đợt 61 R6, xem docs/PHASE9_ROUND63_R5_SERVER_LITERALS_LIMITS.md
 * §1). Các chuỗi này là DỮ LIỆU LỖI trả về UI qua render worker stderr →
 * errorDetail SPEC_VALIDATION — khung summary đã dịch từ đợt 34 Q4, nhưng
 * từng dòng detail vẫn là chuỗi VI thô. Nối từng dòng bằng cách sửa ~130
 * call-site err()/warn() sẽ đụng file lõi đang được nhiều luồng khác dùng
 * chung; thay vào đó file này phân loại CHUỖI ĐÃ TẠO SẴN bằng bảng regex
 * (đúng tiền lệ đợt 34 Q4: parseCurveViolationLine / quotedName trong
 * server/bridge/src/errorDetail.js — "không khớp → detail thô, không bịa
 * tham số").
 *
 * Cách dùng (validate.js): err()/warn() giữ nguyên chuỗi cũ từng chữ cho
 * client cũ, đồng thời ghi thêm entry có cấu trúc qua makeValidationDetail:
 *   { where, code, params } — params LUÔN có `detail` = chuỗi gốc (để web
 *   fallback hiển thị nguyên văn khi template chưa có / dịch lỗi), cộng
 *   các tham số rời mà regex tách được (toàn string).
 * Không khớp pattern nào → code "VALIDATION_DETAIL" (chỉ có detail).
 *
 * Mã KHÔNG trùng mã bridge (BRIDGE_ERROR_CODES) hay mã render
 * (errorDetail.js): chúng sống trong namespace web `validation.<CODE>`
 * (fragment round63-r5), không đi chung field errorCode.
 *
 * Marker JSON: render worker in một dòng `VCUT_VALIDATION_JSON {...}`
 * vào stderr khi validate fail (server/render/src/render.js);
 * server/bridge/src/errorDetail.js bóc dòng đó ra, redact params rồi gắn
 * vào errorDetail.validationDetails. Marker ở đây và ở errorDetail.js là
 * 2 literal trùng nhau có chủ đích (tránh require chéo vào file CLI/MCP
 * cũng load) — test round-trip trong test-error-detail-structured.cjs
 * khóa chúng phải khớp.
 *
 * Không phụ thuộc bên ngoài (chỉ node builtins). File thuần, test được
 * bằng node trực tiếp (server/render/src/test_validate_codes.js).
 */
"use strict";

/** Mã generic: không tách được tham số rời — web hiển thị detail thô. */
const VALIDATION_DETAIL_CODE = "VALIDATION_DETAIL";

/**
 * Dòng JSON có cấu trúc mà render worker in ra stderr khi validate fail.
 * Giữ ngắn: validate.js cắt entries sao cho cả dòng ≤ 1200 ký tự để lọt
 * cửa sổ stderr tail 1500 ký tự của jobQueue._onError.
 */
const VALIDATION_JSON_MARKER = "VCUT_VALIDATION_JSON ";

/** Giới hạn độ dài tham số (chuỗi gốc đầy đủ vẫn nằm trong stderr text). */
const MAX_PARAM_CHARS = 300;
const MAX_DETAIL_CHARS = 500;

/**
 * Bảng phân loại: mỗi entry { code, re, params } — params[i] là tên của
 * nhóm bắt i+1 trong regex (nhóm không-bắt (?:...) không tính).
 * Thứ tự quan trọng: pattern cụ thể trước pattern chung (vd KEYFRAME_V_0_1
 * trước KEYFRAME_V_RANGE — "0..1" cũng khớp V_RANGE; FIELD_DURATION_TOO_LONG
 * trước FADE_TOO_LONG — "transitionIn.duration (5s)..." cũng khớp mẫu sau).
 * Mọi regex neo ^...$ để không khớp nửa chừng rồi tách sai tham số.
 */
const VALIDATION_PATTERNS = [
  // ---- spec / meta ----
  { code: "SPEC_NOT_OBJECT", re: /^spec phải là một object JSON$/, params: [] },
  { code: "UNSUPPORTED_VERSION", re: /^không hỗ trợ "([^"]*)" — worker này chỉ render spec version (.+)$/, params: ["version", "supported"] },
  { code: "MISSING_META", re: /^thiếu object meta$/, params: [] },
  { code: "NONEMPTY_STRING", re: /^phải là chuỗi khác rỗng$/, params: [] },
  { code: "NONEMPTY_STRING_VALUE", re: /^phải là chuỗi khác rỗng, nhận được: (.+)$/, params: ["value"] },
  { code: "POSITIVE_INTEGER", re: /^phải là số nguyên dương, nhận được: (.+)$/, params: ["value"] },
  { code: "EVEN_INTEGER", re: /^phải là số chẵn \(yêu cầu của H\.264\), nhận được: (.+)$/, params: ["value"] },
  { code: "POSITIVE_NUMBER", re: /^phải là số dương, nhận được: (.+)$/, params: ["value"] },
  { code: "MUST_BE_ARRAY", re: /^phải là một mảng$/, params: [] },
  { code: "MUST_BE_OBJECT", re: /^phải là object$/, params: [] },
  { code: "MISSING_ID", re: /^thiếu id \(chuỗi khác rỗng\)$/, params: [] },
  { code: "MUST_BE_BOOLEAN", re: /^phải là boolean$/, params: [] },
  { code: "NUMBER_RANGE", re: /^phải trong khoảng ([^,]+)\.\.([^,]+), nhận được: (.+)$/, params: ["min", "max", "value"] },
  { code: "VOLUME_RANGE", re: /^volume phải trong khoảng ([^,]+)\.\.([^,]+), nhận được: (.+)$/, params: ["min", "max", "value"] },
  // ---- plugins ----
  { code: "PLUGINS_NOT_ARRAY", re: /^phải là một mảng các \{ id \| path, config\? \}$/, params: [] },
  { code: "PLUGIN_NOT_OBJECT", re: /^phải là object \{ id \| path, config\? \}$/, params: [] },
  { code: "PLUGIN_ID_OR_PATH", re: /^chỉ khai đúng MỘT trong hai: id hoặc path$/, params: [] },
  { code: "PLUGIN_MISSING_ID_PATH", re: /^thiếu id \(plugin đóng gói sẵn\) hoặc path \(file plugin\.js\)$/, params: [] },
  { code: "PLUGIN_ID_CHARS", re: /^id chỉ gồm chữ thường, số và dấu "-" \(nhận: (.+)\)$/, params: ["value"] },
  { code: "PLUGIN_PATH_JS", re: /^path phải trỏ tới file \.js \(nhận: (.+)\)$/, params: ["value"] },
  { code: "PLUGIN_CONFIG_OBJECT", re: /^config phải là object JSON thuần$/, params: [] },
  { code: "PLUGIN_DUPLICATE", re: /^plugin "([^"]+)" khai báo trùng — registry sẽ từ chối nạp bản thứ hai$/, params: ["key"] },
  // ---- adjustment layers ----
  { code: "ADJUSTMENT_NOT_ARRAY", re: /^phải là một mảng các layer \{ id, start, duration, filters \}$/, params: [] },
  { code: "DUPLICATE_LAYER_ID", re: /^trùng id layer: "([^"]+)"$/, params: ["id"] },
  { code: "ADJUSTMENT_TRACK_INDEX", re: /^tracks chứa chỉ số (\S+) vượt quá số track của spec \((\S+)\)$/, params: ["index", "total"] },
  { code: "ADJUSTMENT_NO_OVERLAP", re: /^không layer nào giao với clip video nào trong scope của nó — render sẽ không đổi gì$/, params: [] },
  // ---- tracks ----
  { code: "TRACKS_EMPTY", re: /^mảng rỗng — không có gì để render$/, params: [] },
  { code: "DUPLICATE_TRACK_ID", re: /^trùng id track: "([^"]+)"$/, params: ["id"] },
  { code: "TRACK_KIND_INVALID", re: /^phải là "video" \| "audio" \| "text" \| "sticker" \| "image", nhận được: (.+)$/, params: ["value"] },
  { code: "TRACK_HIDDEN_AUDIO", re: /^hidden không có tác dụng với track audio \(chỉ mute mới tắt tiếng\)$/, params: [] },
  { code: "TOTAL_DURATION_ZERO", re: /^tổng thời lượng project phải > 0$/, params: [] },
  // ---- chồng lấn / transition (cấp track) ----
  { code: "CLIP_OVERLAP", re: /^clip "([^"]+)" \[([^,]+), ([^\]]+)\] chồng lấn clip "([^"]+)" \(bắt đầu ([^)]+)\) — trên cùng một track (\w+) các clip không được đè lên nhau$/, params: ["clipA", "startA", "endA", "clipB", "startB", "kind"] },
  { code: "TRANSITION_NO_NEXT", re: /^có transition \(([^)]+)\) nhưng không có clip kề ngay sau trên cùng track \(clip kết thúc ở ([^)]+)s\) — transition yêu cầu 2 clip nối tiếp nhau$/, params: ["type", "end"] },
  { code: "TRANSITION_MISMATCH", re: /^transitionOut \(([^)]+)s\) và transitionIn của clip "([^"]+)" \(([^)]+)s\) không khớp nhau — chỉ đặt một trong hai, hoặc đặt bằng nhau$/, params: ["out", "clip", "in"] },
  { code: "TRANSITION_LONGER_THAN_CLIP", re: /^transition \(([^)]+)s\) dài hơn cả clip \(([^)]+)s\)$/, params: ["transition", "clip"] },
  { code: "MOTION_TARGETFPS_TRANSITION", re: /^motion\.targetFps \(([^)]+)\) khác project fps \(([^)]+)\) nhưng clip "([^"]+)" dính transition với clip "([^"]+)" — xfade yêu cầu 2 input cùng fps \(xem MOTION_LIMITS\.md, đợt 9 M4\)$/, params: ["targetFps", "projectFps", "clip", "other"] },
  { code: "TRANSITION_FIRST_CLIP", re: /^có transitionIn nhưng là clip đầu track — transition bị bỏ qua$/, params: [] },
  { code: "OPACITY_TRANSITION", re: /^có opacity=([^ ]+) và transition — đoạn chuyển cảnh đã merge sẽ dùng opacity của clip đích \("([^"]+)"\) cho toàn bộ unit \(xem OPACITY_LIMITS\.md\)$/, params: ["opacity", "target"] },
  { code: "SR_TRANSITION", re: /^có keyframes scale\/rotation và transition — đoạn chuyển cảnh được gộp qua xfade nên keyframes scale\/rotation của clip này bị bỏ qua khi render \(xem KEYFRAMES_LIMITS\.md\)$/, params: [] },
  { code: "OPACITY_KF_TRANSITION", re: /^có keyframes opacity và transition — đoạn chuyển cảnh được gộp qua xfade nên keyframes opacity của clip này bị bỏ qua khi render \(dùng opacity tĩnh của clip đích, xem OPACITY_LIMITS\.md\)$/, params: [] },
  // ---- clip chung ----
  { code: "CLIP_KIND_MISMATCH", re: /^clip\.kind là "([^"]+)" nhưng nằm trong track kind "([^"]+)" — phải khớp nhau$/, params: ["clipKind", "trackKind"] },
  { code: "NUMBER_MIN_0", re: /^(\S+) phải là số >= 0, nhận được: (.+)$/, params: ["field", "value"] },
  { code: "NUMBER_GT_0", re: /^(\S+) phải là số > 0, nhận được: (.+)$/, params: ["field", "value"] },
  { code: "ENHANCE_VIDEO_ONLY", re: /^enhance chỉ dùng cho video clip$/, params: [] },
  { code: "MOTION_VIDEO_ONLY", re: /^motion chỉ dùng cho video clip$/, params: [] },
  { code: "MISSING_SRC", re: /^thiếu src \(đường dẫn file media\)$/, params: [] },
  { code: "MISSING_IMAGE_SRC", re: /^thiếu src \(đường dẫn file ảnh\)$/, params: [] },
  { code: "OUT_NOT_GT_IN", re: /^out phải > in, nhận được: in=([^,]+), out=(.+)$/, params: ["in", "out"] },
  { code: "SPEED_RANGE", re: /^speed phải trong khoảng (.+)–(.+), nhận được: (.+)$/, params: ["min", "max", "value"] },
  { code: "REVERSE_BOOLEAN", re: /^reverse phải là boolean, nhận được: (.+)$/, params: ["value"] },
  { code: "SPEED_RAMP_REVERSE", re: /^speedKeyframes không dùng chung được với reverse=true \(chưa hỗ trợ\)$/, params: [] },
  { code: "SPEED_AND_SPEED_KEYFRAMES", re: /^có cả speed và speedKeyframes — render dùng speedKeyframes, speed hằng bị bỏ qua$/, params: [] },
  { code: "DURATION_EXCEEDS_SOURCE", re: /^duration \(([^)]+)s\) vượt quá đoạn nguồn hiệu dụng \[in=([^,]+), out=([^\]]+)\] \/ speed=([^ ]+) \(([^)]+)s\) — không đủ frame để phát$/, params: ["duration", "in", "out", "speed", "effective"] },
  { code: "FIELD_MUST_BE_OBJECT", re: /^(\S+) phải là object$/, params: ["field"] },
  { code: "UNSUPPORTED_TRANSITION_TYPE", re: /^(\S+)\.type không hỗ trợ: (.+)$/, params: ["field", "value"] },
  { code: "FIELD_DURATION_TOO_LONG", re: /^(\S+)\.duration \(([^)]+)s\) dài hơn duration của clip \(([^)]+)s\)$/, params: ["field", "value", "duration"] },
  { code: "FADE_TOO_LONG", re: /^(\S+) \(([^)]+)s\) dài hơn duration của clip \(([^)]+)s\)$/, params: ["field", "value", "duration"] },
  { code: "FADE_CURVE", re: /^(\S+) phải là linear \| ease-in \| ease-out \| sine \(nhận được: (.+)\)$/, params: ["field", "value"] },
  // ---- keyframes (volume / speed) ----
  { code: "VOLUME_KEYFRAMES_OBJECT", re: /^volumeKeyframes phải là object \{ keyframes: \[\.\.\.\] \}$/, params: [] },
  { code: "SPEED_KEYFRAMES_OBJECT", re: /^speedKeyframes phải là object \{ keyframes: \[\.\.\.\] \}$/, params: [] },
  { code: "KEYFRAMES_EMPTY", re: /^(\S+)\.keyframes: mảng rỗng — cần ít nhất 1 keyframe$/, params: ["field"] },
  { code: "KEYFRAMES_TOO_MANY", re: /^(\S+)\.keyframes: quá 128 keyframe$/, params: ["field"] },
  { code: "KEYFRAME_ITEM_OBJECT", re: /^(\S+) phải là object \{ t, v, easing \}$/, params: ["field"] },
  { code: "KEYFRAME_T_RANGE", re: /^(\S+)\.t phải trong \[0, ([^\]]+)\] \(nhận được: (.+)\)$/, params: ["field", "max", "value"] },
  { code: "KEYFRAME_V_0_1", re: /^(\S+)\.v phải trong 0\.\.1 \(nhận được: (.+)\)$/, params: ["field", "value"] },
  { code: "KEYFRAME_EASING", re: /^(\S+)\.easing phải là linear \| ease-in \| ease-out \(nhận được: (.+)\)$/, params: ["field", "value"] },
  { code: "KEYFRAME_V_RANGE", re: /^(\S+)\.v phải trong (.+)\.\.(.+) \(nhận được: (.+)\)$/, params: ["field", "min", "max", "value"] },
  { code: "SPEED_EASING", re: /^(\S+)\.easing phải là linear \| ease-in \| ease-out \| bezier \(nhận được: (.+)\)$/, params: ["field", "value"] },
  { code: "BEZIER_SHAPE", re: /^(\S+)\.bezier phải là \[x1, y1, x2, y2\]: x1, x2 trong \[0, 1\], y1, y2 tự do \(chuẩn cubic-bezier\) \(nhận được: (.+)\)$/, params: ["field", "value"] },
  { code: "SPEED_RAMP_CONSUMED", re: /^speedKeyframes đang bật: nguồn tiêu thụ = ([^ ]+)s \(∫speed trên duration=([^)]+)s\) — render dùng in \+ nguồn tiêu thụ, không dùng out \(xem P3_LIMITS\.md\)$/, params: ["consumed", "duration"] },
  // ---- audio / text ----
  { code: "TEXT_MUST_BE_STRING", re: /^text phải là chuỗi, nhận được: (.+)$/, params: ["value"] },
  { code: "TEXT_EMPTY_WARN", re: /^text rỗng — clip này sẽ không hiển thị gì$/, params: [] },
  { code: "MISSING_STYLE", re: /^thiếu style$/, params: [] },
  { code: "STYLE_FONTFAMILY_EMPTY", re: /^style\.fontFamily phải là chuỗi khác rỗng$/, params: [] },
  { code: "HEX_COLOR", re: /^style\.(\w+) phải là mã hex(?: \(#rgb hoặc #rrggbb\))?, nhận được: (.+)$/, params: ["field", "value"] },
  { code: "STYLE_BOOLEAN", re: /^style\.(\w+) phải là boolean, nhận được: (.+)$/, params: ["field", "value"] },
  { code: "STYLE_POSITION", re: /^style\.(\w+) là vị trí tương đối, phải trong khoảng 0\.\.1, nhận được: (.+)$/, params: ["field", "value"] },
  { code: "UNSUPPORTED_ANIMATION", re: /^style\.animation không hỗ trợ: (.+)$/, params: ["value"] },
  { code: "KARAOKE_SR_IGNORED", re: /^keyframes scale\/rotation của text clip karaoke bị bỏ qua khi render \(ASS không hỗ trợ scale\/rotate theo thời gian\)$/, params: [] },
  { code: "TEXT_SR_IGNORED", re: /^keyframes scale\/rotation của text clip (\S+) bị bỏ qua khi render \(ASS không hỗ trợ scale\/rotate theo thời gian\)$/, params: ["animation"] },
  { code: "PARITY_KARAOKE", re: /^text clip parity có karaoke — karaoke thắng, animation parity bị bỏ qua khi render \(tránh vẽ 1 clip bằng 2 lớp ASS\)$/, params: [] },
  { code: "KARAOKE_NOT_ARRAY", re: /^karaoke phải là mảng không rỗng các \{word, start, end\}$/, params: [] },
  { code: "KARAOKE_WORD_SHAPE", re: /^karaoke word sai hình dạng \(cần \{word: string khác rỗng, start, end: number, end > start\}\), nhận được: (.+)$/, params: ["value"] },
  { code: "KARAOKE_WORD_OUT_OF_RANGE", re: /^karaoke word ngoài duration clip \(([^)]+)–([^)]+) trong khi duration=([^)]+)\)$/, params: ["start", "end", "duration"] },
  { code: "KARAOKE_WORD_ORDER", re: /^karaoke words phải theo thứ tự thời gian không chồng lấn$/, params: [] },
  { code: "CAPTION_OF_SHAPE", re: /^captionOf sai hình dạng \(cần \{clipId: string, mediaStart, mediaEnd: number, mediaEnd > mediaStart\}\) — render vẫn vẽ câu chữ theo start\/duration, nhưng editor sẽ không bám link này$/, params: [] },
  { code: "OPACITY_STATIC_AND_KEYFRAMES", re: /^có cả opacity tĩnh \(([^)]+)\) và keyframes opacity — render dùng keyframes \(tuyệt đối\), opacity tĩnh bị bỏ qua \(xem OPACITY_LIMITS\.md\)$/, params: ["value"] },
  { code: "SCALE_KEYFRAME_CLAMP", re: /^keyframe scale=([^ ]+) nằm ngoài \[([^,]+), ([^\]]+)\] — render sẽ clamp về khoảng này \(xem KEYFRAMES_LIMITS\.md\)$/, params: ["value", "min", "max"] },
  { code: "CHROMA_TRANSITION", re: /^clip có chromaKey \+ transition: xfade không giữ alpha, vùng trong suốt có thể bị blend sai \(xem CHROMA_LIMITS\.md\)$/, params: [] },
  { code: "SPEED_RAMP_STABILIZE", re: /^speedKeyframes không dùng chung được với enhance\.stabilize \(vidstab detect theo trim gốc, không khớp các đoạn ramp\)$/, params: [] },
  { code: "SOURCE_AUDIO_DETACH", re: /^sourceAudioMode="detach" chưa được hỗ trợ \(render worker chỉ hỗ trợ "inherit" \| "mute"\)$/, params: [] },
  { code: "MASK_UNSUPPORTED_KIND", re: /^mask chưa hỗ trợ cho clip (\S+) — mask sẽ bị bỏ qua \(chỉ video\/image render mask, xem MASK_LIMITS\.md\)$/, params: ["kind"] },
  // Phase 9 đợt 88 P6: regex TRACK_TRANSITION đã lệch với validate.js từ
  // closing đợt 87 — closing đổi câu warn thành "(chỉ phần dịch chuyển của
  // unit; mask vẫn bám theo track, ...)" nhưng regex/fragment vẫn giữ câu cũ
  // "(keyframes cũng vậy, ...)" nên warn thật rơi về VALIDATION_DETAIL
  // (kiểm chứng bằng classifyValidationMessage trước khi sửa). Đồng bộ lại
  // regex + template vi/en theo đúng chuỗi validate.js hiện tại.
  { code: "TRACK_TRANSITION", re: /^clip video có track nhưng dính transition — track bị bỏ qua ở unit đã merge \(chỉ phần dịch chuyển của unit; mask vẫn bám theo track, xem D3_LIMITS\.md\)$/, params: [] },
  { code: "TRACK_TEXT_ASS", re: /^clip text có track nhưng vẽ bằng ASS \(typewriter\/karaoke\/parity\) — track bị bỏ qua, chữ giữ vị trí tĩnh \(xem D3_LIMITS\.md\)$/, params: [] },
  { code: "TRACK_UNSUPPORTED_KIND", re: /^track chưa hỗ trợ cho clip (\S+) — track sẽ bị bỏ qua \(chỉ video\/text\/sticker bám quỹ đạo, xem D3_LIMITS\.md\)$/, params: ["kind"] },
  // Phase 9 đợt 88 P6: clip image có mask — track không dịch chuyển ảnh
  // nhưng mask vẫn bám track (validate.js tách nhánh riêng, xem trên).
  { code: "TRACK_IMAGE_MASK", re: /^track không dịch chuyển clip image \(ảnh giữ vị trí tĩnh\), nhưng mask vẫn bám theo track \(xem D3_LIMITS\.md\)$/, params: [] },
  // ---- media (validateMedia; where đã tách khỏi chuỗi trước khi vào đây) ----
  { code: "MEDIA_ASSET_INVALID", re: /^asset "([^"]*)" không hợp lệ \(id rỗng hoặc thoát khỏi media-dir\)$/, params: ["asset"] },
  { code: "MEDIA_PATH_TRAVERSAL", re: /^đường dẫn thoát khỏi media-dir \(không cho phép "\.\.\/"\)$/, params: [] },
  { code: "MEDIA_ASSET_NOT_FOUND", re: /^không tìm thấy asset "([^"]+)": không có trong asset map và không có file cùng tên trong media-dir \(upload file asset kèm spec, hoặc truyền asset map cho render worker\)$/, params: ["asset"] },
  { code: "MEDIA_FILE_NOT_FOUND", re: /^không tìm thấy file: (.+)$/, params: ["file"] },
  { code: "MEDIA_NOT_FILE", re: /^không phải file thường: (.+)$/, params: ["file"] },
  { code: "MEDIA_FFPROBE_FAILED", re: /^ffprobe đọc file thất bại: (.+)$/, params: ["detail"] },
  { code: "MEDIA_NO_VIDEO", re: /^file không có video stream$/, params: [] },
  { code: "MEDIA_STILL_AS_VIDEO", re: /^là ảnh tĩnh \(([^)]+)\) — video clip yêu cầu file video, dùng image track cho ảnh tĩnh \(xem P0-03\)$/, params: ["codec"] },
  { code: "MEDIA_OUT_EXCEEDS", re: /^out=([^ ]+)s vượt quá độ dài file \(([^)]+)s\)$/, params: ["out", "duration"] },
  { code: "MEDIA_NO_AUDIO_INHERIT", re: /^file không có audio stream \(sourceAudioMode="inherit" nhưng không có gì để giữ\)$/, params: [] },
  { code: "MEDIA_NO_VIDEO_IMAGE", re: /^file không có video stream \(không phải ảnh\?\)$/, params: [] },
  { code: "MEDIA_NOT_STILL", re: /^không phải ảnh tĩnh \(codec=([^,]+), nb_frames=([^)]+)\) — image clip yêu cầu file ảnh, dùng video track cho file video$/, params: ["codec", "frames"] },
  { code: "MEDIA_NO_AUDIO", re: /^file không có audio stream$/, params: [] },
];

/** Danh sách mã (thứ tự ổn định) — test khóa fragment/web dùng danh sách này. */
const VALIDATION_CODE_LIST = VALIDATION_PATTERNS.map((p) => p.code);

function truncate(s, max) {
  const t = String(s === undefined || s === null ? "" : s);
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * Phân loại 1 thông điệp validator (chuỗi đã tạo sẵn, KHÔNG gồm tiền tố
 * "[where] ") thành { code, params }. Không khớp pattern nào →
 * { code: VALIDATION_DETAIL_CODE, params: { detail } } — KHÔNG bịa mã
 * hay tham số. params LUÔN có `detail` = chuỗi gốc (cắt 500 ký tự) để
 * web fallback hiển thị nguyên văn; tham số rời cắt 300 ký tự.
 */
function classifyValidationMessage(msg) {
  const text = String(msg === undefined || msg === null ? "" : msg);
  for (const p of VALIDATION_PATTERNS) {
    const m = p.re.exec(text);
    if (!m) continue;
    const params = { detail: truncate(text, MAX_DETAIL_CHARS) };
    p.params.forEach((name, i) => {
      params[name] = truncate(m[i + 1] ?? "", MAX_PARAM_CHARS);
    });
    return { code: p.code, params };
  }
  return { code: VALIDATION_DETAIL_CODE, params: { detail: truncate(text, MAX_DETAIL_CHARS) } };
}

/**
 * Entry có cấu trúc cho 1 lỗi/cảnh báo validator:
 * { where, code, params } — where là chuỗi vị trí "[...]" đã tách
 * (vd "meta.width", "tracks[0].clips[1]").
 */
function makeValidationDetail(where, msg) {
  const classified = classifyValidationMessage(msg);
  return {
    where: String(where === undefined || where === null ? "" : where),
    code: classified.code,
    params: classified.params,
  };
}

/**
 * Dòng JSON in ra stderr khi validate fail:
 * "VCUT_VALIDATION_JSON {\"errors\":[...],\"warnings\":[...],\"omitted\":n}".
 * Giữ cả dòng ≤ 1200 ký tự (cửa sổ tail 1500 của jobQueue): cắt entries
 * ở cuối trước, đếm số đã lược vào omitted. Trả "" khi không có entry.
 */
function validationJsonLine(errorDetails, warningDetails) {
  const errors = Array.isArray(errorDetails) ? errorDetails : [];
  const warnings = Array.isArray(warningDetails) ? warningDetails : [];
  if (errors.length === 0 && warnings.length === 0) return "";
  let omitted = 0;
  const errs = errors.slice();
  const warns = warnings.slice();
  // Cắt warnings trước (lỗi quan trọng hơn), rồi mới cắt errors.
  let line = "";
  for (;;) {
    line = VALIDATION_JSON_MARKER + JSON.stringify({ errors: errs, warnings: warns, omitted });
    if (line.length <= 1200) break;
    if (warns.length > 0) { warns.pop(); omitted++; continue; }
    if (errs.length > 1) { errs.pop(); omitted++; continue; }
    break;
  }
  return line;
}

module.exports = {
  VALIDATION_DETAIL_CODE,
  VALIDATION_JSON_MARKER,
  VALIDATION_PATTERNS,
  VALIDATION_CODE_LIST,
  classifyValidationMessage,
  makeValidationDetail,
  validationJsonLine,
};

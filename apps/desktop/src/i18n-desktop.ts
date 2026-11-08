/**
 * i18n-desktop.ts — nhãn menu/dialog của app desktop (Phase 10, luồng G5).
 *
 * Tiếng Việt là mặc định; tiếng Anh là fallback khi thiếu key hoặc khi
 * user chọn English trong menu Xem > Ngôn ngữ. Chuỗi giao diện của web app
 * vẫn do apps/web/src/i18n quản lý (localStorage `vcut-lang`); module này
 * chỉ lo phần native (menu, About, crash, báo lỗi) để hai bên không lệ
 * thuộc lẫn nhau.
 */
export type DesktopLang = "vi" | "en";

export interface DesktopLabels {
  about: {
    copied: string;
    copyInfo: string;
    detailLine1: string;
    detailLine2: string;
    /** Dòng "Tài liệu: …" trong detail About/ReportBug (đợt 61 R6). */
    docsLine: string;
    /** Dòng "gửi kèm file log" trong detail About (đợt 61 R6). */
    logHint: string;
    openRepo: string;
    /** Dòng "Kho mã: …" trong detail About (đợt 61 R6). */
    repoLine: string;
    /** Dòng "Cài đặt: …" trong detail About/ReportBug (đợt 61 R6). */
    settingsLine: string;
    title: string;
    /** Dòng "Phiên bản: …" trong detail ReportBug (đợt 61 R6). */
    versionLine: string;
  };
  /** Nút đóng chung cho các dialog About/Shortcuts/ReportBug (đợt 61 R6). */
  common: {
    close: string;
  };
  /** Nhãn dialog mở/lưu file hệ thống (đợt 61 R6). */
  dialogs: {
    addMedia: string;
    allFiles: string;
    exportVideo: string;
    mediaFilter: string;
    openProject: string;
    projectFilter: string;
    projectFilterLong: string;
    saveProject: string;
  };
  /** Dòng trạng thái/lỗi Model AI trả về renderer qua IPC (đợt 61 R6). */
  models: {
    allReady: string;
    alreadyDownloading: string;
    checkFailed: string;
    emptyId: string;
    missing: string;
    noDownload: string;
    noRoot: string;
  };
  /** Lỗi đọc/ghi file qua IPC file-io (đợt 61 R6). */
  fileIo: {
    cannotOpen: string;
    cannotRead: string;
    cannotWrite: string;
    onlyProject: string;
    tooLarge: string;
  };
  /** Dialog thiếu ffmpeg lúc khởi động (đợt 61 R6). */
  ffmpeg: {
    installHint: string;
    notFoundTitle: string;
    stillUsable: string;
  };
  /** Lỗi lưu file MP4 đã render (đợt 61 R6). */
  nativeFiles: {
    destMustBeMp4: string;
    downloadFailed: string;
    invalidParams: string;
    missingDest: string;
    missingJobId: string;
  };
  crash: {
    detail: string;
    message: string;
    quit: string;
    /** Dòng lý do trong detail crash renderer (đợt 61 R6): {reason}{exitPart}. */
    reasonLine: string;
    reload: string;
    restart: string;
    title: string;
  };
  menu: {
    about: string;
    addMedia: string;
    clearRecent: string;
    closeWindow: string;
    copy: string;
    cut: string;
    delete: string;
    docs: string;
    duplicate: string;
    edit: string;
    exit: string;
    exportVideo: string;
    file: string;
    forceReload: string;
    fullscreen: string;
    help: string;
    language: string;
    minimize: string;
    newProject: string;
    openGithub: string;
    openProject: string;
    paste: string;
    recentEmpty: string;
    recentProjects: string;
    recentClear: string;
    redo: string;
    reload: string;
    reportBug: string;
    saveAs: string;
    saveProject: string;
    selectAll: string;
    shortcuts: string;
    toggleDevTools: string;
    undo: string;
    view: string;
    window: string;
    zoomIn: string;
    zoomOut: string;
    zoomReset: string;
  };
  reportBug: {
    copyInfo: string;
    detail: string;
    message: string;
    openIssues: string;
    openLogDir: string;
    title: string;
  };
  shortcuts: {
    detailIntro: string;
    message: string;
    title: string;
  };
}

const VI: DesktopLabels = {
  about: {
    copied: "Đã sao chép thông tin hệ thống.",
    copyInfo: "Sao chép thông tin",
    detailLine1: "Trình dựng video chạy local — cắt, chữ, hiệu ứng, caption, TTS, xoá nền, render trên máy của bạn.",
    detailLine2: "Giấy phép: MIT.",
    docsLine: "Tài liệu: {value}",
    logHint: "Để báo lỗi, gửi kèm file log:",
    repoLine: "Kho mã: {value}",
    settingsLine: "Cài đặt: {value}",
    versionLine: "Phiên bản: {value} (Electron {electron})",
    openRepo: "Mở kho GitHub",
    title: "Giới thiệu VCut Studio",
  },
  common: {
    close: "Đóng",
  },
  dialogs: {
    addMedia: "Thêm media vào dự án",
    allFiles: "Tất cả file",
    exportVideo: "Xuất video",
    mediaFilter: "Media (video, audio, ảnh)",
    openProject: "Mở dự án",
    projectFilter: "Dự án VCut",
    projectFilterLong: "Dự án VCut (.vcut, .vcut.json)",
    saveProject: "Lưu dự án",
  },
  models: {
    allReady: "{ready}/{total} model AI sẵn sàng ({root})",
    alreadyDownloading: "Đang tải model {modelId} — huỷ trước khi tải model khác.",
    checkFailed: "Không kiểm tra được model AI: {detail}",
    emptyId: "modelId rỗng.",
    missing: "Thiếu model: {missing} — tải trong app (mục Model AI), thư mục: {root}",
    noDownload: "Không có lượt tải model nào đang chạy.",
    noRoot: "Chưa resolve thư mục model (app chưa khởi động xong).",
  },
  fileIo: {
    cannotOpen: "Không mở được file này trong VCut: {name}",
    cannotRead: "Không đọc được file: {detail}",
    cannotWrite: "Không ghi được file: {detail}",
    onlyProject: "Chỉ ghi được file dự án (.vcut/.vcut.json): {name}",
    tooLarge: "File quá lớn để mở qua Electron ({size} > 2 GB): {name}",
  },
  ffmpeg: {
    installHint: [
      "VCut Studio cần ffmpeg hệ thống để render/export video.",
      "",
      "Ubuntu / Debian / Linux Mint:",
      "  sudo apt update && sudo apt install ffmpeg",
      "",
      "Fedora:",
      "  sudo dnf install ffmpeg",
      "",
      "Arch Linux:",
      "  sudo pacman -S ffmpeg",
      "",
      "Hoặc đặt đường dẫn ffmpeg khác bằng biến môi trường FFMPEG, vd:",
      "  FFMPEG=/usr/local/bin/ffmpeg vcut-studio",
    ].join("\n"),
    notFoundTitle: "Không tìm thấy ffmpeg hệ thống",
    stillUsable: "App vẫn mở để xem/sửa project — chỉ render/export video mới cần ffmpeg.",
  },
  nativeFiles: {
    destMustBeMp4: "Đường dẫn đích phải là file .mp4: {path}",
    downloadFailed: "Không tải được video đã render (bridge trả {status}).",
    invalidParams: "desktop:save-export-file: tham số không hợp lệ.",
    missingDest: "Thiếu đường dẫn đích.",
    missingJobId: "Thiếu jobId render.",
  },
  crash: {
    detail: "Ứng dụng gặp lỗi không xử lý được và cần khởi động lại.\n\nKhông có báo cáo lỗi nào được gửi đi đâu — VCut Studio không có telemetry. Chi tiết lỗi đã ghi vào file log dưới đây, bạn có thể gửi file này kèm báo lỗi.",
    message: "VCut Studio gặp sự cố",
    quit: "Đóng ứng dụng",
    reasonLine: "Lý do: {reason}{exitPart}",
    reload: "Tải lại giao diện",
    restart: "Khởi động lại ứng dụng",
    title: "VCut Studio gặp sự cố",
  },
  menu: {
    about: "Giới thiệu VCut Studio",
    addMedia: "Thêm media…",
    clearRecent: "Xóa danh sách gần đây",
    closeWindow: "Đóng cửa sổ",
    copy: "Sao chép",
    cut: "Cắt",
    delete: "Xóa",
    docs: "Tài liệu hướng dẫn",
    duplicate: "Nhân bản clip",
    edit: "Chỉnh sửa",
    exit: "Thoát",
    exportVideo: "Xuất video…",
    file: "Tệp",
    forceReload: "Tải lại (xóa cache)",
    fullscreen: "Toàn màn hình",
    help: "Trợ giúp",
    language: "Ngôn ngữ",
    minimize: "Thu nhỏ",
    newProject: "Dự án mới",
    openGithub: "VCut Studio trên GitHub",
    openProject: "Mở dự án…",
    paste: "Dán",
    recentEmpty: "Chưa có dự án gần đây",
    recentProjects: "Mở gần đây",
    recentClear: "Xóa danh sách",
    redo: "Làm lại",
    reload: "Tải lại",
    reportBug: "Báo lỗi…",
    saveAs: "Lưu dự án thành…",
    saveProject: "Lưu dự án",
    selectAll: "Chọn tất cả",
    shortcuts: "Phím tắt",
    toggleDevTools: "Công cụ nhà phát triển",
    undo: "Hoàn tác",
    view: "Xem",
    window: "Cửa sổ",
    zoomIn: "Phóng to",
    zoomOut: "Thu nhỏ",
    zoomReset: "Mức thu phóng mặc định",
  },
  reportBug: {
    copyInfo: "Sao chép thông tin hệ thống",
    detail: "Để báo lỗi, gửi kèm file log và mô tả các bước gây ra lỗi.\n\nKhông có dữ liệu nào tự động gửi đi — bạn tự quyết định gửi gì.",
    message: "Báo lỗi VCut Studio",
    openIssues: "Mở trang Issues",
    openLogDir: "Mở thư mục log",
    title: "Báo lỗi VCut Studio",
  },
  shortcuts: {
    detailIntro: "Phím tắt trong app desktop (menu) và phím tắt trong editor (web):",
    message: "Phím tắt VCut Studio",
    title: "Phím tắt",
  },
};

const EN: DesktopLabels = {
  about: {
    copied: "System info copied.",
    copyInfo: "Copy system info",
    detailLine1: "Local video editor — cut, text, effects, captions, TTS, background removal, render on your machine.",
    detailLine2: "License: MIT.",
    docsLine: "Docs: {value}",
    logHint: "To report a bug, attach the log file:",
    repoLine: "Repo: {value}",
    settingsLine: "Settings: {value}",
    versionLine: "Version: {value} (Electron {electron})",
    openRepo: "Open GitHub repo",
    title: "About VCut Studio",
  },
  common: {
    close: "Close",
  },
  dialogs: {
    addMedia: "Add media to project",
    allFiles: "All files",
    exportVideo: "Export video",
    mediaFilter: "Media (video, audio, images)",
    openProject: "Open project",
    projectFilter: "VCut Project",
    projectFilterLong: "VCut Project (.vcut, .vcut.json)",
    saveProject: "Save project",
  },
  models: {
    allReady: "{ready}/{total} AI models ready ({root})",
    alreadyDownloading: "Already downloading model {modelId} — cancel it before downloading another.",
    checkFailed: "Could not check AI models: {detail}",
    emptyId: "Empty modelId.",
    missing: "Missing models: {missing} — download in the app (AI Models section), folder: {root}",
    noDownload: "No model download is running.",
    noRoot: "Model folder not resolved yet (app still starting).",
  },
  fileIo: {
    cannotOpen: "Cannot open this file in VCut: {name}",
    cannotRead: "Cannot read file: {detail}",
    cannotWrite: "Cannot write file: {detail}",
    onlyProject: "Only project files can be written (.vcut/.vcut.json): {name}",
    tooLarge: "File too large to open via Electron ({size} > 2 GB): {name}",
  },
  ffmpeg: {
    installHint: [
      "VCut Studio needs system ffmpeg to render/export video.",
      "",
      "Ubuntu / Debian / Linux Mint:",
      "  sudo apt update && sudo apt install ffmpeg",
      "",
      "Fedora:",
      "  sudo dnf install ffmpeg",
      "",
      "Arch Linux:",
      "  sudo pacman -S ffmpeg",
      "",
      "Or point to a different ffmpeg with the FFMPEG environment variable, e.g.:",
      "  FFMPEG=/usr/local/bin/ffmpeg vcut-studio",
    ].join("\n"),
    notFoundTitle: "System ffmpeg not found",
    stillUsable: "The app stays open for viewing/editing projects — only rendering/exporting video needs ffmpeg.",
  },
  nativeFiles: {
    destMustBeMp4: "Destination must be an .mp4 file: {path}",
    downloadFailed: "Could not download the rendered video (bridge returned {status}).",
    invalidParams: "desktop:save-export-file: invalid parameters.",
    missingDest: "Missing destination path.",
    missingJobId: "Missing render jobId.",
  },
  crash: {
    detail: "The app hit an unhandled error and needs to restart.\n\nNo crash report is sent anywhere — VCut Studio has no telemetry. Details were written to the log file below; you can attach it to a bug report.",
    message: "VCut Studio ran into a problem",
    quit: "Quit app",
    reasonLine: "Reason: {reason}{exitPart}",
    reload: "Reload interface",
    restart: "Restart app",
    title: "VCut Studio ran into a problem",
  },
  menu: {
    about: "About VCut Studio",
    addMedia: "Add media…",
    clearRecent: "Clear recent list",
    closeWindow: "Close window",
    copy: "Copy",
    cut: "Cut",
    delete: "Delete",
    docs: "Documentation",
    duplicate: "Duplicate clip",
    edit: "Edit",
    exit: "Quit",
    exportVideo: "Export video…",
    file: "File",
    forceReload: "Reload (clear cache)",
    fullscreen: "Full screen",
    help: "Help",
    language: "Language",
    minimize: "Minimize",
    newProject: "New project",
    openGithub: "VCut Studio on GitHub",
    openProject: "Open project…",
    paste: "Paste",
    recentEmpty: "No recent projects",
    recentProjects: "Open recent",
    recentClear: "Clear list",
    redo: "Redo",
    reload: "Reload",
    reportBug: "Report a bug…",
    saveAs: "Save project as…",
    saveProject: "Save project",
    selectAll: "Select all",
    shortcuts: "Keyboard shortcuts",
    toggleDevTools: "Developer tools",
    undo: "Undo",
    view: "View",
    window: "Window",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    zoomReset: "Default zoom level",
  },
  reportBug: {
    copyInfo: "Copy system info",
    detail: "To report a bug, attach the log file and describe the steps that caused it.\n\nNothing is sent automatically — you decide what to share.",
    message: "Report a VCut Studio bug",
    openIssues: "Open Issues page",
    openLogDir: "Open log folder",
    title: "Report a VCut Studio bug",
  },
  shortcuts: {
    detailIntro: "Desktop app shortcuts (menu) and editor shortcuts (web):",
    message: "VCut Studio shortcuts",
    title: "Keyboard shortcuts",
  },
};

const LABELS: Record<DesktopLang, DesktopLabels> = { en: EN, vi: VI };

export function getDesktopLabels(lang: DesktopLang): DesktopLabels {
  return LABELS[lang] ?? LABELS.vi;
}

/** Chuỗi theo key dạng "menu.saveProject" với biến {name} (đợt 61 R6). */
export function tDesktopVars(
  lang: DesktopLang,
  key: string,
  vars: Record<string, string>,
): string {
  let out = tDesktop(lang, key);
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

/** Chuỗi theo key dạng "menu.saveProject"; thiếu ở `en` thì fallback `vi`. */
export function tDesktop(lang: DesktopLang, key: string): string {
  const lookup = (labels: DesktopLabels): string | undefined => {
    let cur: unknown = labels;
    for (const part of key.split(".")) {
      if (typeof cur !== "object" || cur === null) return undefined;
      cur = (cur as Record<string, unknown>)[part];
    }
    return typeof cur === "string" ? cur : undefined;
  };
  return lookup(LABELS[lang]) ?? lookup(LABELS.vi) ?? key;
}

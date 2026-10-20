/**
 * hello-world — plugin mẫu tối thiểu cho VCut Studio.
 *
 * Chỉ quan sát: ghi log khi có action trên timeline và khi export bắt đầu.
 * Không cần quyền đặc biệt ngoài quan sát.
 */
module.exports = {
  manifest: {
    name: "hello-world",
    version: "1.0.0",
    author: "VCut Team",
    description: "Plugin mẫu: log các sự kiện timeline và export.",
    apiVersion: 1,
    hooks: ["onTimelineAction", "onExportStart"],
    permissions: ["timeline:observe", "export:observe"],
  },
  hooks: {
    onTimelineAction: function (ctx) {
      vc.log("action tren timeline: " + ctx.action);
    },
    onExportStart: function (ctx) {
      vc.log(
        "sap export project '" + ctx.projectName + "' -> " + ctx.outputPath +
        " (" + ctx.preset.width + "x" + ctx.preset.height + ")"
      );
      return { note: "hello-world da thay export nay" };
    },
  },
};

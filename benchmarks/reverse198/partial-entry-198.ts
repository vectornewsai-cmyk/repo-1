// partial-entry-198.ts — entry esbuild cho probe 198: export cả demux
// audio + partial decode để probe trong trang dùng trực tiếp
// AudioDecoder với description khác nhau (chẩn đoán ASC 5 byte vs 2 byte).
export * from "../../apps/web/src/lib/mp4AudioDemux.ts";
export * from "../../apps/web/src/lib/reverseAudioPartial.ts";

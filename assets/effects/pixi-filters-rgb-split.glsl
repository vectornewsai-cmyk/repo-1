/* Lệch kênh màu đỏ/xanh (chromatic aberration / RGB shift).
 * Nguồn: pixi.js filters — RGBSplitFilter
 *   https://github.com/pixijs/filters/tree/main/src/rgb-split
 * Tác giả: các contributor của pixi.js filters (MIT)
 * Giấy phép: MIT (Copyright (c) 2013-2025 Mathew Groves, Chad Engler) — xem LICENSE tại
 *   https://github.com/pixijs/filters/blob/main/LICENSE
 * Ngày lấy: 2026-10-18
 * Ghi chú kỹ thuật: shader viết theo phong cách PixiJS (GLSL ES 3.00,
 *   varying "vTextureCoord", output "finalColor", uniform uTexture/uInputSize...).
 *   Team render engine cần adapter uniform khi tích hợp (đổi uTexture -> texture video,
 *   cấp uTime/uInputSize...). Uniforms dùng trong shader: uTexture, uInputSize, uRed, uGreen, uBlue
 */
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec2 uRed;
uniform vec2 uGreen;
uniform vec2 uBlue;

void main(void)
{
   float r = texture(uTexture, vTextureCoord + uRed/uInputSize.xy).r;
   float g = texture(uTexture, vTextureCoord + uGreen/uInputSize.xy).g;
   float b = texture(uTexture, vTextureCoord + uBlue/uInputSize.xy).b;
   float a = texture(uTexture, vTextureCoord).a;
   finalColor = vec4(r, g, b, a);
}

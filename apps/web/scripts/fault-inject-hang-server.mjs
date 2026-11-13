#!/usr/bin/env node
/**
 * fault-inject-hang-server.mjs — Đợt 97 Y9.
 * Server treo có chủ đích để fault-injection cho E1 (clicktest-77e1-deint-fps.mjs):
 *   node fault-inject-hang-server.mjs media <port>  — HTTP: "/" trả 200 ngay,
 *     "/r77e1-media/*" nhận kết nối nhưng KHÔNG BAO GIỜ trả lời (treo media probe).
 *   node fault-inject-hang-server.mjs tcp <port>    — TCP thô: accept socket
 *     rồi giữ im (treo vòng CDP /json/list khi trỏ E1_DEBUG_PORT tới đây).
 * Dùng với: E1_MEDIA_BASE=http://127.0.0.1:<port> (media) hoặc
 * E1_DEBUG_PORT=<port> + E1_CDP_LIST_ATTEMPTS=N (cdp). Chạy nền rồi kill theo PID.
 * KHÔNG push/tag/binary. Chỉ dùng cho kiểm chứng harness.
 */
import http from "node:http";
import net from "node:net";

const mode = process.argv[2];
const port = Number(process.argv[3]);
if (!["media", "tcp"].includes(mode) || !port) {
  console.error("dùng: node fault-inject-hang-server.mjs <media|tcp> <port>");
  process.exit(2);
}
if (mode === "media") {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/r77e1-media/")) {
      // Treo: nhận request, không trả gì, không đóng kết nối.
      console.log(`[${new Date().toISOString()}] treo media ${req.url}`);
      return;
    }
    res.statusCode = 200;
    res.end("hang-server-ok");
  });
  server.listen(port, "127.0.0.1", () => console.log(`hang-server media đang nghe :${port} (treo /r77e1-media/*)`));
} else {
  const server = net.createServer((socket) => {
    console.log(`[${new Date().toISOString()}] treo tcp từ ${socket.remoteAddress}:${socket.remotePort}`);
    // Giữ socket mở, không ghi gì.
  });
  server.listen(port, "127.0.0.1", () => console.log(`hang-server tcp đang nghe :${port} (treo mọi kết nối)`));
}

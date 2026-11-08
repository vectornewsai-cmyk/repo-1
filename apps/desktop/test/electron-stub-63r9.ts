/**
 * electron-stub-63r9.ts — stub tối thiểu của module "electron" CHỈ để test
 * preload (đợt 63 R9). KHÔNG dùng trong production, KHÔNG import bởi code
 * production (chỉ test preload63R9 import qua esbuild --alias:electron).
 *
 * - contextBridge.exposeInMainWorld ghi api vào __testState.api để test
 *   gọi trực tiếp (không cần window thật).
 * - ipcRenderer.invoke chuyển cho __testState.invokeImpl do test đặt
 *   (mặc định throw để test nào quên stub thì đỏ rõ ràng, không lặng).
 * - ipcRenderer.on/removeListener chỉ ghi nhận listener (preload đăng ký
 *   "vcut:open-file" ngay lúc import).
 */
export const __testState: {
  api: unknown;
  invokeImpl: ((channel: string, ...args: unknown[]) => unknown) | null;
  listeners: Map<string, Array<(...args: unknown[]) => void>>;
} = { api: null, invokeImpl: null, listeners: new Map() };

export const contextBridge = {
  exposeInMainWorld(_key: string, api: unknown): void {
    __testState.api = api;
  },
};

export const ipcRenderer = {
  invoke: async (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!__testState.invokeImpl) throw new Error(`invoke chưa stub: ${channel}`);
    return __testState.invokeImpl(channel, ...args);
  },
  on(channel: string, listener: (...args: unknown[]) => void): void {
    const arr = __testState.listeners.get(channel) ?? [];
    arr.push(listener);
    __testState.listeners.set(channel, arr);
  },
  removeListener(channel: string, listener: (...args: unknown[]) => void): void {
    const arr = __testState.listeners.get(channel) ?? [];
    __testState.listeners.set(
      channel,
      arr.filter((l) => l !== listener),
    );
  },
};

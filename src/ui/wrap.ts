// 中文 / CJK 没有空格分隔，默认按空白换行会让长串中文溢出；
// 且 setWordWrapWidth 会覆盖 wordWrap 对象，丢失高级配置。
// 这里启用 Phaser 的高级换行 + 自定义 wordWrapCallback，
// 用“宽度 / 字号”估算每行字符数，把中文按字断行。
export const cnWrap = (width: number) => ({
  wordWrap: { width, useAdvancedWrap: true },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wordWrapCallback(text: string, style?: any): string[] {
    const fsRaw = style?.fontSize ?? 16;
    const fs = parseInt(String(fsRaw).replace('px', ''), 10) || 16;
    // 中文按方形字计，1.05 略留余量；窄字面可再放大。
    const cpl = Math.max(1, Math.floor(width / (fs * 1.05)));
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += cpl) lines.push(text.slice(i, i + cpl));
    return lines;
  },
});
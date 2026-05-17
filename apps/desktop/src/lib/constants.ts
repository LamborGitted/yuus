/** 支持的图片格式扩展名列表 */
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "ico"];

/** 判断文件路径是否为受支持的图片文件 */
export function isImagePath(path: string): boolean {
  const extension = path.split(".").pop()?.toLowerCase();
  return Boolean(extension && IMAGE_EXTENSIONS.includes(extension));
}

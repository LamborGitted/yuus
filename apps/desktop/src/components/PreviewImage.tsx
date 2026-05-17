/** 图片预览组件 - 为空时不渲染 */
export function PreviewImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className="preview-image" />;
}

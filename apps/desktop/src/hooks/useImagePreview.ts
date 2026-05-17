import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ImagePreviewPayload } from "../lib/types";

/**
 * 获取图片 base64 预览的自定义 Hook
 * @param path - 图片文件路径
 * @param version - 版本号，变化时强制重新加载
 */
export function useImagePreview(path?: string, version = 0) {
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    let active = true;

    if (!path) {
      setPreviewUrl(undefined);
      return () => {
        active = false;
      };
    }

    setPreviewUrl(undefined);

    void invoke<ImagePreviewPayload | null>("get_image_preview", { path })
      .then((payload) => {
        if (!active) return;
        setPreviewUrl(payload?.dataUrl);
      })
      .catch(() => {
        if (active) {
          setPreviewUrl(undefined);
        }
      });

    return () => {
      active = false;
    };
  }, [path, version]);

  return previewUrl;
}

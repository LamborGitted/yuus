import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { basename, dirname, extname, join } from "path";
import { createHash } from "crypto";

const DefaultImagesReplaceDir = "/tmp/images";

let ImagesDir = "";
let CoveredImagesDir = DefaultImagesReplaceDir;

type ImageType =
  | "png"
  | "jpg"
  | "jpeg"
  | "svg"
  | "gif"
  | "bmp"
  | "webp"
  | "ico"
  | "image";

type ImageReplaceItem = {
  imageHash: string;
  originalPath: string;
  originalName: string;
  replacementPath: string;
  replaced: boolean;
};

type ImagesReplaceTable = {
  tableHash: string;
  imagesDir: string;
  items: ImageReplaceItem[];
};

type ReplaceResult = {
  tableHash: string;
  originalPath: string;
  replacementPath: string;
  replaced: boolean;
  reason?: string;
};

const extensionMap: Record<ImageType, string[]> = {
  png: [".png"],
  jpg: [".jpg"],
  jpeg: [".jpeg"],
  svg: [".svg"],
  gif: [".gif"],
  bmp: [".bmp"],
  webp: [".webp"],
  ico: [".ico"],
  image: [".png", ".jpg", ".jpeg", ".svg", ".gif", ".bmp", ".webp", ".ico"],
};

function ensureDir(dir: string) {
  if (!dir) return;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function walkImages(dir: string, imageType: ImageType = "image"): string[] {
  if (!dir || !existsSync(dir)) return [];

  const exts = extensionMap[imageType];
  if (!exts) return [];

  const results: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = extname(entry.name).toLowerCase();
      if (exts.includes(ext)) {
        results.push(fullPath);
      }
    }
  }

  try {
    walk(dir);
  } catch {
    return [];
  }

  return results;
}

function getHash(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function getFileHash(filePath: string) {
  return getHash(readFileSync(filePath));
}

function getImagesTablePath(tableHash: string) {
  return join(CoveredImagesDir, `${tableHash}.json`);
}

function createTableHash(imagesDir: string, imageFiles: string[]) {
  return getHash(JSON.stringify({ imagesDir, imageFiles }));
}

function readReplaceTable(tableHash: string): ImagesReplaceTable | null {
  const tablePath = getImagesTablePath(tableHash);
  if (!existsSync(tablePath)) return null;

  try {
    const content = readFileSync(tablePath, "utf8");
    if (!content.trim()) return null;
    return JSON.parse(content) as ImagesReplaceTable;
  } catch {
    return null;
  }
}

function writeReplaceTable(table: ImagesReplaceTable) {
  ensureDir(CoveredImagesDir);
  writeFileSync(getImagesTablePath(table.tableHash), JSON.stringify(table, null, 2), "utf8");
}

function findTableItem(table: ImagesReplaceTable, originalPath: string) {
  return table.items.find((item) => item.originalPath === originalPath);
}

function setImagesDir(imagesDir: string) {
  ImagesDir = imagesDir;
}

function getImagesDir() {
  return ImagesDir;
}

function setCoveredImagesDir(imagesDir: string) {
  CoveredImagesDir = imagesDir;
}

function getCoveredImagesDir() {
  return CoveredImagesDir;
}

function getImageList(imageType: ImageType = "image"): string[] {
  return walkImages(ImagesDir, imageType);
}

function getImageListForDir(dir: string, imageType: ImageType = "image"): string[] {
  return walkImages(dir, imageType);
}

/**
 * 导入目录时，生成一份 `/tmp/<tableHash>.json` 的图片替换表。
 * 这里的 hash 只作为 json 文件名，不再作为表内记录 key。
 */
function createImagesReplaceMap(imagesDir?: string): ImagesReplaceTable {
  const targetDir = imagesDir ?? ImagesDir;
  const imageFiles = walkImages(targetDir).sort();
  const tableHash = createTableHash(targetDir, imageFiles);

  const table: ImagesReplaceTable = {
    tableHash,
    imagesDir: targetDir,
    items: imageFiles.map((imagePath) => ({
      imageHash: getFileHash(imagePath),
      originalPath: imagePath,
      originalName: basename(imagePath),
      replacementPath: "",
      replaced: false,
    })),
  };

  writeReplaceTable(table);
  return table;
}

function getImagesReplaceMap(tableHash: string) {
  return readReplaceTable(tableHash);
}

/**
 * 给指定 json 表里的某张原图写入替换文件路径。
 * GUI 拿到 tableHash 后，用 originalPath 找到要替换的那一项即可。
 */
function setReplacementPath(tableHash: string, originalPath: string, replacementPath: string): boolean {
  if (!tableHash || !originalPath || !replacementPath || !existsSync(replacementPath)) return false;

  const table = readReplaceTable(tableHash);
  if (!table) return false;

  const item = findTableItem(table, originalPath);
  if (!item) return false;

  item.replacementPath = replacementPath;
  item.replaced = false;
  writeReplaceTable(table);
  return true;
}

/**
 * 按 json 表中的单条记录执行替换。
 * 替换文件会先复制到 `/tmp/images`，然后改成与原文件相同的文件名，再覆盖原图。
 */
function replaceImageByPath(tableHash: string, originalPath: string): ReplaceResult {
  const table = readReplaceTable(tableHash);
  if (!table) {
    return {
      tableHash,
      originalPath,
      replacementPath: "",
      replaced: false,
      reason: "table_not_found",
    };
  }

  const item = findTableItem(table, originalPath);
  if (!item) {
    return {
      tableHash,
      originalPath,
      replacementPath: "",
      replaced: false,
      reason: "image_not_found_in_table",
    };
  }

  if (!item.replacementPath) {
    return {
      tableHash,
      originalPath: item.originalPath,
      replacementPath: "",
      replaced: false,
      reason: "replacement_path_not_set",
    };
  }

  if (!existsSync(item.originalPath)) {
    return {
      tableHash,
      originalPath: item.originalPath,
      replacementPath: item.replacementPath,
      replaced: false,
      reason: "original_file_not_found",
    };
  }

  if (!existsSync(item.replacementPath)) {
    return {
      tableHash,
      originalPath: item.originalPath,
      replacementPath: item.replacementPath,
      replaced: false,
      reason: "replacement_file_not_found",
    };
  }

  ensureDir(CoveredImagesDir);

  const tempPath = join(CoveredImagesDir, basename(item.replacementPath));
  const renamedTempPath = join(CoveredImagesDir, item.originalName);

  copyFileSync(item.replacementPath, tempPath);

  if (tempPath !== renamedTempPath) {
    if (existsSync(renamedTempPath)) {
      unlinkSync(renamedTempPath);
    }
    renameSync(tempPath, renamedTempPath);
  }

  copyFileSync(renamedTempPath, item.originalPath);
  item.replaced = true;
  writeReplaceTable(table);

  return {
    tableHash,
    originalPath: item.originalPath,
    replacementPath: item.replacementPath,
    replaced: true,
  };
}

/**
 * 根据某个 json 表，批量替换所有已经设置 replacementPath 的图片。
 */
function replaceImagesFromMap(tableHash: string): ReplaceResult[] {
  const table = readReplaceTable(tableHash);
  if (!table) {
    return [
      {
        tableHash,
        originalPath: "",
        replacementPath: "",
        replaced: false,
        reason: "table_not_found",
      },
    ];
  }

  return table.items.map((item) => replaceImageByPath(tableHash, item.originalPath));
}

function resetImagesReplaceMap(tableHash: string): boolean {
  const table = readReplaceTable(tableHash);
  if (!table) return false;

  table.items.forEach((item) => {
    item.replacementPath = "";
    item.replaced = false;
  });

  writeReplaceTable(table);
  return true;
}

export {
  setImagesDir,
  getImagesDir,
  setCoveredImagesDir,
  getCoveredImagesDir,
  getImageList,
  getImageListForDir,
  getImagesTablePath,
  createImagesReplaceMap,
  getImagesReplaceMap,
  setReplacementPath,
  replaceImageByPath,
  replaceImagesFromMap,
  resetImagesReplaceMap,
};

export type { ImageType, ImageReplaceItem, ImagesReplaceTable, ReplaceResult };

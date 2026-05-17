export type ImageReplaceItem = {
  imageHash: string;
  originalPath: string;
  originalName: string;
  replacementPath: string;
  replaced: boolean;
};

export type ImagesReplaceTable = {
  tableHash: string;
  imagesDir: string;
  items: ImageReplaceItem[];
  history: HistoryEntry[];
  redoStack: HistoryEntry[];
  auditLog: HistoryEntry[];
};

export type ReplaceResult = {
  tableHash: string;
  originalPath: string;
  replacementPath: string;
  replaced: boolean;
  reason?: string;
};

export type SystemLocaleInfo = {
  locale: string | null;
};

export type ImagePreviewPayload = {
  path: string;
  dataUrl: string;
};

export type HistoryEntry = {
  action: "replace" | "undo" | "redo";
  originalPath: string;
  originalName: string;
  replacementPath: string;
  backupPath: string;
  timestamp: string;
};

export type UndoRedoState = {
  canUndo: boolean;
  canRedo: boolean;
};

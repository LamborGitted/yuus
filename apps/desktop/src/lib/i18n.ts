export const supportedLocales = ["en", "zh-CN"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export type TranslationTree = {
  appTitle: string;
  brandEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  sessionLabel: string;
  idleSession: string;
  importFolder: string;
  metrics: {
    images: string;
    queued: string;
    done: string;
  };
  searchLabel: string;
  searchPlaceholder: string;
  importedImages: string;
  shownCount: (count: number) => string;
  previewDeck: string;
  selectImage: string;
  addReplacement: string;
  applyCurrent: string;
  dropZone: string;
  dropZoneTitle: string;
  dropZoneDescription: string;
  liveTarget: string;
  noImageSelected: string;
  replacementAlreadyStaged: string;
  dropHint: string;
  applyAllQueued: string;
  original: string;
  replacement: string;
  waitingForSelection: string;
  chooseReplacementHint: string;
  noImageAssigned: string;
  dropActivePrompt: string;
  dropPrompt: string;
  browsePrompt: string;
  undo: string;
  redo: string;
  history: string;
  historyTitle: string;
  historyEmpty: string;
  historyClose: string;
  historyActionReplace: string;
  historyActionUndo: string;
  historyActionRedo: string;
  confirmApplyAll: string;
  confirmApplyAllMessage: (count: number) => string;
  cancel: string;
  contextMenu: {
    assignReplacement: string;
    applyReplacement: string;
    revealInFinder: string;
  };
  dialog: {
    chooseImageDirectory: string;
    chooseReplacementImage: string;
    imageFilterName: string;
  };
  importDialog: {
    title: string;
    imageFormats: string;
    allFormats: string;
    selectedFormats: string;
    includeSubfolders: string;
    importAction: string;
  };
  status: {
    initial: string;
    chooseTargetBeforeDrop: string;
    importingDirectory: string;
    loadedSession: (count: number, hash: string) => string;
    assigningReplacement: string;
    replacementQueued: (name: string) => string;
    assignedMultiple: (count: number) => string;
    applyingReplacement: string;
    updatedCurrent: (name: string) => string;
    skippedCurrent: (name: string, reason: string) => string;
    applyingAll: string;
    appliedSummary: (count: number) => string;
    undoing: string;
    undone: (name: string) => string;
    redoing: string;
    redone: (name: string) => string;
  };
  state: {
    done: string;
    queued: string;
    idle: string;
  };
  reason: {
    table_not_found: string;
    image_not_found_in_table: string;
    replacement_path_not_set: string;
    original_file_not_found: string;
    replacement_file_not_found: string;
    backup_not_found: string;
    nothing_to_undo: string;
    nothing_to_redo: string;
    unknown: string;
  };
};

export const translations: Record<SupportedLocale, TranslationTree> = {
  en: {
    appTitle: "Yuus Desktop",
    brandEyebrow: "Yuus desktop atelier",
    heroTitle: "Replace imagery with a tactile, file-first workflow.",
    heroDescription:
      "Import a directory, map replacement files into a hashed session, inspect each frame, then commit the final swap without leaving the desk.",
    sessionLabel: "Session",
    idleSession: "Idle",
    importFolder: "Import Folder",
    metrics: {
      images: "Images",
      queued: "Queued",
      done: "Done",
    },
    searchLabel: "Search",
    searchPlaceholder: "Filter by name or path",
    importedImages: "Imported images",
    shownCount: (count) => `${count} shown`,
    previewDeck: "Preview deck",
    selectImage: "Select an image",
    addReplacement: "Add Replacement",
    applyCurrent: "Apply Current",
    dropZone: "Drop zone",
    dropZoneTitle: "Drag a replacement file onto the window.",
    dropZoneDescription:
      "The dropped image is attached to the currently selected original. This keeps the flow tactile and fast during review.",
    liveTarget: "Live target",
    noImageSelected: "No image selected",
    replacementAlreadyStaged: "A replacement is already staged. Drop again to swap it.",
    dropHint: "Drop a file here after picking an original image from the left rail.",
    applyAllQueued: "Apply All Queued Replacements",
    original: "Original",
    replacement: "Replacement",
    waitingForSelection: "Waiting for selection",
    chooseReplacementHint: "Drop or choose a replacement image",
    noImageAssigned: "No image assigned",
    dropActivePrompt: "Release to assign",
    dropPrompt: "Drop image here",
    browsePrompt: "or click to browse",
    undo: "Undo",
    redo: "Redo",
    history: "History",
    historyTitle: "Replacement History",
    historyEmpty: "No replacements yet.",
    historyClose: "Close",
    historyActionReplace: "Replace",
    historyActionUndo: "Undo",
    historyActionRedo: "Redo",
    confirmApplyAll: "Apply all queued replacements?",
    confirmApplyAllMessage: (count) => `This will replace ${count} original image${count === 1 ? "" : "s"} with their staged replacements. The original files will be backed up and can be restored via Undo.`,
    cancel: "Cancel",
    contextMenu: {
      assignReplacement: "Assign Replacement...",
      applyReplacement: "Apply Replacement",
      revealInFinder: "Reveal in Finder",
    },
    dialog: {
      chooseImageDirectory: "Choose image directory",
      chooseReplacementImage: "Choose replacement image",
      imageFilterName: "Images",
    },
    importDialog: {
      title: "Import Options",
      imageFormats: "Image Formats",
      allFormats: "All supported formats",
      selectedFormats: "Selected formats only",
      includeSubfolders: "Include sub-folders",
      importAction: "Import",
    },
    status: {
      initial: "Import a directory to begin a replacement session.",
      chooseTargetBeforeDrop: "Choose a target image before dropping a replacement file.",
      importingDirectory: "Importing directory",
      loadedSession: (count, hash) => `Loaded ${count} images into session ${hash}.`,
      assigningReplacement: "Assigning replacement",
      replacementQueued: (name) => `Replacement queued for ${name}.`,
      assignedMultiple: (count) => `Assigned ${count} replacement images to items without a replacement.`,
      applyingReplacement: "Applying replacement",
      updatedCurrent: (name) => `Updated ${name}.`,
      skippedCurrent: (name, reason) => `Skipped ${name}: ${reason}.`,
      applyingAll: "Applying all replacements",
      appliedSummary: (count) => `Applied ${count} replacement${count === 1 ? "" : "s"} from the current session.`,
      undoing: "Undoing replacement",
      undone: (name) => `↩ Undo: ${name}`,
      redoing: "Redoing replacement",
      redone: (name) => `↪ Redo: ${name}`,
    },
    state: {
      done: "done",
      queued: "queued",
      idle: "idle",
    },
    reason: {
      table_not_found: "session not found",
      image_not_found_in_table: "image not found in session",
      replacement_path_not_set: "replacement image not set",
      original_file_not_found: "original file not found",
      replacement_file_not_found: "replacement file not found",
      backup_not_found: "backup file not found",
      nothing_to_undo: "nothing to undo",
      nothing_to_redo: "nothing to redo",
      unknown: "unknown reason",
    },
  },
  "zh-CN": {
    appTitle: "Yuus 桌面端",
    brandEyebrow: "Yuus 桌面工作台",
    heroTitle: "按文件流工作的方式，细致地替换图像。",
    heroDescription: "导入目录，把替换图映射进哈希会话，逐张预览确认，再在桌面端一次性完成替换。",
    sessionLabel: "会话",
    idleSession: "空闲",
    importFolder: "导入文件夹",
    metrics: {
      images: "图片",
      queued: "待替换",
      done: "已完成",
    },
    searchLabel: "搜索",
    searchPlaceholder: "按名称或路径筛选",
    importedImages: "已导入图片",
    shownCount: (count) => `显示 ${count} 项`,
    previewDeck: "预览面板",
    selectImage: "选择一张图片",
    addReplacement: "添加替换图",
    applyCurrent: "应用当前项",
    dropZone: "拖放区域",
    dropZoneTitle: "把替换文件拖到窗口里。",
    dropZoneDescription: "拖入的图片会绑定到当前选中的原图，让你在审阅时保持顺手、直接的操作节奏。",
    liveTarget: "当前目标",
    noImageSelected: "尚未选择图片",
    replacementAlreadyStaged: "当前已经有待替换文件，再拖一次可直接覆盖。",
    dropHint: "先在左侧选中原图，再把替换文件拖到这里。",
    applyAllQueued: "应用全部待替换项",
    original: "原图",
    replacement: "替换图",
    waitingForSelection: "等待选择",
    chooseReplacementHint: "拖入或选择一张替换图片",
    noImageAssigned: "尚未指定图片",
    dropActivePrompt: "松开以分配",
    dropPrompt: "将图片拖到这里",
    browsePrompt: "或点击浏览",
    undo: "撤销",
    redo: "重做",
    history: "历史记录",
    historyTitle: "替换历史记录",
    historyEmpty: "暂无替换记录。",
    historyClose: "关闭",
    historyActionReplace: "替换",
    historyActionUndo: "撤销",
    historyActionRedo: "重做",
    confirmApplyAll: "应用全部待替换项？",
    confirmApplyAllMessage: (count) => `将用已暂存的替换图覆盖 ${count} 张原图。原图会自动备份，之后可通过撤销操作恢复。`,
    cancel: "取消",
    contextMenu: {
      assignReplacement: "分配替换图...",
      applyReplacement: "应用替换",
      revealInFinder: "在访达中显示",
    },
    dialog: {
      chooseImageDirectory: "选择图片目录",
      chooseReplacementImage: "选择替换图片",
      imageFilterName: "图片",
    },
    importDialog: {
      title: "导入选项",
      imageFormats: "图片格式",
      allFormats: "全部支持的格式",
      selectedFormats: "仅所选格式",
      includeSubfolders: "包含子文件夹",
      importAction: "导入",
    },
    status: {
      initial: "导入一个目录后即可开始替换会话。",
      chooseTargetBeforeDrop: "请先选择目标图片，再拖入替换文件。",
      importingDirectory: "正在导入目录",
      loadedSession: (count, hash) => `已加载 ${count} 张图片，会话 ${hash}。`,
      assigningReplacement: "正在绑定替换图",
      replacementQueued: (name) => `已为 ${name} 排入替换队列。`,
      assignedMultiple: (count) => `已将 ${count} 张替换图分配到未设置的项。`,
      applyingReplacement: "正在应用替换",
      updatedCurrent: (name) => `已更新 ${name}。`,
      skippedCurrent: (name, reason) => `已跳过 ${name}：${reason}。`,
      applyingAll: "正在批量应用替换",
      appliedSummary: (count) => `当前会话已应用 ${count} 个替换项。`,
      undoing: "正在撤销替换",
      undone: (name) => `↩ 撤销：${name}`,
      redoing: "正在重做替换",
      redone: (name) => `↪ 重做：${name}`,
    },
    state: {
      done: "完成",
      queued: "排队中",
      idle: "空闲",
    },
    reason: {
      table_not_found: "未找到会话",
      image_not_found_in_table: "会话中未找到该图片",
      replacement_path_not_set: "尚未设置替换图片",
      original_file_not_found: "未找到原文件",
      replacement_file_not_found: "未找到替换文件",
      backup_not_found: "未找到备份文件",
      nothing_to_undo: "没有可撤销的操作",
      nothing_to_redo: "没有可重做的操作",
      unknown: "未知原因",
    },
  },
};

export function normalizeLocale(input?: string | null): SupportedLocale {
  const locale = (input ?? "").trim().toLowerCase();

  if (locale.startsWith("zh")) {
    return "zh-CN";
  }

  return "en";
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === "undefined") {
    return "en";
  }

  for (const locale of navigator.languages ?? []) {
    const normalized = normalizeLocale(locale);
    if (normalized) {
      return normalized;
    }
  }

  return normalizeLocale(navigator.language);
}

export function getReasonLabel(locale: SupportedLocale, reason?: string) {
  if (!reason) {
    return translations[locale].reason.unknown;
  }

  return translations[locale].reason[reason as keyof TranslationTree["reason"]] ?? translations[locale].reason.unknown;
}

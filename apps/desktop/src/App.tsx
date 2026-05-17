import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";

import "./styles.css";
import {
  detectBrowserLocale,
  getReasonLabel,
  normalizeLocale,
  translations,
  type SupportedLocale,
} from "./lib/i18n";
import type {
  ImageReplaceItem,
  ImagesReplaceTable,
  ReplaceResult,
  SystemLocaleInfo,
  UndoRedoState,
} from "./lib/types";
import { IMAGE_EXTENSIONS, isImagePath } from "./lib/constants";
import { useImagePreview } from "./hooks/useImagePreview";
import { StatePill } from "./components/StatePill";
import { MetricChip } from "./components/MetricChip";
import { PreviewPanel } from "./components/PreviewPanel";
import { ContextMenu, type ContextMenuItem } from "./components/ContextMenu";
import { HistoryPanel } from "./components/HistoryPanel";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ImportDialog } from "./components/ImportDialog";

function App() {
  const browserLocale = detectBrowserLocale();
  const [locale, setLocale] = useState<SupportedLocale>(browserLocale);
  const [table, setTable] = useState<ImagesReplaceTable | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusLine, setStatusLine] = useState(translations[browserLocale].status.initial);
  const [busyLabel, setBusyLabel] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(Date.now());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [pendingImportDir, setPendingImportDir] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: ImageReplaceItem;
  } | null>(null);

  const deferredQuery = useDeferredValue(query);
  const copy = translations[locale];
  const items = table?.items ?? [];
  const tableRef = useRef(table);
  tableRef.current = table;

  const visibleItems = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (item) =>
        item.originalName.toLowerCase().includes(keyword) ||
        item.originalPath.toLowerCase().includes(keyword),
    );
  }, [deferredQuery, items]);

  const selectedItem =
    items.find((item) => item.originalPath === selectedPath) ?? visibleItems[0] ?? items[0] ?? null;
  const queuedCount = items.filter((item) => item.replacementPath).length;
  const doneCount = items.filter((item) => item.replaced).length;
  const originalPreview = useImagePreview(selectedItem?.originalPath, previewVersion);
  const replacementPreview = useImagePreview(selectedItem?.replacementPath, previewVersion);

  useEffect(() => {
    if (!selectedPath && selectedItem) {
      setSelectedPath(selectedItem.originalPath);
    }
  }, [selectedItem, selectedPath]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await invoke<SystemLocaleInfo>("get_system_locale");
        if (mounted) setLocale(normalizeLocale(info.locale));
      } catch {
        if (mounted) setLocale(browserLocale);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [browserLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy.appTitle;
    void getCurrentWindow().setTitle(copy.appTitle);
  }, [copy.appTitle, locale]);

  useEffect(() => {
    setStatusLine((current) => {
      const initialValues = Object.values(translations).map((e) => e.status.initial);
      return initialValues.includes(current) ? copy.status.initial : current;
    });
  }, [copy.status.initial]);

  useEffect(() => {
    let active = true;
    let unlistenPromise: Promise<(() => void) | undefined> | undefined;

    unlistenPromise = getCurrentWindow().onDragDropEvent((event) => {
      if (!active) return;

      if (event.payload.type === "enter" || event.payload.type === "over") {
        setDropActive(true);
        return;
      }

      if (event.payload.type === "leave") {
        setDropActive(false);
        return;
      }

      if (event.payload.type === "drop") {
        setDropActive(false);
        const droppedPaths = event.payload.paths.filter((p) => isImagePath(p));
        if (droppedPaths.length === 0 || !table) {
          setStatusLine(copy.status.chooseTargetBeforeDrop);
          return;
        }

        if (droppedPaths.length === 1 && selectedItem) {
          void assignReplacement(table.tableHash, selectedItem.originalPath, droppedPaths[0]!);
        } else {
          const used = new Set<string>();
          let count = 0;
          for (const dropPath of droppedPaths) {
            const next = table.items.find(
              (i) => !i.replacementPath && !i.replaced && !used.has(i.originalPath),
            );
            if (!next) break;
            used.add(next.originalPath);
            void assignReplacement(table.tableHash, next.originalPath, dropPath);
            count++;
          }
          if (count > 0) {
            setStatusLine(copy.status.assignedMultiple(count));
          }
        }
      }
    });

    return () => {
      active = false;
      void unlistenPromise?.then((unlisten) => unlisten?.());
    };
  }, [copy.status.chooseTargetBeforeDrop, selectedItem, table]);

  const refreshUndoRedoState = useCallback(async (tableHash?: string) => {
    const hash = tableHash ?? tableRef.current?.tableHash;
    if (!hash) {
      setCanUndo(false);
      setCanRedo(false);
      return;
    }
    try {
      const state = await invoke<UndoRedoState>("get_undo_redo_state", { tableHash: hash });
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    } catch {
      setCanUndo(false);
      setCanRedo(false);
    }
  }, []);

  async function refreshTable(tableHash: string) {
    const nextTable = await invoke<ImagesReplaceTable | null>("get_replace_table", { tableHash });
    if (nextTable) {
      startTransition(() => {
        setTable(nextTable);
        setPreviewVersion(Date.now());
      });
    }
    await refreshUndoRedoState(tableHash);
  }

  async function importFolder() {
    const picked = await open({
      directory: true,
      multiple: false,
      title: copy.dialog.chooseImageDirectory,
    });

    if (typeof picked !== "string") return;
    setPendingImportDir(picked);
  }

  async function handleImport(dir: string, extensions: string[], recursive: boolean) {
    setBusyLabel(copy.status.importingDirectory);
    try {
      const nextTable = await invoke<ImagesReplaceTable>("import_images_dir", {
        dir,
        extensions,
        recursive,
      });
      startTransition(() => {
        setTable(nextTable);
        setSelectedPath(nextTable.items[0]?.originalPath ?? null);
        setPreviewVersion(Date.now());
      });
      setStatusLine(copy.status.loadedSession(nextTable.items.length, nextTable.tableHash.slice(0, 8)));
      await refreshUndoRedoState(nextTable.tableHash);
    } finally {
      setBusyLabel("");
    }
  }

  async function chooseReplacement() {
    if (!table || !selectedItem) return;

    const picked = await open({
      directory: false,
      multiple: false,
      title: copy.dialog.chooseReplacementImage,
      filters: [
        {
          name: copy.dialog.imageFilterName,
          extensions: IMAGE_EXTENSIONS,
        },
      ],
    });

    if (typeof picked === "string") {
      await assignReplacement(table.tableHash, selectedItem.originalPath, picked);
    }
  }

  async function assignReplacement(tableHash: string, originalPath: string, replacementPath: string) {
    setBusyLabel(copy.status.assigningReplacement);

    try {
      const updated = await invoke<ImageReplaceItem | null>("set_replacement_path", {
        tableHash,
        originalPath,
        replacementPath,
      });

      await refreshTable(tableHash);

      if (updated) {
        setSelectedPath(updated.originalPath);
        setStatusLine(copy.status.replacementQueued(updated.originalName));
      }
    } finally {
      setBusyLabel("");
    }
  }

  async function applyCurrent() {
    if (!table || !selectedItem) return;

    setBusyLabel(copy.status.applyingReplacement);

    try {
      const result = await invoke<ReplaceResult>("replace_image_by_path", {
        tableHash: table.tableHash,
        originalPath: selectedItem.originalPath,
      });

      await refreshTable(table.tableHash);
      setPreviewVersion(Date.now());

      if (result.replaced) {
        setStatusLine(copy.status.updatedCurrent(selectedItem.originalName));
      } else {
        setStatusLine(
          copy.status.skippedCurrent(selectedItem.originalName, getReasonLabel(locale, result.reason)),
        );
      }
    } finally {
      setBusyLabel("");
    }
  }

  async function applyAll() {
    if (!table) return;

    setBusyLabel(copy.status.applyingAll);

    try {
      const results = await invoke<ReplaceResult[]>("replace_images_from_map", {
        tableHash: table.tableHash,
      });

      await refreshTable(table.tableHash);
      setPreviewVersion(Date.now());
      setStatusLine(copy.status.appliedSummary(results.filter((r) => r.replaced).length));
    } finally {
      setBusyLabel("");
    }
  }

  async function handleUndo() {
    if (!table) return;
    setBusyLabel(copy.status.undoing);
    try {
      const result = await invoke<ReplaceResult>("undo_last_replace", { tableHash: table.tableHash });
      await refreshTable(table.tableHash);
      setPreviewVersion(Date.now());
      if (result.replaced === false && !result.reason) {
        const name = result.originalPath.split("/").pop() ?? result.originalPath;
        setStatusLine(copy.status.undone(name));
      }
    } finally {
      setBusyLabel("");
    }
  }

  async function handleRedo() {
    if (!table) return;
    setBusyLabel(copy.status.redoing);
    try {
      const result = await invoke<ReplaceResult>("redo_last_replace", { tableHash: table.tableHash });
      await refreshTable(table.tableHash);
      setPreviewVersion(Date.now());
      if (result.replaced && !result.reason) {
        const name = result.originalPath.split("/").pop() ?? result.originalPath;
        setStatusLine(copy.status.redone(name));
      }
    } finally {
      setBusyLabel("");
    }
  }

  async function handleRevealInFinder(path: string) {
    try {
      await invoke("reveal_in_finder", { path });
    } catch {
      // silent
    }
  }

  async function handleContextMenuAction(
    action: "apply" | "assign" | "reveal",
    item: ImageReplaceItem,
  ) {
    if (!table) return;
    if (action === "reveal") {
      await handleRevealInFinder(item.originalPath);
    } else if (action === "assign") {
      setSelectedPath(item.originalPath);
      await chooseReplacement();
    } else if (action === "apply") {
      setSelectedPath(item.originalPath);
      setBusyLabel(copy.status.applyingReplacement);
      try {
        const result = await invoke<ReplaceResult>("replace_image_by_path", {
          tableHash: table.tableHash,
          originalPath: item.originalPath,
        });
        await refreshTable(table.tableHash);
        setPreviewVersion(Date.now());
        setStatusLine(
          result.replaced
            ? copy.status.updatedCurrent(item.originalName)
            : copy.status.skippedCurrent(item.originalName, getReasonLabel(locale, result.reason)),
        );
      } finally {
        setBusyLabel("");
      }
    }
  }

  function onContextMenu(e: React.MouseEvent, item: ImageReplaceItem) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }

  function buildContextMenuItems(item: ImageReplaceItem): (ContextMenuItem | "separator")[] {
    return [
      {
        label: copy.contextMenu.assignReplacement,
        onClick: () => handleContextMenuAction("assign", item),
      },
      {
        label: copy.contextMenu.applyReplacement,
        onClick: () => handleContextMenuAction("apply", item),
        disabled: !item.replacementPath || item.replaced,
      },
      "separator",
      {
        label: copy.contextMenu.revealInFinder,
        onClick: () => handleContextMenuAction("reveal", item),
      },
    ];
  }

  /* Keyboard shortcuts */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) void handleUndo();
      }
      if (e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (canRedo) void handleRedo();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [canUndo, canRedo]);

  return (
    <main className="h-screen overflow-hidden bg-bg text-copy-strong">
      <div className="app-shell">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-4">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-lg font-extrabold text-black">
              Y
            </div>
            <div className="min-w-0">
              <p className="eyebrow">{copy.brandEyebrow}</p>
              <h1 className="truncate text-lg font-extrabold text-copy-strong">{copy.heroTitle}</h1>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
            <div className="session-pill">
              <span>{copy.sessionLabel}</span>
              <span className="font-mono text-copy-muted">
                {table?.tableHash.slice(0, 12) ?? copy.idleSession}
              </span>
            </div>

            <label className="search-box">
              <svg viewBox="0 0 16 16" className="h-4 w-4 text-copy-muted" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <MetricChip label={copy.metrics.images} value={items.length} active={items.length > 0} />
              <MetricChip label={copy.metrics.queued} value={queuedCount} active={queuedCount > 0} />
              <MetricChip label={copy.metrics.done} value={doneCount} active={doneCount > 0} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo || !table}
                className="icon-button"
                title={`${copy.undo} (${navigator.platform.includes("Mac") ? "⌘" : "Ctrl+"}Z)`}
              >
                <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 7L2 10L5 13" />
                  <path d="M3 10H11C13.2091 10 15 11.7909 15 14V15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo || !table}
                className="icon-button"
                title={`${copy.redo} (${navigator.platform.includes("Mac") ? "⌘" : "Ctrl+"}Shift+Z)`}
              >
                <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 7L16 10L13 13" />
                  <path d="M15 10H7C4.79086 10 3 11.7909 3 14V15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                disabled={!table}
                className="icon-button"
                title={copy.history}
              >
                <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="6.5" />
                  <path d="M9 5.5V9L11.5 11.5" />
                </svg>
              </button>
              <div className="h-5 w-px bg-[var(--border-default)]" />
              <button type="button" onClick={importFolder} className="button-secondary">
                {copy.importFolder}
              </button>
              <button
                type="button"
                onClick={() => setConfirmAll(true)}
                disabled={!table || queuedCount === 0}
                className="button-primary"
              >
                {copy.applyAllQueued}
              </button>
            </div>
          </div>
        </header>

        <div className="status-row">
          <p className="truncate">{statusLine}</p>
          {busyLabel ? <span className="eyebrow text-brand">{busyLabel}</span> : null}
        </div>

        <section className="workspace-grid">
          <aside className="panel panel-list">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">{copy.importedImages}</p>
                <p className="mt-1 text-xs text-copy">{copy.shownCount(visibleItems.length)}</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-surface px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-copy">
                  {copy.metrics.queued} {queuedCount}
                </span>
                <span className="bg-brand/14 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-copy-strong">
                  {copy.metrics.done} {doneCount}
                </span>
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-auto pr-1">
              {visibleItems.length === 0 ? (
                 <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-[var(--border-medium)] bg-surface p-8 text-center">
                  <div>
                    <p className="text-sm font-semibold text-copy-strong">{copy.selectImage}</p>
                    <p className="mt-2 text-xs leading-6 text-copy">{copy.waitingForSelection}</p>
                  </div>
                </div>
              ) : (
                 <div className="space-y-1.5">
                  {visibleItems.map((item) => {
                    const active = selectedItem?.originalPath === item.originalPath;
                    return (
                      <button
                        key={item.originalPath}
                        type="button"
                        onClick={() => setSelectedPath(item.originalPath)}
                        onContextMenu={(e) => onContextMenu(e, item)}
                        className={`image-row ${active ? "image-row-active" : ""}`}
                      >
                         <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[11px] uppercase tracking-[0.18em] text-copy-muted">
                          {item.originalName.split(".").pop()?.slice(0, 4) ?? "IMG"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${active ? "text-copy-strong" : "text-copy-strong"}`}>
                            {item.originalName}
                          </p>
                          <p className={`mt-1 truncate text-xs ${active ? "text-copy" : "text-copy-muted"}`}>
                            {item.originalPath}
                          </p>
                        </div>
                        <StatePill item={item} active={active} locale={locale} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <PreviewPanel
            eyebrow={copy.original}
            title={selectedItem?.originalName ?? copy.selectImage}
            subtitle={selectedItem?.originalPath ?? copy.waitingForSelection}
            previewSrc={originalPreview}
            emptyLabel={copy.noImageAssigned}
            footer={
              selectedItem ? (
                 <div className="rounded-lg border border-[var(--border-default)] bg-surface px-4 py-3 text-center text-xs text-copy">
                  {selectedItem.replaced
                    ? copy.replacementAlreadyStaged
                    : selectedItem.replacementPath
                      ? `${copy.metrics.queued}: ${selectedItem.originalName}`
                      : copy.dropHint}
                </div>
              ) : undefined
            }
          />

          <PreviewPanel
            eyebrow={copy.replacement}
            title={selectedItem?.replacementPath ? copy.replacement : copy.chooseReplacementHint}
            subtitle={selectedItem?.replacementPath || copy.chooseReplacementHint}
            previewSrc={replacementPreview}
            emptyLabel={copy.noImageAssigned}
            accent
            dropActive={dropActive}
            onDropClick={chooseReplacement}
            dropActivePrompt={copy.dropActivePrompt}
            dropPrompt={copy.dropPrompt}
            browsePrompt={copy.browsePrompt}
            actions={
              selectedItem ? (
                <>
                  <button type="button" onClick={chooseReplacement} className="button-secondary">
                    {copy.addReplacement}
                  </button>
                  <button
                    type="button"
                    onClick={applyCurrent}
                    disabled={!selectedItem.replacementPath || selectedItem.replaced}
                    className="button-primary"
                  >
                    {copy.applyCurrent}
                  </button>
                </>
              ) : undefined
            }
            footer={
              selectedItem ? (
                <div
                  className={`rounded-lg border border-dashed px-4 py-3 text-center text-xs ${
                    dropActive ? "border-brand bg-brand/8 text-copy-strong" : "border-[var(--border-medium)] bg-surface text-copy"
                  }`}
                >
                  {selectedItem.replacementPath ? copy.replacementAlreadyStaged : copy.dropZoneDescription}
                </div>
              ) : undefined
            }
          />
        </section>
      </div>

      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          items={buildContextMenuItems(contextMenu.item)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showHistory && table && (
        <HistoryPanel
          entries={table.auditLog}
          copy={copy}
          locale={locale}
          onClose={() => setShowHistory(false)}
        />
      )}

      {confirmAll && (
        <ConfirmDialog
          title={copy.confirmApplyAll}
          message={copy.confirmApplyAllMessage(queuedCount)}
          confirmLabel={copy.applyAllQueued}
          cancelLabel={copy.cancel}
          onConfirm={() => {
            setConfirmAll(false);
            void applyAll();
          }}
          onCancel={() => setConfirmAll(false)}
        />
      )}

      {pendingImportDir !== null && (
        <ImportDialog
          title={copy.importDialog.title}
          imageFormatsLabel={copy.importDialog.imageFormats}
          allFormatsLabel={copy.importDialog.allFormats}
          selectedFormatsLabel={copy.importDialog.selectedFormats}
          includeSubfoldersLabel={copy.importDialog.includeSubfolders}
          importLabel={copy.importDialog.importAction}
          cancelLabel={copy.cancel}
          onConfirm={(extensions, recursive) => {
            const dir = pendingImportDir;
            setPendingImportDir(null);
            void handleImport(dir, extensions, recursive);
          }}
          onCancel={() => setPendingImportDir(null)}
        />
      )}
    </main>
  );
}

export default App;

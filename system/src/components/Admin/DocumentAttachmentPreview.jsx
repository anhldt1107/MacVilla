import { useEffect, useMemo, useState } from "react";
import {
  detectDocumentKind,
  documentDisplayName,
  isPreviewableInBrowser,
} from "@/lib/documentUrl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, ExternalLink, FileText, FileWarning } from "lucide-react";

/**
 * Preview tài liệu đính kèm — cột phải trang chi tiết hợp đồng staff.
 *
 * @param {{
 *   url?: string | null;
 *   title?: string;
 *   className?: string;
 * }} props
 */
export function DocumentAttachmentPreview({ url, title = "Xem trước tài liệu", className }) {
  const urlTrim = String(url ?? "").trim();
  const kind = useMemo(() => detectDocumentKind(urlTrim), [urlTrim]);
  const fileName = useMemo(() => documentDisplayName(urlTrim), [urlTrim]);
  const [iframeFailed, setIframeFailed] = useState(false);

  useEffect(() => {
    setIframeFailed(false);
  }, [urlTrim]);

  if (!urlTrim) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900/25 lg:min-h-[420px]",
          className
        )}
      >
        <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
        <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">Chưa có tài liệu đính kèm</p>
        <p className="mt-1 max-w-[220px] text-xs text-slate-500 dark:text-slate-500">
          Tải PDF hoặc Word ở cột bên trái để xem trước tại đây.
        </p>
      </div>
    );
  }

  const openInNewTab = () => {
    window.open(urlTrim, "_blank", "noopener,noreferrer");
  };

  if (kind === "word") {
    return (
      <div
        className={cn(
          "flex min-h-[280px] flex-col rounded-xl border border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900/40 lg:min-h-[420px] lg:sticky lg:top-4",
          className
        )}
      >
        <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={fileName}>
            {fileName}
          </p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <FileText className="h-7 w-7" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Tài liệu Word</p>
            <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
              Trình duyệt không xem trước Word trong trang. Vui lòng tải về hoặc mở bằng ứng dụng Office.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" className="gap-1.5" onClick={openInNewTab}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Mở tab mới
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" asChild>
              <a href={urlTrim} download target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" aria-hidden />
                Tải về
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isPreviewableInBrowser(kind) && !iframeFailed) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900/40 lg:min-h-[420px] lg:sticky lg:top-4",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={fileName}>
              {fileName}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={openInNewTab}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Tab mới
          </Button>
        </div>
        <iframe
          key={urlTrim}
          src={urlTrim}
          title={`Xem trước ${fileName}`}
          className="min-h-[360px] w-full flex-1 border-0 bg-slate-100 dark:bg-slate-950"
          sandbox="allow-scripts allow-same-origin allow-popups"
          onError={() => setIframeFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col rounded-xl border border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900/40 lg:min-h-[420px] lg:sticky lg:top-4",
        className
      )}
    >
      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={fileName}>
          {fileName}
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <FileWarning className="h-7 w-7" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {iframeFailed ? "Không xem trước được trong trang" : "Không nhận dạng định dạng"}
          </p>
          <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
            {iframeFailed
              ? "Trình duyệt hoặc máy chủ file chặn nhúng. Mở tab mới để xem."
              : "Mở hoặc tải tệp bằng liên kết bên dưới."}
          </p>
        </div>
        <Button type="button" size="sm" className="gap-1.5" onClick={openInNewTab}>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Mở tab mới
        </Button>
      </div>
    </div>
  );
}

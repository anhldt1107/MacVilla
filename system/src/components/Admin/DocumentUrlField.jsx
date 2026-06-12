import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { detectDocumentKind, documentOpenLinkLabel } from "@/lib/documentUrl";
import { uploadAdminFile } from "@/services/admin/adminUploadsApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, Upload, X } from "lucide-react";

const fieldInput = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm transition-all",
  "placeholder:text-slate-400 hover:border-slate-300",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  "dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
);

const DEFAULT_ACCEPT = ".pdf,.doc,.docx";
const DEFAULT_HINT = "PDF hoặc Word, tối đa 30MB. Có thể dán link hoặc tải lên.";

/**
 * URL tài liệu + tải file lên (Cloudinary secure URL).
 * @param {{
 *   id: string;
 *   label: string;
 *   value: string;
 *   onChange: (url: string) => void;
 *   uploadFolder: "contract" | "invoice";
 *   disabled?: boolean;
 *   accept?: string;
 *   hint?: string;
 *   urlPlaceholder?: string;
 * }} props
 */
export function DocumentUrlField({
  id,
  label,
  value,
  onChange,
  uploadFolder,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  hint = DEFAULT_HINT,
  urlPlaceholder = "https://…",
}) {
  const { accessToken } = useAuth();
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [pendingFile, setPendingFile] = useState(/** @type {File | null} */ (null));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const busy = disabled || uploading;
  const urlTrim = String(value ?? "").trim();
  const openLinkLabel = documentOpenLinkLabel(detectDocumentKind(urlTrim));

  const handlePickFile = () => {
    if (busy) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setPendingFile(file);
    setUploadError("");
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!pendingFile || !accessToken || busy) return;
    setUploading(true);
    setUploadError("");
    try {
      const data = await uploadAdminFile(accessToken, pendingFile, uploadFolder);
      const url = typeof data?.secureUrl === "string" ? data.secureUrl.trim() : "";
      if (!url) throw new Error("Tải tệp thất bại.");
      onChange(url);
      setPendingFile(null);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tải được tệp.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleClearUrl = () => {
    if (busy) return;
    onChange("");
    setPendingFile(null);
    setUploadError("");
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="url"
        className={fieldInput}
        disabled={busy}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setUploadError("");
        }}
        placeholder={urlPlaceholder}
        autoComplete="off"
      />
      {hint ? <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={busy}
        onChange={handleFileChange}
        aria-hidden
        tabIndex={-1}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={handlePickFile}>
          Chọn tệp
        </Button>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={busy || !pendingFile || !accessToken}
          onClick={() => void handleUpload()}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Upload className="h-3.5 w-3.5" aria-hidden />}
          Tải lên
        </Button>
        {pendingFile && !uploading ? (
          <span className="max-w-[200px] truncate text-xs text-slate-600 dark:text-slate-400" title={pendingFile.name}>
            {pendingFile.name}
          </span>
        ) : null}
      </div>

      {urlTrim ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={urlTrim}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {openLinkLabel}
            <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
          </a>
          {!disabled ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-slate-600" onClick={handleClearUrl}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Xóa link
            </Button>
          ) : null}
        </div>
      ) : null}

      {uploadError ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}

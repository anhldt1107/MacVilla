import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { fetchAdminVariantBySku } from "@/services/admin/adminVariantsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";

function pick(obj, camel, pascal) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camel] !== undefined && obj[camel] !== null) return obj[camel];
  if (obj[pascal] !== undefined && obj[pascal] !== null) return obj[pascal];
  return undefined;
}

/** Tra SKU read-only trong shell Worker. */
export function WorkerSkuLookupPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const [skuInput, setSkuInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [variant, setVariant] = useState(/** @type {Record<string, unknown> | null} */ (null));

  const handleSearch = async () => {
    if (!isAuthenticated || !accessToken || loading) return;
    const sku = skuInput.trim();
    if (!sku) {
      setError("Nhập mã SKU.");
      return;
    }
    setLoading(true);
    setError("");
    setVariant(null);
    try {
      const data = await fetchAdminVariantBySku(accessToken, sku);
      setVariant(data && typeof data === "object" ? /** @type {Record<string, unknown>} */ (data) : null);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không tra được SKU.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const productName = variant ? pick(variant, "productName", "ProductName") : null;
  const variantName = variant ? pick(variant, "variantName", "VariantName") : null;
  const sku = variant ? pick(variant, "sku", "Sku") : null;
  const onHand = variant ? pick(variant, "quantityOnHand", "QuantityOnHand") : null;
  const available = variant ? pick(variant, "quantityAvailable", "QuantityAvailable") : null;
  const reserved = variant ? pick(variant, "quantityReserved", "QuantityReserved") : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tra SKU</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nhập mã SKU</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={skuInput}
            onChange={(e) => setSkuInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
            placeholder="Ví dụ: SP-001-RED"
            className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <Button type="button" onClick={() => void handleSearch()} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Tra cứu
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      {variant ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-base">{String(sku ?? "—")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Sản phẩm:</span> {String(productName ?? "—")}
              {variantName ? ` · ${String(variantName)}` : ""}
            </p>
            <p>
              <span className="text-muted-foreground">Tồn thực:</span>{" "}
              <span className="font-medium tabular-nums">{onHand != null ? Number(onHand).toLocaleString("vi-VN") : "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Còn bán:</span>{" "}
              <span className="font-medium tabular-nums">{available != null ? Number(available).toLocaleString("vi-VN") : "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Giữ chỗ:</span>{" "}
              <span className="font-medium tabular-nums">{reserved != null ? Number(reserved).toLocaleString("vi-VN") : "—"}</span>
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

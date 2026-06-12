import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchStoreProductDetail, pickStoreRow } from "@/services/store/storeCatalogApi";
import { ApiRequestError } from "@/services/api/apiEnvelope";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function formatMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("vi-VN")} đ`;
}

export function SalerProductDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchStoreProductDetail(id);
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) {
          setDetail(null);
          setError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : "Không tải được sản phẩm.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const name = pickStoreRow(detail, "name", "Name");
  const variants = detail?.variants ?? detail?.Variants ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/saler/products" className="text-primary underline-offset-2 hover:underline">
          Tra sản phẩm
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">{name ?? id}</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {detail && !loading ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Danh mục: {pickStoreRow(detail, "categoryName", "CategoryName") ?? "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biến thể</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-2">SKU</th>
                    <th className="py-2 pr-2">Tên</th>
                    <th className="py-2 pr-2 text-right">Giá bán</th>
                    <th className="py-2 text-right">Tồn khả dụng</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-muted-foreground">
                        Không có biến thể.
                      </td>
                    </tr>
                  ) : (
                    variants.map((v) => {
                      const vid = pickStoreRow(v, "id", "Id");
                      return (
                        <tr key={vid} className="border-b border-border/50">
                          <td className="py-2 pr-2 font-mono text-xs">{pickStoreRow(v, "sku", "Sku")}</td>
                          <td className="py-2 pr-2">{pickStoreRow(v, "variantName", "VariantName")}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">
                            {formatMoney(pickStoreRow(v, "retailPrice", "RetailPrice"))}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {pickStoreRow(v, "quantityAvailable", "QuantityAvailable") ?? "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Button asChild>
            <Link to="/saler/quotations/create">Thêm vào báo giá mới</Link>
          </Button>
        </>
      ) : null}
    </div>
  );
}

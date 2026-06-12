import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ApiRequestError } from "@/services/api/apiEnvelope";

/**
 * @param {object} p
 * @param {string} p.title
 * @param {boolean} p.loading
 * @param {Error | null} p.error
 * @param {import('react').ReactNode} p.children
 * @param {string} [p.className]
 */
export function DashboardSectionFrame({ title, loading, error, children, className }) {
  const forbidden = error instanceof ApiRequestError && error.status === 403;
  return (
    <Card className={cn("border-border/60 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          </div>
        ) : error ? (
          <p className="text-sm text-amber-800 dark:text-amber-200" role="alert">
            {forbidden ? "Không có quyền xem mục này." : error.message}
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

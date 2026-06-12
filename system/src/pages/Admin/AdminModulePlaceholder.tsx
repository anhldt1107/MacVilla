import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title?: string;
  description?: string;
};

export function AdminModulePlaceholder({ title, description }: Props) {
  const { pathname } = useLocation();
  return (
    <Card className="max-w-2xl border-dashed border-border/80 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title ?? "Module đang phát triển"}</CardTitle>
        <CardDescription>{description ?? "Tính năng đang phát triển."}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-sm text-muted-foreground">{pathname}</p>
      </CardContent>
    </Card>
  );
}

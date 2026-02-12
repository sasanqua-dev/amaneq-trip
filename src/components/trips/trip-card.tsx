import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import type { TripStatus } from "@/lib/supabase/types";

interface TripCardProps {
  id: string;
  title: string;
  description?: string | null;
  status: TripStatus;
  startDate?: string | null;
  endDate?: string | null;
}

const statusLabels: Record<TripStatus, string> = {
  draft: "下書き",
  planned: "計画中",
  ongoing: "旅行中",
  completed: "完了",
};

const statusVariants: Record<TripStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  planned: "secondary",
  ongoing: "default",
  completed: "outline",
};

export function TripCard({
  id,
  title,
  description,
  status,
  startDate,
  endDate,
}: TripCardProps) {
  return (
    <Link href={`/trips/${id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant={statusVariants[status]}>
              {statusLabels[status]}
            </Badge>
          </div>
          {description && (
            <CardDescription className="line-clamp-2">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        {(startDate || endDate) && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {startDate ?? "未定"} ~ {endDate ?? "未定"}
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}

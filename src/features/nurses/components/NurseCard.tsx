import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { NursePublic } from "@/types/models";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/RatingStars";
import { ROUTES } from "@/constants/routes";

export function NurseCard({ nurse }: { nurse: NursePublic }) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-elevated sm:flex-row sm:items-center sm:p-5">
      <Avatar className="h-16 w-16 ring-4 ring-accent-subtle">
        <AvatarImage src={nurse.avatar_url ?? undefined} alt={nurse.full_name} />
        <AvatarFallback className="text-lg">{nurse.full_name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="font-semibold text-foreground">{nurse.full_name}</p>
        <p className="text-sm text-muted-foreground">{nurse.experience_years} سنوات خبرة</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <RatingStars rating={nurse.rating_avg} reviewCount={nurse.rating_count} />
          {nurse.service_area.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {nurse.service_area.slice(0, 2).join("، ")}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
        <div className="text-left sm:text-right">
          <p className="font-semibold text-foreground">{nurse.visit_price} جنيه</p>
          {nurse.available_today && (
            <Badge variant="success" className="mt-1">
              متاحة اليوم
            </Badge>
          )}
        </div>
        <Button asChild size="sm" className="group-hover:shadow-soft">
          <Link to={ROUTES.nurseProfile(nurse.id)}>طلب زيارة منزلية</Link>
        </Button>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { DoctorPublic } from "@/types/models";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/RatingStars";
import { ROUTES } from "@/constants/routes";

export function DoctorCard({ doctor }: { doctor: DoctorPublic }) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-elevated sm:flex-row sm:items-center sm:p-5">
      <Avatar className="h-16 w-16 ring-4 ring-primary-subtle">
        <AvatarImage src={doctor.avatar_url ?? undefined} alt={doctor.full_name} />
        <AvatarFallback className="text-lg">{doctor.full_name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="font-semibold text-foreground">د. {doctor.full_name}</p>
        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <RatingStars rating={doctor.rating_avg} reviewCount={doctor.rating_count} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {doctor.clinic_address}
          </span>
        </div>
      </div>

      <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
        <div className="text-left sm:text-right">
          <p className="font-semibold text-foreground">{doctor.consultation_price} جنيه</p>
          {doctor.available_today && (
            <Badge variant="success" className="mt-1">
              متاح اليوم
            </Badge>
          )}
        </div>
        <Button asChild size="sm" className="group-hover:shadow-soft">
          <Link to={ROUTES.doctorProfile(doctor.id)}>عرض الملف</Link>
        </Button>
      </div>
    </div>
  );
}

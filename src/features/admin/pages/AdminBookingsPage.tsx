import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminBookings } from "../hooks/useAdminData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_VARIANT } from "@/constants/booking-status";
import { ROUTES } from "@/constants/routes";
import type { AdminBookingFilters } from "../services/admin-bookings.service";
import type { BookingStatus } from "@/types/enums";

const STATUS_OPTIONS: BookingStatus[] = [
  "pending",
  "accepted",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
];

export function AdminBookingsPage() {
  const [filters, setFilters] = useState<AdminBookingFilters>({});
  const { data: bookings, isLoading } = useAdminBookings(filters);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">إدارة الحجوزات</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "all" ? undefined : (v as BookingStatus) }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {BOOKING_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.providerType ?? "all"}
          onValueChange={(v) => setFilters((f) => ({ ...f, providerType: v === "all" ? undefined : (v as "doctor" | "nurse") }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">أطباء وتمريض</SelectItem>
            <SelectItem value="doctor">الأطباء</SelectItem>
            <SelectItem value="nurse">التمريض المنزلي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <EmptyState title="لا توجد حجوزات مطابقة" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>مقدّم الخدمة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.patient_name}</TableCell>
                  <TableCell>{b.provider_name}</TableCell>
                  <TableCell>{format(new Date(b.booking_date), "d MMMM yyyy", { locale: ar })}</TableCell>
                  <TableCell>
                    <Badge variant={BOOKING_STATUS_VARIANT[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={ROUTES.adminBookingDetails(b.id)}>التفاصيل</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

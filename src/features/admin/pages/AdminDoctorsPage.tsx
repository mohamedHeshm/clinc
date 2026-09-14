import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useAdminDoctors, useSetDoctorAccountStatus } from "../hooks/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { ROUTES } from "@/constants/routes";

export function AdminDoctorsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data: doctors, isLoading } = useAdminDoctors(debouncedSearch);
  const setStatus = useSetDoctorAccountStatus();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">إدارة الأطباء</h1>
        <Button asChild size="sm">
          <Link to={ROUTES.adminDoctorNew}>
            <Plus className="h-4 w-4" />
            إضافة طبيب
          </Link>
        </Button>
      </div>

      <div className="relative mt-4 max-w-sm">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث بالاسم أو التخصص..."
          className="pr-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !doctors || doctors.length === 0 ? (
          <EmptyState title="لا يوجد أطباء بعد" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>التخصص</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>د. {doctor.full_name}</TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>{doctor.consultation_price} جنيه</TableCell>
                  <TableCell>{doctor.rating_avg.toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge variant={doctor.account_status === "active" ? "success" : "destructive"}>
                      {doctor.account_status === "active" ? "نشط" : "موقوف"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={ROUTES.adminDoctorEdit(doctor.id)}>تعديل</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={setStatus.isPending}
                        onClick={() =>
                          setStatus.mutate({
                            profileId: doctor.profile_id,
                            status: doctor.account_status === "active" ? "suspended" : "active",
                          })
                        }
                      >
                        {doctor.account_status === "active" ? "إيقاف" : "تفعيل"}
                      </Button>
                    </div>
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

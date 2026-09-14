import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAdminUsers, useSetUserAccountStatus } from "../hooks/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { ROUTES } from "@/constants/routes";

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data: users, isLoading } = useAdminUsers(debouncedSearch);
  const setStatus = useSetUserAccountStatus();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">إدارة المستخدمين</h1>

      <div className="relative mt-4 max-w-sm">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث بالاسم أو رقم الهاتف..."
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
        ) : !users || users.length === 0 ? (
          <EmptyState title="لا يوجد مستخدمون بعد" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : "destructive"}>
                      {user.status === "active" ? "نشط" : "موقوف"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={ROUTES.adminUserDetails(user.id)}>التفاصيل</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={setStatus.isPending}
                        onClick={() =>
                          setStatus.mutate({
                            profileId: user.id,
                            status: user.status === "active" ? "suspended" : "active",
                          })
                        }
                      >
                        {user.status === "active" ? "إيقاف" : "تفعيل"}
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

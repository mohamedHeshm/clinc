import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function SearchSection() {
  const navigate = useNavigate();
  const [doctorQuery, setDoctorQuery] = useState("");
  const [nurseQuery, setNurseQuery] = useState("");

  const searchDoctors = (e: FormEvent) => {
    e.preventDefault();
    const params = doctorQuery.trim() ? `?search=${encodeURIComponent(doctorQuery.trim())}` : "";
    navigate(`${ROUTES.doctors}${params}`);
  };

  const searchNurses = (e: FormEvent) => {
    e.preventDefault();
    const params = nurseQuery.trim() ? `?search=${encodeURIComponent(nurseQuery.trim())}` : "";
    navigate(`${ROUTES.nurses}${params}`);
  };

  return (
    <section className="container -mt-8 pb-16">
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-surface p-5 shadow-elevated sm:p-6">
        <Tabs defaultValue="doctors">
          <TabsList className="w-full">
            <TabsTrigger value="doctors" className="flex-1">
              الأطباء
            </TabsTrigger>
            <TabsTrigger value="nurses" className="flex-1">
              التمريض المنزلي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctors">
            <form onSubmit={searchDoctors} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث باسم الطبيب أو التخصص (مثال: أسنان، جلدية...)"
                  className="pr-10"
                  value={doctorQuery}
                  onChange={(e) => setDoctorQuery(e.target.value)}
                />
              </div>
              <Button type="submit">بحث</Button>
            </form>
          </TabsContent>

          <TabsContent value="nurses">
            <form onSubmit={searchNurses} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث باسم الممرض أو نوع الخدمة..."
                  className="pr-10"
                  value={nurseQuery}
                  onChange={(e) => setNurseQuery(e.target.value)}
                />
              </div>
              <Button type="submit">بحث</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

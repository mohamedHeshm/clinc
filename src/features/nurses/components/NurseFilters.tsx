import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNurseServiceAreas } from "../hooks/useNurses";
import type { NurseFilters as NurseFiltersType } from "../services/nurses.service";

interface Props {
  value: NurseFiltersType;
  onChange: (value: NurseFiltersType) => void;
}

const PRICE_OPTIONS = [100, 200, 300, 500];
const RATING_OPTIONS = [4, 4.5, 4.8];

export function NurseFilters({ value, onChange }: Props) {
  const { data: areas } = useNurseServiceAreas();

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث باسم الممرض/الممرضة..."
          className="pr-10"
          value={value.search ?? ""}
          onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          value={value.region ?? "all"}
          onValueChange={(v) => onChange({ ...value, region: v === "all" ? undefined : v, page: 1 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="المنطقة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المناطق</SelectItem>
            {areas?.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.priceMax ? String(value.priceMax) : "all"}
          onValueChange={(v) => onChange({ ...value, priceMax: v === "all" ? undefined : Number(v), page: 1 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="السعر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأسعار</SelectItem>
            {PRICE_OPTIONS.map((p) => (
              <SelectItem key={p} value={String(p)}>
                حتى {p} جنيه
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.ratingMin ? String(value.ratingMin) : "all"}
          onValueChange={(v) => onChange({ ...value, ratingMin: v === "all" ? undefined : Number(v), page: 1 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="التقييم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">أي تقييم</SelectItem>
            {RATING_OPTIONS.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r}+ فأعلى
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.sortBy ?? "rating"}
          onValueChange={(v) => onChange({ ...value, sortBy: v as NurseFiltersType["sortBy"], page: 1 })}
        >
          <SelectTrigger>
            <SelectValue placeholder="الترتيب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">الأعلى تقييمًا</SelectItem>
            <SelectItem value="price_asc">السعر: الأقل أولًا</SelectItem>
            <SelectItem value="price_desc">السعر: الأعلى أولًا</SelectItem>
            <SelectItem value="experience">الأكثر خبرة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="nurse-available-today"
            checked={value.availableToday ?? false}
            onCheckedChange={(checked) => onChange({ ...value, availableToday: checked, page: 1 })}
          />
          <Label htmlFor="nurse-available-today" className="cursor-pointer font-normal">
            متاحة اليوم فقط
          </Label>
        </div>

        <Select
          value={value.gender ?? "all"}
          onValueChange={(v) =>
            onChange({ ...value, gender: v === "all" ? undefined : (v as "MALE" | "FEMALE"), page: 1 })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الجنس" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="MALE">ذكر</SelectItem>
            <SelectItem value="FEMALE">أنثى</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

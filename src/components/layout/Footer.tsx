import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container flex flex-col items-center gap-4 py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Clinic. جميع الحقوق محفوظة.</p>
        <nav className="flex items-center gap-5">
          <Link to={ROUTES.howItWorks} className="hover:text-foreground">
            كيف تعمل المنصة
          </Link>
          <Link to={ROUTES.about} className="hover:text-foreground">
            عن المنصة
          </Link>
          <Link to={ROUTES.doctors} className="hover:text-foreground">
            الأطباء
          </Link>
          <Link to={ROUTES.nurses} className="hover:text-foreground">
            التمريض المنزلي
          </Link>
        </nav>
      </div>
    </footer>
  );
}

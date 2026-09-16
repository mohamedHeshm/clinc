import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container flex flex-col gap-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">

        <div className="text-center md:text-right">
          <p>
            © {new Date().getFullYear()} Clinic. جميع الحقوق محفوظة.
          </p>

          <p className="mt-2">
            تطوير وتصميم{" "}
            <span className="font-semibold text-foreground">
             المهندس محمد هشام
            </span>
            {" · "}
            <a
              href="https://wa.me/201009712501"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary transition-colors hover:underline"
            >
             انقر للتواصل معي على WhatsApp
            </a>
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-5">
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
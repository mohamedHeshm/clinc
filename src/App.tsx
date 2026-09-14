import { Routes, Route } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ScaffoldPlaceholder } from "@/components/ScaffoldPlaceholder";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { PublicLayout } from "@/layouts/PublicLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { HomePage } from "@/features/home/pages/HomePage";
import { DoctorsPage } from "@/features/doctors/pages/DoctorsPage";
import { DoctorProfilePage } from "@/features/doctors/pages/DoctorProfilePage";
import { NursesPage } from "@/features/nurses/pages/NursesPage";
import { NurseProfilePage } from "@/features/nurses/pages/NurseProfilePage";
import { NursesNearbyPage } from "@/features/nurses/pages/NursesNearbyPage";
import { NursesUrgentPage } from "@/features/nurses/pages/NursesUrgentPage";
import { HowItWorksPage } from "@/features/static/pages/HowItWorksPage";
import { AboutPage } from "@/features/static/pages/AboutPage";
import { DashboardOverviewPage } from "@/features/dashboard/pages/DashboardOverviewPage";
import { MyBookingsPage } from "@/features/bookings/pages/MyBookingsPage";
import { BookingDetailsPage } from "@/features/bookings/pages/BookingDetailsPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { DoctorBookingPage } from "@/features/bookings/doctor-booking/DoctorBookingPage";
import { NurseBookingPage } from "@/features/bookings/nurse-booking/NurseBookingPage";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import { ProviderDashboardOverviewPage } from "@/features/provider/pages/ProviderDashboardOverviewPage";
import { ProviderRequestsPage } from "@/features/provider/pages/ProviderRequestsPage";
import { ProviderCalendarPage } from "@/features/provider/pages/ProviderCalendarPage";
import { ProviderBookingsPage } from "@/features/provider/pages/ProviderBookingsPage";
import { ProviderBookingDetailsPage } from "@/features/provider/pages/ProviderBookingDetailsPage";
import { ProviderAvailabilityPage } from "@/features/provider/pages/ProviderAvailabilityPage";
import { ProviderServicesPage } from "@/features/provider/pages/ProviderServicesPage";
import { ProviderReviewsPage } from "@/features/provider/pages/ProviderReviewsPage";
import { ProviderRevenuePage } from "@/features/provider/pages/ProviderRevenuePage";
import { ProviderProfileEditPage } from "@/features/provider/pages/ProviderProfileEditPage";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminOverviewPage } from "@/features/admin/pages/AdminOverviewPage";
import { AdminDoctorsPage } from "@/features/admin/pages/AdminDoctorsPage";
import { AdminDoctorFormPage } from "@/features/admin/pages/AdminDoctorFormPage";
import { AdminNursesPage } from "@/features/admin/pages/AdminNursesPage";
import { AdminNurseFormPage } from "@/features/admin/pages/AdminNurseFormPage";
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import { AdminUserDetailsPage } from "@/features/admin/pages/AdminUserDetailsPage";
import { AdminServicesPage } from "@/features/admin/pages/AdminServicesPage";
import { AdminBookingsPage } from "@/features/admin/pages/AdminBookingsPage";
import { AdminBookingDetailsPage } from "@/features/admin/pages/AdminBookingDetailsPage";
import { AdminAnalyticsPage } from "@/features/admin/pages/AdminAnalyticsPage";
import { AdminAuditLogPage } from "@/features/admin/pages/AdminAuditLogPage";

/**
 * خريطة المسارات الكاملة كما هي موثّقة في 01-architecture.md.
 * الصفحات العامة (المرحلة 7) حقيقية بالكامل ومتصلة بـ Supabase الآن
 * (تصفح، بحث، فلاتر، تقييمات — كل ذلك من PostgreSQL مباشرة، بدون بيانات وهمية).
 * صفحات لوحات التحكم لسه ScaffoldPlaceholder وستُستبدل في مرحلتها
 * (المراحل 8 وما بعدها)، لكنها محمية فعليًا بـ ProtectedRoute حسب الدور —
 * الحماية الحقيقية غير القابلة للالتفاف عليها مكتملة فعلًا عبر RLS (المرحلة 5).
 */
export default function App() {
  return (
    <Routes>
      {/* الصفحات العامة — بتخطيط Navbar/Footer موحّد */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.doctors} element={<DoctorsPage />} />
        <Route path="/doctors/:id" element={<DoctorProfilePage />} />
        <Route path={ROUTES.nurses} element={<NursesPage />} />
        <Route path="/nurses/:id" element={<NurseProfilePage />} />
        <Route path={ROUTES.nursesNearby} element={<NursesNearbyPage />} />
        <Route path={ROUTES.nursesUrgent} element={<NursesUrgentPage />} />
        <Route path={ROUTES.howItWorks} element={<HowItWorksPage />} />
        <Route path={ROUTES.about} element={<AboutPage />} />
      </Route>

      {/* Authentication — بدون Navbar/Footer، تخطيط مركزي خاص بها */}
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />

      {/* User dashboard — ProtectedRoute(role=USER) + DashboardLayout (Sidebar/Bottom Nav) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.dashboard} element={<DashboardOverviewPage />} />
        <Route path={ROUTES.dashboardBookings} element={<MyBookingsPage />} />
        <Route path="/dashboard/bookings/:id" element={<BookingDetailsPage />} />
        <Route path={ROUTES.dashboardNotifications} element={<NotificationsPage />} />
      </Route>

      {/* الملف الشخصي/الإعدادات — متاحة لكل الأدوار، بدون Sidebar المستخدم تحديدًا */}
      <Route
        path={ROUTES.dashboardProfile}
        element={
          <ProtectedRoute allowedRoles={["USER", "DOCTOR", "NURSE", "ADMIN"]}>
            <PublicLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProfilePage />} />
      </Route>
      <Route
        path={ROUTES.dashboardSettings}
        element={
          <ProtectedRoute allowedRoles={["USER", "DOCTOR", "NURSE", "ADMIN"]}>
            <PublicLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SettingsPage />} />
      </Route>

      <Route
        path="/booking/doctor/:doctorId"
        element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <PublicLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorBookingPage />} />
      </Route>
      <Route
        path="/booking/nurse/:nurseId"
        element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <PublicLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<NurseBookingPage />} />
      </Route>

      {/* Provider dashboard (DOCTOR/NURSE) — ProtectedRoute(role=DOCTOR|NURSE) + ProviderLayout */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["DOCTOR", "NURSE"]}>
            <ProviderLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.providerDashboard} element={<ProviderDashboardOverviewPage />} />
        <Route path={ROUTES.providerRequests} element={<ProviderRequestsPage />} />
        <Route path={ROUTES.providerCalendar} element={<ProviderCalendarPage />} />
        <Route path={ROUTES.providerBookings} element={<ProviderBookingsPage />} />
        <Route path="/provider/bookings/:id" element={<ProviderBookingDetailsPage />} />
        <Route path={ROUTES.providerAvailability} element={<ProviderAvailabilityPage />} />
        <Route path={ROUTES.providerServices} element={<ProviderServicesPage />} />
        <Route path={ROUTES.providerReviews} element={<ProviderReviewsPage />} />
        <Route path={ROUTES.providerRevenue} element={<ProviderRevenuePage />} />
        <Route path={ROUTES.providerProfileEdit} element={<ProviderProfileEditPage />} />
      </Route>

      {/* Admin — ProtectedRoute(role=ADMIN) + AdminLayout */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.admin} element={<AdminOverviewPage />} />
        <Route path={ROUTES.adminDoctors} element={<AdminDoctorsPage />} />
        <Route path={ROUTES.adminDoctorNew} element={<AdminDoctorFormPage />} />
        <Route path="/admin/doctors/:id/edit" element={<AdminDoctorFormPage />} />
        <Route path={ROUTES.adminNurses} element={<AdminNursesPage />} />
        <Route path={ROUTES.adminNurseNew} element={<AdminNurseFormPage />} />
        <Route path="/admin/nurses/:id/edit" element={<AdminNurseFormPage />} />
        <Route path={ROUTES.adminUsers} element={<AdminUsersPage />} />
        <Route path="/admin/users/:id" element={<AdminUserDetailsPage />} />
        <Route path={ROUTES.adminServices} element={<AdminServicesPage />} />
        <Route path={ROUTES.adminBookings} element={<AdminBookingsPage />} />
        <Route path="/admin/bookings/:id" element={<AdminBookingDetailsPage />} />
        <Route path={ROUTES.adminAnalytics} element={<AdminAnalyticsPage />} />
        <Route path={ROUTES.adminAuditLog} element={<AdminAuditLogPage />} />
      </Route>

      <Route path="*" element={<ScaffoldPlaceholder label="الصفحة غير موجودة (404)" />} />
    </Routes>
  );
}

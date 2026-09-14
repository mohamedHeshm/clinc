-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────

-- gen_random_uuid()
create extension if not exists pgcrypto;

-- مطلوبة لعمل EXCLUDE constraint على uuid + tsrange معًا (منع الـ Double Booking)
create extension if not exists btree_gist;

-- ─────────────────────────────────────────────────────────────
-- ENUM Types — يجب أن تطابق src/types/enums.ts تمامًا
-- ─────────────────────────────────────────────────────────────

create type public.user_role as enum ('USER', 'DOCTOR', 'NURSE', 'ADMIN');

create type public.gender_type as enum ('MALE', 'FEMALE');

create type public.provider_kind as enum ('doctor', 'nurse');

create type public.account_status as enum ('active', 'suspended');

-- آلة الحالة الكاملة للحجز (راجع 01-architecture.md §5)
create type public.booking_status as enum (
  'pending',
  'accepted',
  'rejected',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.notification_type as enum (
  'booking_requested',
  'booking_accepted',
  'booking_rejected',
  'booking_confirmed',
  'booking_cancelled',
  'booking_completed',
  'review_available'
);

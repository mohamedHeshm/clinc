alter table public.doctors
  add constraint doctors_clinic_latitude_range check (clinic_latitude is null or clinic_latitude between -90 and 90),
  add constraint doctors_clinic_longitude_range check (clinic_longitude is null or clinic_longitude between -180 and 180);

alter table public.nurses
  add constraint nurses_base_latitude_range check (base_latitude is null or base_latitude between -90 and 90),
  add constraint nurses_base_longitude_range check (base_longitude is null or base_longitude between -180 and 180);

alter table public.profiles
  add column latitude double precision,
  add column longitude double precision,
  add constraint profiles_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint profiles_longitude_range check (longitude is null or longitude between -180 and 180);

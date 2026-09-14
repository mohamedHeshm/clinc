create or replace function public.create_booking(
  p_provider_id uuid,
  p_provider_type public.provider_kind,
  p_service_id uuid,
  p_date date,
  p_start time,
  p_end time,
  p_price numeric,
  p_notes text default null
)
returns public.bookings
language plpgsql
as $$
declare
  new_booking public.bookings;
  booking_price numeric(10, 2);
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول لإتمام الحجز';
  end if;

  if p_date < current_date or (p_date = current_date and p_start <= localtime) then
    raise exception 'لا يمكن حجز موعد في وقت مضى';
  end if;

  if p_provider_type = 'doctor' then
    select consultation_price into booking_price
    from public.doctors
    where id = p_provider_id and is_active;
  else
    select visit_price into booking_price
    from public.nurses
    where id = p_provider_id and is_active;
  end if;

  if booking_price is null then
    raise exception 'مقدّم الخدمة غير متاح حاليًا';
  end if;

  if p_service_id is not null then
    if p_provider_type = 'doctor' then
      select coalesce(ds.price, s.default_price, booking_price) into booking_price
      from public.doctor_services ds
      join public.services s on s.id = ds.service_id and s.is_active
      where ds.doctor_id = p_provider_id and ds.service_id = p_service_id;
    else
      select coalesce(ns.price, s.default_price, booking_price) into booking_price
      from public.nurse_services ns
      join public.services s on s.id = ns.service_id and s.is_active
      where ns.nurse_id = p_provider_id and ns.service_id = p_service_id;
    end if;

    if booking_price is null then
      raise exception 'الخدمة المختارة غير متاحة لدى مقدّم الخدمة';
    end if;
  end if;

  if not exists (
    select 1
    from public.availability a
    where a.provider_id = p_provider_id
      and a.provider_type = p_provider_type
      and a.day_of_week = extract(dow from p_date)
      and a.is_available
      and a.start_time <= p_start
      and a.end_time >= p_end
  ) then
    raise exception 'هذا الموعد خارج أوقات عمل مقدّم الخدمة';
  end if;

  insert into public.bookings (
    patient_id, provider_id, provider_type, service_id,
    booking_date, start_time, end_time, price, notes
  ) values (
    auth.uid(), p_provider_id, p_provider_type, p_service_id,
    p_date, p_start, p_end, booking_price, p_notes
  )
  returning * into new_booking;

  return new_booking;
exception
  when exclusion_violation then
    raise exception 'عذرًا، هذا الموعد لم يعد متاحًا. برجاء اختيار موعد آخر.'
      using errcode = '23P01';
end;
$$;

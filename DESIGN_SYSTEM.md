# Clinic — Design System (المرحلة 6)

مرجع سريع يُستخدم في كل الصفحات القادمة لضمان تناسق التصميم بالكامل.

## الألوان (Design Tokens)

معرّفة في `src/index.css` كمتغيرات CSS، ومربوطة بـ `tailwind.config.ts`:

| الاستخدام | Token | ملاحظة |
|---|---|---|
| خلفية الصفحة | `bg-background` | عاجي هادئ، ليس أبيض خام |
| خلفية البطاقات | `bg-surface` | أبيض نقي |
| خلفية ثانوية (Tabs, Skeleton) | `bg-surface-muted` | رمادي فاتح جدًا |
| اللون الأساسي (أزرار، روابط) | `bg-primary` / `text-primary` | تيل-أزرق طبي عميق |
| لون النجاح/التوفر | `bg-accent` / `text-accent` | أخضر طبي — **استخدام محدود فقط** (توفر، اكتمال) |
| نص أساسي | `text-foreground` | قريب من الأسود، دافئ |
| نص ثانوي | `text-muted-foreground` | رمادي متوسط |
| خطأ | `bg-destructive` / `text-destructive` | أحمر مطفأ، ليس صارخًا |
| تحذير | `text-warning` | كهرماني مطفأ |
| حدود | `border-border` | رمادي فاتح جدًا |

**قاعدة صارمة:** لا تستخدم ألوان Tailwind الافتراضية (`bg-blue-500`, `text-green-600`...) في أي مكان — استخدم الـ tokens أعلاه فقط، حتى يبقى التصميم متناسقًا ومركزيًا.

## الطباعة

- الخط: **IBM Plex Sans Arabic** (محمَّل في `index.html`)، بأوزان 400/500/600/700.
- المقياس مُعرَّف في `tailwind.config.ts` (`text-xs` → `text-4xl`) — لا تستخدم أحجام عشوائية (`text-[15px]`).
- العناوين: `font-semibold` غالبًا، وليس `font-bold` الثقيل إلا للـ Hero.
- **ممنوع:** ALL CAPS للـ labels، تمييز كلمة واحدة بلون مختلف داخل عنوان، إضافة "Eyebrow" فوق كل عنوان.

## المكوّنات الجاهزة (`src/components/ui`)

| المكوّن | الاستخدام |
|---|---|
| `Button` | `variant`: default/outline/ghost/destructive/link — `size`: sm/default/lg/icon |
| `Input`, `Label` | حقول النماذج |
| `Select*` (Radix) | قوائم منسدلة |
| `Card` | تغليف محتوى — **لا تضع كل شيء في Card**، استخدم Layout طبيعي حسب قسم 5 بالمواصفة |
| `Dialog*` | Modals |
| `Badge` | حالات صغيرة — استخدم `BOOKING_STATUS_VARIANT`/`BOOKING_STATUS_LABELS` من `src/constants/booking-status.ts` بدل ما تكتب variant يدويًا |
| `Table*` | جداول (Admin بشكل أساسي) |
| `Calendar` | اختيار تاريخ + عرض حالة الأيام (نقطة ملوّنة) |
| `Tabs*` | تبديل بين "الأطباء" و"التمريض المنزلي" |
| `Avatar*` | صور المستخدمين/الأطباء/الممرضين (مع Fallback بأول حرف من الاسم) |
| `Switch` | تفعيل/تعطيل (مثال: توفر يوم في الجدول) |

## الحالات (`src/components/feedback`)

- `Spinner`, `Skeleton`, `CardSkeleton` — أثناء التحميل.
- `EmptyState` — شاشة فارغة **مع فعل مقترح** (زر/رابط) وليست مجرد جملة.
- `ErrorState` — تشرح المشكلة وتوفّر زر "إعادة المحاولة"، بدون تفاصيل تقنية.

استخدم الثلاثة دايمًا مع أي بيانات من Supabase: `isLoading → Skeleton`, `error → ErrorState`, `data.length === 0 → EmptyState`, غير كده اعرض البيانات.

## مبادئ لا تُخترق في أي مرحلة قادمة

1. لا Gradient مبالغ فيه، لا Glassmorphism، لا Glow.
2. Shadow واحد بس لكل حالة ارتفاع (`shadow-soft` للبطاقات العادية، `shadow-elevated` للـ Modals/Popovers) — مش نفس الـ shadow على كل حاجة بلا تمييز.
3. Border-radius متّسق: `rounded-sm` (6px) للعناصر الصغيرة، الافتراضي (10px) للبطاقات، `rounded-lg` (14px) نادرًا للعناصر الكبيرة — مش كل حاجة `rounded-2xl`.
4. حركة (Animation) محدودة ومقصودة فقط (فتح Modal، Toast) — لا "fade-up" على كل Section.
5. لا تكرار الأيقونات بلا داعٍ، ولا استخدام emoji كعنصر أساسي.

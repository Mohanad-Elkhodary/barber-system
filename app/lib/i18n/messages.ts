// ============================================================
// Arabic translations — Egyptian colloquial
// All user-facing strings in one typed dictionary
// ============================================================

const messages = {
  common: {
    appName: 'STYLE',
    loading: 'جاري التحميل...',
    error: 'حصل خطأ، جرب تاني',
    online: 'متاح',
    offline: 'مش متاح',
    submit: 'تأكيد',
    cancel: 'إلغاء',
    back: 'رجوع',
    close: 'قفل',
  },

  customer: {
    title: 'احجز دورك في STYLE',
    subtitle: 'اختار الحلاق واحجز مكانك — خدمة مميزة بأسلوب راقي',
    selectBarber: 'اختار الحلاق',
    nowServing: 'بيخدم دلوقتي',
    waiting: 'مستنيين',
    person: 'شخص',
    people: 'أشخاص',
    noBarbers: 'مفيش حلاقين متاحين دلوقتي',
    barberOffline: 'الحلاق مش متاح دلوقتي',
    bookNow: 'احجز دورك',
  },

  booking: {
    title: 'احجز دورك',
    name: 'اسمك',
    namePlaceholder: 'اكتب اسمك هنا',
    phone: 'رقم الموبايل',
    phonePlaceholder: '01XXXXXXXXX',
    phoneHint: 'رقم مصري (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)',
    submit: 'احجز دورك',
    submitting: 'جاري الحجز...',
  },

  ticket: {
    title: 'تذكرتك',
    yourNumber: 'رقمك',
    nowServing: 'بيتخدم دلوقتي',
    ahead: 'قبلك',
    person: 'شخص',
    people: 'أشخاص',
    noneAhead: 'مفيش حد قبلك!',
    yourTurn: 'دورك! 🎉',
    statusWaiting: 'مستني',
    statusServing: 'بيتخدم',
    statusDone: 'خلص',
    statusNoShow: 'لم يحضر',
    waitingMessage: 'استنى شوية، هنادي عليك',
    servingMessage: 'دورك دلوقتي! روح للحلاق',
    doneMessage: 'شكراً ليك! نتمنى نشوفك تاني',
  },

  dashboard: {
    title: 'لوحة التحكم',
    welcome: 'أهلاً',
    goOnline: 'ابدأ الشغل',
    goOffline: 'وقّف الشغل',
    queue: 'الطابور',
    emptyQueue: 'مفيش حد في الطابور',
    next: 'التالي',
    done: 'تم',
    noShow: 'لم يحضر',
    currentlyServing: 'بيتخدم دلوقتي',
    noOneServing: 'مفيش حد بيتخدم',
    ticketNumber: 'تذكرة رقم',
    logout: 'تسجيل خروج',
    todayStats: 'إحصائيات اليوم',
    served: 'تم خدمتهم',
    noShows: 'لم يحضروا',
  },

  display: {
    title: 'شاشة العرض',
    nowServing: 'بيتخدم دلوقتي',
    noOneServing: 'مفيش حد بيتخدم',
    waitingCount: 'مستنيين',
  },

  login: {
    title: 'دخول الحلاق',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'example@email.com',
    password: 'كلمة السر',
    passwordPlaceholder: 'كلمة السر',
    submit: 'دخول',
    submitting: 'جاري الدخول...',
    error: 'البريد أو كلمة السر غلط',
  },

  errors: {
    nameRequired: 'لازم تكتب اسمك',
    nameMin: 'الاسم لازم يكون حرفين على الأقل',
    phoneRequired: 'لازم تكتب رقم الموبايل',
    phoneInvalid: 'رقم الموبايل مش صح — لازم يكون 11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015',
    barberRequired: 'لازم تختار حلاق',
    barberOffline: 'الحلاق ده مش متاح دلوقتي',
    duplicatePhone: 'الرقم ده عنده تذكرة شغالة بالفعل',
    rateLimited: 'حجوزات كتير! استنى شوية وجرب تاني',
    serverError: 'حصل مشكلة في السيرفر، جرب تاني',
  },
} as const;

export type Messages = typeof messages;
export default messages;

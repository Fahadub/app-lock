import React, { createContext, useContext, useEffect, useState } from 'react';
import { native } from './native';

export type Lang = 'ar' | 'en';

const ar = {
  appName: 'قفل التطبيقات',
  settings: 'الإعدادات',
  back: 'رجوع',
  cancel: 'إلغاء',
  protectionOn: 'الحماية تعمل',
  protectionOff: 'الحماية متوقفة',
  appsLocked: '{n} تطبيق مقفل',
  noLockedHint: 'شغّل المفتاح بجانب أي تطبيق لقفله',
  permissionsTitle: 'الصلاحيات المطلوبة',
  permissionsNote: 'أكمل الصلاحيات أدناه حتى يعمل القفل فعلياً',
  permUsage: 'الوصول إلى الاستخدام',
  permUsageNote: 'ضرورية لمعرفة التطبيق المفتوح',
  permOverlay: 'العرض فوق التطبيقات',
  permOverlayNote: 'ضرورية لإظهار شاشة القفل',
  permBattery: 'تجاهل تحسينات البطارية',
  permBatteryNote: 'موصى بها لعمل الحماية باستمرار',
  grant: 'تفعيل',
  searchPlaceholder: 'ابحث عن تطبيق…',
  loadingApps: 'جارٍ تحميل التطبيقات…',
  noResults: 'لا توجد نتائج',
  currentMethod: 'طريقة القفل الحالية',
  methodPin: 'رمز رقمي PIN',
  methodPattern: 'نمط الرسم',
  protectionToggle: 'تشغيل الحماية',
  serviceOn: 'الخدمة تعمل في الخلفية',
  serviceOff: 'الخدمة متوقفة',
  infoText:
    'يعمل القفل عبر مراقبة التطبيق المفتوح ثم إظهار شاشة القفل فوقه مباشرة.\nيُعاد القفل تلقائياً عند مغادرة التطبيق أو إطفاء الشاشة.\nعند إعادة تشغيل الهاتف تُستأنف الحماية تلقائياً.\nنسيت الرمز؟ امسح بيانات التطبيق من إعدادات النظام.',
  chooseTitle: 'اختر طريقة القفل',
  chooseTitleChange: 'تغيير طريقة القفل',
  chooseSubtitle: 'يمكنك تغييرها لاحقاً من الإعدادات',
  pinCardTitle: 'رمز رقمي PIN',
  pinCardDesc: 'أرقام من 4 إلى 8 خانات — سريع ومألوف',
  patternCardTitle: 'نمط الرسم',
  patternCardDesc: 'ارسم نمطاً يربط النقاط — أسلس للاستخدام',
  enterPin: 'أدخل رمزاً جديداً',
  confirmPin: 'أعد إدخال الرمز نفسه',
  enterPattern: 'ارسم نمطاً جديداً',
  confirmPattern: 'أعد رسم النمط نفسه',
  lenError: 'الرمز يجب أن يكون من 4 إلى 8 أرقام',
  mismatchPin: 'الرمزان غير متطابقين، أعد الإدخال',
  mismatchPattern: 'النمطان غير متطابقين، أعد الرسم',
  saveFailed: 'تعذّر الحفظ، حاول من جديد',
  next: 'متابعة',
  saveLock: 'حفظ القفل',
  verifyTitle: 'تأكيد الهوية',
  verifyPinHint: 'أدخل رمزك الحالي للمتابعة',
  verifyPatternHint: 'ارسم نمطك الحالي للمتابعة',
  verifyWrong: 'إدخال غير صحيح، حاول مجدداً',
  verifyError: 'حدث خطأ، حاول مجدداً',
  unavailableTitle: 'هذه النسخة تعمل داخل Expo Go',
  unavailableBody:
    'القفل يحتوي كوداً أصلياً (Kotlin) لا يعمل داخل Expo Go.\nللحصول على نسخة كاملة ابنِ APK عبر:\n',
  unavailableBody2: '\nأو نسخة تطوير على جهاز متصل:\n',
};

const en: typeof ar = {
  appName: 'App Lock',
  settings: 'Settings',
  back: 'Back',
  cancel: 'Cancel',
  protectionOn: 'Protection active',
  protectionOff: 'Protection paused',
  appsLocked: '{n} apps locked',
  noLockedHint: 'Use the switch next to any app to lock it',
  permissionsTitle: 'Required permissions',
  permissionsNote: 'Grant the permissions below so locking actually works',
  permUsage: 'Usage access',
  permUsageNote: 'Required to detect the open app',
  permOverlay: 'Display over other apps',
  permOverlayNote: 'Required to show the lock screen',
  permBattery: 'Ignore battery optimization',
  permBatteryNote: 'Recommended so protection keeps running',
  grant: 'Enable',
  searchPlaceholder: 'Search apps…',
  loadingApps: 'Loading apps…',
  noResults: 'No results',
  currentMethod: 'Current lock method',
  methodPin: 'PIN code',
  methodPattern: 'Pattern',
  protectionToggle: 'Protection',
  serviceOn: 'Service running in background',
  serviceOff: 'Service stopped',
  infoText:
    'Locking works by watching the open app and showing the lock screen on top of it.\nApps lock again when you leave them or turn the screen off.\nProtection resumes automatically after phone reboot.\nForgot your code? Clear app data from system settings.',
  chooseTitle: 'Choose a lock method',
  chooseTitleChange: 'Change lock method',
  chooseSubtitle: 'You can change it later in settings',
  pinCardTitle: 'PIN code',
  pinCardDesc: '4 to 8 digits — quick and familiar',
  patternCardTitle: 'Pattern',
  patternCardDesc: 'Connect the dots — smooth to use',
  enterPin: 'Enter a new code',
  confirmPin: 'Re-enter the same code',
  enterPattern: 'Draw a new pattern',
  confirmPattern: 'Redraw the same pattern',
  lenError: 'Code must be 4 to 8 digits',
  mismatchPin: 'Codes do not match, try again',
  mismatchPattern: 'Patterns do not match, try again',
  saveFailed: 'Could not save, try again',
  next: 'Continue',
  saveLock: 'Save lock',
  verifyTitle: 'Confirm identity',
  verifyPinHint: 'Enter your current code to continue',
  verifyPatternHint: 'Draw your current pattern to continue',
  verifyWrong: 'Incorrect, try again',
  verifyError: 'Something went wrong, try again',
  unavailableTitle: 'This build runs inside Expo Go',
  unavailableBody:
    'Locking uses native code (Kotlin) that does not run inside Expo Go.\nFor the full app build an APK with:\n',
  unavailableBody2: '\nor a dev build on a connected device:\n',
};

const dict: Record<Lang, typeof ar> = { ar, en };
export type I18nKey = keyof typeof ar;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: I18nKey) => string;
  rtl: boolean;
  row: 'row-reverse' | 'row';
  align: 'right' | 'left';
}

const defaultCtx: I18nCtx = {
  lang: 'ar',
  setLang: () => {},
  t: k => dict.ar[k],
  rtl: true,
  row: 'row-reverse',
  align: 'right',
};

const I18nContext = createContext<I18nCtx>(defaultCtx);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    native
      ?.getLanguage()
      .then(l => {
        if (l === 'ar' || l === 'en') setLangState(l);
      })
      .catch(() => {});
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    native?.saveLanguage(l).catch(() => {});
  };

  const value: I18nCtx = {
    lang,
    setLang,
    t: k => dict[lang][k],
    rtl: lang === 'ar',
    row: lang === 'ar' ? 'row-reverse' : 'row',
    align: lang === 'ar' ? 'right' : 'left',
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

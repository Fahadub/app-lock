# App Lock

تطبيق أندرويد يقفل أي تطبيق على الهاتف برمز رقمي أو بنمط رسم، ويعمل بالعربية والإنجليزية.

Android app to lock any app on your phone with a PIN or a pattern, in Arabic and English.

## التحميل

حمّل ملف APK من صفحة Releases ثم ثبّته على هاتفك، مع السماح بالتثبيت من مصادر غير معروفة.

## الاستخدام

عند أول تشغيل تختار رمز PIN أو نمط رسم وتأكيده. بعدها تمنح التطبيق ثلاث صلاحيات يطلبها من الشاشة الرئيسية، وتشغّل المفتاح بجانب أي تطبيق تريد قفله.

عند فتح تطبيق مقفل تظهر شاشة القفل فوقه مباشرة، ويعاد القفل تلقائيا عند مغادرة التطبيق أو إطفاء الشاشة. بعد خمس محاولات خاطئة ينتظر التطبيق نصف دقيقة قبل محاولة جديدة.

إذا نسيت الرمز امسح بيانات التطبيق من إعدادات النظام.

ملاحظة لبعض الهواتف مثل شاومي وهواوي وأوبو: فعّل خيار التشغيل التلقائي للتطبيق من إعدادات النظام حتى لا توقف الشركة الخدمة في الخلفية.

## Download

Get the APK from the Releases page and install it on your phone. You may need to allow installs from unknown sources.

## How to use

On first launch pick a PIN or a pattern and confirm it. Grant the three permissions the app asks for, then use the switch next to any app to lock it.

Opening a locked app shows the lock screen on top of it. Apps lock again automatically when you leave them or turn the screen off. After five wrong attempts the app waits thirty seconds.

If you forget your PIN, clear the app data from system settings. On some phones (Xiaomi, Huawei, Oppo and similar) enable autostart for the app so the protection keeps running.

## البناء من المصدر

Build from source:

```
npm install
eas build -p android --profile preview
```

أو بناء محلي: npx expo prebuild -p android ثم gradlew assembleRelease داخل مجلد android.

المشروع مبني ب Expo و React Native مع وحدة أصلية بلغة Kotlin لمراقبة التطبيقات وإظهار شاشة القفل.

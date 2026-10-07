import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { C, card } from '../theme';
import { LockSettings, native } from '../native';
import { GlobeIcon } from '../icons';
import { useI18n } from '../i18n';

export function SettingsScreen({
  settings,
  reload,
  onBack,
  onChangeLock,
}: {
  settings: LockSettings;
  reload: () => void;
  onBack: () => void;
  onChangeLock: () => void;
}) {
  const { t, lang, setLang, row, align } = useI18n();
  const [enabled, setEnabled] = useState(settings.protectionEnabled);
  useEffect(() => setEnabled(settings.protectionEnabled), [settings.protectionEnabled]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: (StatusBar.currentHeight ?? 24) + 8 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: row, alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={onBack} hitSlop={10}>
            <Text style={{ color: C.accent, fontSize: 16, fontWeight: '700' }}>
              {lang === 'ar' ? '← ' : ' '}
              {t('back')}
            </Text>
          </Pressable>
          <Text style={{ flex: 1, color: C.text, fontSize: 22, fontWeight: '800', textAlign: align }}>
            {t('settings')}
          </Text>
          <Pressable
            onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? C.card2 : C.card,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
            })}>
            <GlobeIcon size={16} color={C.accent} />
            <Text style={{ color: C.accent, fontSize: 13, fontWeight: '700', marginHorizontal: 5 }}>
              {lang === 'ar' ? 'EN' : 'ع'}
            </Text>
          </Pressable>
        </View>

        <View style={card}>
          <View style={{ flexDirection: row, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '700', textAlign: align }}>
                {t('protectionToggle')}
              </Text>
              <Text style={{ color: C.sub, fontSize: 12, marginTop: 3, textAlign: align }}>
                {settings.serviceRunning ? t('serviceOn') : t('serviceOff')}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={v => {
                setEnabled(v);
                native!
                  .setProtectionEnabled(v)
                  .then(reload)
                  .catch(() => {});
              }}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={[card, { marginTop: 12 }]}>
          <Text style={{ color: C.sub, fontSize: 13, marginBottom: 6, textAlign: align }}>
            {t('currentMethod')}
          </Text>
          <Text style={{ color: C.text, fontSize: 17, fontWeight: '700', textAlign: align }}>
            {settings.method === 'pattern' ? t('methodPattern') : t('methodPin')}
          </Text>
          <Pressable
            onPress={onChangeLock}
            style={{
              marginTop: 14,
              backgroundColor: C.card2,
              borderWidth: 1,
              borderColor: C.accent,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}>
            <Text style={{ color: C.accent, fontWeight: '700', fontSize: 15 }}>
              {lang === 'ar' ? 'تغيير الرمز / النمط' : 'Change code / pattern'}
            </Text>
          </Pressable>
        </View>

        <View style={[card, { marginTop: 12 }]}>
          <Text style={{ color: C.sub, fontSize: 13, lineHeight: 21, textAlign: align }}>{t('infoText')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

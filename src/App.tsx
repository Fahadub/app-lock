import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, Text, View } from 'react-native';
import { C } from './theme';
import { isNativeAvailable, LockSettings, native } from './native';
import { SetupScreen } from './screens/SetupScreen';
import { VerifyGate } from './screens/VerifyGate';
import { SettingsScreen } from './screens/SettingsScreen';
import { HomeScreen } from './screens/HomeScreen';
import { I18nProvider, useI18n } from './i18n';

function Unavailable() {
  const { t, align } = useI18n();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
      <Text style={{ color: C.text, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
        {t('unavailableTitle')}
      </Text>
      <Text style={{ color: C.sub, fontSize: 14, lineHeight: 22, textAlign: align, marginTop: 16 }}>
        {t('unavailableBody')}
        <Text style={{ color: C.accent }}>npx eas-cli build -p android --profile preview</Text>
        {t('unavailableBody2')}
        <Text style={{ color: C.accent }}>npx expo run:android</Text>
      </Text>
    </ScrollView>
  );
}

function Root() {
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [page, setPage] = useState<'home' | 'settings'>('home');
  const [changeFlow, setChangeFlow] = useState<'none' | 'verify' | 'setup'>('none');

  const load = useCallback(async () => {
    if (!native) return;
    try {
      setSettings(await native.getSettings());
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load, page, changeFlow]);

  let content: React.ReactNode;
  if (!isNativeAvailable || !native) {
    content = <Unavailable />;
  } else if (!settings) {
    content = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  } else if (!settings.hasCredential) {
    content = <SetupScreen mode="initial" onDone={load} />;
  } else if (changeFlow === 'verify') {
    content = (
      <VerifyGate
        settings={settings}
        onVerified={() => setChangeFlow('setup')}
        onCancel={() => setChangeFlow('none')}
      />
    );
  } else if (changeFlow === 'setup') {
    content = (
      <SetupScreen mode="change" onDone={() => setChangeFlow('none')} onCancel={() => setChangeFlow('none')} />
    );
  } else if (page === 'settings') {
    content = (
      <SettingsScreen
        settings={settings}
        reload={load}
        onBack={() => setPage('home')}
        onChangeLock={() => setChangeFlow('verify')}
      />
    );
  } else {
    content = <HomeScreen settings={settings} reload={load} onOpenSettings={() => setPage('settings')} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1020" />
      {content}
    </View>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Root />
    </I18nProvider>
  );
}

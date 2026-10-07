import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, useWindowDimensions, View } from 'react-native';
import { C } from '../theme';
import { Keypad, PinDots } from '../components/Keypad';
import { PatternLock } from '../components/PatternLock';
import { hashSecret, LockSettings } from '../native';
import { useI18n } from '../i18n';

export function VerifyGate({
  settings,
  onVerified,
  onCancel,
}: {
  settings: LockSettings;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const { t, row, align } = useI18n();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [patternError, setPatternError] = useState(false);
  const [busy, setBusy] = useState(false);
  const isPin = settings.method !== 'pattern';
  const { width } = useWindowDimensions();
  const size = Math.min(width - 72, 300);

  const fail = () => {
    setErr(t('verifyWrong'));
    setPin('');
  };

  const patternFail = () => {
    setErr(t('verifyWrong'));
    setPatternError(true);
    setTimeout(() => setPatternError(false), 700);
  };

  const verify = (secret: string) => {
    if (busy) return;
    setBusy(true);
    hashSecret(secret, settings.salt)
      .then(h => {
        if (h === settings.hash) {
          onVerified();
        } else if (isPin) {
          fail();
        } else {
          patternFail();
        }
      })
      .catch(() => setErr(t('verifyError')))
      .finally(() => setBusy(false));
  };

  const onDigit = (d: string) => {
    if (busy || pin.length >= 8) return;
    const next = pin + d;
    setPin(next);
    if (next.length >= settings.pinLength) verify(next);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 24,
        paddingTop: (StatusBar.currentHeight ?? 24) + 32,
        flexGrow: 1,
      }}>
      <View style={{ flexDirection: row, alignItems: 'center', marginBottom: 8 }}>
        <Pressable onPress={onCancel} hitSlop={10}>
          <Text style={{ color: C.accent, fontSize: 15, fontWeight: '700' }}>{t('cancel')}</Text>
        </Pressable>
        <Text style={{ flex: 1, color: C.text, fontSize: 18, fontWeight: '800', textAlign: align }}>
          {t('verifyTitle')}
        </Text>
      </View>
      <Text style={{ color: C.sub, fontSize: 14, textAlign: align, marginBottom: 10 }}>
        {isPin ? t('verifyPinHint') : t('verifyPatternHint')}
      </Text>

      {isPin ? (
        <>
          <PinDots total={settings.pinLength} filled={pin.length} error={!!err} />
          <Keypad onDigit={onDigit} onDelete={() => setPin(p => p.slice(0, -1))} disabled={busy} />
        </>
      ) : (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <PatternLock size={size} error={patternError} onComplete={cells => verify(cells.join(','))} />
        </View>
      )}

      {err ? (
        <Text style={{ color: C.danger, fontSize: 14, textAlign: 'center', marginTop: 12 }}>{err}</Text>
      ) : null}
    </ScrollView>
  );
}

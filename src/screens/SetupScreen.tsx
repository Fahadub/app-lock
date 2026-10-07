import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Crypto from 'expo-crypto';
import { C, card } from '../theme';
import { Keypad, PinDots } from '../components/Keypad';
import { PatternLock } from '../components/PatternLock';
import { hashSecret, LockMethod, native } from '../native';
import { KeypadIcon, PatternIcon } from '../icons';
import { useI18n } from '../i18n';

type Props = {
  mode: 'initial' | 'change';
  onDone: () => void;
  onCancel?: () => void;
};

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 24,
        paddingTop: (StatusBar.currentHeight ?? 24) + 32,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function SetupScreen({ mode, onDone, onCancel }: Props) {
  const { t, lang, row, align } = useI18n();
  const isChange = mode === 'change';
  const [step, setStep] = useState<'choose' | 'enter' | 'confirm'>('choose');
  const [method, setMethod] = useState<LockMethod>('pin');
  const [firstPin, setFirstPin] = useState('');
  const [secondPin, setSecondPin] = useState('');
  const [firstPattern, setFirstPattern] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patternError, setPatternError] = useState(false);
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  const patternSize = Math.min(width - 72, 300);

  const isPin = method === 'pin';
  const inEnter = step === 'enter';
  const pinValue = inEnter ? firstPin : secondPin;

  const title =
    step === 'choose'
      ? isChange
        ? t('chooseTitleChange')
        : t('chooseTitle')
      : step === 'enter'
        ? isPin
          ? t('enterPin')
          : t('enterPattern')
        : isPin
          ? t('confirmPin')
          : t('confirmPattern');

  const save = useCallback(
    async (secret: string, pinLen: number) => {
      if (!native) return;
      setBusy(true);
      try {
        const salt = Crypto.randomUUID();
        const hash = await hashSecret(secret, salt);
        await native.saveCredential(method, salt, hash, pinLen);
        if (!isChange) {
          try {
            await native.setProtectionEnabled(true);
          } catch {}
        }
        onDone();
      } catch {
        setError(t('saveFailed'));
        setBusy(false);
      }
    },
    [method, isChange, onDone, t]
  );

  const onDigit = (d: string) => {
    setError(null);
    if (inEnter) setFirstPin(v => (v.length >= 8 ? v : v + d));
    else setSecondPin(v => (v.length >= 8 ? v : v + d));
  };

  const onDelete = () => {
    if (inEnter) setFirstPin(v => v.slice(0, -1));
    else setSecondPin(v => v.slice(0, -1));
  };

  const submitPin = () => {
    if (inEnter) {
      if (firstPin.length < 4 || firstPin.length > 8) {
        setError(t('lenError'));
        return;
      }
      setError(null);
      setStep('confirm');
    } else {
      if (secondPin !== firstPin) {
        setError(t('mismatchPin'));
        setSecondPin('');
        setStep('enter');
        return;
      }
      save(secondPin, secondPin.length);
    }
  };

  const onPattern = (cells: number[]) => {
    setError(null);
    if (inEnter) {
      setFirstPattern(cells);
      setStep('confirm');
    } else if (firstPattern && cells.join(',') === firstPattern.join(',')) {
      save(cells.join(','), 0);
    } else {
      setError(t('mismatchPattern'));
      setPatternError(true);
      setTimeout(() => setPatternError(false), 700);
    }
  };

  const errorText = error ? (
    <Text style={{ color: C.danger, fontSize: 14, textAlign: 'center', marginBottom: 6 }}>{error}</Text>
  ) : null;

  const cancelLink = onCancel ? (
    <Pressable onPress={onCancel} style={{ marginTop: 14, alignItems: 'center' }} hitSlop={8}>
      <Text style={{ color: C.sub, fontSize: 14 }}>{t('cancel')}</Text>
    </Pressable>
  ) : null;

  const backLink = (toEnter: () => void) => (
    <Pressable onPress={toEnter} style={{ marginTop: 14, alignItems: 'center' }} hitSlop={8}>
      <Text style={{ color: C.sub, fontSize: 14 }}>{t('back')}</Text>
    </Pressable>
  );

  if (step === 'choose') {
    return (
      <Screen>
        <Text style={{ color: C.text, fontSize: 26, fontWeight: '800', textAlign: align }}>{title}</Text>
        <Text style={{ color: C.sub, fontSize: 14, marginTop: 6, marginBottom: 8, textAlign: align }}>
          {t('chooseSubtitle')}
        </Text>
        <Pressable
          onPress={() => {
            setMethod('pin');
            setStep('enter');
            setError(null);
          }}
          style={({ pressed }) => [
            card,
            { marginTop: 12, flexDirection: row, alignItems: 'center', opacity: pressed ? 0.7 : 1 },
          ]}>
          <View style={{ marginHorizontal: 8 }}>
            <KeypadIcon size={34} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '700', textAlign: align }}>
              {t('pinCardTitle')}
            </Text>
            <Text style={{ color: C.sub, fontSize: 13, marginTop: 3, textAlign: align }}>
              {t('pinCardDesc')}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            setMethod('pattern');
            setStep('enter');
            setError(null);
          }}
          style={({ pressed }) => [
            card,
            { marginTop: 12, flexDirection: row, alignItems: 'center', opacity: pressed ? 0.7 : 1 },
          ]}>
          <View style={{ marginHorizontal: 8 }}>
            <PatternIcon size={34} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '700', textAlign: align }}>
              {t('patternCardTitle')}
            </Text>
            <Text style={{ color: C.sub, fontSize: 13, marginTop: 3, textAlign: align }}>
              {t('patternCardDesc')}
            </Text>
          </View>
        </Pressable>
        {cancelLink}
      </Screen>
    );
  }

  if (isPin) {
    return (
      <Screen>
        <Text style={{ color: C.text, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
        <PinDots total={8} filled={pinValue.length} error={!!error} />
        {errorText}
        <Keypad onDigit={onDigit} onDelete={onDelete} disabled={busy} />
        <Pressable
          onPress={submitPin}
          disabled={busy || pinValue.length < 4}
          style={{
            marginTop: 18,
            backgroundColor: busy || pinValue.length < 4 ? C.border : C.accent,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
          }}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
              {inEnter ? t('next') : t('saveLock')}
            </Text>
          )}
        </Pressable>
        {inEnter
          ? isChange
            ? cancelLink
            : null
          : backLink(() => {
              setSecondPin('');
              setStep('enter');
              setError(null);
            })}
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ color: C.text, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
      {errorText}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <PatternLock key={step} size={patternSize} error={patternError} onComplete={onPattern} />
      </View>
      {inEnter
        ? isChange
          ? cancelLink
          : null
        : backLink(() => {
            setStep('enter');
            setError(null);
          })}
    </Screen>
  );
}

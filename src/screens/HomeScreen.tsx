import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { C, card } from '../theme';
import { InstalledApp, LockSettings, native } from '../native';
import { GlobeIcon, PhoneIcon, SearchIcon } from '../icons';
import { useI18n } from '../i18n';

const AppRow = React.memo(function AppRow({
  app,
  locked,
  onToggle,
  row,
  align,
}: {
  app: InstalledApp;
  locked: boolean;
  onToggle: (v: boolean) => void;
  row: 'row-reverse' | 'row';
  align: 'right' | 'left';
}) {
  return (
    <View
      style={{
        flexDirection: row,
        alignItems: 'center',
        backgroundColor: locked ? C.card2 : C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: locked ? C.accent : C.border,
        padding: 12,
        marginBottom: 8,
      }}>
      {app.icon ? (
        <Image
          source={{ uri: `data:image/png;base64,${app.icon}` }}
          style={{ width: 44, height: 44, borderRadius: 11 }}
        />
      ) : (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            backgroundColor: C.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <PhoneIcon size={24} color={C.sub} />
        </View>
      )}
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text numberOfLines={1} style={{ color: C.text, fontSize: 15, fontWeight: '600', textAlign: align }}>
          {app.appName}
        </Text>
        <Text numberOfLines={1} style={{ color: C.sub, fontSize: 11, marginTop: 2, textAlign: align }}>
          {app.packageName}
        </Text>
      </View>
      <Switch
        value={locked}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.accent }}
        thumbColor="#fff"
      />
    </View>
  );
});

function PermRow({
  label,
  note,
  action,
  row,
  align,
}: {
  label: string;
  note?: string;
  action: () => void;
  row: 'row-reverse' | 'row';
  align: 'right' | 'left';
}) {
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', paddingVertical: 10 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontSize: 15, fontWeight: '600', textAlign: align }}>{label}</Text>
        {note ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 2, textAlign: align }}>{note}</Text> : null}
      </View>
      <Pressable
        onPress={action}
        style={{ backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{t('grant')}</Text>
      </Pressable>
    </View>
  );
}

export function HomeScreen({
  settings,
  reload,
  onOpenSettings,
}: {
  settings: LockSettings;
  reload: () => void;
  onOpenSettings: () => void;
}) {
  const { t, lang, setLang, row, align } = useI18n();
  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [locked, setLocked] = useState<Set<string>>(() => new Set(settings.lockedApps));
  const [query, setQuery] = useState('');
  const [perms, setPerms] = useState({ usage: false, overlay: false, battery: false });
  const [enabled, setEnabled] = useState(settings.protectionEnabled);

  useEffect(() => {
    setLocked(new Set(settings.lockedApps));
    setEnabled(settings.protectionEnabled);
  }, [settings.lockedApps, settings.protectionEnabled]);

  useEffect(() => {
    let mounted = true;
    native!
      .getInstalledApps()
      .then(list => {
        if (mounted) setApps(list);
      })
      .catch(() => {
        if (mounted) setApps([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const refreshPerms = useCallback(() => {
    try {
      setPerms({
        usage: native!.hasUsageAccess(),
        overlay: native!.canDrawOverlays(),
        battery: native!.isIgnoringBatteryOptimizations(),
      });
    } catch {}
  }, []);

  useEffect(() => {
    refreshPerms();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshPerms();
        reload();
      }
    });
    return () => sub.remove();
  }, [refreshPerms, reload]);

  const toggleApp = (pkg: string, value: boolean) => {
    const next = new Set(locked);
    if (value) next.add(pkg);
    else next.delete(pkg);
    setLocked(next);
    native!.setLockedApps([...next]).catch(() => {});
  };

  const toggleProtection = (value: boolean) => {
    setEnabled(value);
    native!
      .setProtectionEnabled(value)
      .then(() => reload())
      .catch(() => {});
  };

  const permRows = [
    {
      key: 'usage',
      label: t('permUsage'),
      note: t('permUsageNote'),
      ok: perms.usage,
      action: () => native!.openUsageAccessSettings().catch(() => {}),
    },
    {
      key: 'overlay',
      label: t('permOverlay'),
      note: t('permOverlayNote'),
      ok: perms.overlay,
      action: () => native!.openOverlaySettings().catch(() => {}),
    },
    {
      key: 'battery',
      label: t('permBattery'),
      note: t('permBatteryNote'),
      ok: perms.battery,
      action: () => native!.requestIgnoreBatteryOptimizations().catch(() => {}),
    },
  ];
  const missing = permRows.filter(r => !r.ok);

  const filtered = useMemo(() => {
    if (!apps) return null;
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      a => a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q)
    );
  }, [apps, query]);

  const lockedCount = locked.size;

  const header = (
    <View>
      <View style={{ flexDirection: row, alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ flex: 1, color: C.text, fontSize: 26, fontWeight: '800', textAlign: align }}>
          {t('appName')}
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
            marginHorizontal: 8,
          })}>
          <GlobeIcon size={16} color={C.accent} />
          <Text style={{ color: C.accent, fontSize: 13, fontWeight: '700', marginHorizontal: 5 }}>
            {lang === 'ar' ? 'EN' : 'ع'}
          </Text>
        </Pressable>
        <Pressable onPress={onOpenSettings} hitSlop={10}>
          <Text style={{ color: C.accent, fontSize: 15, fontWeight: '700' }}>{t('settings')}</Text>
        </Pressable>
      </View>

      <View style={card}>
        <View style={{ flexDirection: row, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', textAlign: align }}>
              {enabled ? t('protectionOn') : t('protectionOff')}
            </Text>
            <Text style={{ color: C.sub, fontSize: 13, marginTop: 3, textAlign: align }}>
              {lockedCount > 0 ? t('appsLocked').replace('{n}', String(lockedCount)) : t('noLockedHint')}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggleProtection}
            trackColor={{ false: C.border, true: C.accent }}
            thumbColor="#fff"
          />
        </View>
        {!perms.usage || !perms.overlay ? (
          <Text style={{ color: C.warn, fontSize: 12, marginTop: 10, textAlign: align }}>
            {t('permissionsNote')}
          </Text>
        ) : null}
      </View>

      {missing.length > 0 ? (
        <View style={[card, { marginTop: 12 }]}>
          <Text style={{ color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 4, textAlign: align }}>
            {t('permissionsTitle')}
          </Text>
          {missing.map(r => (
            <PermRow key={r.key} label={r.label} note={r.note} action={r.action} row={row} align={align} />
          ))}
        </View>
      ) : null}

      <View style={[card, { marginTop: 12, padding: 10, flexDirection: row, alignItems: 'center' }]}>
        <View style={{ marginHorizontal: 6 }}>
          <SearchIcon size={18} color={C.sub} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={C.sub}
          style={{ flex: 1, color: C.text, fontSize: 15, textAlign: align, paddingVertical: 6 }}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: (StatusBar.currentHeight ?? 24) + 8 }}>
      <FlatList
        data={filtered ?? []}
        keyExtractor={i => i.packageName}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={
          apps == null ? (
            <View style={{ marginTop: 32, alignItems: 'center' }}>
              <ActivityIndicator color={C.accent} size="large" />
              <Text style={{ color: C.sub, marginTop: 10 }}>{t('loadingApps')}</Text>
            </View>
          ) : (
            <Text style={{ color: C.sub, marginTop: 24, textAlign: 'center' }}>{t('noResults')}</Text>
          )
        }
        renderItem={({ item }) => (
          <AppRow
            app={item}
            locked={locked.has(item.packageName)}
            onToggle={v => toggleApp(item.packageName, v)}
            row={row}
            align={align}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        initialNumToRender={12}
      />
    </View>
  );
}

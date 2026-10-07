import * as Crypto from 'expo-crypto';
import { requireNativeModule } from 'expo';

export type LockMethod = 'pin' | 'pattern';

export interface InstalledApp {
  packageName: string;
  appName: string;
  icon: string | null;
}

export interface LockSettings {
  method: LockMethod | null;
  hasCredential: boolean;
  lockedApps: string[];
  protectionEnabled: boolean;
  serviceRunning: boolean;
  salt: string;
  hash: string | null;
  pinLength: number;
}

interface AppLockModuleType {
  getInstalledApps(): Promise<InstalledApp[]>;
  saveCredential(method: LockMethod, salt: string, hash: string, pinLength: number): Promise<void>;
  getSettings(): Promise<LockSettings>;
  setLockedApps(packages: string[]): Promise<void>;
  setProtectionEnabled(enabled: boolean): Promise<void>;
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): Promise<void>;
  canDrawOverlays(): boolean;
  openOverlaySettings(): Promise<void>;
  isIgnoringBatteryOptimizations(): boolean;
  requestIgnoreBatteryOptimizations(): Promise<boolean>;
  openBatterySettings(): Promise<void>;
  isServiceRunning(): boolean;
  getLanguage(): Promise<string | null>;
  saveLanguage(lang: string): Promise<void>;
}

let nativeModule: AppLockModuleType | null = null;
try {
  nativeModule = requireNativeModule<AppLockModuleType>('AppLock');
} catch {
  nativeModule = null;
}

export const native = nativeModule;
export const isNativeAvailable = nativeModule != null;

/** Must match the Kotlin side: sha256("<secret>|<salt>") */
export function hashSecret(secret: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${secret}|${salt}`);
}

import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'ShakeServiceModule' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const ShakeServiceModule = NativeModules.ShakeServiceModule
  ? NativeModules.ShakeServiceModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export const startShakeService = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  return await ShakeServiceModule.startService();
};

export const stopShakeService = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  return await ShakeServiceModule.stopService();
};

export const isShakeServiceRunning = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  return await ShakeServiceModule.isServiceRunning();
};

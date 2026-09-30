import { NativeModules, Platform } from 'react-native';

const { WidgetStateModule } = NativeModules;

// Notify the home screen widget of the new active goal.
// Fire-and-forget — no-ops on iOS or if the module isn't linked.
export const updateWidget = (goalJson: string): void => {
    if (Platform.OS !== 'android' || !WidgetStateModule) return;
    WidgetStateModule.update(goalJson);
};

import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SoundName =
  | 'create'
  | 'keyTick'
  | 'save'
  | 'priority'
  | 'complete'
  | 'kill'
  | 'restore';

const SOUND_FILES = {
  create: require('../assets/sounds/create.wav'),
  keyTick: require('../assets/sounds/keyTick.wav'),
  save: require('../assets/sounds/save.wav'),
  priority: require('../assets/sounds/priority.wav'),
  complete: require('../assets/sounds/complete.wav'),
  kill: require('../assets/sounds/kill.wav'),
  restore: require('../assets/sounds/restore.wav'),
};

const SOUND_KEY = 'quiet-goals-sound';
let isSoundEnabled = false;

// Initialize sound preference
AsyncStorage.getItem(SOUND_KEY).then((val) => {
  if (val !== null) {
    isSoundEnabled = val === '1';
  }
});

export const getSoundEnabled = () => isSoundEnabled;

export const setSoundEnabled = async (enabled: boolean) => {
  isSoundEnabled = enabled;
  await AsyncStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
};

export const playSound = async (name: SoundName) => {
  if (!isSoundEnabled) return;

  try {
    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[name]);
    await sound.playAsync();
    
    // Cleanup after playing to prevent memory leaks
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.warn(`Failed to play sound ${name}`, error);
  }
};

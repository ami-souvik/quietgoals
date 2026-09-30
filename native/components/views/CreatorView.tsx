import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreatorToolbar } from '../CreatorToolbar';
import { CreatorOverlay } from '../overlay/CreatorOverlay';
import { WallpaperCanvas } from '../WallpaperCanvas';

import { useCreatorStore } from '../CreatorContext';
import { BackButton } from '../action';


export const CreatorView: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setWallpaper, saveWallpaper } = useCreatorStore();

  const handleSetWallpaper = (type: "screen" | "lock" | "both") => {
    setWallpaper(type);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <WallpaperCanvas />
      </View>

      <View style={styles.header}>
        <BackButton />
      </View>

      <View style={[styles.toolbarContainer, { bottom: Math.max(30, insets.bottom + 10) }]}>
        <CreatorOverlay
          handleSetWallpaper={handleSetWallpaper}
        />
        <CreatorToolbar onSave={saveWallpaper} />
      </View>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  headerBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0
  },
});

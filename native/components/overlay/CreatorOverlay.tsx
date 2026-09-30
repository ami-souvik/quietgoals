import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MoodOverlay, LayoutOverlay, FontOverlay, BgOverlay, ApplyOverlay } from '.';
import { useCreatorStore } from '../CreatorContext';

interface CreatorOverlayProps {
  handleSetWallpaper: (type: 'screen' | 'lock' | 'both') => void;
}

export const CreatorOverlay: React.FC<CreatorOverlayProps> = ({
  handleSetWallpaper,
}) => {
  const { activeTool } = useCreatorStore();
  if (activeTool === 'none') return null;

  const renderOverlay = () => {
    switch (activeTool) {
      case 'mood':
        return <MoodOverlay />;
      case 'layout':
        return <LayoutOverlay />;
      case 'font':
        return <FontOverlay />;
      case 'bg':
        return <BgOverlay />;
      default:
        return null;
    }
  }

  return (
    activeTool === 'apply' ?
      <View style={styles.applyOverlay}>
        <ApplyOverlay handleSetWallpaper={handleSetWallpaper} />
      </View> :
      <View style={styles.toolOverlay}>
        {renderOverlay()}
      </View>
  );
};

const styles = StyleSheet.create({
  toolOverlay: {
    alignItems: 'center',
    zIndex: 99
  },
  applyOverlay: {
    alignItems: 'flex-end',
    zIndex: 99
  }
});

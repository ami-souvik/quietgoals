import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Text,
} from 'react-native';
import { getMood } from '../lib/moods';
import { getVariant } from '../lib/variants';
import { useCreatorStore } from './CreatorContext';

export const WallpaperCanvas: React.FC = () => {
  const {
    moodId,
    variantId,
    fontSizeScale,
    isBold,
    backgroundImage,
    activeTool,
    setActiveTool,
    allTasks,
  } = useCreatorStore();

  const { width, height } = Dimensions.get('window');

  const getNativeFont = (moodId: string, isBold: boolean) => {
    switch (moodId) {
      case 'ambitious':
        return isBold ? 'Oswald-Bold' : 'Oswald-Regular';
      case 'grounded':
        return isBold ? 'Grounded-Bold' : 'Grounded-Regular';
      case 'focused':
        return isBold ? 'Focused-Bold' : 'Focused-Regular';
      case 'calm':
      default:
        return isBold ? 'Calm-Bold' : 'Calm-Regular';
    }
  };

  const currentVariant = getVariant(variantId);
  const currentFont = getNativeFont(moodId, isBold);

  const pinnedTasks = allTasks.filter(t => t.isPinned && !t.completed);

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (activeTool !== 'none') {
            setActiveTool('none');
          }
        }}
        style={StyleSheet.absoluteFill}
      >
        <View style={{ position: 'absolute', width, height, backgroundColor: getMood(moodId).bgColor, alignItems: 'center', justifyContent: 'center' }}>
        </View>
        {backgroundImage && <Image source={{ uri: backgroundImage }} width={width} height={height} style={{ position: 'absolute', opacity: 0.4 }} />}
      </TouchableOpacity>

      <View
        pointerEvents="box-none"
        style={[
          styles.floatingInputContainer,
          {
            justifyContent: currentVariant.verticalAlign === 'top' ? 'flex-start' :
              currentVariant.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            paddingTop: currentVariant.verticalAlign === 'top' ? height * 0.15 : 0,
            paddingBottom: currentVariant.verticalAlign === 'bottom' ? height * 0.15 : 0,
          }
        ]}
      >
        {pinnedTasks.length > 0 ? (
          <View style={styles.tasksContainer}>
            {pinnedTasks.map((task, index) => {
              const priorityColors: Record<string, string> = {
                none: 'transparent',
                low: '#3B82F6',
                medium: '#F59E0B',
                high: '#EF4444'
              };
              const priorityColor = task.priority ? priorityColors[task.priority] : 'transparent';
              
              return (
                <View key={task.id} style={[
                  styles.taskRow, 
                  { 
                    backgroundColor: getMood(moodId).textColor + '15', // very subtle glass background
                    alignSelf: currentVariant.textAlign === 'center' ? 'center' : 
                               currentVariant.textAlign === 'right' ? 'flex-end' : 'flex-start'
                  }
                ]}>
                  <View style={[styles.taskCheckbox, { borderColor: getMood(moodId).textColor + '80' }]} />
                  <Text
                    style={[
                      styles.floatingText,
                      {
                        color: getMood(moodId).textColor,
                        fontFamily: currentFont,
                        textTransform: getMood(moodId).uppercase ? 'uppercase' : 'none',
                        fontSize: 24, // Standard font size
                        flexShrink: 1,
                      }
                    ]}
                  >
                    {task.title || task.text}
                  </Text>
                  {priorityColor !== 'transparent' && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: priorityColor, marginLeft: 12, alignSelf: 'center' }} />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <Text
            style={[
              styles.floatingText,
              {
                color: getMood(moodId).textColor + '80', // semi-transparent placeholder
                fontFamily: currentFont,
                textTransform: getMood(moodId).uppercase ? 'uppercase' : 'none',
                fontSize: 24,
                textAlign: currentVariant.textAlign as 'left' | 'center' | 'right',
              }
            ]}
          >
            Pin some tasks to see them here!
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingInputContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 20,
    right: 20,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  tasksContainer: {
    gap: 16,
  },
  floatingText: {
    backgroundColor: 'transparent',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    maxWidth: '100%',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 16,
  },
});

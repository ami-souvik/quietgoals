import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, Text, StatusBar, SectionList, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, CheckCircle2, Circle, Pin, PinOff, Trash2 } from 'lucide-react-native';
import { useCreatorStore } from '../CreatorContext';
import { TodoItem } from '../../lib/storage';
import { PinWarningModal } from '../overlay/PinWarningModal';
import { useTheme, ThemeColors } from '../../lib/theme';

interface HomeViewProps {
  onCreatePress: () => void;
  onSettingsPress: () => void;
}


const SwipeableTaskRow = ({
  item,
  toggleTaskCompletion,
  toggleTaskPin,
  deleteTask,
  openOverlay
}: {
  item: TodoItem,
  toggleTaskCompletion: (id: string) => void,
  toggleTaskPin: (id: string) => void,
  deleteTask: (id: string) => void,
  openOverlay: (task: TodoItem) => void
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpened = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.dx + (isOpened.current ? -80 : 0);
        if (newX > 0) newX = 0;
        if (newX < -120) newX = -120;
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -30 || (isOpened.current && gestureState.dx < 30)) {
          isOpened.current = true;
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        } else {
          isOpened.current = false;
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isOpened.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      }
    })
  ).current;

  return (
    <View style={styles.swipeableContainer}>
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTask(item.id)}>
          <Trash2 size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          styles.taskRow,
          item.completed && styles.taskRowCompleted,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleTaskCompletion(item.id)}
          activeOpacity={0.7}
        >
          {item.completed ? (
            <CheckCircle2 size={24} color={colors.iconInactive} />
          ) : (
            <Circle size={24} color={colors.icon} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1, paddingVertical: 4 }} onPress={() => openOverlay(item)}>
          <Text style={[styles.taskText, item.completed && styles.taskTextCompleted, { flex: undefined }]}>
            {item.text}
          </Text>
        </TouchableOpacity>

        {!item.completed && (
          <TouchableOpacity
            style={[styles.pinButton, item.isPinned && styles.pinButtonActive]}
            onPress={() => toggleTaskPin(item.id)}
          >
            {item.isPinned ? (
              <PinOff size={20} color={colors.icon} />
            ) : (
              <Pin size={20} color={colors.iconInactive} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

export const HomeView: React.FC<HomeViewProps> = ({
  onCreatePress, // We might not need this if QuietButton handles creation
  onSettingsPress
}) => {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const { allTasks, toggleTaskCompletion, toggleTaskPin, deleteTask, openOverlay, isPinWarningVisible, hidePinWarning, handlePinWarningAccept } = useCreatorStore();

  const sections = useMemo(() => {
    // Sort tasks: uncompleted first, then by creation date (newest first)
    const sortedTasks = [...allTasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const grouped = sortedTasks.reduce((acc, task) => {
      const project = task.project || 'Inbox';
      if (!acc[project]) acc[project] = [];
      acc[project].push(task);
      return acc;
    }, {} as Record<string, TodoItem[]>);

    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [allTasks]);

  const renderTask = ({ item }: { item: TodoItem }) => (
    <SwipeableTaskRow
      item={item}
      toggleTaskCompletion={toggleTaskCompletion}
      toggleTaskPin={toggleTaskPin}
      deleteTask={deleteTask}
      openOverlay={openOverlay}
    />
  );

  return (
    <SafeAreaView style={styles.homeContainer}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={onSettingsPress} activeOpacity={0.7}>
          <Settings size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {allTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>All clear.</Text>
            <Text style={styles.emptySubtitle}>Tap + to capture what's on your mind.</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            renderSectionHeader={({ section: { title } }) => {
              const projectColors = colors.projectColors[title] || colors.projectColors['Inbox'];
              return (
                <View style={styles.sectionHeader}>
                  <View style={[styles.projectChip, { backgroundColor: projectColors.bg }]}>
                    <Text style={[styles.projectChipText, { color: projectColors.text }]}>{title}</Text>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
      <PinWarningModal
        visible={isPinWarningVisible}
        onAccept={handlePinWarningAccept}
        onCancel={hidePinWarning}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Calm-Bold',
    color: colors.text,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 5,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for floating button
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  projectChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  projectChipText: {
    fontSize: 12,
    fontFamily: 'Calm-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swipeableContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  deleteActionContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 24,
  },
  deleteButton: {
    padding: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 4,
    elevation: 2,
  },
  taskRowCompleted: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: colors.cardSecondary,
  },
  checkbox: {
    marginRight: 12,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Calm-Regular',
    color: colors.text,
    lineHeight: 22,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  pinButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.pinBg,
    marginLeft: 12,
  },
  pinButtonActive: {
    backgroundColor: colors.pinActiveBg, // highlighted state when pinned
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Calm-Bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Calm-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  }
});

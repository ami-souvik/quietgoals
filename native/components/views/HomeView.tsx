import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, Animated, PanResponder, RefreshControl } from 'react-native';
import { NestableScrollContainer, NestableDraggableFlatList, ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, CheckCircle2, Circle, Pin, PinOff, Trash2, RotateCcw, XCircle } from 'lucide-react-native';
import { useCreatorStore } from '../CreatorContext';
import { TodoItem } from '../../lib/storage';
import { PinWarningModal } from '../overlay/PinWarningModal';
import { useTheme, ThemeColors } from '../../lib/theme';
import { playSound } from '../../lib/sound';

interface HomeViewProps {
  onCreatePress: () => void;
  onSettingsPress: () => void;
}


const TaskRow = ({
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

  const priorityColors: Record<string, string> = {
    none: 'transparent',
    low: '#3B82F6', // blue
    medium: '#F59E0B', // yellow
    high: '#EF4444' // red
  };
  const priorityColor = item.priority ? priorityColors[item.priority] : 'transparent';
  
  const isArchived = item.completed || item.status === 'completed' || item.status === 'killed';

  return (
    <View style={styles.swipeableContainer}>
      <View
        style={[
          styles.taskRow,
          isArchived && styles.taskRowCompleted,
        ]}
      >
        {!isArchived ? (
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleTaskCompletion(item.id)}
            activeOpacity={0.7}
          >
            <Circle size={24} color={colors.icon} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.checkbox, { opacity: 1 }]}>
            {item.status === 'killed' ? (
              <XCircle size={24} color="#ef4444" />
            ) : (
              <CheckCircle2 size={24} color="#10b981" />
            )}
          </View>
        )}

        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 4 }} 
          onPress={() => {
            if (!isArchived) openOverlay(item);
          }}
          disabled={isArchived}
        >
          <Text style={[styles.taskText, isArchived && styles.taskTextCompleted, { flex: undefined }]}>
            {item.title || item.text}
          </Text>
        </TouchableOpacity>
        
        {/* Priority Indicator */}
        {priorityColor !== 'transparent' && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: priorityColor, marginLeft: 8 }} />
        )}

        {isArchived ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 12 }}>
            <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)}>
              <RotateCcw size={20} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
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
      </View>
    </View>
  );
};

export const HomeView: React.FC<HomeViewProps> = ({
  onCreatePress, // We might not need this if QuietButton handles creation
  onSettingsPress
}) => {
  const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
  const {
    allTasks,
    toggleTaskCompletion,
    toggleTaskPin,
    deleteTask,
    reorderTasks,
    openOverlay,
    isPinWarningVisible,
    hidePinWarning,
    handlePinWarningAccept,
    refreshTasks,
    isRefreshing,
  } = useCreatorStore();

  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');

  const visibleTasks = useMemo(() => {
    return allTasks.filter(task => {
        const isArchived = task.status === 'completed' || task.status === 'killed' || task.completed;
        return activeTab === 'archive' ? isArchived : !isArchived;
    }).sort((a, b) => {
        if (a.position && b.position) return a.position.localeCompare(b.position);
        return 0;
    });
  }, [allTasks, activeTab]);

  const onRefresh = async () => {
    playSound('keyTick');
    await refreshTasks();
  };

  const renderTask = ({ item }: { item: TodoItem }) => (
    <TaskRow
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
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('active')} style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('archive')} style={[styles.tabButton, activeTab === 'archive' && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeTab === 'archive' && styles.tabTextActive]}>Archive</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={onSettingsPress} activeOpacity={0.7}>
          <Settings size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <NestableScrollContainer
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
              colors={[colors.text, '#d4af37']}
              progressBackgroundColor={colors.card}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            visibleTasks.length === 0 && styles.listContentEmpty,
          ]}
        >
          {visibleTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {activeTab === 'active' ? 'All clear.' : 'Archive empty.'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'active'
                  ? "Tap + to capture what's on your mind."
                  : 'Completed and killed goals will appear here.'}
              </Text>
            </View>
          ) : (
            <NestableDraggableFlatList
              data={visibleTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item, drag, isActive }) => (
                <ScaleDecorator>
                  <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    delayLongPress={200}
                    activeOpacity={1}
                  >
                    {renderTask({ item })}
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
              onDragEnd={({ data, from, to }) => {
                if (from !== to) {
                  reorderTasks(data, from, to);
                }
              }}
            />
          )}
        </NestableScrollContainer>
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
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tabButton: {
    paddingVertical: 4,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  tabText: {
    fontSize: 24,
    fontFamily: 'Calm-Bold',
    color: colors.textSecondary,
  },
  tabTextActive: {
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
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
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

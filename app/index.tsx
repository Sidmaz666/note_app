import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotes } from '@/hooks/use-notes';
import { useAuth } from '@/hooks/use-auth';
import { LocalNote } from '@/lib/types/note';
import MasonryList from '@react-native-seoul/masonry-list';
import { GestureHandlerRootView, GestureDetector, Gesture, LongPressGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContrastingTextColor, getContrastingSecondaryTextColor } from '@/lib/utils/color-utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const COLUMN_GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - 32 - COLUMN_GAP) / NUM_COLUMNS; // 32 = horizontal padding

export default function NotesScreen() {
  const router = useRouter();
  const { notes, loading, removeNote, search, refresh, reorder } = useNotes();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const { themeColor, getBackgroundColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = getBackgroundColor();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<LocalNote[]>(notes);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      search(searchQuery).then(results => {
        setFilteredNotes(results);
        setIsSearching(false);
      });
    } else {
      setFilteredNotes(notes);
    }
  }, [searchQuery, notes, search]);

  const handleCreateNote = () => {
    router.push('/note/new');
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

  const handleDeleteNote = (noteId: string, noteTitle: string) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${noteTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeNote(noteId),
        },
      ]
    );
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragTranslateX = useSharedValue(0);
  const dragTranslateY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);
  const dragZIndex = useSharedValue(0);
  const lastReorderTime = useRef<number>(0);

  const handleDragStart = useCallback((itemId: string, index: number) => {
    setDraggedItem(itemId);
    setDraggedIndex(index);
    setIsDragActive(true);
    dragScale.value = withSpring(1.05);
    dragOpacity.value = 0.6;
    dragZIndex.value = 1000;
    dragTranslateX.value = 0;
    dragTranslateY.value = 0;
    lastReorderTime.current = Date.now();
  }, [dragScale, dragOpacity, dragZIndex, dragTranslateX, dragTranslateY]);

  const handleDrag = useCallback((newIndex: number) => {
    if (draggedIndex === null || draggedIndex === newIndex || newIndex < 0 || newIndex >= filteredNotes.length) return;
    
    // Throttle reorder calls to avoid too many updates
    const now = Date.now();
    if (now - lastReorderTime.current < 250) return; // Throttle to max 4 updates per second for stability
    lastReorderTime.current = now;
    
    const newOrder = [...filteredNotes];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    
    setFilteredNotes(newOrder);
    setDraggedIndex(newIndex);
    
    // Update the actual notes order
    reorder(newOrder);
  }, [draggedIndex, filteredNotes, reorder]);

  const handleDragEnd = useCallback(() => {
    setIsDragActive(false);
    setDraggedItem(null);
    setDraggedIndex(null);
    dragScale.value = withSpring(1);
    dragOpacity.value = withSpring(1);
    dragZIndex.value = 0;
    dragTranslateX.value = withSpring(0);
    dragTranslateY.value = withSpring(0);
  }, [dragScale, dragOpacity, dragZIndex, dragTranslateX, dragTranslateY]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      height: 40,
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
      borderRadius: 20,
      paddingHorizontal: 16,
      color: isDark ? '#ECEDEE' : '#11181C',
      fontSize: 16,
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: themeColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    notesList: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 100, // Space for FAB
    },
    noteCard: {
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    noteContent: {
      padding: 12,
      flex: 1,
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    noteTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
    },
    deleteButton: {
      padding: 4,
    },
    notePreview: {
      fontSize: 14,
      opacity: 0.7,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#9BA1A6' : '#687076',
      textAlign: 'center',
      marginTop: 16,
    },
  });

  // NoteCard component - separate component to allow hooks
  const NoteCard = React.memo(({ note, index, isDragging, draggedIndex, filteredNotesLength, backgroundColor: bgColor, isDark: darkMode, headerTop, accentColor, onPress, onDelete, onDragStart, onDrag, onDragEnd, cardStyles }: {
    note: LocalNote;
    index: number;
    isDragging: boolean;
    draggedIndex: number | null;
    filteredNotesLength: number;
    backgroundColor: string;
    isDark: boolean;
    headerTop: number;
    accentColor: string;
    onPress: (id: string) => void;
    onDelete: (id: string, title: string) => void;
    onDragStart: (id: string, idx: number) => void;
    onDrag: (idx: number) => void;
    onDragEnd: () => void;
    cardStyles: any;
  }) => {
    const noteColor = note.color || bgColor;
    const textColor = getContrastingTextColor(note.color, darkMode);
    const secondaryTextColor = getContrastingSecondaryTextColor(note.color, darkMode);
    
    // More dynamic height calculation - asymmetrical for short content
    const titleLength = note.title?.length || 0;
    const contentLength = note.content?.length || 0;
    const hasTitle = titleLength > 0;
    const hasContent = contentLength > 0;
    
    // Calculate height more dynamically
    let estimatedHeight = 60; // Base padding and header
    
    if (hasTitle) {
      // Title takes ~2 lines max (with numberOfLines={2})
      estimatedHeight += 48; // ~24px per line * 2
    }
    
    if (hasContent) {
      // Content: calculate actual lines needed (more accurate)
      const charsPerLine = 35; // Approximate characters per line for card width
      const contentLines = Math.ceil(contentLength / charsPerLine);
      const maxContentLines = 6; // Limit preview to 6 lines
      const actualContentLines = Math.min(contentLines, maxContentLines);
      estimatedHeight += actualContentLines * 20; // ~20px per line
    }
    
    // Minimum height for very short notes, but not too high
    const minHeight = hasTitle || hasContent ? 100 : 80;
    const maxHeight = 280; // Max height to prevent huge cards
    const noteHeight = Math.max(minHeight, Math.min(maxHeight, estimatedHeight));

    const itemTranslateX = useSharedValue(0);
    const itemTranslateY = useSharedValue(0);
    const itemScale = useSharedValue(1);
    const itemOpacity = useSharedValue(1);
    const itemZIndex = useSharedValue(0);
    const dragActive = useSharedValue(false);
    const lastUpdateTime = useSharedValue(0);
    
    // Long press gesture to activate drag
    const longPressGesture = Gesture.LongPress()
      .minDuration(250) // Slightly faster for better responsiveness
      .onStart(() => {
        // Activate drag immediately on long press - state persists
        dragActive.value = true;
        runOnJS(onDragStart)(note.id, index);
        itemScale.value = withSpring(1.05);
        itemOpacity.value = withSpring(0.6);
        itemZIndex.value = 1000;
        lastUpdateTime.value = Date.now();
      });
    
    // Pan gesture for dragging - works after long press activates
    const panGesture = Gesture.Pan()
      .onStart(() => {
        // If pan starts and drag is already active from long press, continue
        // Otherwise, activate if movement is significant (fallback)
        if (!dragActive.value) {
          dragActive.value = true;
          runOnJS(onDragStart)(note.id, index);
          itemScale.value = withSpring(1.05);
          itemOpacity.value = withSpring(0.6);
          itemZIndex.value = 1000;
          lastUpdateTime.value = Date.now();
        }
      })
      .onUpdate((event) => {
        // Only process if drag was activated - state check ensures persistence
        if (!dragActive.value) return;
        
        // Keep card following finger smoothly - card follows cursor
        itemTranslateX.value = event.translationX;
        itemTranslateY.value = event.translationY;
        
        // Throttle position calculations to avoid too many updates
        const now = Date.now();
        if (now - lastUpdateTime.value < 200) return; // Update max every 200ms for stability
        lastUpdateTime.value = now;
        
        // Improved position calculation for masonry layout
        const screenX = event.absoluteX;
        const screenY = event.absoluteY;
        const padding = 16;
        const headerHeight = headerTop + 60;
        
        // Calculate which column (0 or 1) - more accurate
        const relativeX = screenX - padding;
        const columnWidth = ITEM_WIDTH + COLUMN_GAP;
        // Use center of column for better accuracy
        let targetColumn = Math.floor((relativeX + ITEM_WIDTH / 2) / columnWidth);
        targetColumn = Math.max(0, Math.min(NUM_COLUMNS - 1, targetColumn));
        
        // Calculate row based on Y position
        const relativeY = screenY - headerHeight;
        if (relativeY < 0) return; // Above header, don't update
        
        // Better row calculation: account for masonry variable heights
        const avgItemHeight = 160; // Average height for masonry
        const rowGap = 12;
        const estimatedRow = Math.max(0, Math.floor(relativeY / (avgItemHeight + rowGap)));
        
        // Calculate target index - ensure it's valid
        let estimatedIndex = estimatedRow * NUM_COLUMNS + targetColumn;
        estimatedIndex = Math.max(0, Math.min(filteredNotesLength - 1, estimatedIndex));
        
        // Only update if index actually changed and is valid
        if (estimatedIndex !== draggedIndex && draggedIndex !== null && estimatedIndex >= 0 && estimatedIndex < filteredNotesLength) {
          runOnJS(onDrag)(estimatedIndex);
        }
      })
      .onEnd(() => {
        if (!dragActive.value) return;
        
        // Release when finger is lifted - card returns to position
        dragActive.value = false;
        runOnJS(onDragEnd)();
        itemScale.value = withSpring(1);
        itemOpacity.value = withSpring(1);
        itemZIndex.value = 0;
        itemTranslateX.value = withSpring(0);
        itemTranslateY.value = withSpring(0);
      })
      .minDistance(5); // Lower threshold for better responsiveness
    
    // Use Simultaneous so both gestures can work together
    // Long press activates drag state, pan handles movement
    const dragGesture = Gesture.Simultaneous(longPressGesture, panGesture);

    const defaultBorderColor = note.color ? note.color : (darkMode ? '#333' : '#e5e5e5');
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: itemTranslateX.value },
        { translateY: itemTranslateY.value },
        { scale: itemScale.value },
      ],
      opacity: itemOpacity.value,
      borderWidth: 1, // Always keep normal border
      borderColor: defaultBorderColor,
      zIndex: itemZIndex.value,
    }));

    return (
      <GestureDetector gesture={dragGesture}>
        <Animated.View
          style={[
            cardStyles.noteCard,
            {
              width: ITEM_WIDTH,
              minHeight: noteHeight,
              backgroundColor: noteColor,
            },
            animatedStyle, // Always apply animated style (will show selection when dragging)
          ]}
        >
          <TouchableOpacity
            onPress={() => !isDragging && onPress(note.id)}
            activeOpacity={0.7}
            style={cardStyles.noteContent}
            disabled={isDragging}
          >
            <View style={cardStyles.noteHeader}>
              <Text style={[cardStyles.noteTitle, { color: textColor }]} numberOfLines={2}>
                {note.title || 'Untitled Note'}
              </Text>
              <TouchableOpacity
                onPress={() => onDelete(note.id, note.title)}
                style={cardStyles.deleteButton}
                disabled={isDragging}
              >
                <Ionicons name="trash-outline" size={16} color={textColor} />
              </TouchableOpacity>
            </View>
            {note.content && (
              <Text style={[cardStyles.notePreview, { color: secondaryTextColor }]} numberOfLines={8}>
                {note.content}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    );
  });

  const renderNote = useCallback(({ item, i }: { item: unknown; i: number }): React.ReactElement => {
    const note = item as LocalNote;
    return (
      <NoteCard
        key={note.id}
        note={note}
        index={i}
        isDragging={draggedItem === note.id}
        draggedIndex={draggedIndex}
        filteredNotesLength={filteredNotes.length}
        backgroundColor={backgroundColor}
        isDark={isDark}
        headerTop={insets.top}
        accentColor={themeColor}
        onPress={handleNotePress}
        onDelete={handleDeleteNote}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        cardStyles={styles}
      />
    );
  }, [draggedItem, draggedIndex, filteredNotes.length, isDark, backgroundColor, insets.top, handleNotePress, handleDeleteNote, handleDragStart, handleDrag, handleDragEnd, styles]);

  if (loading) {
    return (
      <View style={[styles.container, styles.emptyState]}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: backgroundColor }]}>
      <View style={[styles.container, { backgroundColor: backgroundColor }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={handleProfile} style={styles.profileButton}>
            <Ionicons name="menu" size={24} color={isDark ? '#ECEDEE' : '#11181C'} />
          </TouchableOpacity>
        </View>

        <MasonryList
          data={filteredNotes}
          keyExtractor={(item: LocalNote) => item.id}
          numColumns={NUM_COLUMNS}
          renderItem={renderNote}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          onEndReachedThreshold={0.5}
          refreshing={loading}
          onRefresh={refresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={isDark ? '#9BA1A6' : '#687076'} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No notes found' : 'No notes yet\nTap + to create your first note'}
              </Text>
            </View>
          }
        />
        <TouchableOpacity onPress={handleCreateNote} style={[styles.fab, { bottom: insets.bottom + 20 }]} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

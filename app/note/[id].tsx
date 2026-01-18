import { useNotes } from '@/hooks/use-notes';
import { useAppTheme } from '@/hooks/use-app-theme';
import { LocalNote } from '@/lib/types/note';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, Image, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ColorDropdown } from '@/components/color-dropdown';
import { NOTE_COLORS } from '@/components/color-picker';
import { getContrastingTextColor, getContrastingSecondaryTextColor } from '@/lib/utils/color-utils';
import * as ImagePicker from 'expo-image-picker';

export default function NoteEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, editNote, addNote } = useNotes();
  const { themeColor, getBackgroundColor } = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = getBackgroundColor();
  const styles = getStyles(isDark, backgroundColor, themeColor);
  
  const [note, setNote] = useState<LocalNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const backButtonScale = useRef(new Animated.Value(1)).current;

  const isNewNote = id === 'new';

  useEffect(() => {
    if (isNewNote) {
      setNote(null);
      setTitle('');
      setContent('');
      setColor(null);
      setImages([]);
    } else {
      const foundNote = notes.find(n => n.id === id);
      if (foundNote) {
        setNote(foundNote);
        setTitle(foundNote.title);
        setContent(foundNote.content);
        setColor(foundNote.color || null);
        // Extract images from content
        const imageRegex = /\[IMAGE:(data:image\/[^;]+;base64,[^\]]+)\]/g;
        const extractedImages: string[] = [];
        let match;
        while ((match = imageRegex.exec(foundNote.content)) !== null) {
          extractedImages.push(match[1]);
        }
        setImages(extractedImages);
      }
    }
  }, [id, notes, isNewNote]);

  const handleImagePick = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to add images to notes.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          // Create image data URI
          const imageUri = `data:image/${asset.uri.split('.').pop()?.toLowerCase() || 'jpeg'};base64,${asset.base64}`;
          const imageMarker = `[IMAGE:${imageUri}]`;
          
          // Insert image at end of content
          const newContent = content + (content ? '\n\n' : '') + imageMarker;
          setContent(newContent);
          setImages([...images, imageUri]);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to pick image: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Error', 'Note cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      if (isNewNote) {
        const newNote = await addNote(title.trim() || 'Untitled Note', content, color);
        console.log('Note created successfully:', newNote.id);
        // Wait a bit longer to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 200));
        router.replace('/');
      } else if (note) {
        const updated = await editNote(note.id, title.trim() || 'Untitled Note', content, color);
        console.log('Note updated successfully:', updated.id);
        setHasChanges(false);
        // Wait a bit longer to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 200));
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Save error details:', error);
      Alert.alert(
        'Error', 
        `Failed to save note: ${error?.message || 'Unknown error'}\n\nCheck console for details.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackPress = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them?',
        [
          { 
            text: 'Discard', 
            style: 'destructive', 
            onPress: () => {
              // Small delay to ensure smooth animation
              setTimeout(() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }, 50);
            }
          },
          { text: 'Save', onPress: handleSave },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      // Small delay to ensure smooth animation
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }, 50);
    }
  };

  useEffect(() => {
    if (note) {
      const titleChanged = title !== note.title;
      const contentChanged = content !== note.content;
      const colorChanged = color !== (note.color || null);
      setHasChanges(titleChanged || contentChanged || colorChanged);
    } else if (!isNewNote) {
      setHasChanges(false);
    } else {
      setHasChanges(title.trim().length > 0 || content.trim().length > 0);
    }
  }, [title, content, color, note, isNewNote]);

  // Get display title for header
  const getDisplayTitle = () => {
    if (isNewNote) {
      // Don't show "Untitled_n" in header for new notes
      return '';
    }
    return title.trim() || 'Untitled Note';
  };

  // Determine text colors based on background color using contrast calculation
  const textColor = getContrastingTextColor(color, isDark);
  const secondaryTextColor = getContrastingSecondaryTextColor(color, isDark);
  // Placeholder should be slightly less visible than secondary text
  const placeholderColor = color 
    ? (getContrastingTextColor(color, isDark) === '#111827' ? '#6b7280' : '#9ca3af')
    : '#9ca3af';
  
  // Get color preview for header button - same as note color
  const getColorPreview = () => {
    return color || backgroundColor;
  };
  
  // Get icon color for color button based on background
  const getColorButtonIconColor = () => {
    return getContrastingTextColor(color, isDark);
  };

  // Get header background color - same as content body
  const getHeaderBackgroundColor = () => {
    return color || backgroundColor;
  };

  return (
    <View style={[styles.container, { backgroundColor: color || backgroundColor }]}>
      {/* Header - same color as content body */}
      <View style={[styles.header, { backgroundColor: getHeaderBackgroundColor() }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
          <Animated.View style={[{ transform: [{ scale: backButtonScale }] }, styles.iconButtonContainer, { backgroundColor: 'transparent' }]}>
            <Ionicons name="arrow-back" size={20} color={getContrastingTextColor(color, isDark)} />
          </Animated.View>
        </TouchableOpacity>
        {!isNewNote && (
          <Text style={[styles.headerTitle, { color: getContrastingTextColor(color, isDark) }]} numberOfLines={1}>
            {getDisplayTitle()}
          </Text>
        )}
        {isNewNote && <View style={styles.headerTitle} />}
        <View style={styles.headerActions}>
          <ColorDropdown
            selectedColor={color}
            onColorSelect={setColor}
            triggerButton={
              <View style={[styles.colorButton, { backgroundColor: 'transparent' }]}>
                <Ionicons 
                  name="color-palette-outline" 
                  size={20} 
                  color={getContrastingTextColor(color, isDark)} 
                />
              </View>
            }
          />
          <TouchableOpacity
            onPress={handleImagePick}
            style={styles.attachButton}
          >
            <View style={[styles.iconButtonContainer, { backgroundColor: 'transparent' }]}>
              <Ionicons 
                name="attach-outline" 
                size={20} 
                color={getContrastingTextColor(color, isDark)} 
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || (!hasChanges && !isNewNote)}
            style={styles.saveButton}
          >
            <View style={[styles.iconButtonContainer, { backgroundColor: 'transparent' }]}>
              {isSaving ? (
                <ActivityIndicator size="small" color={getContrastingTextColor(color, isDark)} />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={hasChanges || isNewNote ? getContrastingTextColor(color, isDark) : (getContrastingTextColor(color, isDark) === '#111827' ? '#9ca3af' : '#6b7280')}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Editor */}
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: color || backgroundColor }]} 
        contentContainerStyle={styles.scrollContent}
      >
        <TextInput
          style={[styles.titleInput, { color: textColor }]}
          placeholder="Title"
          placeholderTextColor={placeholderColor}
          value={title}
          onChangeText={setTitle}
          multiline
        />
        <TextInput
          style={[styles.contentInput, { color: secondaryTextColor }]}
          placeholder="Start writing..."
          placeholderTextColor={placeholderColor}
          value={content.replace(/\[IMAGE:[^\]]+\]/g, '')}
          onChangeText={(text) => {
            // Preserve images when editing text
            const imageMarkers = content.match(/\[IMAGE:[^\]]+\]/g) || [];
            const newContent = text + (imageMarkers.length > 0 ? '\n\n' + imageMarkers.join('\n\n') : '');
            setContent(newContent);
          }}
          multiline
          textAlignVertical="top"
        />
        {/* Display images */}
        {images.map((imageUri, index) => (
          <Image
            key={`image-${index}`}
            source={{ uri: imageUri }}
            style={styles.contentImage}
            resizeMode="contain"
          />
        ))}
      </ScrollView>

      {hasChanges && (
        <View style={styles.unsavedBanner}>
          <Text style={styles.unsavedText}>
            You have unsaved changes
          </Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (isDark: boolean, backgroundColor: string, themeColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButton: {
    padding: 0,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 400,
  },
  contentImage: {
    width: '100%',
    height: 300,
    marginVertical: 16,
    borderRadius: 8,
  },
  unsavedBanner: {
    backgroundColor: isDark ? '#78350f' : '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#92400e' : '#fde68a',
  },
  unsavedText: {
    fontSize: 12,
    color: isDark ? '#fbbf24' : '#92400e',
  },
});

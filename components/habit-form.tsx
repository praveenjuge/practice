import {
  BottomSheet,
  Button,
  FieldGroup,
  Host,
  Icon,
  ListItem,
  Text,
  TextInput,
  type TextInputRef,
  useNativeState,
} from "@expo/ui";
import {
  type Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { APP_ACCENT_COLOR, HOST_THEME } from "../lib/app-colors";
import { CHEVRON_RIGHT_ICON } from "../lib/native-icons";

import {
  getHabitCategory,
  HABIT_CATEGORIES,
  HABIT_CATEGORY_GROUP_ORDER,
  type HabitCategoryGroup,
  type HabitCategoryId,
  resolveHabitCategoryId,
} from "../shared/habit-categories";

// The habit form for iOS and Android, from universal @expo/ui components:
// a SwiftUI Form on iOS, Material 3 grouped lists on Android.

const SECONDARY = { color: "#8e8e93" };
const CHECKMARK_ICON = Icon.select({
  android: import("@expo/material-symbols/check.xml"),
  ios: "checkmark",
});

export interface HabitFormInput {
  categoryId: HabitCategoryId;
  name: string;
}

interface GroupedCategories {
  categories: (typeof HABIT_CATEGORIES)[number][];
  group: HabitCategoryGroup;
}

interface HabitFormProps {
  autoFocusName?: boolean;
  initialCategoryId?: string | null;
  initialName: string;
  onSavingChange?: (isSaving: boolean) => void;
  onSubmit: (input: HabitFormInput) => Promise<void>;
  onSubmitReady?: (submit: (() => void) | null) => void;
  showSubmitSection?: boolean;
  submitErrorTitle: string;
  submitLabel: string;
}

interface NativeTextInputProps {
  autoFocus?: boolean;
  initialValue: string;
  inputRef?: Ref<TextInputRef>;
  onTextChange: (value: string) => void;
  placeholder: string;
}

function NativeTextInput({
  autoFocus,
  initialValue,
  inputRef,
  onTextChange,
  placeholder,
}: NativeTextInputProps) {
  const text = useNativeState(initialValue);

  return (
    <TextInput
      autoFocus={autoFocus}
      onChangeText={onTextChange}
      placeholder={placeholder}
      ref={inputRef}
      returnKeyType="done"
      value={text}
    />
  );
}

function CategoryOption({
  categoryId,
  isSelected,
  label,
  onSelect,
}: {
  categoryId: HabitCategoryId;
  isSelected: boolean;
  label: string;
  onSelect: (categoryId: HabitCategoryId) => void;
}) {
  const handlePress = useCallback(
    () => onSelect(categoryId),
    [categoryId, onSelect]
  );
  return (
    <ListItem
      onPress={handlePress}
      trailing={
        isSelected ? (
          <Icon color={APP_ACCENT_COLOR} name={CHECKMARK_ICON} size={18} />
        ) : undefined
      }
    >
      {label}
    </ListItem>
  );
}

export function HabitForm({
  autoFocusName,
  initialName,
  initialCategoryId,
  submitErrorTitle,
  submitLabel,
  showSubmitSection = true,
  onSubmitReady,
  onSavingChange,
  onSubmit,
}: HabitFormProps) {
  const [name, setName] = useState(initialName);
  const [selectedCategoryId, setSelectedCategoryId] = useState<HabitCategoryId>(
    resolveHabitCategoryId(initialCategoryId)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputKey, setSearchInputKey] = useState(0);
  const selectedCategory = getHabitCategory(selectedCategoryId);

  const groupedCategories = useMemo<GroupedCategories[]>(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredCategories =
      normalizedQuery.length === 0
        ? HABIT_CATEGORIES
        : HABIT_CATEGORIES.filter(
            (category) =>
              category.label.toLowerCase().includes(normalizedQuery) ||
              category.group.toLowerCase().includes(normalizedQuery)
          );

    return HABIT_CATEGORY_GROUP_ORDER.map((group) => ({
      categories: filteredCategories.filter(
        (category) => category.group === group
      ),
      group,
    })).filter((section) => section.categories.length > 0);
  }, [searchQuery]);

  const openCategorySheet = useCallback(() => {
    setSearchQuery("");
    setSearchInputKey((value) => value + 1);
    setIsCategorySheetOpen(true);
  }, []);

  const closeCategorySheet = useCallback(() => {
    setIsCategorySheetOpen(false);
  }, []);

  const selectCategory = useCallback((categoryId: HabitCategoryId) => {
    setSelectedCategoryId(categoryId);
    setIsCategorySheetOpen(false);
  }, []);

  const nameInputRef = useRef<TextInputRef>(null);

  const handleSubmit = useCallback(async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    // Release keyboard focus first: SwiftUI forms assert if they update rows
    // while a text field inside them is still the first responder.
    const nameInput: TextInputRef | null = nameInputRef.current;
    if (nameInput) {
      nameInput.blur();
    }
    try {
      await onSubmit({ categoryId: selectedCategoryId, name });
    } catch (error) {
      Alert.alert(
        submitErrorTitle,
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, name, onSubmit, selectedCategoryId, submitErrorTitle]);

  useEffect(() => {
    onSavingChange?.(isSaving);
  }, [isSaving, onSavingChange]);

  useEffect(() => {
    onSubmitReady?.(handleSubmit);
    return () => {
      onSubmitReady?.(null);
    };
  }, [handleSubmit, onSubmitReady]);

  return (
    <Host {...HOST_THEME} style={{ flex: 1 }}>
      <FieldGroup>
        <FieldGroup.Section title="Habit">
          <NativeTextInput
            autoFocus={autoFocusName}
            initialValue={initialName}
            inputRef={nameInputRef}
            key={`habit-name-${initialName}`}
            onTextChange={setName}
            placeholder="Habit name"
          />
          <ListItem
            onPress={openCategorySheet}
            trailing={
              <>
                <Text textStyle={SECONDARY}>{selectedCategory.label}</Text>
                <Icon color="#8e8e93" name={CHEVRON_RIGHT_ICON} size={16} />
              </>
            }
          >
            Category
          </ListItem>
        </FieldGroup.Section>
        {showSubmitSection ? (
          <FieldGroup.Section>
            <Button
              disabled={isSaving}
              label={isSaving ? "Saving..." : submitLabel}
              onPress={handleSubmit}
            />
          </FieldGroup.Section>
        ) : null}
      </FieldGroup>
      <BottomSheet
        contentPadding={0}
        isPresented={isCategorySheetOpen}
        onDismiss={closeCategorySheet}
        showDragIndicator
        snapPoints={["half", "full"]}
      >
        <FieldGroup>
          <FieldGroup.Section title="Select Category">
            <NativeTextInput
              initialValue=""
              key={`category-search-${searchInputKey}`}
              onTextChange={setSearchQuery}
              placeholder="Search categories"
            />
          </FieldGroup.Section>
          {groupedCategories.length === 0 ? (
            <FieldGroup.Section>
              <ListItem supportingText="Try a different search term.">
                No categories
              </ListItem>
            </FieldGroup.Section>
          ) : (
            groupedCategories.map((section) => (
              <FieldGroup.Section key={section.group} title={section.group}>
                {section.categories.map((category) => (
                  <CategoryOption
                    categoryId={category.id}
                    isSelected={category.id === selectedCategoryId}
                    key={category.id}
                    label={category.label}
                    onSelect={selectCategory}
                  />
                ))}
              </FieldGroup.Section>
            ))
          )}
        </FieldGroup>
      </BottomSheet>
    </Host>
  );
}

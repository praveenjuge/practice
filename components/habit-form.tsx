import {
  BottomSheet,
  Button,
  FieldGroup,
  Host,
  List,
  ListItem,
  Text,
  TextInput,
  useNativeState,
} from "@expo/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  getHabitCategory,
  HABIT_CATEGORIES,
  HABIT_CATEGORY_GROUP_ORDER,
  type HabitCategoryGroup,
  type HabitCategoryId,
  resolveHabitCategoryId,
} from "./habit-categories";

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
  onTextChange: (value: string) => void;
  placeholder: string;
}

function NativeTextInput({
  autoFocus,
  initialValue,
  onTextChange,
  placeholder,
}: NativeTextInputProps) {
  const text = useNativeState(initialValue);

  return (
    <TextInput
      autoFocus={autoFocus}
      onChangeText={onTextChange}
      placeholder={placeholder}
      returnKeyType="done"
      value={text}
    />
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
      group,
      categories: filteredCategories.filter(
        (category) => category.group === group
      ),
    })).filter((section) => section.categories.length > 0);
  }, [searchQuery]);

  const openCategorySheet = () => {
    setSearchQuery("");
    setSearchInputKey((value) => value + 1);
    setIsCategorySheetOpen(true);
  };

  const closeCategorySheet = () => {
    setIsCategorySheetOpen(false);
  };

  const handleSubmit = useCallback(async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({ name, categoryId: selectedCategoryId });
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
    <Host style={{ flex: 1 }}>
      <FieldGroup>
        <FieldGroup.Section title="Habit">
          <NativeTextInput
            autoFocus={autoFocusName}
            initialValue={initialName}
            key={`habit-name-${initialName}`}
            onTextChange={setName}
            placeholder="Habit name"
          />
          <ListItem
            onPress={openCategorySheet}
            supportingText={selectedCategory.label}
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
        isPresented={isCategorySheetOpen}
        onDismiss={closeCategorySheet}
        showDragIndicator
        snapPoints={["half", "full"]}
      >
        <Host style={{ flex: 1 }}>
          <FieldGroup>
            <FieldGroup.Section title="Select Category">
              <NativeTextInput
                initialValue=""
                key={`category-search-${searchInputKey}`}
                onTextChange={setSearchQuery}
                placeholder="Search categories"
              />
            </FieldGroup.Section>
          </FieldGroup>
          <List>
            {groupedCategories.length === 0 ? (
              <ListItem supportingText="Try a different search term.">
                No categories
              </ListItem>
            ) : (
              groupedCategories.map((section) =>
                section.categories.map((category) => (
                  <ListItem
                    key={category.id}
                    onPress={() => {
                      setSelectedCategoryId(category.id);
                      closeCategorySheet();
                    }}
                    supportingText={section.group}
                    trailing={
                      category.id === selectedCategoryId ? (
                        <Text textStyle={{ color: "#34c759" }}>Selected</Text>
                      ) : undefined
                    }
                  >
                    {category.label}
                  </ListItem>
                ))
              )
            )}
          </List>
        </Host>
      </BottomSheet>
    </Host>
  );
}

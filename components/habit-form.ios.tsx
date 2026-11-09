import {
  BottomSheet,
  Button,
  Group,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
  TextField,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  foregroundStyle,
  presentationDetents,
  presentationDragIndicator,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, PlatformColor } from "react-native";
import {
  getHabitCategory,
  HABIT_CATEGORIES,
  HABIT_CATEGORY_GROUP_ORDER,
  type HabitCategoryGroup,
  type HabitCategoryId,
  resolveHabitCategoryId,
} from "../shared/habit-categories";
import { APP_ACCENT_COLOR, HOST_THEME } from "./app-colors";

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
    <TextField
      autoFocus={autoFocus}
      onTextChange={onTextChange}
      placeholder={placeholder}
      text={text}
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
    <Button modifiers={[tint(PlatformColor("label"))]} onPress={handlePress}>
      <HStack>
        <Text>{label}</Text>
        <Spacer />
        {isSelected ? (
          <Image
            modifiers={[tint(APP_ACCENT_COLOR)]}
            size={16}
            systemName="checkmark"
          />
        ) : null}
      </HStack>
    </Button>
  );
}

export function HabitForm({
  autoFocusName,
  initialName,
  initialCategoryId,
  submitErrorTitle,
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

  const selectCategory = useCallback((categoryId: HabitCategoryId) => {
    setSelectedCategoryId(categoryId);
    setIsCategorySheetOpen(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
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
      <List>
        <Section title="Habit">
          <NativeTextInput
            autoFocus={autoFocusName}
            initialValue={initialName}
            key={`habit-name-${initialName}`}
            onTextChange={setName}
            placeholder="Habit name"
          />
          <Button
            modifiers={[buttonStyle("plain")]}
            onPress={openCategorySheet}
          >
            <HStack>
              <Text
                modifiers={[
                  foregroundStyle({
                    style: "secondary",
                    type: "hierarchical",
                  }),
                ]}
              >
                Category
              </Text>
              <Spacer />
              <HStack spacing={10}>
                <Text>{selectedCategory.label}</Text>
                <Image color="secondary" size={14} systemName="chevron.right" />
              </HStack>
            </HStack>
          </Button>
        </Section>
      </List>
      <BottomSheet
        isPresented={isCategorySheetOpen}
        onIsPresentedChange={setIsCategorySheetOpen}
      >
        <Group
          modifiers={[
            presentationDetents([{ fraction: 0.5 }, "large"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <List>
            <Section title="Select Category">
              <NativeTextInput
                initialValue=""
                key={`category-search-${searchInputKey}`}
                onTextChange={setSearchQuery}
                placeholder="Search categories"
              />
            </Section>
            {groupedCategories.length === 0 ? (
              <Section title="Results">
                <Text>No categories match your search.</Text>
              </Section>
            ) : (
              groupedCategories.map((section) => (
                <Section key={section.group} title={section.group}>
                  {section.categories.map((category) => (
                    <CategoryOption
                      categoryId={category.id}
                      isSelected={category.id === selectedCategoryId}
                      key={category.id}
                      label={category.label}
                      onSelect={selectCategory}
                    />
                  ))}
                </Section>
              ))
            )}
          </List>
        </Group>
      </BottomSheet>
    </Host>
  );
}

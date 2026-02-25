import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, PlatformColor } from "react-native";
import {
  BottomSheet,
  Button,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
  TextField,
} from "@expo/ui/swift-ui";
import {
  getHabitCategory,
  HABIT_CATEGORIES,
  HABIT_CATEGORY_GROUP_ORDER,
  resolveHabitCategoryId,
  type HabitCategoryId,
  type HabitCategoryGroup,
} from "./habit-categories";
import { APP_ACCENT_COLOR } from "./app-colors";

export type HabitFormInput = {
  name: string;
  categoryId: HabitCategoryId;
};

type GroupedCategories = {
  group: HabitCategoryGroup;
  categories: (typeof HABIT_CATEGORIES)[number][];
};

type HabitFormProps = {
  initialName: string;
  initialCategoryId?: string | null;
  submitLabel: string;
  submitErrorTitle: string;
  showSubmitSection?: boolean;
  onSubmitReady?: (submit: (() => void) | null) => void;
  onSavingChange?: (isSaving: boolean) => void;
  onSubmit: (input: HabitFormInput) => Promise<void>;
};

export function HabitForm({
  initialName,
  initialCategoryId,
  submitLabel,
  submitErrorTitle,
  showSubmitSection = true,
  onSubmitReady,
  onSavingChange,
  onSubmit,
}: HabitFormProps) {
  const [name, setName] = useState(initialName);
  const [selectedCategoryId, setSelectedCategoryId] = useState<HabitCategoryId>(
    resolveHabitCategoryId(initialCategoryId),
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
        : HABIT_CATEGORIES.filter((category) => {
            return (
              category.label.toLowerCase().includes(normalizedQuery) ||
              category.group.toLowerCase().includes(normalizedQuery)
            );
          });

    return HABIT_CATEGORY_GROUP_ORDER.map((group) => ({
      group,
      categories: filteredCategories.filter(
        (category) => category.group === group,
      ),
    })).filter((section) => section.categories.length > 0);
  }, [searchQuery]);

  const openCategorySheet = () => {
    setSearchQuery("");
    setSearchInputKey((value) => value + 1);
    setIsCategorySheetOpen(true);
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
        error instanceof Error ? error.message : "Please try again.",
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
    <Host matchContents useViewportSizeMeasurement style={{ flex: 1 }}>
      <List>
        <Section title="Habit">
          <TextField
            key={`habit-name-${initialName}`}
            defaultValue={initialName}
            placeholder="Habit name"
            onChangeText={setName}
          />
          <Button onPress={openCategorySheet}>
            <HStack>
              <Text color="secondary">Category</Text>
              <Spacer />
              <Text color={PlatformColor("systemGreen") as unknown as string}>
                {selectedCategory.label}
              </Text>
            </HStack>
          </Button>
        </Section>
        {showSubmitSection ? (
          <Section title="Actions">
            <Button
              onPress={handleSubmit}
              disabled={isSaving}
              color={APP_ACCENT_COLOR}
            >
              <HStack>
                <Text color={APP_ACCENT_COLOR}>
                  {isSaving ? "Saving..." : submitLabel}
                </Text>
                <Spacer />
              </HStack>
            </Button>
          </Section>
        ) : null}
      </List>
      <BottomSheet
        isOpened={isCategorySheetOpen}
        onIsOpenedChange={setIsCategorySheetOpen}
        presentationDetents={["large"]}
      >
        <List>
          <Section title="Search">
            <TextField
              key={`category-search-${searchInputKey}`}
              defaultValue=""
              placeholder="Search categories"
              onChangeText={setSearchQuery}
            />
          </Section>
          {groupedCategories.length === 0 ? (
            <Section title="Results">
              <Text>No categories match your search.</Text>
            </Section>
          ) : (
            groupedCategories.map((section) => (
              <Section key={section.group} title={section.group}>
                {section.categories.map((category) => {
                  const isSelected = category.id === selectedCategoryId;
                  return (
                    <Button
                      key={category.id}
                      onPress={() => {
                        setSelectedCategoryId(category.id);
                        setIsCategorySheetOpen(false);
                      }}
                    >
                      <HStack>
                        <Text>{category.label}</Text>
                        <Spacer />
                        {isSelected ? (
                          <Image
                            systemName="checkmark.circle.fill"
                            size={16}
                            color="secondary"
                          />
                        ) : null}
                      </HStack>
                    </Button>
                  );
                })}
              </Section>
            ))
          )}
        </List>
      </BottomSheet>
    </Host>
  );
}

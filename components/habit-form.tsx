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
import { APP_ACCENT_COLOR } from "./app-colors";
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
  initialCategoryId?: string | null;
  initialName: string;
  onSavingChange?: (isSaving: boolean) => void;
  onSubmit: (input: HabitFormInput) => Promise<void>;
  onSubmitReady?: (submit: (() => void) | null) => void;
  showSubmitSection?: boolean;
  submitErrorTitle: string;
  submitLabel: string;
}

export function HabitForm({
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
        : HABIT_CATEGORIES.filter((category) => {
            return (
              category.label.toLowerCase().includes(normalizedQuery) ||
              category.group.toLowerCase().includes(normalizedQuery)
            );
          });

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
    <Host matchContents style={{ flex: 1 }} useViewportSizeMeasurement>
      <List>
        <Section title="Habit">
          <TextField
            defaultValue={initialName}
            key={`habit-name-${initialName}`}
            onChangeText={setName}
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
                    type: "hierarchical",
                    style: "secondary",
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
              <TextField
                defaultValue=""
                key={`category-search-${searchInputKey}`}
                onChangeText={setSearchQuery}
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
                  {section.categories.map((category) => {
                    const isSelected = category.id === selectedCategoryId;
                    return (
                      <Button
                        key={category.id}
                        modifiers={[tint(PlatformColor("label"))]}
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
                              modifiers={[tint(APP_ACCENT_COLOR)]}
                              size={16}
                              systemName="checkmark"
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
        </Group>
      </BottomSheet>
    </Host>
  );
}

import {
  View,
  Text,
  Image,
  FlatList,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { format } from "date-fns";
import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import styled from "styled-components/native";
import {
  Container,
  Title,
  DropdownRow,
  DropdownContainer,
  Label,
  AthleteRow,
  AthleteDetailsRow,
  Portrait,
  Input,
  InputRow,
  InputWide,
  InputNarrow,
  InputMedium,
  ModalContent,
  ModalHeader,
  ModalPortrait,
  ModalTitle,
  ModalButtons,
  NoSelectionText,
  ActiveContainer,
  ActiveLabel,
  ActiveCheckbox,
  Checkbox,
  Checkmark,
  PickerContainer,
  PickerHalf,
  colors,
} from "../../styles/globalStyles";

interface Athlete {
  fincode?: number;
  name: string;
  photo?: string;
  birthdate?: string;
  gender?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  groups?: string;
  [key: string]: any; // Allow additional properties from rosters
}

// Interface for season data
interface Season {
  seasonid: number;
  description: string;
  seasonstart: string;
  seasonend: string;
}

const FloatingFilterButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${colors.primary};
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 5px;
  elevation: 8;
  z-index: 100;
`;

const FilterModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

const FilterModalContent = styled.View`
  background-color: ${colors.white};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  max-height: 60%;
`;

const FilterModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.lightGray};
`;

const FilterModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${colors.textPrimary};
`;

const FilterSection = styled.View`
  margin-bottom: 20px;
`;

const FilterLabel = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textSecondary};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AthletesScreen = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const groupOptions = [
    { label: "Select a group...", value: "" },
    { label: "ASS", value: "ASS" },
    { label: "EA", value: "EA" },
    { label: "EB", value: "EB" },
    { label: "PROP", value: "PROP" },
  ];

  // Helper function to generate Supabase storage URL for athlete portraits
  const getPortraitUrl = (fincode: number | string): string | null => {
    if (!fincode) {
      return null;
    }

    // Generate the Supabase storage URL using fincode
    return `https://rxwlwfhytiwzvntpwlyj.supabase.co/storage/v1/object/public/PortraitPics/${fincode}.jpg`;
  };

  // Helper function to add timeout to database calls
  const withTimeout = (
    promise: PromiseLike<any>,
    timeoutMs: number = 30000
  ): Promise<any> => {
    return Promise.race([
      Promise.resolve(promise),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`Database request timed out after ${timeoutMs}ms`)
            ),
          timeoutMs
        )
      ),
    ]);
  };

  // Helper function to handle image errors
  const handleImageError = (fincode: number | string) => {
    const key = fincode?.toString() || "unknown";
    setImageErrors((prev) => new Set([...prev, key]));
  };

  useEffect(() => {
    // Fetch seasons from the database
    const fetchSeasons = async () => {
      setSeasonsLoading(true);
      try {
        const { data, error } = await supabase
          .from("_seasons")
          .select("*")
          .order("seasonid", { ascending: false });

        if (error) {
          console.error("Error fetching seasons:", error);
        } else {
          setSeasons(data || []);
        }
      } catch (err) {
        console.error("Error fetching seasons:", err);
      }
      setSeasonsLoading(false);
    };

    fetchSeasons();
  }, []);

  // Fetch athletes when season or group changes
  useEffect(() => {
    if (selectedSeason && selectedGroup && selectedGroup !== "") {
      fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
    } else {
      setAthletes([]);
      setFilteredAthletes([]);
      setLoading(false);
    }
  }, [selectedSeason, selectedGroup]);

  const fetchAthletesForSeasonAndGroup = async (
    season: string,
    group: string
  ) => {
    // Prevent multiple simultaneous requests
    if (loading) {
      console.log("Request already in progress, skipping...");
      return;
    }

    setLoading(true);
    setError(null);
    setImageErrors(new Set()); // Clear previous image errors

    try {
      // Test basic connection first with timeout
      await withTimeout(
        supabase.from("athletes").select("count"),
        10000 // 10 second timeout for connection test
      );

      // Call the database function get_athletes_with_rosters with timeout
      const { data, error } = await withTimeout(
        supabase.rpc("get_athletes_with_rosters", {
          paramseason: season,
          paramgroups: group,
        }),
        30000 // 30 second timeout for main query
      );

      if (error) {
        console.error("Database error:", error);
        setError(`Database error: ${error.message}`);
        setAthletes([]);
        setFilteredAthletes([]);
        return; // Early return to prevent further processing
      }

      // Check if data exists and is valid
      if (!data) {
        setAthletes([]);
        setFilteredAthletes([]);
        return;
      }

      if (!Array.isArray(data)) {
        console.error("Data is not an array:", data);
        setError("Invalid data format received");
        setAthletes([]);
        setFilteredAthletes([]);
        return;
      }

      // Safely process the data
      const processed = data.map((item: any, index: number) => {
        // Ensure the item has required properties
        const rawGroups = item.groups || item.team || "";
        const normalizedGroups = rawGroups.trim().toUpperCase();

        const processedItem = {
          ...item,
          name: item.name || "Unnamed Athlete",
          fincode: item.fincode || index,
          // Map team field to groups for consistency and normalize the value
          groups: normalizedGroups,
        };

        return processedItem;
      });

      // Sort athletes by name alphabetically with safe comparison
      const sortedAthletes = processed.sort((a: any, b: any) => {
        try {
          const nameA = String(a.name || "");
          const nameB = String(b.name || "");
          return nameA.localeCompare(nameB);
        } catch (sortError) {
          console.error("Error during sorting:", sortError);
          return 0;
        }
      });

      setAthletes(sortedAthletes);
      setFilteredAthletes(sortedAthletes);
    } catch (err: any) {
      console.error("Catch block error:", err);

      // Handle specific error types
      let errorMessage = "Unknown error occurred";
      if (err?.message?.includes("timed out")) {
        errorMessage =
          "Database request timed out. Please check your connection and try again.";
      } else if (err?.message?.includes("network")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err?.code === "PGRST116") {
        errorMessage = "Database function not found. Please contact support.";
      } else if (err?.message) {
        errorMessage = `Error fetching athletes: ${err.message}`;
      }

      setError(errorMessage);
      setAthletes([]);
      setFilteredAthletes([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (athlete: Athlete) => {

    setSelectedAthlete(athlete);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedAthlete(null);
    setModalVisible(false);
  };

  const saveAthlete = async () => {
    if (!selectedAthlete) return;

    try {
      const { error } = await withTimeout(
        supabase
          .from("athletes")
          .update(selectedAthlete)
          .eq("fincode", selectedAthlete.fincode),
        15000 // 15 second timeout for save operation
      );

      if (error) {
        throw error;
      }

      // Refetch data after saving
      if (selectedSeason && selectedGroup && selectedGroup !== "") {
        await fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
      }
      closeModal();
    } catch (error: any) {
      console.error("Error saving athlete:", error);
      const errorMsg = error?.message?.includes("timed out")
        ? "Save operation timed out. Please try again."
        : `Error saving athlete: ${error?.message || "Unknown error"}`;
      setError(errorMsg);
    }
  };

  const deleteAthlete = async () => {
    if (!selectedAthlete) return;

    try {
      const { error } = await withTimeout(
        supabase
          .from("athletes")
          .delete()
          .eq("fincode", selectedAthlete.fincode),
        15000 // 15 second timeout for delete operation
      );

      if (error) {
        throw error;
      }

      // Refetch data after deleting
      if (selectedSeason && selectedGroup && selectedGroup !== "") {
        await fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
      }
      closeModal();
    } catch (error: any) {
      console.error("Error deleting athlete:", error);
      const errorMsg = error?.message?.includes("timed out")
        ? "Delete operation timed out. Please try again."
        : `Error deleting athlete: ${error?.message || "Unknown error"}`;
      setError(errorMsg);
    }
  };

  const renderAthlete = ({ item, index }: { item: Athlete; index: number }) => {
    try {
      // Ensure item exists
      if (!item) {
        return (
          <AthleteRow>
            <Text>Invalid athlete data</Text>
          </AthleteRow>
        );
      }

      const athleteKey = item.fincode?.toString() || item.name || "unknown";
      const hasImageError = imageErrors.has(athleteKey);

      // Get the portrait URL from Supabase storage using fincode
      const photoUrl = item.fincode ? getPortraitUrl(item.fincode) : null;

      // Simple image loading - let React Native handle optimization
      const shouldLoadImage = photoUrl && !hasImageError;

      return (
        <AthleteRow>
          {shouldLoadImage ? (
            <Portrait
              source={{ uri: photoUrl }}
              onLoad={() => {
                // Image loaded successfully
              }}
              onError={(error: any) => {
                const errorMsg = error.nativeEvent?.error || "";
                // Handle various error codes that indicate file doesn't exist
                if (
                  errorMsg.includes("404") ||
                  errorMsg.includes("Not Found") ||
                  errorMsg.includes("400") ||
                  errorMsg.includes("Bad Request") ||
                  errorMsg.includes("Unexpected HTTP code")
                ) {
                  console.log(
                    `Portrait not found in Supabase storage for athlete ${item.name} (fincode: ${item.fincode}). Using default avatar.`
                  );
                } else {
                  console.error(
                    `Failed to load portrait for athlete ${item.name} (${athleteKey}):`,
                    "URL:",
                    photoUrl,
                    "Error:",
                    error.nativeEvent
                  );
                }
                handleImageError(athleteKey);
              }}
            />
          ) : (
            <Portrait source={require("@/assets/images/default-avatar.png")} />
          )}
          <Text>{item.name || "No Name"}</Text>
          <AthleteDetailsRow
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons
              name="list-circle-outline"
              color="#333"
              size={24}
              onPress={() => {
                try {
                  openModal(item);
                } catch (modalError) {
                  console.error("Error opening modal:", modalError);
                }
              }}
            />
          </AthleteDetailsRow>
        </AthleteRow>
      );
    } catch (renderError) {
      console.error("Error rendering athlete:", renderError);
      return (
        <AthleteRow>
          <Text>Error displaying athlete</Text>
        </AthleteRow>
      );
    }
  };

  return (
    <Container>
      {/* Loading and Error States */}
      {seasonsLoading && <Text>Loading seasons...</Text>}
      {loading && selectedSeason && <Text>Loading athletes...</Text>}
      {error && <Text style={{ color: colors.danger }}>{error}</Text>}

      {/* Athletes List */}
      {!loading &&
        !error &&
        selectedSeason &&
        selectedGroup !== "" &&
        Array.isArray(filteredAthletes) &&
        filteredAthletes.length > 0 && (
          <FlatList
            data={filteredAthletes}
            keyExtractor={(item, index) => {
              try {
                if (item && typeof item === "object") {
                  return (
                    item.fincode?.toString() ||
                    item.name?.toString() ||
                    `athlete_${index}`
                  );
                }
                return `athlete_${index}`;
              } catch (keyError) {
                return `athlete_error_${index}`;
              }
            }}
            renderItem={({ item, index }) => renderAthlete({ item, index })}
            removeClippedSubviews={true}
            initialNumToRender={8}
            maxToRenderPerBatch={3}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate height of each row
              offset: 80 * index,
              index,
            })}
          />
        )}

      {/* Empty States */}
      {!loading && !error && selectedSeason === "" && (
        <NoSelectionText>
          Please select a season from the dropdown to view athletes.
        </NoSelectionText>
      )}
      {!loading && !error && selectedSeason && selectedGroup === "" && (
        <NoSelectionText>
          Please select a group from the dropdown to view athletes.
        </NoSelectionText>
      )}
      {!loading &&
        !error &&
        selectedSeason &&
        selectedGroup &&
        selectedGroup !== "" &&
        filteredAthletes.length === 0 && (
          <NoSelectionText>
            No athletes found for the selected season and group combination.
          </NoSelectionText>
        )}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
        transparent={true}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ModalContent>
            {selectedAthlete && (
            <>
              {/* Portrait and Name Header */}
              <ModalHeader>
                {(() => {
                  const athleteKey =
                    selectedAthlete.fincode?.toString() || "unknown";
                  const hasImageError = imageErrors.has(athleteKey);
                  const photoUrl = selectedAthlete.fincode
                    ? getPortraitUrl(selectedAthlete.fincode)
                    : null;
                  const shouldLoadImage = photoUrl && !hasImageError;

                  return shouldLoadImage ? (
                    <ModalPortrait
                      source={{ uri: photoUrl }}
                      onError={(error: any) => {
                        const errorMsg = error.nativeEvent?.error || "";
                        if (
                          errorMsg.includes("404") ||
                          errorMsg.includes("Not Found") ||
                          errorMsg.includes("400") ||
                          errorMsg.includes("Bad Request") ||
                          errorMsg.includes("Unexpected HTTP code")
                        ) {
                          console.log(
                            `Portrait not found in Supabase storage for athlete ${selectedAthlete.name} (fincode: ${selectedAthlete.fincode}). Using default avatar.`
                          );
                        }
                        handleImageError(selectedAthlete.fincode || 0);
                      }}
                    />
                  ) : (
                    <ModalPortrait
                      source={require("@/assets/images/default-avatar.png")}
                    />
                  );
                })()}
                <ModalTitle>{selectedAthlete.name}</ModalTitle>
              </ModalHeader>

              {/* Form Fields */}

              {/* Birthdate and Gender Row */}
              <InputRow>
                <InputWide
                  value={
                    selectedAthlete.birthdate
                      ? format(
                          new Date(selectedAthlete.birthdate),
                          "yyyy-MM-dd"
                        )
                      : ""
                  }
                  onChangeText={(text: string) =>
                    setSelectedAthlete({ ...selectedAthlete, birthdate: text })
                  }
                  placeholder="Birthdate (YYYY-MM-DD)"
                />
                <InputNarrow
                  value={selectedAthlete.gender}
                  onChangeText={(text: string) =>
                    setSelectedAthlete({ ...selectedAthlete, gender: text })
                  }
                  placeholder="Gender"
                />
                <InputMedium
                  value={selectedAthlete.groups}
                  onChangeText={(text: string) =>
                    setSelectedAthlete({ ...selectedAthlete, groups: text })
                  }
                  placeholder="Group"
                />
              </InputRow>
              <Input
                value={selectedAthlete.email}
                onChangeText={(text: string) =>
                  setSelectedAthlete({ ...selectedAthlete, email: text })
                }
                placeholder="Email"
              />
              <Input
                value={selectedAthlete.phone}
                onChangeText={(text: string) =>
                  setSelectedAthlete({ ...selectedAthlete, phone: text })
                }
                placeholder="Phone"
              />

              {/* Removed duplicate Active row here */}
              <ModalButtons>
                <TouchableOpacity
                  onPress={saveAthlete}
                  style={{ marginHorizontal: 8 }}
                >
                  <Ionicons
                    name="save-outline"
                    color={colors.success}
                    size={24}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeModal}
                  style={{ marginHorizontal: 8 }}
                >
                  <Ionicons
                    name="close-circle-outline"
                    color={colors.info}
                    size={26}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={deleteAthlete}
                  style={{ marginHorizontal: 8 }}
                >
                  <Ionicons
                    name="trash-outline"
                    color={colors.danger}
                    size={24}
                  />
                </TouchableOpacity>
              </ModalButtons>
            </>
          )}
          </ModalContent>
        </View>
      </Modal>

      <FloatingFilterButton onPress={() => setFilterModalVisible(true)}>
        <Ionicons name="filter" size={28} color={colors.white} />
      </FloatingFilterButton>

      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <FilterModalOverlay>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setFilterModalVisible(false)}
          />
          <FilterModalContent>
            <FilterModalHeader>
              <FilterModalTitle>Filter Athletes</FilterModalTitle>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </FilterModalHeader>

            <ScrollView>
              <FilterSection>
                <FilterLabel>Season</FilterLabel>
                <Picker
                  selectedValue={selectedSeason}
                  onValueChange={(itemValue) => {
                    setSelectedSeason(itemValue);
                    setFilterModalVisible(false);
                  }}
                  enabled={!seasonsLoading}
                  style={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: 8,
                    color: "#333333",
                  }}
                >
                  <Picker.Item 
                    label="Select a season..." 
                    value="" 
                  />
                  {seasons.map((season) => (
                    <Picker.Item
                      key={season.seasonid}
                      label={season.description}
                      value={season.description}
                    />
                  ))}
                </Picker>
              </FilterSection>

              <FilterSection>
                <FilterLabel>Group</FilterLabel>
                <Picker
                  selectedValue={selectedGroup}
                  onValueChange={(itemValue) => {
                    setSelectedGroup(itemValue);
                    setFilterModalVisible(false);
                  }}
                  enabled={!!selectedSeason && !loading}
                  style={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: 8,
                    color: "#333333",
                  }}
                >
                  {groupOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </FilterSection>
            </ScrollView>
          </FilterModalContent>
        </FilterModalOverlay>
      </Modal>
    </Container>
  );
};

export default AthletesScreen;

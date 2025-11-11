import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../utils/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Container,
  Heading,
  SuccessButton,
  ButtonText,
  colors,
} from "../../styles/globalStyles";
import styled from "styled-components/native";

// Styled components specific to stats
const FilterContainer = styled.View`
  background-color: ${colors.white};
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const FilterRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 15px;
`;

const Label = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.textPrimary};
  width: 80px;
`;

const PickerContainer = styled.View`
  flex: 1;
  background-color: ${colors.lightGray};
  border-radius: 8px;
  margin-left: 10px;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 10px;
`;

// Compact Filter Components
const CompactFilterContainer = styled.View`
  background-color: ${colors.white};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 4;
`;

const CompactFilterGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const CompactFilterItem = styled.View`
  flex: 1;
  min-width: 100px;
  margin-right: 8px;
  margin-bottom: 8px;
`;

const CompactLabel = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textSecondary};
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CustomDropdown = styled.TouchableOpacity`
  background-color: ${colors.lightGray};
  border-radius: 8px;
  padding: 10px 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  border: 1px solid ${colors.border};
`;

const DropdownText = styled.Text`
  font-size: 14px;
  color: ${colors.textPrimary};
  flex: 1;
`;

const DropdownModal = styled(Modal)``;

const DropdownOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const DropdownMenu = styled.View`
  background-color: ${colors.white};
  border-radius: 12px;
  min-width: 200px;
  max-height: 300px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 8px;
  elevation: 8;
`;

const DropdownHeader = styled.View`
  padding: 16px;
  border-bottom: 1px solid ${colors.lightGray};
`;

const DropdownTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.textPrimary};
  text-align: center;
`;

const DropdownItem = styled.TouchableOpacity`
  padding: 12px 16px;
  border-bottom: 1px solid ${colors.lightGray};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const DropdownItemText = styled.Text`
  font-size: 14px;
  color: ${colors.textPrimary};
`;

const FilterButton = styled.TouchableOpacity`
  background-color: ${colors.primary};
  flex-direction: row;
  align-items: center;
  padding-vertical: 12px;
  padding-horizontal: 20px;
  border-radius: 8px;
  flex: 1;
  margin-right: 10px;
  justify-content: center;
`;

const ErrorText = styled.Text`
  color: ${colors.danger};
  font-size: 16px;
  text-align: center;
  margin-vertical: 10px;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 8px;
`;

const TableContainer = styled.View`
  background-color: ${colors.white};
  border-radius: 10px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const TableHeader = styled.View`
  flex-direction: row;
  background-color: ${colors.primary};
  padding-vertical: 12px;
  padding-horizontal: 8px;
`;

const TableHeaderCell = styled.Text`
  flex: 1;
  color: ${colors.white};
  font-weight: bold;
  text-align: center;
  font-size: 12px;
`;

const TableRow = styled.View`
  flex-direction: row;
  background-color: ${colors.white};
  padding-vertical: 8px;
  padding-horizontal: 8px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.lightGray};
  align-items: center;
`;

const TableCell = styled.Text`
  flex: 1;
  color: ${colors.textPrimary};
  text-align: center;
  font-size: 12px;
`;

const PortraitCell = styled.View`
  flex: 1;
  align-items: center;
`;

const Portrait = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${colors.lightGray};
`;

const NoDataContainer = styled.View`
  padding: 40px;
  align-items: center;
`;

const NoDataText = styled.Text`
  color: ${colors.textSecondary};
  font-size: 16px;
  text-align: center;
`;

const SummaryContainer = styled.View`
  margin-top: 20px;
  padding: 15px;
  background-color: ${colors.white};
  border-radius: 10px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const SummaryText = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.textPrimary};
  margin-bottom: 8px;
`;

const NoteText = styled.Text`
  font-size: 14px;
  color: ${colors.textSecondary};
  font-style: italic;
`;

const DataCell = styled.View`
  flex: 3;
  padding-horizontal: 20px;
  justify-content: center;
`;

const AthleteName = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${colors.textPrimary};
  margin-bottom: 5px;
`;

const StatsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const StatItem = styled.Text`
  font-size: 12px;
  color: ${colors.textSecondary};
  flex: 1;
  text-align: center;
`;

const PercentCell = styled.Text`
  flex: 1;
  font-size: 14px;
  font-weight: bold;
  color: ${colors.textPrimary};
  text-align: center;
`;

interface Athlete {
  fincode: number;
  name: string;
  photo?: string;
  presenze: number;
  giustificate: number;
  total_sessions: number;
  percent: number;
}

export default function StatsScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState<string>("2025-26");
  const [typeFilter, setTypeFilter] = useState<string>("Swim");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteGroupFilter, setAthleteGroupFilter] = useState<string>("ASS");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Dropdown data
  const seasonOptions = [
    { label: "2023-24", value: "2023-24" },
    { label: "2024-25", value: "2024-25" },
    { label: "2025-26", value: "2025-26" },
  ];

  const typeOptions = [
    { label: "Swim", value: "Swim" },
    { label: "Gym", value: "Gym" },
  ];

  const groupOptions = [
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

  // Helper function to handle image errors
  const handleImageError = (fincode: number | string) => {
    const key = fincode?.toString() || "unknown";
    setImageErrors((prev) => new Set([...prev, key]));
  };

  // Helper function to clear image errors (for retry)
  const clearImageError = (fincode: number | string) => {
    const key = fincode?.toString() || "unknown";
    setImageErrors((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  // Helper function to clear all image errors
  const clearAllImageErrors = () => {
    setImageErrors(new Set());
  };

  // Export function placeholder for React Native
  const exportToExcel = () => {
    if (athletes.length === 0) {
      Alert.alert("No Data", "No data to export. Please run a filter first.");
      return;
    }

    // In a real React Native app, you would use a library like react-native-fs
    // or expo-file-system to export data
    Alert.alert(
      "Export",
      "Export functionality would be implemented here using react-native-fs or similar library."
    );
  };

  // Fetch attendance summary using the get_attendance_stats_by_season function
  const handleFilter = async () => {
    setLoading(true);
    setError(null);
    // Clear image errors to allow retry
    clearAllImageErrors();

    try {
      // Call the get_attendance_stats_by_season function
      let query = supabase.rpc("get_attendance_stats_by_season", {
        season: season,
        session_type: typeFilter,
        group_name: athleteGroupFilter,
      });

      // Order by percent desc
      query = query.order("percent", { ascending: false });
      const { data, error } = await query;

      if (error) {
        setError(error.message);
        setAthletes([]);
      } else {
        setAthletes(data || []);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setAthletes([]);
    }
    setLoading(false);
  };

  return (
    <Container style={{ backgroundColor: colors.lightGray }}>
      <CompactFilterContainer>
        <CompactFilterGrid>
          <CompactFilterItem style={{ flex: 1, width: '100%', marginRight: 0 }}>
            <CompactLabel>Season</CompactLabel>
            <Picker
              selectedValue={season}
              onValueChange={(itemValue) => setSeason(itemValue)}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 8,
                color: "#333333",
              }}
              itemStyle={{
                height: 44,
                color: "#333333",
              }}
            >
              {seasonOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  style={{ color: "#333333" }}
                />
              ))}
            </Picker>
          </CompactFilterItem>
        </CompactFilterGrid>

        <CompactFilterGrid>
          <CompactFilterItem>
            <CompactLabel>Type</CompactLabel>
            <Picker
              selectedValue={typeFilter}
              onValueChange={(itemValue) => setTypeFilter(itemValue)}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 8,
                color: "#333333",
              }}
              itemStyle={{
                height: 44,
                color: "#333333",
              }}
            >
              {typeOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  style={{ color: "#333333" }}
                />
              ))}
            </Picker>
          </CompactFilterItem>

          <CompactFilterItem style={{ marginRight: 0 }}>
            <CompactLabel>Group</CompactLabel>
            <Picker
              selectedValue={athleteGroupFilter}
              onValueChange={(itemValue) => setAthleteGroupFilter(itemValue)}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 8,
                color: "#333333",
              }}
              itemStyle={{
                height: 44,
                color: "#333333",
              }}
            >
              {groupOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  style={{ color: "#333333" }}
                />
              ))}
            </Picker>
          </CompactFilterItem>
        </CompactFilterGrid>

        <ButtonRow style={{ justifyContent: 'center' }}>
          <TouchableOpacity onPress={handleFilter} disabled={loading}>
            <Ionicons name="filter-outline" size={28} color={colors.info} />
          </TouchableOpacity>
        </ButtonRow>
      </CompactFilterContainer>

      {error && <ErrorText>Error: {error}</ErrorText>}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView>
          <Heading style={{ fontSize: 20, marginBottom: 15 }}>
            Group: {athleteGroupFilter}
          </Heading>

          <TableContainer>
            <TableHeader>
              <TableHeaderCell>Photo</TableHeaderCell>
              <TableHeaderCell>Athlete Data</TableHeaderCell>
              <TableHeaderCell>%</TableHeaderCell>
            </TableHeader>

            {athletes.length === 0 ? (
              <NoDataContainer>
                <NoDataText>
                  No data available for the selected filters
                </NoDataText>
              </NoDataContainer>
            ) : (
              athletes.map((ath, idx) => (
                <TableRow key={ath.fincode || idx}>
                  <PortraitCell>
                    {(() => {
                      const athleteKey = ath.fincode?.toString() || "unknown";
                      const hasImageError = imageErrors.has(athleteKey);

                      // Get the portrait URL from Supabase storage using fincode
                      const photoUrl = ath.fincode
                        ? getPortraitUrl(ath.fincode)
                        : null;

                      // Simple image loading - let React Native handle optimization
                      const shouldLoadImage = photoUrl && !hasImageError;

                      return shouldLoadImage ? (
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
                            }
                            handleImageError(ath.fincode);
                          }}
                        />
                      ) : (
                        <Portrait
                          source={require("@/assets/images/default-avatar.png")}
                        />
                      );
                    })()}
                  </PortraitCell>

                  <DataCell>
                    <AthleteName>{ath.name}</AthleteName>
                    <StatsRow>
                      <StatItem>P: {ath.presenze}</StatItem>
                      <StatItem>J: {ath.giustificate}</StatItem>
                      <StatItem>T: {ath.total_sessions}</StatItem>
                    </StatsRow>
                  </DataCell>

                  <PercentCell>
                    {ath.percent != null ? ath.percent.toFixed(1) + "%" : ""}
                  </PercentCell>
                </TableRow>
              ))
            )}
          </TableContainer>

          {athletes.length > 0 && (
            <SummaryContainer>
              <SummaryText>Showing {athletes.length} athletes</SummaryText>
              <NoteText>
                Note: Attendance percentages are calculated based on total
                sessions in the selected period
              </NoteText>
            </SummaryContainer>
          )}
        </ScrollView>
      )}
    </Container>
  );
}

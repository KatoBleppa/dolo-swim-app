import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { supabase } from "../../utils/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle, Text as SvgText, Line, G } from "react-native-svg";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  Container,
  colors,
  spacing,
  ButtonText,
} from "../../styles/globalStyles";
import styled from "styled-components/native";

interface Athlete {
  fincode: number;
  name: string;
}

interface AttendanceData {
  month: string;
  attendance_percentage: number;
}

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
  flex-direction: column;
  margin-bottom: 16px;
`;

const FilterRow = styled.View`
  flex-direction: row;
  margin-bottom: 12px;
`;

const CompactFilterItem = styled.View`
  flex: 1;
  min-width: 120px;
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
  max-height: 400px;
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

const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 10px;
`;

const ChartButton = styled.TouchableOpacity`
  background-color: ${colors.primary};
  flex-direction: row;
  align-items: center;
  padding-vertical: 12px;
  padding-horizontal: 20px;
  border-radius: 8px;
  flex: 1;
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

const GroupTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${colors.textPrimary};
  text-align: center;
  margin-bottom: 15px;
`;

const NoDataContainer = styled.View`
  padding: 40px;
  align-items: center;
  background-color: ${colors.white};
  border-radius: 10px;
  margin-vertical: 20px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const NoDataText = styled.Text`
  color: ${colors.textSecondary};
  font-size: 16px;
  text-align: center;
`;

const ModalContainer = styled.View`
  flex: 1;
  background-color: ${colors.lightGray};
`;

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: ${colors.white};
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const ModalTitle = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${colors.textPrimary};
  flex: 1;
`;

const CloseButton = styled.TouchableOpacity`
  padding: 4px;
  background-color: ${colors.lightGray};
  border-radius: 15px;
`;

const FullScreenChartScrollView = styled.ScrollView`
  flex: 1;
  background-color: ${colors.white};
  margin: 5px;
  border-radius: 10px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const FullScreenChartSvg = styled(Svg)`
  background-color: #f8f8ff;
  border-radius: 8px;
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
  font-size: 14px;
  color: ${colors.textSecondary};
  margin-bottom: 8px;
`;

const NoteText = styled.Text`
  font-size: 14px;
  color: ${colors.textSecondary};
`;

const BoldText = styled.Text`
  font-weight: bold;
  color: ${colors.textPrimary};
`;

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
  max-height: 80%;
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

function getSeasonMonths(season: string) {
  const result: string[] = [];
  const [startYear, endYear] = season.split("-");

  // Generate months from September of start year to August of end year
  // For '2024-25': Sep 2024 to Aug 2025
  const startYearNum = parseInt(startYear);
  const endYearNum = parseInt("20" + endYear); // Convert '25' to '2025'

  // September to December of start year
  for (let month = 9; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, "0");
    result.push(`${startYearNum}-${monthStr}`);
  }

  // January to August of end year
  for (let month = 1; month <= 8; month++) {
    const monthStr = month.toString().padStart(2, "0");
    result.push(`${endYearNum}-${monthStr}`);
  }

  return result;
}

function getSeasonDisplayText(season: string) {
  const [startYear, endYear] = season.split("-");
  return `Sep ${startYear} – Aug 20${endYear}`;
}

export default function TrendScreen() {
  const [season, setSeason] = useState<string>("2025-26");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedFincode, setSelectedFincode] = useState<"all" | number>("all");
  const [selectedType, setSelectedType] = useState<"Swim" | "Gym">("Swim");
  const [selectedGroup, setSelectedGroup] = useState<
    "all" | "ASS" | "EA" | "EB" | "PROP"
  >("all");
  const [chartData, setChartData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Dropdown modal states
  const [seasonModalVisible, setSeasonModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [athleteModalVisible, setAthleteModalVisible] = useState(false);

  const months = getSeasonMonths(season);

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
    { label: "All", value: "all" },
    { label: "ASS", value: "ASS" },
    { label: "EA", value: "EA" },
    { label: "EB", value: "EB" },
    { label: "PROP", value: "PROP" },
  ];

  const athleteOptions = [
    { label: "Athlete...", value: "all" },
    ...athletes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((a) => ({
        label: `${a.name} (${a.fincode})`,
        value: a.fincode.toString(),
      })),
  ];

  // Custom Dropdown Component
  const CustomDropdownComponent: React.FC<{
    title: string;
    selectedValue: string;
    options: { label: string; value: string }[];
    onSelect: (value: string) => void;
    visible: boolean;
    onClose: () => void;
  }> = ({ title, selectedValue, options, onSelect, visible, onClose }) => (
    <DropdownModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <DropdownOverlay>
        <TouchableOpacity
          style={{ flex: 1, width: "100%" }}
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <TouchableOpacity activeOpacity={1}>
              <DropdownMenu>
                <DropdownHeader>
                  <DropdownTitle>{title}</DropdownTitle>
                </DropdownHeader>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item, index }) => (
                    <DropdownItem
                      onPress={() => {
                        onSelect(item.value);
                        onClose();
                      }}
                      style={{
                        borderBottomWidth: index === options.length - 1 ? 0 : 1,
                      }}
                    >
                      <DropdownItemText>{item.label}</DropdownItemText>
                      {selectedValue === item.value && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </DropdownItem>
                  )}
                />
              </DropdownMenu>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </DropdownOverlay>
    </DropdownModal>
  );

  useEffect(() => {
    const fetchAthletes = async () => {
      if (selectedGroup === "all") {
        setAthletes([]);
        return;
      }

      try {
        const { data, error } = await supabase.rpc(
          "get_athletes_with_rosters",
          {
            paramseason: season,
            paramgroups: selectedGroup,
          }
        );

        if (error) {
          setError(error.message);
        } else {
          setAthletes(data || []);
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    };

    fetchAthletes();
  }, [selectedGroup, season]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);

      if (selectedFincode === "all") {
        setChartData([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_monthly_attendance_percentage",
        {
          fincode_input: selectedFincode,
          season_input: season,
          session_type_input: selectedType,
        }
      );

      if (error) {
        setError(error.message);
        setChartData([]);
      } else {
        setChartData(data || []);
      }
      setLoading(false);
    };

    fetchAttendanceData();
  }, [selectedFincode, selectedType, season]);

  // Export function placeholder for React Native
  const exportToExcel = () => {
    if (chartData.length === 0) {
      Alert.alert(
        "No Data",
        "No data to export. Please select an athlete and run the trend analysis first."
      );
      return;
    }

    // In a real React Native app, you would use a library like react-native-fs
    // or expo-file-system to export data
    Alert.alert(
      "Export",
      "Export functionality would be implemented here using react-native-fs or similar library."
    );
  };

  // Function to open chart modal and set landscape orientation
  const openChartModal = async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      setShowChartModal(true);
    } catch (error) {
      console.log("Could not change orientation:", error);
      setShowChartModal(true); // Show modal anyway even if orientation change fails
    }
  };

  // Function to close chart modal and reset orientation
  const closeChartModal = async () => {
    try {
      setShowChartModal(false);
      await ScreenOrientation.unlockAsync();
    } catch (error) {
      console.log("Could not reset orientation:", error);
      setShowChartModal(false); // Close modal anyway
    }
  };

  // Chart dimensions for line chart
  const chartTopPadding = 24;
  const chartHeight = 220;
  const pointSpacing = 60;
  const chartPadding = 40;
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.max(
    screenWidth - 40,
    (months.length - 1) * pointSpacing + 2 * chartPadding
  );

  return (
    <Container style={{ backgroundColor: colors.lightGray }}>
      <ScrollView style={{ padding: 20 }}>

        {error && <ErrorText>Error: {error}</ErrorText>}

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            <GroupTitle>
              Athlete:{" "}
              {selectedFincode === "all"
                ? "Athlete..."
                : athletes.find((a) => a.fincode === selectedFincode)?.name ||
                  "Unknown"}
            </GroupTitle>

            {selectedFincode === "all" && (
              <NoDataContainer>
                <NoDataText>
                  Please select an athlete to view their attendance trend
                </NoDataText>
              </NoDataContainer>
            )}

            {/* Full Screen Chart Modal */}
            <Modal
              visible={showChartModal}
              animationType="slide"
              presentationStyle="fullScreen"
              onRequestClose={closeChartModal}
            >
              <ModalContainer>
                <ModalHeader>
                  <ModalTitle>
                    {athletes.find((a) => a.fincode === selectedFincode)?.name}{" "}
                    - {selectedType} Attendance
                  </ModalTitle>
                  <CloseButton onPress={closeChartModal}>
                    <Ionicons name="close" size={24} color="#333" />
                  </CloseButton>
                </ModalHeader>

                <FullScreenChartScrollView
                  horizontal
                  contentContainerStyle={{
                    paddingVertical: 5,
                    paddingHorizontal: 5,
                  }}
                  showsHorizontalScrollIndicator={true}
                >
                  <FullScreenChartSvg
                    width={Math.max(
                      Dimensions.get("window").height - 20,
                      months.length * 50 + 140
                    )} // Increased width for better label space
                    height={Dimensions.get("window").width - 60} // Reduced height for shorter header
                  >
                    {(() => {
                      // Calculate responsive dimensions for mobile landscape
                      const screenHeight = Dimensions.get("window").width - 60; // Less space taken by header
                      const screenWidth = Math.max(
                        Dimensions.get("window").height - 20,
                        months.length * 50 + 140
                      );
                      const leftPadding = 55; // Reduced padding to move chart left
                      const rightPadding = 20;
                      const topPadding = 40; // Space for value labels above points
                      const bottomPadding = 60; // Space for month labels

                      // Reduce chart height so Y-axis labels are closer together
                      const maxChartHeight = 180; // Compact height for mobile landscape
                      const availableHeight =
                        screenHeight - topPadding - bottomPadding;
                      const chartHeight = Math.min(
                        maxChartHeight,
                        availableHeight
                      );
                      const chartWidth =
                        screenWidth - leftPadding - rightPadding;
                      const pointSpacing =
                        chartWidth / Math.max(months.length - 1, 1);

                      return (
                        <G>
                          {/* Y axis grid lines and labels */}
                          {[0, 20, 40, 60, 80, 100].map((y) => {
                            const yPosition =
                              topPadding +
                              chartHeight -
                              (y / 100) * chartHeight;
                            return (
                              <G key={y}>
                                {/* Grid line */}
                                <Line
                                  x1={leftPadding}
                                  x2={leftPadding + chartWidth}
                                  y1={yPosition}
                                  y2={yPosition}
                                  stroke={y === 0 ? "#999" : "#ddd"}
                                  strokeWidth={y === 0 ? 2 : 1}
                                />
                                {/* Y-axis label */}
                                <SvgText
                                  x={leftPadding - 15} // Adjusted for reduced left padding
                                  y={yPosition + 4}
                                  fontSize={16} // Slightly larger font
                                  textAnchor="end"
                                  fill="#333"
                                  fontWeight="bold"
                                >
                                  {y}%
                                </SvgText>
                              </G>
                            );
                          })}

                          {/* X axis line */}
                          <Line
                            x1={leftPadding}
                            x2={leftPadding + chartWidth}
                            y1={topPadding + chartHeight}
                            y2={topPadding + chartHeight}
                            stroke="#999"
                            strokeWidth={2}
                          />

                          {/* Data points, lines, and labels */}
                          {months.map((month, i) => {
                            const data = chartData.find(
                              (cd) => cd.month === month
                            );
                            const value = data?.attendance_percentage || 0;
                            const pointColor =
                              value >= 80 ? "#4caf50" : "#f44336";

                            const x = leftPadding + i * pointSpacing;
                            const y =
                              topPadding +
                              chartHeight -
                              (value / 100) * chartHeight;

                            return (
                              <G key={month}>
                                {/* Line to next point */}
                                {i < months.length - 1 &&
                                  (() => {
                                    const nextData = chartData.find(
                                      (cd) => cd.month === months[i + 1]
                                    );
                                    const nextValue =
                                      nextData?.attendance_percentage || 0;
                                    const nextX =
                                      leftPadding + (i + 1) * pointSpacing;
                                    const nextY =
                                      topPadding +
                                      chartHeight -
                                      (nextValue / 100) * chartHeight;

                                    return (
                                      <Line
                                        x1={x}
                                        y1={y}
                                        x2={nextX}
                                        y2={nextY}
                                        stroke="#666"
                                        strokeWidth={3}
                                      />
                                    );
                                  })()}

                                {/* Data point circle */}
                                <Circle
                                  cx={x}
                                  cy={y}
                                  r={6}
                                  fill={pointColor}
                                  stroke="white"
                                  strokeWidth={3}
                                />

                                {/* Month label below X axis */}
                                <SvgText
                                  x={x}
                                  y={topPadding + chartHeight + 20}
                                  fontSize={12}
                                  textAnchor="middle"
                                  fill="#333"
                                  fontWeight="bold"
                                >
                                  {month.slice(5)} {/* Show only month (MM) */}
                                </SvgText>

                                {/* Value label above point */}
                                {value > 0 && (
                                  <SvgText
                                    x={x}
                                    y={y - 12}
                                    fontSize={12}
                                    textAnchor="middle"
                                    fill="#333"
                                    fontWeight="bold"
                                  >
                                    {`${value}%`}
                                  </SvgText>
                                )}

                                {/* Vertical grid line at each month */}
                                <Line
                                  x1={x}
                                  x2={x}
                                  y1={topPadding + chartHeight}
                                  y2={topPadding + chartHeight + 5}
                                  stroke="#999"
                                  strokeWidth={1}
                                />
                              </G>
                            );
                          })}
                        </G>
                      );
                    })()}
                  </FullScreenChartSvg>
                </FullScreenChartScrollView>
              </ModalContainer>
            </Modal>

            {selectedFincode !== "all" && chartData.length > 0 && (
              <SummaryContainer>
                <SummaryText>
                  Showing attendance trend for{" "}
                  <BoldText>
                    {athletes.find((a) => a.fincode === selectedFincode)?.name}
                  </BoldText>{" "}
                  in <BoldText>{selectedType}</BoldText> sessions
                </SummaryText>
                <NoteText>
                  <BoldText>Note:</BoldText> Green points indicate attendance
                  ≥80%, red points indicate attendance &lt;80%
                </NoteText>
              </SummaryContainer>
            )}
          </>
        )}
      </ScrollView>

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
              <FilterModalTitle>Filter Trend</FilterModalTitle>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </FilterModalHeader>

            <ScrollView>
              <FilterSection>
                <CompactLabel>Season</CompactLabel>
                <CustomDropdown onPress={() => setSeasonModalVisible(true)}>
                  <DropdownText>
                    {seasonOptions.find((opt) => opt.value === season)?.label ||
                      season}
                  </DropdownText>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSecondary}
                  />
                </CustomDropdown>
              </FilterSection>

              <FilterSection>
                <CompactLabel>Type</CompactLabel>
                <CustomDropdown onPress={() => setTypeModalVisible(true)}>
                  <DropdownText>
                    {typeOptions.find((opt) => opt.value === selectedType)
                      ?.label || selectedType}
                  </DropdownText>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSecondary}
                  />
                </CustomDropdown>
              </FilterSection>

              <FilterSection>
                <CompactLabel>Group</CompactLabel>
                <CustomDropdown onPress={() => setGroupModalVisible(true)}>
                  <DropdownText>
                    {groupOptions.find((opt) => opt.value === selectedGroup)
                      ?.label || selectedGroup}
                  </DropdownText>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSecondary}
                  />
                </CustomDropdown>
              </FilterSection>

              <FilterSection>
                <CompactLabel>Athlete</CompactLabel>
                <CustomDropdown onPress={() => setAthleteModalVisible(true)}>
                  <DropdownText>
                    {selectedFincode === "all"
                      ? "Athlete..."
                      : athletes.find((a) => a.fincode === selectedFincode)
                          ?.name || "Unknown"}
                  </DropdownText>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSecondary}
                  />
                </CustomDropdown>
              </FilterSection>

              <ChartButton
                style={{ opacity: selectedFincode === "all" ? 0.5 : 1, marginTop: 10 }}
                onPress={() => {
                  setFilterModalVisible(false);
                  openChartModal();
                }}
                disabled={loading || selectedFincode === "all"}
              >
                <Ionicons name="analytics" size={20} color="#fff" />
                <ButtonText style={{ marginLeft: 8 }}>View Chart</ButtonText>
              </ChartButton>
            </ScrollView>
          </FilterModalContent>
        </FilterModalOverlay>
      </Modal>

      {/* Custom Dropdown Modals */}
      <CustomDropdownComponent
        title="Select Season"
        selectedValue={season}
        options={seasonOptions}
        onSelect={setSeason}
        visible={seasonModalVisible}
        onClose={() => setSeasonModalVisible(false)}
      />

      <CustomDropdownComponent
        title="Select Type"
        selectedValue={selectedType}
        options={typeOptions}
        onSelect={(value: string) => setSelectedType(value as "Swim" | "Gym")}
        visible={typeModalVisible}
        onClose={() => setTypeModalVisible(false)}
      />

      <CustomDropdownComponent
        title="Select Group"
        selectedValue={selectedGroup}
        options={groupOptions}
        onSelect={(value: string) =>
          setSelectedGroup(value as "all" | "ASS" | "EA" | "EB" | "PROP")
        }
        visible={groupModalVisible}
        onClose={() => setGroupModalVisible(false)}
      />

      <CustomDropdownComponent
        title="Select Athlete"
        selectedValue={selectedFincode.toString()}
        options={athleteOptions}
        onSelect={(value: string) =>
          setSelectedFincode(value === "all" ? "all" : Number(value))
        }
        visible={athleteModalVisible}
        onClose={() => setAthleteModalVisible(false)}
      />
    </Container>
  );
}

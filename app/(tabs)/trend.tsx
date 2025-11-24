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
import { Picker } from "@react-native-picker/picker";
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

      {/* Floating Filter Button */}
      <TouchableOpacity
        onPress={() => setFilterModalVisible(true)}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      >
        <Ionicons name="filter" size={28} color="white" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
        transparent={true}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 20, width: '85%', maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20, textAlign: 'center' }}>Filter Trend</Text>
            
            <CompactLabel>Season</CompactLabel>
            <View style={{ borderWidth: 1, borderColor: colors.lightGray, borderRadius: 8, marginBottom: 15, backgroundColor: colors.white }}>
              <Picker
                selectedValue={season}
                onValueChange={(value) => setSeason(value)}
                style={{ height: 60 }}
              >
                {seasonOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>

            <CompactLabel>Type</CompactLabel>
            <View style={{ borderWidth: 1, borderColor: colors.lightGray, borderRadius: 8, marginBottom: 15, backgroundColor: colors.white }}>
              <Picker
                selectedValue={selectedType}
                onValueChange={(value) => setSelectedType(value as "Swim" | "Gym")}
                style={{ height: 60 }}
              >
                {typeOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>

            <CompactLabel>Group</CompactLabel>
            <View style={{ borderWidth: 1, borderColor: colors.lightGray, borderRadius: 8, marginBottom: 15, backgroundColor: colors.white }}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={(value) => setSelectedGroup(value as "all" | "ASS" | "EA" | "EB" | "PROP")}
                style={{ height: 60 }}
              >
                {groupOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>

            <CompactLabel>Athlete</CompactLabel>
            <View style={{ borderWidth: 1, borderColor: colors.lightGray, borderRadius: 8, marginBottom: 20, backgroundColor: colors.white }}>
              <Picker
                selectedValue={selectedFincode.toString()}
                onValueChange={(value) => setSelectedFincode(value === "all" ? "all" : Number(value))}
                style={{ height: 60 }}
              >
                {athleteOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.white,
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.danger,
                }}
              >
                <Ionicons name="close-circle" size={28} color={colors.danger} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setFilterModalVisible(false);
                  if (selectedFincode !== "all") {
                    openChartModal();
                  }
                }}
                disabled={selectedFincode === "all"}
                style={{
                  flex: 1,
                  backgroundColor: colors.white,
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: selectedFincode === "all" ? colors.lightGray : colors.primary,
                }}
              >
                <Ionicons name="analytics" size={28} color={selectedFincode === "all" ? colors.lightGray : colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Container>
  );
}

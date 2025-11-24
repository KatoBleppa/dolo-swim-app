import {
  Text,
  FlatList,
  Modal,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import React, { useState } from "react";
import { Picker } from "@react-native-picker/picker"; // Import Picker for dropdown
import { supabase } from "../../utils/supabaseClient";
import { filterAthletesByTeam } from "../../utils/athletesUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  Container,
  Heading,
  ModalContainer,
  ModalContent,
  ModalTitle,
  Input,
  WeekNavigation,
  NavButton,
  WeekTitle,
  WeekDaysContainer,
  DayContainer,
  DayLabel,
  DayButton,
  DayText,
  FilterLabel,
  colors,
} from "../../styles/globalStyles";

type TrainingDay = {
  session_id: number;
  title: string;
  date: string;
  starttime: string;
  endtime: string;
  type: string;
  description: string;
  volume: number;
  location: string;
  poolname: string;
  poollength: number;
  groups: string;
};

type DateObject = {
  dateString: string;
};

import styled from "styled-components/native";

// Additional styled components specific to this screen
const SessionItem = styled.View`
  padding: 10px;
  background-color: #ffffff;
  margin-bottom: 5px;
  border-radius: 5px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
`;

const GroupFilterContainer = styled.View`
  background-color: #ffffff;
  margin-bottom: 15px;
  border-radius: 10px;
  padding: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const WeeklyCalendarContainer = styled.View`
  background-color: #ffffff;
  margin-bottom: 20px;
  border-radius: 10px;
  padding: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const NoSessions = styled.View`
  align-items: center;
  margin-top: 20px;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
`;

const IconButton = styled.TouchableOpacity`
  flex: 1;
  background-color: #ffffff;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  border-width: 2px;
`;

export default function TrainingsScreen() {
  const [selectedDay, setSelectedDay] = useState<DateObject | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [sessionsForDay, setSessionsForDay] = useState<TrainingDay[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] =
    useState(false);
  const [athletesList, setAthletesList] = useState<any[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("ASS");
  const [filterGroup, setFilterGroup] = useState<string>("ASS");
  const [descriptionHeight, setDescriptionHeight] = useState<number>(60);

  const [newSession, setNewSession] = useState<Partial<TrainingDay>>({
    session_id: 0,
    title: "",
    date: "",
    starttime: "18:00", // Default value
    endtime: "20:00", // Default value
    type: "Swim", // Default value
    description: "",
    volume: 0,
    location: "Bolzano", // Default value
    poollength: 25, // Default value
    groups: "ASS", // Default value
  });

  const router = useRouter();

  const fetchSessionsForDay = async (dateString: string) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("date", dateString);

      if (error) {
        throw error;
      }

      setSessionsForDay(data || []);
    } catch (err) {
      console.error("Failed to fetch sessions for the day:", err);
    }
  };

  const onDayPress = (day: DateObject) => {
    setSelectedDay(day);
    fetchSessionsForDay(day.dateString);
  };

  const toggleModal = () => {
    setNewSession({
      ...newSession,
      date: selectedDay?.dateString || "", // Autofill date with selected day
      groups: "ASS", // Ensure groups is initialized as a string
    });
    setIsModalVisible(!isModalVisible);
  };

  const handleInputChange = (
    field: keyof TrainingDay,
    value: string | number
  ) => {
    setNewSession({ ...newSession, [field]: value });
  };

  const saveSession = async () => {
    try {
      // Ensure time is in hh:mm format (not hh:mm:ss or longer)
      const formatTime = (time: string | undefined) => {
        if (!time) return "";
        // Only keep hh:mm
        return time.length > 5 ? time.slice(0, 5) : time;
      };
      // Exclude session_id from insert payload, but include for update
      const { session_id, ...fieldsToSave } = newSession;
      const formattedSession = {
        ...fieldsToSave,
        starttime: formatTime(newSession.starttime),
        endtime: formatTime(newSession.endtime),
        groups:
          typeof newSession.groups === "string"
            ? newSession.groups
            : newSession.groups?.[0] || "",
      };

      let response;
      if (newSession.session_id) {
        // For update, do not update session_id field
        response = await supabase
          .from("sessions")
          .update(formattedSession)
          .eq("session_id", newSession.session_id);
      } else {
        // For insert, just use formattedSession (session_id is not present)
        response = await supabase.from("sessions").insert([formattedSession]);
      }

      if (response.error) {
        throw response.error;
      }

      if (selectedDay?.dateString) {
        fetchSessionsForDay(selectedDay.dateString);
      }
    } catch (err) {
      console.error("Failed to save session:", err);
    } finally {
      setIsModalVisible(false);
      setNewSession({
        title: "",
        date: selectedDay?.dateString || "",
        starttime: "18:00",
        endtime: "20:00",
        type: "Swim",
        description: "",
        volume: 0,
        location: "Bolzano",
        poolname: "Maso della Pieve",
        poollength: 25,
        groups: "ASS",
      });
    }
  };

  const filterAthletesByTeamHandler = (team: string) => {
    filterAthletesByTeam(team, setSelectedGroup);
  };

  const renderAthlete = ({ item }: { item: any }) => <Text>{item.name}</Text>;

  const editSession = async (session_id: number) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("session_id", session_id);

      if (error) {
        throw error;
      }

      if (Array.isArray(data) && data.length > 0) {
        const session = data[0];
        setNewSession({
          ...session,
          groups: session.groups || "", // Ensure groups is treated as a string
        });
        setIsModalVisible(true);
      }
    } catch (err) {
      console.error("Failed to fetch session details:", err);
    }
  };

  const deleteSession = async (session_id: number) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("session_id", session_id);

      if (error) {
        throw error;
      }

      setSessionsForDay((prevSessions) =>
        prevSessions.filter((session) => session.session_id !== session_id)
      );
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const getWeekDays = () => {
    const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const handleDayPress = (date: Date) => {
    const dayObj = {
      dateString: format(date, "yyyy-MM-dd"),
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
    setSelectedDay(dayObj);
    fetchSessionsForDay(dayObj.dateString);
  };

  return (
    <Container>
      <WeeklyCalendarContainer>
        <WeekNavigation>
          <NavButton onPress={goToPreviousWeek}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </NavButton>
          <WeekTitle>
            {format(getWeekDays()[0], "MMM d")} -{" "}
            {format(getWeekDays()[6], "MMM d, yyyy")}
          </WeekTitle>
          <NavButton onPress={goToNextWeek}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </NavButton>
        </WeekNavigation>

        <WeekDaysContainer>
          {getWeekDays().map((date, index) => {
            const isSelected =
              selectedDay && isSameDay(date, new Date(selectedDay.dateString));
            const isToday = isSameDay(date, new Date());

            return (
              <DayContainer key={index}>
                <DayLabel>{format(date, "EEE")}</DayLabel>
                <DayButton
                  onPress={() => handleDayPress(date)}
                  isSelected={isSelected}
                  isToday={isToday}
                >
                  <DayText isSelected={isSelected} isToday={isToday}>
                    {format(date, "d")}
                  </DayText>
                </DayButton>
              </DayContainer>
            );
          })}
        </WeekDaysContainer>
      </WeeklyCalendarContainer>

      <GroupFilterContainer>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FilterLabel>Group:</FilterLabel>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Picker
              selectedValue={filterGroup}
              onValueChange={(itemValue) => setFilterGroup(itemValue)}
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
              <Picker.Item label="ASS" value="ASS" style={{ color: "#333333" }} />
              <Picker.Item label="EA" value="EA" style={{ color: "#333333" }} />
              <Picker.Item label="EB" value="EB" style={{ color: "#333333" }} />
              <Picker.Item label="PROP" value="PROP" style={{ color: "#333333" }} />
            </Picker>
          </View>
        </View>
      </GroupFilterContainer>

      {selectedDay && (
        <>
          <Heading>{selectedDay.dateString}</Heading>
          <TouchableOpacity
            onPress={toggleModal}
            style={{
              backgroundColor: colors.warning,
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 5,
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Ionicons name="add-circle-outline" color="#fff" size={28} />
          </TouchableOpacity>
          <FlatList
            data={sessionsForDay.filter(
              (session) =>
                filterGroup === "ASS" || session.groups?.includes(filterGroup)
            )}
            keyExtractor={(item) =>
              item.session_id
                ? item.session_id.toString()
                : Math.random().toString()
            }
            renderItem={({ item }) => (
              <SessionItem>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text>ID: {item.session_id}</Text>
                  <Text>Type: {item.type}</Text>
                </View>
                <ButtonContainer>
                  <TouchableOpacity
                    onPress={() => editSession(item.session_id)}
                    style={{ marginHorizontal: 8 }}
                  >
                    <Ionicons name="create-outline" color={colors.primary} size={24} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      router.push({
                        pathname: "/attendance_form",
                        params: {
                          sessionId: item.session_id,
                          sessionDate: item.date,
                          selectedGroup: filterGroup,
                        },
                      });
                    }}
                    style={{ marginHorizontal: 8 }}
                  >
                    <Ionicons name="people-outline" color={colors.info} size={24} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteSession(item.session_id)}
                    style={{ marginHorizontal: 8 }}
                  >
                    <Ionicons name="trash-outline" color={colors.danger} size={24} />
                  </TouchableOpacity>
                </ButtonContainer>
              </SessionItem>
            )}
            ListEmptyComponent={
              <NoSessions>
                <Text>No sessions</Text>
              </NoSessions>
            }
            style={{ flexGrow: 1, minHeight: 100 }}
          />
        </>
      )}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <ModalContainer>
          <ModalContent style={{ maxHeight: "80%" }}>
            <ScrollView>
              <ModalTitle>{newSession.date}</ModalTitle>
              <Input
                placeholder="Title"
                value={newSession.title || ""}
                onChangeText={(text: string) =>
                  handleInputChange("title", text)
                }
              />
              <Input
                placeholder="Start Time (hh:mm)"
                value={newSession.starttime || ""}
                onChangeText={(text: string) =>
                  handleInputChange("starttime", text)
                }
              />
              <Input
                placeholder="End Time (hh:mm)"
                value={newSession.endtime || ""}
                onChangeText={(text: string) =>
                  handleInputChange("endtime", text)
                }
              />
              <Picker
                selectedValue={newSession.type}
                onValueChange={(itemValue) =>
                  handleInputChange("type", itemValue)
                }
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
                <Picker.Item label="Swim" value="Swim" style={{ color: "#333333" }} />
                <Picker.Item label="Gym" value="Gym" style={{ color: "#333333" }} />
              </Picker>
              <Input
                placeholder="Description"
                value={newSession.description || ""}
                onChangeText={(text: string) =>
                  handleInputChange("description", text)
                }
                multiline={true}
                textAlignVertical="top"
                scrollEnabled={true}
                onContentSizeChange={(event: any) => {
                  setDescriptionHeight(Math.max(60, event.nativeEvent.contentSize.height));
                }}
                style={{ height: Math.max(60, descriptionHeight), paddingTop: 10, fontSize: 10 }}
              />
              {/* Hide volume, poolname, poollength if type is Gym */}
              {newSession.type !== "Gym" && (
                <>
                  <Input
                    placeholder="Volume"
                    value={(newSession.volume ?? 0).toString()}
                    onChangeText={(text: string) =>
                      handleInputChange("volume", parseInt(text))
                    }
                    keyboardType="numeric"
                  />
                  <Input
                    placeholder="Pool Name"
                    value={newSession.poolname || ""}
                    onChangeText={(text: string) =>
                      handleInputChange("poolname", text)
                    }
                  />
                  <Input
                    placeholder="Pool Length"
                    value={(newSession.poollength ?? 0).toString()}
                    onChangeText={(text: string) =>
                      handleInputChange("poollength", parseInt(text))
                    }
                    keyboardType="numeric"
                  />
                </>
              )}
              <Input
                placeholder="Location"
                value={newSession.location || ""}
                onChangeText={(text: string) =>
                  handleInputChange("location", text)
                }
              />
              <Input
                placeholder="Groups"
                value={newSession.groups || ""}
                onChangeText={(text: string) =>
                  handleInputChange("groups", text)
                }
              />
              <ButtonContainer>
                <IconButton
                  onPress={toggleModal}
                  style={{ borderColor: colors.danger }}
                >
                  <Ionicons name="close-circle" color={colors.danger} size={28} />
                </IconButton>
                <IconButton
                  onPress={saveSession}
                  style={{ borderColor: colors.success }}
                >
                  <Ionicons name="checkmark-circle" color={colors.success} size={28} />
                </IconButton>
              </ButtonContainer>
            </ScrollView>
          </ModalContent>
        </ModalContainer>
      </Modal>
    </Container>
  );
}

import { useState, useEffect } from 'react';
import { Container, colors } from "../../styles/globalStyles";
import { supabase } from "../../utils/supabaseClient";
import styled from "styled-components/native";

interface Meet {
  mindate: string;
  maxdate: string;
  meetname: string;
  place: string;
  course: number;
  groups: string[];
}

interface Session {
  date: string;
  starttime: string;
  type: string;
  groups: string;
}

interface SeasonSummary {
  season: string;
  totalKm: number;
  totalSessions: number;
  averageKm: number;
  eventCount: number;
}

const DashboardContainer = styled.ScrollView`
  flex: 1;
  padding: 10px;
`;

const SectionContainer = styled.View`
  background-color: #f5f5f5;
  border-radius: 12px;
  margin-bottom: 15px;
  padding: 15px;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
  color: #333;
`;

const HorizontalScrollContainer = styled.ScrollView`
  flex: 1;
`;

const CardContainer = styled.View`
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  margin-right: 12px;
  width: 300px;
  min-height: 120px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const CardTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
`;

const CardText = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`;

const LoadingText = styled.Text`
  text-align: center;
  color: #666;
  font-style: italic;
`;

const ErrorText = styled.Text`
  text-align: center;
  color: red;
`;

export default function Index() {
  const [nextEvents, setNextEvents] = useState<Meet[]>([]);
  const [nextWorkouts, setNextWorkouts] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutLoading, setWorkoutLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutError, setWorkoutError] = useState<string | null>(null);

  // Helper function to format date as dd.mm.yyyy
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    const fetchNextEvents = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('meets_teammanager')
          .select('mindate, maxdate, meetname, place, course, groups')
          .gte('mindate', today)
          .order('mindate', { ascending: true })
          .limit(2);

        if (error) {
          setError(error.message);
        } else {
          setNextEvents(data || []);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchNextWorkouts = async () => {
      try {
        setWorkoutLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('sessions')
          .select('date, starttime, type, groups')
          .gte('date', today)
          .order('date', { ascending: true })
          .order('starttime', { ascending: true })
          .limit(2);

        if (error) {
          setWorkoutError(error.message);
        } else {
          setNextWorkouts(data || []);
        }
      } catch (err: any) {
        setWorkoutError(err.message || 'An error occurred');
      } finally {
        setWorkoutLoading(false);
      }
    };

    fetchNextEvents();
    fetchNextWorkouts();
  }, []);

  return (
    <Container style={{ backgroundColor: colors.white }}>
      <DashboardContainer showsVerticalScrollIndicator={false}>
        {/* Next Events Section */}
        <SectionContainer>
          <SectionTitle>Next Events</SectionTitle>
          {loading ? (
            <LoadingText>Loading events...</LoadingText>
          ) : error ? (
            <ErrorText>Error: {error}</ErrorText>
          ) : nextEvents.length === 0 ? (
            <LoadingText>No upcoming events found.</LoadingText>
          ) : (
            <HorizontalScrollContainer
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 10, paddingRight: 25 }}
              decelerationRate="fast"
              snapToInterval={312}
              snapToAlignment="start"
            >
              {nextEvents.map((event, index) => (
                <CardContainer key={index}>
                  <CardTitle>{event.meetname}</CardTitle>
                  <CardText>📅 {formatDate(event.mindate)} - {formatDate(event.maxdate)}</CardText>
                  <CardText>📍 {event.place}</CardText>
                  <CardText>🏊 Course: {event.course === 1 ? '50m' : event.course === 2 ? '25m' : event.course}</CardText>
                  <CardText>👥 Groups: {event.groups ? event.groups.join(', ') : 'No groups specified'}</CardText>
                </CardContainer>
              ))}
            </HorizontalScrollContainer>
          )}
        </SectionContainer>

        {/* Next Workouts Section */}
        <SectionContainer>
          <SectionTitle>Next Workouts</SectionTitle>
          {workoutLoading ? (
            <LoadingText>Loading workouts...</LoadingText>
          ) : workoutError ? (
            <ErrorText>Error: {workoutError}</ErrorText>
          ) : nextWorkouts.length === 0 ? (
            <LoadingText>No upcoming workouts found.</LoadingText>
          ) : (
            <HorizontalScrollContainer
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 10, paddingRight: 25 }}
              decelerationRate="fast"
              snapToInterval={312}
              snapToAlignment="start"
            >
              {nextWorkouts.map((workout, index) => (
                <CardContainer key={index}>
                  <CardTitle>{workout.type}</CardTitle>
                  <CardText>📅 {formatDate(workout.date)}</CardText>
                  <CardText>⏰ {workout.starttime.substring(0, 5)}</CardText>
                  <CardText>👥 Groups: {workout.groups || 'No groups specified'}</CardText>
                </CardContainer>
              ))}
            </HorizontalScrollContainer>
          )}
        </SectionContainer>
      </DashboardContainer>
    </Container>
  );
}

import 'react-native-gesture-handler';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="attendance_form" options={{ title: 'Tracking attendance' }} />
    </Stack>
  );
}


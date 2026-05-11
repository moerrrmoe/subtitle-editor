import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";

export default function Layout() {
  return (
    <PaperProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false, // This hides all native headers
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="editor"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="editor-web"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </PaperProvider>
  );
}

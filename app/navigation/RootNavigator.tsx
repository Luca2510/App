import React from "react";
import { DarkTheme, NavigationContainer, Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { color } from "../theme";
import { SplashScreen } from "../screens/SplashScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { GameScreen } from "../screens/GameScreen";
import { EndingScreen } from "../screens/EndingScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { LegacyScreen } from "../screens/LegacyScreen";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Home: undefined;
  Game: undefined;
  // historyId set when reopening a past run (read-only) from Legacy;
  // omitted for the live end-of-run flow, which reads the store directly.
  Ending: { historyId: string } | undefined;
  Legacy: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: color.ground,
    card: color.ground,
    text: color.ink,
    border: color.rule,
    primary: color.accent,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.ground },
          animation: "fade",
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Ending" component={EndingScreen} />
        <Stack.Screen name="Legacy" component={LegacyScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

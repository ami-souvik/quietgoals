import 'react-native-url-polyfill/auto';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

const Stack = createNativeStackNavigator();

// Warm up the browser for OAuth before it's needed — prevents the
// "this._url.includes is not a function" crash in @better-auth/expo
WebBrowser.maybeCompleteAuthSession();

import { CreatorView, HomeView, SettingsView } from './components/views';
import { ToastProvider } from './components/ToastContext';
import { AppProvider } from './components/AppContext';
import { CreatorProvider, useCreatorStore } from './components/CreatorContext';
import { QuietButton } from './components/action';
import ViewShot from 'react-native-view-shot';
import { WallpaperCanvas } from './components/WallpaperCanvas';
import { View, Dimensions, StyleSheet } from 'react-native';

function MainApp() {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
  const [fontsLoaded] = useFonts({
    'Oswald-Regular': require('./assets/fonts/Oswald-Regular.ttf'),
    'Oswald-Bold': require('./assets/fonts/Oswald-Bold.ttf'),
    'Grounded-Regular': require('./assets/fonts/DancingScript-Regular.ttf'),
    'Grounded-Bold': require('./assets/fonts/DancingScript-Bold.ttf'),
    'Calm-Regular': require('./assets/fonts/HostGrotesk-Regular.ttf'),
    'Calm-Bold': require('./assets/fonts/HostGrotesk-Bold.ttf'),
    'Calm-Italic': require('./assets/fonts/HostGrotesk-Italic.ttf'),
    'Focused-Regular': require('./assets/fonts/Outfit-Regular.ttf'),
    'Focused-Bold': require('./assets/fonts/Outfit-Bold.ttf'),
  });

  const { viewShotRef } = useCreatorStore();
  const { width, height } = Dimensions.get('window');

  if (!fontsLoaded) return null;

  return (
    <>
      {/* Hidden ViewShot for background wallpaper captures */}
      <View style={{ position: 'absolute', left: -9999, top: 0, width, height }} pointerEvents="none">
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1.0 }}
          style={StyleSheet.absoluteFill}
        >
          <WallpaperCanvas />
        </ViewShot>
      </View>

      <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
        <Stack.Screen name="Home">
          {({ navigation }) => (
            <>
              <HomeView
                onCreatePress={() => navigation.navigate('Creator')}
                onSettingsPress={() => navigation.navigate('Settings')}
              />
              <QuietButton />
            </>
          )}
        </Stack.Screen>

        <Stack.Screen name="Creator">
          {() => <CreatorView />}
        </Stack.Screen>

        <Stack.Screen name="Settings">
          {() => <SettingsView />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <ToastProvider>
          <CreatorProvider>
            <MainApp />
          </CreatorProvider>
        </ToastProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

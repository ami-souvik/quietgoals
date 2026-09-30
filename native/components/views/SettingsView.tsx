import { StyleSheet, StatusBar, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../action';
import { useNavigation } from '@react-navigation/native';
import { Palette, ChevronRight, LogIn, LogOut } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../lib/theme';
import { useSession, signIn, signOut } from '../../lib/auth-client';
import { useState, useEffect } from 'react';

export const SettingsView: React.FC = () => {
    const { isDark, colors } = useTheme();
    const styles = getStyles(colors);
    const navigation = useNavigation<any>();
    const { data: session, isPending } = useSession();
    const [authLoading, setAuthLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        if (session && !syncing) {
            const syncOfflineData = async () => {
                setSyncing(true);
                try {
                    const { getTasks, saveTasks } = require('../../lib/storage');
                    const tasks = await getTasks();
                    if (tasks && tasks.length > 0) {
                        const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
                        const response = await fetch(`${baseUrl}/api/goals/sync`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ offlineTasks: tasks })
                        });
                        if (response.ok) {
                            // Clear offline tasks once synced successfully
                            await saveTasks([]);
                        }
                    }
                } catch (error) {
                    console.error('Failed to sync offline tasks:', error);
                } finally {
                    setSyncing(false);
                }
            };
            syncOfflineData();
        }
    }, [session]);

    const handleAuth = async () => {
        if (session) {
            setAuthLoading(true);
            try {
                await signOut();
            } catch (error) {
                Alert.alert("Sign Out Error", "Could not sign out. Please try again.");
            }
            setAuthLoading(false);
        } else {
            setAuthLoading(true);
            try {
                const res = await signIn.social({
                    provider: "google",
                    callbackURL: "quietgoals://",
                });
                
                if (res?.error) {
                    Alert.alert("Sign In Error", res.error.message || "Failed to sign in with Google.");
                }
            } catch (error: any) {
                Alert.alert("Sign In Error", error?.message || "An unexpected error occurred during sign in.");
            } finally {
                setAuthLoading(false);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View style={styles.header}>
                <BackButton />
                <Text style={styles.headerTitle}>Settings</Text>
            </View>
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.settingRow}
                    onPress={() => navigation.navigate('Creator')}
                >
                    <View style={styles.settingIcon}>
                        <Palette size={20} color={colors.icon} />
                    </View>
                    <Text style={styles.settingLabel}>Wallpaper Customization</Text>
                    <ChevronRight size={20} color={colors.iconInactive} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.settingRow, { marginTop: 16 }]}
                    onPress={handleAuth}
                    disabled={isPending || authLoading}
                >
                    <View style={styles.settingIcon}>
                        {session ? <LogOut size={20} color={colors.icon} /> : <LogIn size={20} color={colors.icon} />}
                    </View>
                    <Text style={styles.settingLabel}>
                        {isPending || authLoading ? 'Loading...' : session ? 'Sign out' : 'Sign in with Google'}
                    </Text>
                    {session && <Text style={{ color: colors.textSecondary, marginRight: 8, fontSize: 12 }}>{session.user.email}</Text>}
                    {!(isPending || authLoading) && <ChevronRight size={20} color={colors.iconInactive} />}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Calm-Bold',
        color: colors.text,
    },
    content: {
        flex: 1,
        paddingTop: 12,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        marginHorizontal: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: colors.shadowOpacity,
        shadowRadius: 4,
        elevation: 2,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    settingLabel: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Calm-Regular',
        color: colors.text,
    }
});

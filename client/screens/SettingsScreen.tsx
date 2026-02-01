import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Switch, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useP2P } from '@/context/P2PContext';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Alert, Platform } from 'react-native';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { profile, updateProfile, settings, updateSettings, isConnected, clearAllData } = useP2P();

  const [displayName, setDisplayName] = useState(profile?.name || '');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (displayName.trim()) {
      await updateProfile(displayName.trim(), profile?.avatarIndex || 0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleToggleAutoDelete = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ autoDeleteEnabled: value });
  };

  const handleTimerChange = async (timer: 10 | 30) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ autoDeleteTimer: timer });
  };

  const handleToggleNotifications = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ notificationsEnabled: value });
  };

  const handleToggleAutoConnect = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ autoConnect: value });
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          PROFILE
        </ThemedText>
        
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="user" size={32} color={theme.primary} />
          </View>
          <View style={styles.avatarInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {displayName || 'Your Name'}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              ID: {profile?.id.slice(0, 8) || '...'}
            </ThemedText>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
          Display Name
        </ThemedText>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your name"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          maxLength={30}
          testID="display-name-input"
        />
        
        <Button onPress={handleSaveProfile} style={styles.saveButton}>
          Save Profile
        </Button>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          MESSAGE PRIVACY
        </ThemedText>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Feather name="clock" size={18} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={styles.settingLabel}>Auto-delete after seen</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Messages delete after receiver views them
              </ThemedText>
            </View>
          </View>
          <Switch
            value={settings.autoDeleteEnabled}
            onValueChange={handleToggleAutoDelete}
            trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            thumbColor="#FFFFFF"
            testID="auto-delete-toggle"
          />
        </View>
        
        {settings.autoDeleteEnabled ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Delete Timer
            </ThemedText>
            <View style={styles.timerButtons}>
              <Pressable
                style={[
                  styles.timerButton,
                  {
                    backgroundColor: settings.autoDeleteTimer === 10 ? theme.primary : theme.backgroundSecondary,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => handleTimerChange(10)}
                testID="timer-10-button"
              >
                <ThemedText
                  type="body"
                  style={{
                    color: settings.autoDeleteTimer === 10 ? theme.buttonText : theme.text,
                    fontWeight: '600',
                  }}
                >
                  10 min
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.timerButton,
                  {
                    backgroundColor: settings.autoDeleteTimer === 30 ? theme.primary : theme.backgroundSecondary,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => handleTimerChange(30)}
                testID="timer-30-button"
              >
                <ThemedText
                  type="body"
                  style={{
                    color: settings.autoDeleteTimer === 30 ? theme.buttonText : theme.text,
                    fontWeight: '600',
                  }}
                >
                  30 min
                </ThemedText>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          PREFERENCES
        </ThemedText>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Feather name="bell" size={18} color={theme.primary} />
            <ThemedText type="body" style={styles.settingLabel}>Notifications</ThemedText>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            thumbColor="#FFFFFF"
            testID="notifications-toggle"
          />
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Feather name="wifi" size={18} color={theme.primary} />
            <ThemedText type="body" style={styles.settingLabel}>Auto-connect to known peers</ThemedText>
          </View>
          <Switch
            value={settings.autoConnect}
            onValueChange={handleToggleAutoConnect}
            trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            thumbColor="#FFFFFF"
            testID="auto-connect-toggle"
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          ABOUT
        </ThemedText>
        
        <View style={styles.aboutContent}>
          <View style={styles.aboutHeader}>
            <Feather name="shield" size={32} color={theme.primary} />
            <ThemedText type="h4" style={styles.aboutTitle}>How P2P Works</ThemedText>
          </View>
          
          <ThemedText type="body" style={[styles.aboutText, { color: theme.textSecondary }]}>
            MeshChat creates direct connections between devices without storing any messages on servers.
          </ThemedText>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: theme.primary }]} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Messages exist only on connected devices
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: theme.primary }]} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                No cloud storage, no backups, no traces
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: theme.primary }]} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                True peer-to-peer encrypted communication
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.error }]}>
          DANGER ZONE
        </ThemedText>
        
        <Button 
          onPress={() => {
            if (Platform.OS === 'web') {
              const confirmed = window.confirm('This will permanently delete ALL conversations and messages. This cannot be undone.\n\nClear All Data?');
              if (confirmed) {
                clearAllData();
              }
              return;
            }

            Alert.alert(
              'Clear All Data',
              'This will permanently delete ALL conversations and messages. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Clear Everything', 
                  style: 'destructive',
                  onPress: clearAllData
                }
              ]
            );
          }} 
          style={{ backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.error }}
        >
          <ThemedText style={{ color: theme.error, fontWeight: '600' }}>Clear All Conversations</ThemedText>
        </Button>
      </View>

      <View style={styles.footer}>
        <View style={styles.connectionStatus}>
          <View 
            style={[
              styles.statusDot, 
              { backgroundColor: isConnected ? theme.primary : theme.error }
            ]} 
          />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {isConnected ? 'Network connected' : 'Disconnected'}
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          MeshChat v1.0.0
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  avatarInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    marginTop: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    marginLeft: Spacing.md,
  },
  settingTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timerButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutContent: {},
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  aboutTitle: {
    marginLeft: Spacing.md,
  },
  aboutText: {
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  featureList: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
});

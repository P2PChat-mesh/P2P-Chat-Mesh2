import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { theme } = useTheme();
  const isSent = message.isSent;

  return (
    <View style={[styles.container, isSent ? styles.sentContainer : styles.receivedContainer]}>
      <View
        style={[
          styles.bubble,
          isSent ? styles.sentBubble : styles.receivedBubble,
          {
            backgroundColor: isSent ? theme.messageSent : theme.messageReceived,
            borderColor: isSent ? theme.primary : theme.border,
          },
        ]}
      >
        <ThemedText type="body" style={styles.content}>{message.content}</ThemedText>
        <View style={styles.footer}>
          <ThemedText type="small" style={[styles.time, { color: theme.textSecondary }]}>
            {formatMessageTime(message.timestamp)}
          </ThemedText>
          {isSent ? (
            <View style={styles.statusContainer}>
              <Feather 
                name="lock" 
                size={10} 
                color={theme.primary} 
                style={styles.lockIcon}
              />
              {message.status === 'sending' ? (
                <Feather name="clock" size={12} color={theme.textSecondary} />
              ) : message.status === 'sent' ? (
                <Feather name="check" size={12} color={theme.primary} />
              ) : message.status === 'delivered' ? (
                <Feather name="check-circle" size={12} color={theme.primary} />
              ) : (
                <Feather name="alert-circle" size={12} color={theme.error} />
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sentBubble: {
    borderTopRightRadius: Spacing.xs,
  },
  receivedBubble: {
    borderTopLeftRadius: Spacing.xs,
  },
  content: {
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: 11,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  lockIcon: {
    marginRight: 4,
  },
});

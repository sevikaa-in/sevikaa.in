import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure foreground notification behavior for Expo SDK 54
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Register device for Expo Push Notifications & configure Android Notification Channels
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Check if running inside Expo Go app client (SDK 53+ Expo Go disables remote push)
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    if (isExpoGo) {
      return 'ExponentPushToken[expo-go-dev-token]';
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sevikaa-alerts', {
        name: 'Sevikaa Household Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A73E8',
        sound: 'default',
      }).catch(() => {});
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync().catch(() => ({ status: 'denied' }));
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync().catch(() => ({ status: 'denied' }));
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    return pushTokenData ? pushTokenData.data : 'ExponentPushToken[dev-token]';
  } catch (error) {
    return 'ExponentPushToken[dev-token]';
  }
}

/**
 * Trigger an instant local push notification alert
 */
export async function sendLocalPushNotification(payload: PushNotificationPayload) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // instant
    }).catch(() => {});
  } catch (err) {
    // ignore
  }
}

/**
 * Attach listeners for foreground and user interaction (tap) on notifications
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  try {
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  } catch (e) {
    return () => {};
  }
}

import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  send = async ({ pushToken, notification: { body, title } }) => {
    // This registration token comes from the client FCM SDKs.
    const message = {
      notification: { title, body },
      token: pushToken,
    };

    try {
      const response = await admin.messaging().send(message);

      console.log('Successfully push notification: ', response);
    } catch (error) {
      console.log('Error sending push notification: ', error);
    }
  };
}

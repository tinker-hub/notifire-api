import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { SmsService } from './sms.service';

@Injectable()
export class ZonesService {
  constructor(private readonly SmsService: SmsService) {}

  sendSmsEmergencyAlert = async ({ zoneId }) => {
    const db = admin.firestore();

    const zonesRef = db.collection('zones');
  };

  subscribeToSmsFireAlerts = async ({
    phoneNumber,
    userId,
    userSMSToken,
    zoneCode,
  }) => {
    const db = admin.firestore();

    const zonesRef = db.collection('zones');

    const getZoneSnapshots = await zonesRef.where('code', '==', zoneCode).get();

    let zone = null;
    getZoneSnapshots.forEach(doc => {
      const { id } = doc;

      // Add needed user data to `smsAlertSubscribers`
      db.collection('zones')
        .doc(id)
        .update({
          smsAlertSubscribers: admin.firestore.FieldValue.arrayUnion({
            userId,
            userPhoneNumber: phoneNumber,
            userSMSToken,
          }),
        });

      const docData = doc.data();

      this.SmsService.send({
        phoneNumber: phoneNumber.replace('+63', ''),
        message: `You are now subscribed to fire alerts in ${docData.name} zone.`,
        smsToken: userSMSToken,
      });

      zone = {
        id,
        ...docData,
      };
    });

    return zone;
  };
}

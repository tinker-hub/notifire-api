import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ZonesService } from './services/zones.service';

import * as admin from 'firebase-admin';
import { UsersService } from './services/users.service';
import { PushService } from './services/push.service';
import { SmsService } from './services/sms.service';

@Controller('/api')
export class AppController {
  constructor(
    private readonly pushService: PushService,
    private readonly smsService: SmsService,
    private readonly usersService: UsersService,
    private readonly zonesService: ZonesService,
  ) {}

  @Get()
  async test() {}

  @Get('/sms-alerts/subscribe')
  async subscribeToSmsEmergencyAlerts(@Query()
  query: {
    access_token;
    subscriber_number;
  }) {
    const db = admin.firestore();

    const phoneNumber = query.subscriber_number;
    const smsToken = query.access_token;

    const usersRef = db.collection('users');

    const newUserRecord = usersRef.add({
      smsToken,
      phoneNumber: `+${63}${phoneNumber}`,
    });

    return newUserRecord;
  }

  @Post('/sms-alerts/receive-sms')
  async subscribeToZone(@Body()
  body: {
    inboundSMSMessageList: {
      inboundSMSMessage: [
        {
          dateTime: string;
          destinationAddress: string;
          messageId: string | null;
          message: string;
          resourceURL: string | null;
          senderAddress: string;
        },
      ];
      numberOfMessagesInThisBatch: number;
      resourceURL: null | string;
      totalNumberOfPendingMessages: null | string;
    };
  }) {
    const db = admin.firestore();

    const {
      inboundSMSMessageList: { inboundSMSMessage },
    } = body;

    inboundSMSMessage.forEach(async ({ message, senderAddress }) => {
      const [action] = message.split(' ');

      // senderAddress: 'tel:+639162364309'
      const senderPhoneNumber = senderAddress.replace('tel:', '');
      const senderUserRecord = await this.usersService.findOneByPhoneNumber({
        phoneNumber: senderPhoneNumber,
      });

      // Subscribe to zone fire alerts
      if (action === 'SUBSCRIBE') {
        const [__, ...zoneCodes] = message.split(' ');

        zoneCodes.forEach(async zoneCode => {
          const res = await this.zonesService.subscribeToSmsFireAlerts({
            zoneCode,
            // phoneNumber: '9162364309'
            phoneNumber: senderPhoneNumber,
            userId: senderUserRecord.id,
            userSMSToken: senderUserRecord.smsToken,
          });
        });

        // Send fire reports
      } else if (action === 'SUNOG') {
        const [messagePart1, messagePart2] = message.split('ZONES');

        const [dirtyReportMessage] = messagePart1
          .replace('SUNOG', '')
          .trim()
          .split('ZONE_CODE');

        const reportMessage = dirtyReportMessage.trim();

        const areaCode = messagePart2 && messagePart2.trim();

        await db.collection('fire_reports').add({
          source: 'sms',
          details: reportMessage,
          zone: areaCode
            ? {
                code: areaCode,
              }
            : null,
        });
      } else if (action === 'ZONES') {
        const getZonesSnapshot = await db.collection('zones').get();

        let zones = [];
        getZonesSnapshot.forEach(doc => {
          const { id } = doc;

          zones = [
            ...zones,
            {
              id,
              ...doc.data(),
            },
          ];
        });

        const message = zones
          .map(
            ({ name, code, description }) =>
              `Notifire list of available zones\nZONE_NAME: ${name}\nZONE_CODE: ${code}\nZONE_DESCRIPTION: ${description}`,
          )
          .join('\n\n');

        this.smsService.send({
          message,
          smsToken: senderUserRecord.smsToken,
          phoneNumber: senderPhoneNumber.replace('+63', ''),
        });
      }
    });

    const zoneCode = 'PASIG';

    return zoneCode;
  }

  @Post('zones/send-fire-alerts')
  async sendFireAlert(@Body() body) {
    const {
      message = 'Please proceed to the barangay covered court.',
      zones = [
        { id: 'UQW9qEOE9IqoFxdzwuWj', code: 'Pasig', name: 'Pasig' },
        {
          id: 'UUl1MXHA8avvuqIAbt3v',
          code: 'QUEZON_CITY',
          name: 'Quezon City',
        },
      ],
    } = body;

    const db = admin.firestore();
    const zonesRef = db.collection('zones');

    zones.forEach(async ({ id }) => {
      const getZoneDocRef = await zonesRef.doc(id).get();

      const {
        pushAlertSubscribers,
        smsAlertSubscribers,
        name: zoneName,
      } = getZoneDocRef.data();

      const alertMessage = message
        ? `Fire alert in ${zoneName}\n\n${message}`
        : `Fire alert in ${zoneName}`;

      pushAlertSubscribers.forEach(async ({ userPushToken }) => {
        this.pushService.send({
          pushToken: userPushToken,
          notification: {
            body: alertMessage,
            title: 'Notifire Fire Alert',
          },
        });
      });

      if (!smsAlertSubscribers) {
        return;
      }

      smsAlertSubscribers.forEach(async ({ userSMSToken, userPhoneNumber }) => {
        this.smsService.send({
          message: alertMessage,
          smsToken: userSMSToken,
          phoneNumber: userPhoneNumber,
        });
      });
    });

    return;
  }
}

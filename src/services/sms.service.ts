import { Injectable } from '@nestjs/common';
import * as fetch from 'node-fetch';

const GLOBE_API_URL = process.env.GLOBE_API_URL;
const GLOBE_APP_SHORT_CODE_SUFFIX = process.env.GLOBE_APP_SHORT_CODE_SUFFIX;

const SEND_SMS_ENDPOINT = ({ smsToken }) =>
  `${GLOBE_API_URL}/smsmessaging/v1/outbound/${GLOBE_APP_SHORT_CODE_SUFFIX}/requests?access_token=${smsToken}`;

@Injectable()
export class SmsService {
  send = async ({ message, phoneNumber, smsToken }) => {
    const response = await fetch(SEND_SMS_ENDPOINT({ smsToken }), {
      method: 'POST',
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          // TODO: Should be auto-generated and unique for each message
          clientCorrelator: '123456',
          senderAddress: GLOBE_APP_SHORT_CODE_SUFFIX,
          outboundSMSTextMessage: { message },
          address: phoneNumber,
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const responseData = await response.json();

    return responseData;
  };
}

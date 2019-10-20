import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  findOneByPhoneNumber = async ({ phoneNumber }) => {
    const db = admin.firestore();

    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('phoneNumber', '==', phoneNumber)
      .get();

    let user = null;
    snapshot.forEach(doc => {
      const { id } = doc;

      user = {
        id,
        ...doc.data(),
      };
    });

    return user;
  };
}

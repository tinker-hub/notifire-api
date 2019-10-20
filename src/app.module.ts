import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { SmsService } from './services/sms.service';
import { UsersService } from './services/users.service';
import { ZonesService } from './services/zones.service';
import { PushService } from './services/push.service';

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [AppService, PushService, SmsService, UsersService, ZonesService],
})
export class AppModule {}

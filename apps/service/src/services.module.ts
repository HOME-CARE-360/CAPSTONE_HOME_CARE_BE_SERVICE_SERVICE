import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { CommonModule } from 'libs/common/src';
import { ConfigModule } from 'libs/common/src/modules/config.module';

@Module({
  imports: [CommonModule, ConfigModule,

  ],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule { }

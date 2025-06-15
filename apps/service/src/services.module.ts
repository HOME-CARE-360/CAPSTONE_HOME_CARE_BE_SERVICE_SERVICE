import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { CommonModule } from 'libs/common/src';
import { ConfigModule } from 'libs/common/src/modules/config.module';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';

@Module({
  imports: [CommonModule, ConfigModule,

  ],
  controllers: [ServicesController, CategoriesController],
  providers: [ServicesService, CategoriesService],
})
export class ServicesModule { }

import { Module } from '@nestjs/common';

import { CommonModule } from 'libs/common/src';
import { ConfigModule } from 'libs/common/src/modules/config.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
    imports: [CommonModule, ConfigModule,

    ],
    controllers: [CategoriesController],
    providers: [CategoriesService],
})
export class ServicesModule { }

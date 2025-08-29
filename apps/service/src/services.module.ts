import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { CommonModule } from 'libs/common/src';
import { ConfigModule } from 'libs/common/src/modules/config.module';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { OpenAiResearchProcessor } from './AI/openai-research.processor';
import { ChatController } from './AI/chat.controller';


@Module({
  imports: [CommonModule, ConfigModule,

  ],
  controllers: [ServicesController, CategoriesController, ChatController],
  providers: [ServicesService, CategoriesService, OpenAiResearchProcessor],
  exports: [OpenAiResearchProcessor],
})
export class ServicesModule { }





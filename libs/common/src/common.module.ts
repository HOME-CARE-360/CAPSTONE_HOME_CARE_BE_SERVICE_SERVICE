import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { PaymentAPIKeyGuard } from './guards/api-key.guard';
import { EmailService } from './services/email.service';
import { SharedUserRepository } from './repositories/shared-user.repo';
import { TwoFactorService } from './services/2fa.service';

import { SharedProviderRepository } from './repositories/share-provider.repo';
import { SharedRoleRepository } from './repositories/shared-role.repo';
import { S3Service } from './services/S3.service';
import { ShareStaffRepository } from './repositories/shared-staff.repo';
import { SharedCategoryRepository } from './repositories/shared-category.repo';
import { ShareServicesRepository } from './repositories/shared-service.repo';
import { OpenAiResearchService } from './services/AI.services';
const sharedServices = [
  PrismaService,
  HashingService,
  TokenService,
  OpenAiResearchService,
  PaymentAPIKeyGuard,
  EmailService,
  SharedUserRepository,
  TwoFactorService,
  SharedProviderRepository
  , SharedRoleRepository,
  S3Service,
  ShareStaffRepository,
  SharedCategoryRepository,
  ShareServicesRepository

]

@Global()
@Module({
  providers: [
    ...sharedServices
  ],
  exports: sharedServices,
  imports: [JwtModule],
})
export class CommonModule { }
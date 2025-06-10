import { PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import mime from 'mime-types'


@Injectable()
export class S3Service {
    private s3: S3
    constructor(private configService: ConfigService) {
        this.s3 = new S3({
            endpoint: this.configService.get<string>("S3_ENPOINT"),
            region: this.configService.get<string>("S3_REGION"),
            forcePathStyle: true,
            credentials: {
                secretAccessKey: this.configService.get<string>("S3_SECRET_KEY") as string,
                accessKeyId: this.configService.get<string>("S3_ACCESS_KEY") as string,

            },
        })
    }
    createPresignedUrlWithClient(filename: string) {
        const contentType = mime.lookup(filename) || 'application/octet-stream'


        const command = new PutObjectCommand({ Bucket: this.configService.get<string>("S3_BUCKET_NAME"), Key: filename, ContentType: contentType, })
        try {
            getSignedUrl(this.s3, command, { expiresIn: 10 })

        } catch (error) {
            console.log(error);

        }
        return getSignedUrl(this.s3, command, { expiresIn: 10 })



    }
}
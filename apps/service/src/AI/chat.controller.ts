
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatService } from 'libs/common/src/services/chatAI.service';
import {
    ChatRequest,
} from 'libs/common/src/request-response-type/chatAI/chat.model';
import { Controller } from '@nestjs/common';

@Controller("chat")
export class ChatMsController {
    constructor(private readonly chat: ChatService) { }

    @MessagePattern({ cmd: 'chat' })
    async talk(@Payload() data: ChatRequest) {
        return this.chat.chat(data.message, data.history ?? []);
    }
}

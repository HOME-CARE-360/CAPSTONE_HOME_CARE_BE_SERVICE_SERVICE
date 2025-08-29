
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatService } from 'libs/common/src/services/chatAI.service';
import {
    ChatRequest,
    ChatStreamQuery,
    ChatHistoryItem,
    chatRequestSchema,
} from 'libs/common/src/request-response-type/chatAI/chat.model';
import { Subject, Observable } from 'rxjs';

@Controller()
export class ChatMsController {
    constructor(private readonly chat: ChatService) { }

    @MessagePattern({ cmd: 'chat' })
    async talk(@Payload() data: ChatRequest) {
        return this.chat.chat(data.message, data.history ?? []);
    }

    @MessagePattern({ cmd: 'stream' })
    stream(@Payload() data: ChatStreamQuery): Observable<{ type?: string; data: any }> {
        const bus = new Subject<{ type?: string; data: any }>();


        let history: ChatHistoryItem[] = [];
        if (data.history) {
            try {
                const json = Buffer.from(data.history, 'base64').toString('utf8');
                const arr = JSON.parse(json);
                const { history: validated } = chatRequestSchema.pick({ history: true }).parse({ history: arr });
                history = validated ?? [];
            } catch {
                bus.next({ type: 'status', data: 'Invalid history format, ignoring.' });
            }
        }

        (async () => {
            try {
                bus.next({ type: 'status', data: 'Đang xử lý…' });
                const res = await this.chat.chat(data.message, history);
                bus.next({ data: res });
                bus.next({ type: 'done', data: { done: true } });
                bus.complete();
            } catch (e) {
                bus.next({ type: 'error', data: 'Đã có lỗi khi xử lý.' });
                bus.complete();
            }
        })();

        return bus.asObservable();
    }
}

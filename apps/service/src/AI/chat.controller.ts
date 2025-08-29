import {
    Body,
    Controller,
    HttpCode,
    MessageEvent,
    Post,
    Query,
    Sse,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { ChatService } from 'libs/common/src/services/chatAI.service';
import { ChatHistoryItem, ChatRequest, chatRequestSchema, ChatStreamQuery } from 'libs/common/src/request-response-type/chatAI/chat.model';


@Controller('chat')
export class ChatController {
    constructor(private readonly chat: ChatService) { }
    @Post('')
    @HttpCode(200)
    async talk(@Body() body: ChatRequest) {
        const res = await this.chat.chat(body.message, body.history ?? []);
        return res;
    }
    @Sse('stream')
    stream(@Query() query: ChatStreamQuery): Observable<MessageEvent> {
        const bus = new Subject<MessageEvent>();

        let history: ChatHistoryItem[] = [];
        if (query.history) {
            try {
                const json = Buffer.from(query.history, 'base64').toString('utf8');
                const arr = JSON.parse(json);
                const { history: validated } = chatRequestSchema
                    .pick({ history: true })
                    .parse({ history: arr });

                history = validated ?? [];
            } catch {
                bus.next({ type: 'status', data: 'Invalid history format, ignoring.' });
            }
        }

        (async () => {
            try {
                bus.next({ type: 'status', data: 'Đang xử lý…' });
                const res = await this.chat.chat(query.message, history);
                bus.next({ data: res });

                bus.next({ type: 'done', data: { done: true } });
                bus.complete();
            } catch {
                bus.next({ type: 'error', data: 'Đã có lỗi khi xử lý.' });
                bus.complete();
            }
        })();

        return bus.asObservable();
    }
}

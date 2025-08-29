import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService, ChatMsg } from './openai.service';
import { DbToolsService } from './db-tools.service';
import { tools } from 'libs/common/helpers';
import { DomainGuard } from '../guards/domain.guard';


type HistoryMsg = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    private readonly STRICT = true;

    private readonly CLF_THRESHOLD = 0.7;

    constructor(
        private readonly openai: OpenAIService,
        private readonly db: DbToolsService,
    ) { }

    private systemPrompt = `
You are an AI assistant for a home-care marketplace. 
- If the user asks about *services, providers, categories*, call the relevant DB tool to fetch fresh data.
- Answer concisely with bullet points or compact tables when helpful.
- If no results, explain clearly and suggest useful filters.
- Timezone: Asia/Ho_Chi_Minh.
`;

    private buildDataFromToolResults(toolResults: Array<{ tool: string; args: any; result: any }>) {
        if (!toolResults.length) return null;
        if (toolResults.length === 1) {
            const only = toolResults[0];
            if (only.tool === 'db_find_services') {
                if (Array.isArray(only.result)) return only.result.length === 1 ? { service: only.result[0] } : { services: only.result };
                return { services: only.result };
            }
            if (only.tool === 'db_find_providers') return { providers: Array.isArray(only.result) ? only.result : [only.result] };
            if (only.tool === 'db_find_categories') return { categories: Array.isArray(only.result) ? only.result : [only.result] };
            return { result: only.result };
        }
        const data: Record<string, any> = {};
        for (const t of toolResults) {
            if (t.tool === 'db_find_services') data.services = t.result;
            else if (t.tool === 'db_find_providers') data.providers = t.result;
            else if (t.tool === 'db_find_categories') data.categories = t.result;
            else data[t.tool] = t.result;
        }
        return data;
    }

    private async isInDomainOrRefuse(userMessage: string, history: HistoryMsg[]) {
        const combined = [userMessage, ...history.map(h => h.content)].join(' ');
        if (DomainGuard.isLikelyInDomain(combined)) return true;

        const clf = await this.openai.classifyInDomain(combined);
        if (clf.in_domain && clf.confidence >= this.CLF_THRESHOLD) return true;

        if (this.STRICT) return false;

        return false;
    }

    async chat(userMessage: string, history: HistoryMsg[] = []) {
        try {
            const inDomain = await this.isInDomainOrRefuse(userMessage, history);
            if (!inDomain && this.STRICT) {
                return {
                    content:
                        'Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến dịch vụ chăm sóc tại nhà (dịch vụ, nhà cung cấp, danh mục, giá, đặt lịch, sửa chữa/vệ sinh).',
                    data: null,
                };
            }

            const messages: ChatMsg[] = [
                { role: 'system', content: this.systemPrompt },
                ...history,
                { role: 'user', content: userMessage },
            ];

            const enableTools = true;
            const toolResults: Array<{ tool: string; args: any; result: any }> = [];

            for (let i = 0; i < 3; i++) {
                const resp = await this.openai.respond(
                    messages,
                    enableTools ? { tools, toolChoice: 'auto' } : undefined
                );

                const msg = resp.choices?.[0]?.message as any;
                if (!msg) return { content: 'Xin lỗi, mình chưa tạo được câu trả lời.', data: null };

                const toolCalls = msg.tool_calls ?? [];

                if (toolCalls.length === 0) {
                    return { content: msg.content ?? '', data: this.buildDataFromToolResults(toolResults) };
                }

                messages.push({
                    role: 'assistant',
                    content: msg.content ?? '',
                    tool_calls: toolCalls.map((tc: any) => ({
                        id: tc.id,
                        type: 'function',
                        function: {
                            name: tc.function?.name ?? '',
                            arguments: tc.function?.arguments ?? '{}',
                        },
                    })),
                });

                for (const tc of toolCalls) {
                    const toolName = tc.function?.name as string | undefined;
                    const argsRaw = (tc.function?.arguments as string) ?? '{}';

                    let args: any = {};
                    try { args = JSON.parse(argsRaw); } catch { args = {}; }

                    let result: any;
                    switch (toolName) {
                        case 'db_find_services':
                            result = await this.db.findServices(args);
                            break;
                        case 'db_find_providers':
                            result = await this.db.findProviders(args);
                            break;
                        case 'db_find_categories':
                            result = await this.db.findCategories(args);
                            break;
                        default:
                            result = { error: 'Unknown tool name', received: toolName };
                            break;
                    }

                    toolResults.push({ tool: toolName ?? 'unknown_tool', args, result });

                    messages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: JSON.stringify(result ?? null),
                    });
                }
            }

            return {
                content:
                    'Yêu cầu này cần quá nhiều lần gọi công cụ. Bạn có thể thu hẹp câu hỏi hoặc bổ sung tiêu chí không?',
                data: this.buildDataFromToolResults(toolResults),
            };
        } catch (err: any) {
            this.logger.error('Chat error', err?.stack || err);
            return { content: 'Xin lỗi, đã có lỗi trong quá trình xử lý.', data: null };
        }
    }
}

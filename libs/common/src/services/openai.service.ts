import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';
export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
export type ChatMsg = { role: ChatRole; content: string; tool_calls?: ToolCall[]; tool_call_id?: string };

type RespondOpts = { tools?: any; toolChoice?: 'auto' | 'none' };

@Injectable()
export class OpenAIService {
    private readonly logger = new Logger(OpenAIService.name);
    private readonly client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    private readonly model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    private readonly clfModel = process.env.OPENAI_CLF_MODEL ?? 'gpt-4o-mini';

    respond(messages: ChatMsg[], opts?: RespondOpts) {
        const payload = messages.map((m: any) => {
            if (m.role === 'tool') return { role: 'tool', content: String(m.content ?? ''), tool_call_id: m.tool_call_id };
            if (m.role === 'assistant') {
                const out: any = { role: 'assistant', content: m.content ?? '' };
                if (Array.isArray(m.tool_calls) && m.tool_calls.length) {
                    out.tool_calls = m.tool_calls.map((tc: any) => ({
                        id: tc.id,
                        type: 'function',
                        function: {
                            name: tc.function?.name,
                            arguments: typeof tc.function?.arguments === 'string' ? tc.function.arguments : JSON.stringify(tc.function?.arguments ?? '{}'),
                        },
                    }));
                }
                return out;
            }
            return { role: m.role, content: m.content ?? '' };
        });

        const req: any = { model: this.model, messages: payload };
        if (opts?.tools) {
            req.tools = opts.tools;
            if (opts.toolChoice) req.tool_choice = opts.toolChoice;
        }
        return this.client.chat.completions.create(req);
    }

    async classifyInDomain(text: string): Promise<{ in_domain: boolean; intent: string; confidence: number }> {
        const sys =
            `You are a strict domain intent classifier for a home-care marketplace.
Return ONLY a JSON object with fields:
- in_domain: true|false (true if the user message is about home-care marketplace topics: services, providers, categories, prices, booking, repair/cleaning/home-care tasks…)
- intent: short snake_case label (e.g., "find_services", "ask_provider", "small_talk", "general_knowledge")
- confidence: number from 0 to 1.
No extra text.`;

        const res = await this.client.chat.completions.create({
            model: this.clfModel,
            response_format: { type: 'json_object' }, // ép JSON
            messages: [
                { role: 'system', content: sys },
                { role: 'user', content: text || '' },
            ],
        });

        const raw = res.choices?.[0]?.message?.content ?? '{}';
        try {
            const obj = JSON.parse(raw);
            return {
                in_domain: !!obj.in_domain,
                intent: String(obj.intent ?? ''),
                confidence: Number(obj.confidence ?? 0),
            };
        } catch {
            return { in_domain: false, intent: 'parse_error', confidence: 0 };
        }
    }
}

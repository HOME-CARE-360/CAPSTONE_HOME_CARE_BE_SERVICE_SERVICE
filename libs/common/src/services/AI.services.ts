
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'libs/common/src/services/prisma.service';
import fetch from 'node-fetch';

type Candidate = {
    source: string;
    url: string;
    title: string;
    imageUrl?: string;
    brand?: string;
    model?: string;
    price?: number;
    currency?: string;
    discountPct?: number;
    releaseDate?: string;
    productId?: string;
};

type Ranked = Candidate & {
    score: number;
    reason: string;
    normalizedTitle?: string;
    normalizedBrand?: string;
    normalizedModel?: string;
    isNewer?: boolean;
};

@Injectable()
export class OpenAiResearchService {
    private readonly OPENAI_KEY: string;
    private readonly OPENAI_MODEL: string;
    private readonly OPENAI_BASE: string;
    private readonly SERP_KEY?: string;
    private readonly MODE: 'serpapi' | 'mock';
    private readonly RESEARCH_MAX_ASSETS: number;
    private readonly RESEARCH_MAX_CANDIDATES: number;
    private readonly MIN_SCORE: number;
    private readonly FETCH_PRODUCT_IMAGES: boolean;

    constructor(
        private readonly cfg: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.OPENAI_KEY = this.cfg.get<string>('OPENAI_API_KEY') ?? process.env.OPENAI_API_KEY ?? '';
        this.OPENAI_MODEL = this.cfg.get<string>('OPENAI_RESEARCH_MODEL') ?? 'gpt-4o-mini';
        this.OPENAI_BASE = this.cfg.get<string>('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
        this.SERP_KEY = this.cfg.get<string>('SERPAPI_KEY') ?? process.env.SERPAPI_KEY;
        this.MODE = (this.cfg.get<string>('RESEARCH_MODE')?.toLowerCase() as any) || (this.SERP_KEY ? 'serpapi' : 'mock');

        this.RESEARCH_MAX_ASSETS = Number(this.cfg.get('RESEARCH_MAX_ASSETS') ?? 100);
        this.RESEARCH_MAX_CANDIDATES = Number(this.cfg.get('RESEARCH_MAX_CANDIDATES') ?? 30);
        this.MIN_SCORE = Number(this.cfg.get('MIN_SCORE') ?? 0.25);
        this.FETCH_PRODUCT_IMAGES = (this.cfg.get('SERPAPI_FETCH_PRODUCT_IMAGES') ?? 'false').toString().toLowerCase() === 'true';

        if (!this.OPENAI_KEY) throw new Error('Missing OPENAI_API_KEY');
    }

    /** Public API: chạy cho 1 customer (hoặc tất cả) và ghi suggestion */
    async researchAndSuggestForCustomer(opts: { customerId?: number | null; maxPerAsset?: number } = {}) {
        const { customerId = null, maxPerAsset = Number(process.env.MAX_PER_ASSET ?? 5) } = opts;

        const where = customerId ? { customerId } : {};
        const assets = await this.prisma.customerAsset.findMany({
            where,
            include: { Category: true },
            orderBy: { id: 'asc' },
            take: this.RESEARCH_MAX_ASSETS,
        });

        let createdOrUpdated = 0;

        for (const asset of assets) {
            const queries = this.buildQueriesFromAsset(asset);
            const raw: Candidate[] = [];

            for (const q of queries) {
                const portion = await this.searchCandidates(q);
                raw.push(...portion);
            }
            console.log("raw");

            console.log(raw[0]);

            const dedup = new Map<string, Candidate>();
            for (const c of raw) if (c.url) dedup.set(`${c.source}::${c.url}`, c);
            const unique = Array.from(dedup.values()).slice(0, this.RESEARCH_MAX_CANDIDATES);
            console.log("unique");
            console.log(unique);


            const ranked = await this.rankWithOpenAI({
                asset: {

                    brand: asset.brand ?? '',
                    model: asset.model ?? '',
                    category: asset.Category?.name ?? '',
                    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
                },
                candidates: unique,
                take: maxPerAsset,
            });
            console.log("ranked");

            console.log(ranked);


            let picked: Ranked[] = (ranked || [])
                .filter(r => typeof r.score === 'number' && r.score >= this.MIN_SCORE)
                .sort((a, b) => b.score - a.score)
                .slice(0, maxPerAsset);

            picked = picked.map(r => {
                const ensuredUrl = r.url?.trim() || this.findUrlInCandidates(unique, r);
                return { ...r, url: ensuredUrl! };
            }).filter(r => !!r.url);


            if (picked.length < maxPerAsset) {
                const remain = unique
                    .filter(c => !picked.some(p => p.url === c.url))
                    .map<Ranked>((c) => {
                        const sameBrand = this.same(asset.brand, c.brand);
                        const sameModel = this.same(asset.model, c.model);
                        const rec = c.releaseDate ? 0.2 : 0;
                        const promo = Math.min((c.discountPct ?? 0) / 100, 0.5);
                        const sim = (sameBrand ? 0.3 : 0) + (sameModel ? 0.3 : 0);
                        const score = promo * 0.6 + rec + sim;

                        const reason = [
                            sameBrand ? 'Cùng brand' : null,
                            sameModel ? 'Cùng model/dòng' : null,
                            c.discountPct ? `Ưu đãi ~${c.discountPct}%` : null,
                            c.releaseDate ? 'Có ngày phát hành' : null,
                        ].filter(Boolean).join(' · ');

                        return {
                            ...c,
                            score,
                            reason,
                            normalizedBrand: c.brand,
                            normalizedModel: c.model,
                            normalizedTitle: c.title,
                        };
                    })
                    .sort((a, b) => b.score - a.score)
                    .slice(0, maxPerAsset - picked.length);

                picked = picked.concat(remain);
            }


            for (const r of picked) {
                if (!r.url) continue;
                console.log(r.imageUrl);

                const product = await this.prisma.externalProduct.upsert({
                    where: { source_url: { source: r.source, url: r.url } },
                    update: {
                        title: r.normalizedTitle ?? r.title,
                        brand: r.normalizedBrand ?? r.brand,
                        model: r.normalizedModel ?? r.model,
                        categoryId: asset.categoryId,
                        price: r.price,
                        currency: r.currency ?? 'VND',
                        discountPct: r.discountPct,
                        releaseDate: r.releaseDate ? new Date(r.releaseDate) : undefined,
                        scrapedAt: new Date(),
                        updatedAt: new Date(),
                        ...(r.imageUrl ? { imageUrl: r.imageUrl } : {}),
                    },
                    create: {
                        source: r.source,
                        url: r.url,
                        title: r.normalizedTitle ?? r.title,
                        imageUrl: r.imageUrl ?? null,
                        brand: r.normalizedBrand ?? r.brand,
                        model: r.normalizedModel ?? r.model,
                        categoryId: asset.categoryId,
                        price: r.price,
                        currency: r.currency ?? 'VND',
                        discountPct: r.discountPct,
                        releaseDate: r.releaseDate ? new Date(r.releaseDate) : undefined,
                        scrapedAt: new Date(),
                        updatedAt: new Date(),
                    },
                });

                await this.prisma.assetSuggestion.upsert({
                    where: { customerAssetId_productId: { customerAssetId: asset.id, productId: product.id } },
                    update: { score: r.score, reason: r.reason, status: 'NEW', updatedAt: new Date() },
                    create: {
                        customerAssetId: asset.id,
                        productId: product.id,
                        score: r.score,
                        reason: r.reason,
                        status: 'NEW',
                        updatedAt: new Date(),
                    },
                });

                createdOrUpdated++;
            }

            console.log(`[OpenAI-Research] asset#${asset.id} queries=${queries.length} cand=${unique.length} inserted=${picked.length}`);
        }

        return { success: true, assets: assets.length, createdOrUpdated, mode: this.MODE };
    }


    private buildQueriesFromAsset(asset: any): string[] {
        const brand = asset.brand ?? '';
        const model = asset.model ?? '';
        const cat = asset.Category?.name ?? '';
        const base = [brand, model, cat].filter(Boolean).join(' ').trim() || 'điện máy';
        return [
            `${base} khuyến mãi`,
            `${base} giảm giá`,
            `${base} đời mới 2025`,
            `${brand} ${model}`.trim(),
        ].filter(Boolean);
    }

    private async searchCandidates(query: string): Promise<Candidate[]> {
        if (this.MODE === 'serpapi' && this.SERP_KEY) {
            const url = new URL('https://serpapi.com/search.json');
            url.searchParams.set('engine', 'google_shopping');
            url.searchParams.set('q', query);
            url.searchParams.set('hl', 'vi');
            url.searchParams.set('gl', 'vn');
            url.searchParams.set('api_key', this.SERP_KEY);
            url.searchParams.set('num', '20');

            const res = await fetch(url.toString());
            const json: any = await res.json();
            if (!res.ok) {
                console.warn('[SerpAPI] non-OK', json?.error || res.statusText);
                return [];
            }

            const items: any[] = json.shopping_results ?? [];


            const out: Candidate[] = [];


            for (const it of items) {
                const productUrl = this.pickBestProductUrl(it);
                if (!productUrl) continue;

                const thumb =
                    this.normalizeUrl(it?.thumbnail) ||
                    this.normalizeUrl(it?.serpapi_thumbnails?.[0]) ||
                    this.normalizeUrl(it?.thumbnails?.[0]);

                const imageUrl = thumb ?? (await this.pickImageUrl(it)); // fallback nếu thiếu

                const price = this.parsePriceToNumber(it.price ?? it.extracted_price);
                const { brand, model } = this.guessBrandModelFromTitle(it.title || '');
                const source = (it?.source && typeof it.source === 'string') ? it.source : 'google';


                out.push({
                    source,
                    url: productUrl,
                    title: it.title,
                    imageUrl,
                    brand,
                    model,
                    price: price ?? undefined,
                    currency: 'VND',
                    discountPct: undefined,
                    releaseDate: undefined,
                    productId: it?.product_id,
                });
            }
            // out.map((item) => console.log(item.imageUrl))

            return out;
        }


        const now = Date.now();
        const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
        return [
            {
                source: 'mock',
                url: `https://mock.local/buy?p=${encodeURIComponent(query)}&i=1`,
                title: `${query} – Giảm ${rand(10, 25)}%`,
                imageUrl: 'https://picsum.photos/seed/a/640/480',
                price: rand(5_000_000, 12_000_000),
                currency: 'VND',
                discountPct: rand(10, 25),
                releaseDate: new Date(now - rand(10, 300) * 86400000).toISOString(),
            },
            {
                source: 'mock',
                url: `https://mock.local/buy?p=${encodeURIComponent(query)}&i=2`,
                title: `${query} đời 2025 – Flash Sale`,
                imageUrl: 'https://picsum.photos/seed/b/640/480',
                price: rand(6_000_000, 14_000_000),
                currency: 'VND',
                discountPct: rand(5, 18),
                releaseDate: new Date(now - rand(10, 200) * 86400000).toISOString(),
            },
            {
                source: 'mock',
                url: `https://mock.local/buy?p=${encodeURIComponent(query)}&i=3`,
                title: `${query} ưu đãi online`,
                imageUrl: 'https://picsum.photos/seed/c/640/480',
                price: rand(6_000_000, 9_000_000),
                currency: 'VND',
                discountPct: rand(0, 15),
                releaseDate: undefined,
            },
        ];
    }


    private normalizeUrl(u?: string | null): string | undefined {
        if (!u) return undefined;
        let s = u.trim();
        if (!s) return undefined;
        if (s.startsWith('//')) s = 'https:' + s;
        if (!/^https?:\/\//i.test(s)) return undefined;
        return s;
    }

    private isLikelyImageUrl(u: string): boolean {
        return /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(u);
    }

    private pickBestProductUrl(it: any): string | undefined {
        const cands = [it?.link, it?.product_link, it?.source?.link];
        for (const raw of cands) {
            const u = this.normalizeUrl(raw);
            if (u && !this.isLikelyImageUrl(u)) return u;
        }
        return undefined;
    }

    private pickImageUrlLocal(it: any): string | undefined {
        const cands = [
            it?.thumbnail,
            it?.serpapi_thumbnails?.[0],
            it?.thumbnails?.[0],
            it?.product_photos?.[0]?.link,
            it?.images?.[0],
            it?.image,
        ];
        for (const raw of cands) {
            const u = this.normalizeUrl(raw);
            if (u && this.isLikelyImageUrl(u)) return u;
        }
        return undefined;
    }

    private async fetchSerpProductImages(productId?: string, serpApiProductUrl?: string): Promise<string[]> {
        if (!this.FETCH_PRODUCT_IMAGES || !this.SERP_KEY) return [];
        const endpoints: string[] = [];

        if (serpApiProductUrl) endpoints.push(serpApiProductUrl);
        if (productId) {
            endpoints.push(`https://serpapi.com/search.json?engine=google_product&product_id=${encodeURIComponent(productId)}&hl=vi&gl=vn&api_key=${this.SERP_KEY}`);
            endpoints.push(`https://serpapi.com/search.json?engine=google_shopping_product&product_id=${encodeURIComponent(productId)}&hl=vi&gl=vn&api_key=${this.SERP_KEY}`);
        }

        const imgs = new Set<string>();

        for (const ep of endpoints) {
            try {
                const res = await fetch(ep);
                const json: any = await res.json();
                if (!res.ok) continue;

                const push = (raw?: string) => {
                    const u = this.normalizeUrl(raw);
                    if (u && this.isLikelyImageUrl(u)) imgs.add(u);
                };

                if (Array.isArray(json?.product_photos)) {
                    for (const p of json.product_photos) push(p?.link || p?.source);
                }
                if (Array.isArray(json?.images)) {
                    for (const p of json.images) push(p?.link || p?.source || p);
                }
                if (Array.isArray(json?.images_results)) {
                    for (const p of json.images_results) push(p?.original || p?.thumbnail);
                }
                push(json?.thumbnail);
            } catch {
                // ignore endpoint errors
            }
        }

        return Array.from(imgs);
    }

    private async pickImageUrl(it: any): Promise<string | undefined> {
        const local = this.pickImageUrlLocal(it);
        if (local) return local;

        const productId = it?.product_id;
        const serpApiProductUrl = this.normalizeUrl(it?.serpapi_product_api);
        const images = await this.fetchSerpProductImages(productId, serpApiProductUrl);
        return images[0];
    }

    private parsePriceToNumber(p: any): number | undefined {
        if (typeof p === 'number') return p;
        if (typeof p === 'string') {
            const digits = p.replace(/[^\d]/g, '');
            return digits ? Number(digits) : undefined;
        }
        return undefined;
    }

    private guessBrandModelFromTitle(title: string): { brand?: string; model?: string } {
        const commonVi = new Set([
            'điều', 'hòa', 'máy', 'lạnh', 'tủ', 'giặt', 'nồi', 'cơm', 'quạt', 'bàn', 'ghế',
            'cao', 'cấp', 'chính', 'hãng', 'inverter', 'điện', 'nước'
        ]);
        const toks = (title || '').split(/\s+/).filter(Boolean);
        let brand: string | undefined;
        let model: string | undefined;

        for (const tok of toks) {
            const t = tok.toLowerCase();
            if (commonVi.has(t)) continue;
            // eslint-disable-next-line no-useless-escape
            if (!brand && /^[A-Z][A-Za-z0-9\-]{2,}$/.test(tok)) { brand = tok; continue; }
            // eslint-disable-next-line no-useless-escape
            if (brand && !model && /^[A-Za-z0-9\-]{2,}$/.test(tok)) { model = tok; break; }
        }
        return { brand, model };
    }

    private same(a?: string | null, b?: string | null): boolean {
        const na = (a ?? '').trim().toLowerCase();
        const nb = (b ?? '').trim().toLowerCase();
        if (!na || !nb) return false;
        return na === nb || na.includes(nb) || nb.includes(na);
    }

    private findUrlInCandidates(
        cands: Candidate[],
        r: { url?: string; title?: string; normalizedTitle?: string },
    ): string | undefined {
        if (r.url && r.url.trim() && !this.isLikelyImageUrl(r.url)) return r.url.trim();
        const titleKey = (r.normalizedTitle || r.title || '').trim();
        if (!titleKey) return undefined;
        const found = cands.find(c => !!c.url && c.title === titleKey);
        return found?.url;
    }

    private async rankWithOpenAI(input: {
        asset: { brand: string; model: string; category: string; purchaseDate: string | null };
        candidates: Candidate[];
        take: number;
    }): Promise<Ranked[]> {
        const body = {
            model: this.OPENAI_MODEL,
            response_format: { type: 'json_object' as const },
            temperature: 0.2,
            messages: [
                {
                    role: 'system',
                    content:
                        'Bạn là trợ lý TMĐT. Hãy chọn sản phẩm đáng gợi ý nhất dựa trên thiết bị hiện có của người dùng. Ưu tiên: (1) đang giảm giá/ưu đãi, (2) đời mới hơn, (3) cùng brand/model hoặc cùng dòng. Trả về JSON { "recommendations": [...] }.',
                },
                {
                    role: 'user',
                    content: JSON.stringify({
                        pick_top_k: input.take,
                        prefer_discount: true,
                        prefer_newer: true,
                        prefer_same_brand_or_line: true,
                        asset: input.asset,
                        candidates: input.candidates,
                        expected_schema: {
                            recommendations: [
                                {
                                    source: 'string',
                                    url: 'string (purchase link, required)',
                                    normalizedTitle: 'string',
                                    normalizedBrand: 'string?',
                                    normalizedModel: 'string?',
                                    imageUrl: 'image product link  required',
                                    price: 'number?',
                                    currency: 'string?',
                                    discountPct: 'number?',
                                    isNewer: 'boolean?',
                                    releaseDate: 'string (ISO)?',
                                    score: '0..1',
                                    reason: 'string',
                                },
                            ],
                        },
                    }),
                },
            ],
        };

        const res = await fetch(`${this.OPENAI_BASE}/chat/completions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.OPENAI_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const json: any = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.warn('[OpenAI-rank] non-OK:', json?.error || res.statusText);
            return [];
        }

        try {
            const txt = json?.choices?.[0]?.message?.content ?? '{}';
            const obj = JSON.parse(txt);
            const arr = (obj?.recommendations ?? []) as Ranked[];
            return Array.isArray(arr) ? arr : [];
        } catch {
            console.warn('[OpenAI-rank] invalid JSON output');
            return [];
        }
    }
}

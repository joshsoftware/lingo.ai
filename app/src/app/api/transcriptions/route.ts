import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { PAGINATION_LIMIT } from "@/constants/pagination";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;


export async function GET(req: NextRequest) {
    try {

        const cursor = parseInt(req.nextUrl.searchParams.get('cursor') || '0');
        const filter = req.nextUrl.searchParams.get('filter') || 'false';

        
        if (filter !== 'true' && filter !== 'false' && filter !== null) {
            return new Response(JSON.stringify({ error: "Invalid filter value. Must be 'true' or 'false'." }), { status: 400 });
        }

        const isFilter = filter === 'true';

        const limit = PAGINATION_LIMIT;

        const transcriptionsData = await db
            .select({
                id: transcriptions.id,
                documentName: transcriptions.documentName,
                createdAt: transcriptions.createdAt,
                documentUrl: transcriptions.documentUrl,
                isDefault: transcriptions.isDefault,
                audioDuration: transcriptions.audioDuration,
            })
            .from(transcriptions)
            .where(eq(transcriptions.isDefault, isFilter))
            .orderBy(desc(transcriptions.createdAt))
            .offset(cursor)
            .limit(limit);

        const nextCursor = transcriptionsData.length === limit ? cursor + limit : null;

        return new Response(JSON.stringify({ transcriptions: transcriptionsData, nextCursor }), { status: 200 });

    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify(error), { status: 500 });
    }
}
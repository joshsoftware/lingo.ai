import NavigateBack from "@/components/NavigateBack";
import TranscriptionItem from "@/components/TranscriptionItem";
import { PAGINATION_LIMIT } from "@/constants/pagination";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { validateRequest } from "@/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | Transcriptions",
};

const page = async () => {
  const { user } = await validateRequest();

  const userTranscriptions = await db
    .select({
      id: transcriptions.id,
      documentName: transcriptions.documentName,
      createdAt: transcriptions.createdAt,
      documentUrl: transcriptions.documentUrl,
      isDefault: transcriptions.isDefault,
      audioDuration: transcriptions.audioDuration,
    })
    .from(transcriptions)
    .orderBy(desc(transcriptions.createdAt))
    .limit(PAGINATION_LIMIT);

  return (
    <div className="flex flex-col w-full h-full pt-8">
      <div className="flex justify-start w-full mb-8">
        <NavigateBack subHeading="Transcriptions" />
      </div>
      <div className="flex flex-col items-center overflow-y-auto h-fit w-full">
        <TranscriptionItem
          initialTranscriptionsData={userTranscriptions}
          userId={user?.id || null}
        />
      </div>
    </div>
  );
};

export default page;

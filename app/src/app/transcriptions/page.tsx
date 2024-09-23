import NavigateBack from "@/components/NavigateBack";
import TranscriptionItem from "@/components/TranscriptionItem";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | Transcriptions",
};

const page = async () => {
  const userTranscriptions = await db
    .select({
      id: transcriptions.id,
      documentName: transcriptions.documentName,
      createdAt: transcriptions.createdAt,
      documentUrl: transcriptions.documentUrl,
    })
    .from(transcriptions)
    .limit(10)
    .orderBy(desc(transcriptions.createdAt));

  return (
    <div className="flex flex-col w-full h-screen pt-16 px-0 md:px-16">
      <div className="flex justify-start w-full px-4 mt-8">
        <NavigateBack subHeading="Transcriptions" />
      </div>
      <div className="flex flex-1 justify-center items-center">
        <div className="flex flex-col w-full max-h-96 overflow-y-auto gap-4">
          {userTranscriptions.map((transcription, idx) => (
            <TranscriptionItem key={idx} index={idx} transcription={transcription} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default page;

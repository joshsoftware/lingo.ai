import { validateRequest } from "@/auth";
import NavigateBack from "@/components/NavigateBack";
import TranscriptionItem from "@/components/TranscriptionItem";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Lingo.ai | Transcriptions",
};

const page = async () => {

  // skip user signin validation for now

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
    <div className="flex flex-col w-full h-full pt-8">
      <div className="flex justify-start w-full mb-8">
        <NavigateBack subHeading="Transcriptions" />
      </div>
      <div className="flex flex-col flex-1 items-center gap-4 overflow-y-auto mb-8">
        {userTranscriptions.map((transcription, idx) => (
          <TranscriptionItem key={idx} index={idx} transcription={transcription} />
        ))}
      </div>
    </div>
  );
};

export default page;

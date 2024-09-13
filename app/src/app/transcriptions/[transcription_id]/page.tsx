// transcriptions / [transcription_id] / page.tsx

import DetailedTranscription from "@/components/DetailedTranscription";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | Transcription",
};

interface PageProps {
  params: {
    transcription_id: string;
  };
}

const page = async (props: PageProps) => {
  const { transcription_id } = props.params;

  const transcription = await db
    .select()
    .from(transcriptions)
    .where(eq(transcriptions.id, transcription_id));

  return (
    <div className="flex flex-col w-full min-h-screen overflow-y-auto justify-center items-center gap-4 pt-16 px-0 md:px-16">
      {transcription.length > 0 && (
        <DetailedTranscription transcription={transcription[0]} />
      )}
    </div>
  );
};

export default page;

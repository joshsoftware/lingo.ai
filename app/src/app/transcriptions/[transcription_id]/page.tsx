// transcriptions / [transcription_id] / page.tsx

import DetailedTranscription from "@/components/DetailedTranscription";
import NavigateBack from "@/components/NavigateBack";
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

    <div className="flex flex-col w-full h-screen pt-16 px-0 md:px-16">
      <div className="flex justify-start w-full px-4 mt-8">
        <NavigateBack subHeading={`Transcription for ${transcription[0].documentName}`} />
      </div>
      <div className="flex flex-1 justify-center items-center">
        {transcription.length > 0 && (
          <DetailedTranscription transcription={transcription[0]} />
        )}
      </div>
    </div>
  );
};

export default page;

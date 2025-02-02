import { validateRequest } from "@/auth";
import DetailedTranscription from "@/components/DetailedTranscription";
import NavigateBack from "@/components/NavigateBack";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { validate as validateUUID } from 'uuid';

export const metadata: Metadata = {
  title: "Lingo.ai | Transcription",
};

interface PageProps {
  params: Promise<{
    transcription_id: string;
  }>;
}

const page = async (props: PageProps) => {
  const { transcription_id } = (await props.params);

  if (!validateUUID(transcription_id)) {
    return notFound();
  }

  // skip user signin validation for now

  const transcription = await db
    .select()
    .from(transcriptions)
    .where(eq(transcriptions.id, transcription_id));


  if (transcription.length === 0) {
    return notFound();
  }

  return (
    <div className="flex flex-col w-full h-full pt-8">
      <div className="flex justify-start w-full mb-8">
        <NavigateBack href="/transcriptions" subHeading={`Transcription for ${transcription[0].documentName}`} />
      </div>
      <div className="flex flex-1 xl:overflow-y-auto">
        {transcription.length > 0 && (
          <DetailedTranscription transcription={transcription[0]} />
        )}
      </div>
    </div>
  );
};

export default page;
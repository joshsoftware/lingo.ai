import NavigateBack from "@/components/NavigateBack";
import InterviewAnalysisItem from "@/components/InterviewAnalysisItem";
import { db } from "@/db";
import { interviewAnalysis } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AiCruit",
};

const page = async () => {
  const interviewAnalysisList = await db
    .select({
      id: interviewAnalysis.id,
      candidateName: interviewAnalysis.candidateName,
      createdAt: interviewAnalysis.createdAt,
      status: interviewAnalysis.status,
      interviewerName: interviewAnalysis.interviewerName,
    })
    .from(interviewAnalysis)
    .limit(10)
    .orderBy(desc(interviewAnalysis.createdAt));

  return (
    <div className="flex flex-col w-full pt-8">
      <h3 className="text-2xl text-center dark:text-white mb-1">Interview Analysis</h3>
      <div className="flex justify-start w-full mb-8">
        <NavigateBack />
      </div>
      <div className="flex flex-col flex-1 items-center gap-4 overflow-y-auto mb-8">
        {interviewAnalysisList.map((interviewAnalysis, idx) => (
          <InterviewAnalysisItem key={idx} index={idx} interviewAnalysis={interviewAnalysis} />
        ))}
      </div>
    </div>
  );
};

export default page;

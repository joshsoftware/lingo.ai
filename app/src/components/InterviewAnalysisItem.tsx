'use client'

import "./InterviewAnalysisItem.css";
import { interviewAnalysisType } from "@/db/schema";
import { format } from "date-fns";
import { Button, buttonVariants } from "./ui/button";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface InterviewAnalysisProps {
  interviewAnalysis: Pick<
    interviewAnalysisType,
    "id" | "candidateName" | "createdAt" | "status" | "interviewerName"
  >;
  index: number;
}

const InterviewAnalysis = (props: InterviewAnalysisProps) => {
  const router = useRouter();
  const { interviewAnalysis, index } = props;

  const showAnalysis = () => {
    router.push(`/analysis/${interviewAnalysis.id}?f=l`);
  };

  return (
    <div
      key={index}
      className="flex flex-col md:items-center md:flex-row gap-4 w-full h-full bg-[#F9F9F9] p-4 px-4 rounded-xl justify-between items-start"
    >
      <h1 className="error-analysis-list-item-index text-ellipsis whitespace-nowrap">
        {index + 1}
      </h1>
      <h1 className="overflow-hidden text-ellipsis whitespace-nowrap w-full">
        {interviewAnalysis.candidateName} <br></br>
        Interviewer: {interviewAnalysis.interviewerName}
      </h1>
      <h1 className="text-gray-500 text-sm text-ellipsis whitespace-nowrap">
        {interviewAnalysis.createdAt
          ? format(
              new Date(interviewAnalysis.createdAt),
              "dd MMM yyyy | hh:mm a"
            )
          : "N/A"}
      </h1>
      {interviewAnalysis.status == "pending" ? (
        <p
          className="flex-1 w-full gap-2 bg-[#E2EBE7FF] text-[#668D7E] whitespace-nowrap px-4 py-2 rounded-md"
        >
          Processing
        </p>
      ) : (
        <Link
          href={`/analysis/${interviewAnalysis.id}?f=l`}
          className={buttonVariants({
            className: "!bg-[#668D7E] !hover:bg-[#668D7E] text-white whitespace-nowrap",
          })}
        >
          Show Analysis
        </Link>
      )}
    </div>
  );
};

export default InterviewAnalysis;

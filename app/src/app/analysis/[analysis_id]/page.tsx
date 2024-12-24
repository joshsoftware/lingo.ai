'use client'

import "./page.css";
import Feedback from "@/components/Feedback";
import NavigateBack from "@/components/NavigateBack";
import ReadMore from "../../../components/ReadMore";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Loader2, Logs } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "../../../components/ui/card";
import InterviewResult from "@/components/InterviewResult";
import InterviewQA from "@/components/InterviewQA";
import InterviewConversation from "@/components/InterviewConversation";
import InterviewAnalysis from "@/components/InterviewAnalysis";

type PageProps = {
  params: { analysis_id: string };
};

interface AnalysisData {
  analysisResult: any;
  candidateName: string;
  interviewerName: string;
  interviewRecordingLink: string;
  jobDescriptionDocumentLink: string;
  parsedJobDescription: string;
  questionsAnswers: any;
  transcript: string;
  conversation: string;
  summary: string;
}

const Page = (props: PageProps) => {
  const analysis_id = props.params.analysis_id;
  const searchParams = useSearchParams();
  const from = searchParams.get("f");
  const [analysisData, setAnalysisData] = useState<Partial<AnalysisData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    GetAnalysis({ id: analysis_id });
  }, [analysis_id]);

  const { mutate: GetAnalysis } = useMutation({
    mutationKey: ["GetAnalysis"],
    mutationFn: async (payload: any) => {
      setLoading(true);
      const analysis = await axios.post("/api/analyse/get", payload);
      const analysisData = analysis.data[0];
      if (analysisData) {
        const analysisResult = JSON.parse(analysisData.analysisResult);
        const data = {
          analysisResult: analysisResult,
          candidateName: analysisData.candidateName,
          interviewerName: analysisData.interviewerName,
          interviewRecordingLink: analysisData.interviewRecordingLink,
          jobDescriptionDocumentLink: analysisData.jobDescriptionDocumentLink,
          parsedJobDescription: analysisData.parsedJobDescription,
          questionsAnswers: JSON.parse(analysisData.questions_answers),
          conversation: analysisData.conversation,
          transcript: analysisData.transcript,
          summary: analysisResult.summary,
        };
        setAnalysisData(data);
      }
    },
    onSuccess: async (res: any) => {
      setLoading(false);
    },
    onError: (error) => {
      setError("Something went wrong, please try again");
      setLoading(false);
    },
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full pt-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Just a moment</p>
      </div>
    );
  }

  if (Object.keys(analysisData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full pt-8">
        <p className="mt-4">Nothing to show</p>
      </div>
    );
  }

  console.log(analysisData);

  return (
    <InterviewAnalysis
      candidateName={analysisData.candidateName ?? ""}
      interviewerName={analysisData.interviewerName}
      overview={analysisData.summary ?? ""}
      interviewLink={analysisData.interviewRecordingLink ?? ""}
      jobDescriptionLink={analysisData.jobDescriptionDocumentLink ?? ""}
      overallRating={analysisData.analysisResult.overall_rating}
      ratingScale={analysisData.analysisResult.rating_scale}
      coreSkills={analysisData.analysisResult.result.skills.core.questions}
      secondarySkills={
        analysisData.analysisResult.result.skills.secondary.questions
      }
      domainSkills={
        analysisData.analysisResult.result.domain_expertise.questions
      }
      strengths={analysisData.analysisResult.result.strengths}
      weaknesses={analysisData.analysisResult.result.weaknesses}
      conversation={[analysisData.conversation ?? ""]}
      transcript={[analysisData.transcript ?? ""]}
    />
  );

  return (
    <div className="flex flex-col w-full h-full pt-8">
      <h3 className="text-2xl text-center dark:text-white mb-1">
        Interview Analysis Report
      </h3>
      <div className="flex justify-start w-full mb-8">
        <NavigateBack href={from == "l" ? "/analysis" : "/analyse"} />
      </div>
      <div className="flex flex-col justify-start w-full mb-12">
        <div className="flex flex-row items-center mb-4">
          <h1 className="text-xl ml-2">
            Candidate Name : {analysisData.candidateName}
          </h1>
        </div>
        <div className="flex flex-row items-center mb-4">
          <h1 className="text-xl ml-2">
            Interviewer Name : {analysisData.interviewerName}
          </h1>
        </div>

        <div className="flex flex-row gap-4 m-3">
          {/* Analysis Container on the Left */}
          <div className="flex-1 analysis-container">
            <h1 className="text-xl">Analysis</h1>
            <p>Overview -</p>
            <ReadMore summary={analysisData.summary ?? ""} />
          </div>

          {/* Cards on the Right */}
          <div className="flex flex-col items-end gap-4 m-3">
            {analysisData && (
              <Card className="bg-[#fafbff] w-[300px] h-[80px] p-4 rounded-lg break-words flex items-center">
                <p>Interview</p>
                <a
                  href={analysisData.interviewRecordingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 cursor-pointer hover:underline ml-2 truncate"
                >
                  {analysisData.interviewRecordingLink}
                </a>
              </Card>
            )}
            {analysisData && (
              <Card className="bg-[#fafbff] w-[300px] h-[80px] p-4 rounded-lg break-words flex items-center">
                <p>Job Description</p>
                <a
                  href={analysisData.jobDescriptionDocumentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 cursor-pointer hover:underline ml-2 truncate"
                >
                  {analysisData.jobDescriptionDocumentLink}
                </a>
              </Card>
            )}
          </div>
        </div>
      </div>
      {analysisData && <InterviewResult analysis={analysisData} />}
      {analysisData && <InterviewQA analysis={analysisData} />}
      {analysisData && <InterviewConversation analysis={analysisData} />}
      <Feedback analysisId={analysis_id}></Feedback>
    </div>
  );
};

export default Page;

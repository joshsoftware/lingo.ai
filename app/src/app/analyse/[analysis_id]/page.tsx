'use client';

import './page.css';
import DetailedInterviewAnalysis from "@/components/DetailedInterviewAnalysis";
import Feedback from "@/components/Feedback";
import NavigateBack from "@/components/NavigateBack";
import ReadMore from "../../../components/ReadMore";
import axios from "axios";
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import { Loader2, Logs } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Card } from "../../../components/ui/card";

interface PageProps {
  params: {
    analysis_id: string;
  };
}

interface AnalysisData {
  analysisResult: any;
  candidateName: string;
  interviewRecordingLink: string;
  jobDescriptionDocumentLink: string;
  parsedJobDescription: string;
  questionsAnswers: any;
  transcript: string;
}

const Page = (props: PageProps) => {

  const { analysis_id } = props.params;
  const searchParams = useSearchParams();
  const from = searchParams.get('f')
  const [analysisData, setAnalysisData] = useState<Partial<AnalysisData>>({});
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState("");

  useEffect(() => {
    GetAnalysis({id: analysis_id});
  }, [analysis_id]);  

  const { mutate: GetAnalysis } = useMutation({
    mutationKey: ["GetAnalysis"],
    mutationFn: async (payload: any) => {
        setLoading(true);
        const analysis = await axios.post("/api/analyse/get", payload);
        const analysisData = analysis.data[0];
        console.log("Ananlysis Data : ", analysisData)
        if(analysisData) {
          const data = {
            analysisResult: JSON.parse(analysisData.analysisResult),
            candidateName: analysisData.candidateName,
            interviewRecordingLink: analysisData.interviewRecordingLink,
            jobDescriptionDocumentLink: analysisData.jobDescriptionDocumentLink,
            parsedJobDescription: analysisData.parsedJobDescription,
            questionsAnswers: JSON.parse(analysisData.questions_answers),
            conversation: analysisData.conversation,
            transcript: analysisData.transcript,
          }
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

  console.log("2 Analysis data : ",analysisData)
  
  if (Object.keys(analysisData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full pt-8">
        <p className="mt-4">Nothing to show</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col w-full h-full pt-8">
      <h3 className="text-2xl text-center dark:text-white mb-1">Interview Analysis Report</h3>
      <div className="flex justify-start w-full mb-8">
        <NavigateBack href={from == "l" ? "/analyse" : "/new"} />
      </div>
      <div className="flex flex-col justify-start w-full mb-12">
        <div className="flex flex-row items-center mb-4">
          <Logs className='w-6 h-6' />
          <h1 className="text-xl ml-2">Candidate Name : {analysisData.candidateName}</h1>
        </div>
        <div className="flex flex-row gap-4 m-3">
          {analysisData && (
            <Card className="bg-[#fafbff] w-full flex-1 max-w-xs md:max-w-full p-4 rounded-lg break-words">
              <p>Interview</p>
              <a
                href={analysisData.interviewRecordingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 cursor-pointer hover:underline"
              >
                {analysisData.interviewRecordingLink}
              </a>
            </Card>
          )}
          {analysisData && (
            <Card className="bg-[#fafbff] w-full flex-1 max-w-xs md:max-w-full p-4 rounded-lg break-words">
              <p>Job Description</p>
              <a
                href={analysisData.jobDescriptionDocumentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 cursor-pointer hover:underline"
              >
                {analysisData.jobDescriptionDocumentLink}
              </a>
            </Card>
          )}
        </div>

      </div>
      <div className="flex flex-col analysis-container">
        <h1 className="text-xl">Analysis</h1>
        Summary / Overview -
        <ReadMore summary={"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."}></ReadMore>
        {(analysisData &&
          <DetailedInterviewAnalysis analysis={analysisData} />
        )}
      </div>
      <Feedback analysisId={analysis_id}></Feedback>
    </div>
  );
};

export default Page;

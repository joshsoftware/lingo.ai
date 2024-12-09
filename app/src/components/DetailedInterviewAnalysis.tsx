"use client";
import { Card } from "./ui/card";
import './DetailedInterviewAnalysis.css';
import { CircleAlert, CircleCheck, CircleHelp, ListTodo, SquareTerminal, SquareX } from "lucide-react";

interface DetailedInterviewAnalysisProps {
  analysis: any
}

const DetailedInterviewAnalysis = ({
  analysis,
}: DetailedInterviewAnalysisProps) => {
  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-1 flex-row max-sm:flex-col w-full gap-4 justify-center items-stretch mb-8">
        <div className="analysis-section flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start mt-8">
          <div className="flex flex-row items-center">
            <SquareTerminal className="w-6 h-6 text-amber-500"/>
            <h1 className="text-xl ml-2">Conversation</h1>  
          </div>
          <p className="analysis-section-subtitle analysis-section-cause text-gray-500 mb-2">between interviewer and candidate</p>
          <Card className="analysis-section-card bg-[#fafbff] flex-1 w-full max-w-xs md:max-w-full p-4 rounded-lg break-words">
            {analysis.conversation}
         </Card>

        </div>
        
        <div className="analysis-section flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start mt-8">
          <div className="flex flex-row items-center">
            <SquareX className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl ml-2">Question and Answers</h1>
          </div>
          <p className="analysis-section-subtitle analysis-section-impact text-gray-500 mb-2">How this could affect your business</p>
          <Card className="analysis-section-card bg-[#fafbff] w-full flex-1 max-w-xs md:max-w-full p-4 rounded-lg break-words">
            { analysis.questionsAnswers.result.length > 0 ? (
              <div className="space-y-4">
                {analysis.questionsAnswers.result.map((item:any) => (
                  <div
                    key={item.id}
                    className="border-b border-gray-200 pb-4 mb-4 last:mb-0 last:border-0"
                  >
                    <h4 className="text-lg font-semibold text-gray-800">{item.question}</h4>
                    <p className="text-gray-700 mt-2">
                      <span className="font-bold">Answer: </span>
                      {item.answer}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <span className="font-bold">Rightness: </span>
                      {item.rightness}
                    </p>
                    {item.remark && (
                      <p className="text-gray-600 mt-2">
                        <span className="font-bold">Remark: </span>
                        {item.remark}
                      </p>
                    )}
                    <p className="text-gray-700 mt-2">
                      <span className="font-bold">Rating: </span>
                      {item.rating} / {analysis.questionsAnswers.rating_scale[1]}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No Question Answers</p>
            )}
          </Card>

        </div>

        <div className="analysis-section flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start xl:overflow-y-auto mt-8">
          <div className="flex flex-row items-center">
            <ListTodo className="w-6 h-6 text-teal-500"/>
            <h1 className="text-xl ml-2">Result</h1>
          </div>
          <p className="analysis-section-subtitle analysis-section-fix text-gray-500 mb-2">Steps to resolve the error</p>
          <Card className="analysis-section-card bg-[#fafbff] flex-1 w-full max-w-xs md:max-w-full xl:overflow-y-auto p-4 rounded-lg break-words">
            {analysis.analysisResult ? (
              <div>
                {/* Overall Rating */}
                <h3 className="text-lg font-semibold mt-4">Overall Rating:</h3>
                <p>{analysis.analysisResult.overall_rating}</p>

                {/* Result Details */}
                <h3 className="text-lg font-semibold mt-4">Results:</h3>
                <div>
                  {/* Skills */}
                  <h4 className="text-md font-semibold mt-2">Skills:</h4>
                  <div className="pl-4">
                    {/* Skills Must Have */}
                    <h5 className="text-sm font-semibold mt-2">Skills Must Have:</h5>
                    <p>Overall Rating: {analysis.analysisResult.result.skills.core.overall_rating}</p>
                    <ul className="list-disc pl-6">
                      {analysis.analysisResult.result.skills.core.questions.map((question: any, idx: number) => (
                        <li key={idx}>
                          <strong>Q:</strong> {question.question}<br />
                          <strong>A:</strong> {question.answer}<br />
                          <strong>Correctness:</strong> {question.correctness}<br />
                          <strong>Remark:</strong> {question.remark}<br />
                          <strong>Rating:</strong> {question.rating}
                        </li>
                      ))}
                    </ul>

                    {/* Skills Good to Have */}
                    <h5 className="text-sm font-semibold mt-2">Skills Good to Have:</h5>
                    <p>Overall Rating: {analysis.analysisResult.result.skills.secondary.overall_rating}</p>
                    <ul className="list-disc pl-6">
                      {analysis.analysisResult.result.skills.secondary.questions.map((question: any, idx: number) => (
                        <li key={idx}>
                          <strong>Q:</strong> {question.question}<br />
                          <strong>A:</strong> {question.answer}<br />
                          <strong>Correctness:</strong> {question.correctness}<br />
                          <strong>Remark:</strong> {question.remark}<br />
                          <strong>Rating:</strong> {question.rating}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Domain Expertise */}
                  <h4 className="text-md font-semibold mt-2">Domain Expertise:</h4>
                  <p>Overall Rating: {analysis.analysisResult.result.domain_expertise.overall_rating}</p>
                  <ul className="list-disc pl-6">
                    {analysis.analysisResult.result.domain_expertise.questions.map((question: any, idx: number) => (
                      <li key={idx}>
                        <strong>Q:</strong> {question.question}<br />
                        <strong>A:</strong> {question.answer}<br />
                        <strong>Correctness:</strong> {question.correctness}<br />
                        <strong>Remark:</strong> {question.remark}<br />
                        <strong>Rating:</strong> {question.rating}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Strengths */}
                <h3 className="text-lg font-semibold mt-4">Strengths:</h3>
                <ul className="list-disc pl-6">
                  {analysis.analysisResult.result.strengths.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>

                {/* Weaknesses */}
                <h3 className="text-lg font-semibold mt-4">Weaknesses:</h3>
                {analysis.analysisResult.result.weaknesses.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {analysis.analysisResult.result.weaknesses.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>None</p>
                )}
              </div>
            ) : (
              "No Final Results"
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailedInterviewAnalysis;

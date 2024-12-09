"use client";
import { Card } from "./ui/card";
import './DetailedErrorAnalysis.css';
import { SquareX } from "lucide-react";

interface InterviewQAs {
  analysis: any
}

const InterviewQA = ({
  analysis,
}: InterviewQAs) => {
  const formattedConversation = Object.entries(analysis.conversation.data).map(
    ([key, value]) => `${key === "candidate" ? "Candidate" : "Interviewer"}: ${value}`
  );
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-1 flex-row max-sm:flex-col w-full gap-4 justify-center items-stretch mb-8">        
      <div className="analysis-section flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start xl:overflow-y-auto mt-0">
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
      </div>
    </div>
  );
};

export default InterviewQA;

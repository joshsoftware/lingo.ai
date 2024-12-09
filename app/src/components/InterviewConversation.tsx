"use client";
import { Card } from "./ui/card";
import "./DetailedErrorAnalysis.css";
import { SquareTerminal } from "lucide-react";

interface InterviewConversation {
  analysis: any;
}

const InterviewConversation = ({ analysis }: InterviewConversation) => {
  const formattedConversation = Object.entries(analysis.conversation.data).map(
    ([key, value]) =>
      `${key === "candidate" ? "Candidate" : "Interviewer"}: ${value}`
  );
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-1 flex-row max-sm:flex-col w-full gap-4 justify-center items-stretch mb-8">
        <div className="analysis-section flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start mt-8">
          <div className="flex flex-row items-center">
            <SquareTerminal className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl ml-2">Conversation</h1>
          </div>
          <p className="analysis-section-subtitle analysis-section-cause text-gray-500 mb-2">
            between interviewer and candidate
          </p>
          <Card className="analysis-section-card bg-[#fafbff] flex-1 w-full max-w-xs md:max-w-full p-4 rounded-lg break-words">
            {formattedConversation.length > 0 ? (
              <ul className="list-disc pl-4">
                {formattedConversation.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              "No Cause"
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewConversation;

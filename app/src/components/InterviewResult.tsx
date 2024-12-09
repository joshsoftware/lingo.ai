import React, { useRef } from "react";
import { Card } from "./ui/card";
import { ListTodo } from "lucide-react";
import { Button } from "./ui/button";
import { jsPDF } from "jspdf";
import './DetailedInterviewAnalysis.css';

interface InterviewResultProps {
  analysis: any;
}

const InterviewResult = ({ analysis }: InterviewResultProps) => {
  const componentRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    if (componentRef.current) {
      const doc = new jsPDF();
      doc.html(componentRef.current, {
        callback: (doc:any) => {
          doc.save("interview-result.pdf");
        },
        margin: [10, 10, 10, 10], // Customize margins
        autoPaging: true,
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start xl:overflow-y-auto mt-8">
        <div className="analysis-section flex flex-1 flex-col max-h-full w-full gap-2 justify-start items-start xl:overflow-y-auto mt-8">
          <div className="flex w-full  flex-row items-center justify-between">
            <div className="flex gap-2">
              <ListTodo className="w-6 h-6 text-teal-500" />
              <h1 className="text-xl ml-2">Result</h1>
            </div>
            <Button
              className="top-0 right-0 m-4 bg-[#668D7E] hover:bg-[#668D7E] text-white"
              onClick={handlePrint}
            >
              Download Result
            </Button>
          </div>

          <p className="analysis-section-subtitle analysis-section-fix text-gray-500 mb-2">
            Compared JD and Interview QAs
          </p>
          <Card className="analysis-section-card bg-[#fafbff] flex-1 w-full max-w-xs md:max-w-full xl:overflow-y-auto p-4 rounded-lg break-words">
            {analysis.analysisResult ? (
              <div ref={componentRef}>
                <h3 className="text-lg font-semibold mt-4">Overall Rating:</h3>
                <p>{analysis.analysisResult.overall_rating}</p>

                <h3 className="text-lg font-semibold mt-4">Results:</h3>
                <div>
                  <h4 className="text-md font-semibold mt-2">Skills:</h4>
                  <div className="pl-4">
                    <h5 className="text-sm font-semibold mt-2 text-orange-900">
                      Core:
                    </h5>
                    <p>
                      Overall Rating:{" "}
                      {analysis.analysisResult.result.skills.core.overall_rating}
                    </p>
                    <ul className="list-disc pl-6">
                      {analysis.analysisResult.result.skills.core.questions.map(
                        (question: any, idx: number) => (
                          <li key={idx}>
                            <strong>Q:</strong> {question.question}
                            <br />
                            <strong>A:</strong> {question.answer}
                            <br />
                            <strong>Correctness:</strong> {question.correctness}
                            <br />
                            <strong>Remark:</strong> {question.remark}
                            <br />
                            <strong>Rating:</strong> {question.rating}
                          </li>
                        )
                      )}
                    </ul>

                    <h5 className="text-sm font-semibold mt-2 text-orange-900">
                      Secondary:
                    </h5>
                    <p>
                      Overall Rating:{" "}
                      {analysis.analysisResult.result.skills.secondary.overall_rating}
                    </p>
                    <ul className="list-disc pl-6">
                      {analysis.analysisResult.result.skills.secondary.questions.map(
                        (question: any, idx: number) => (
                          <li key={idx}>
                            <strong>Q:</strong> {question.question}
                            <br />
                            <strong>A:</strong> {question.answer}
                            <br />
                            <strong>Correctness:</strong> {question.correctness}
                            <br />
                            <strong>Remark:</strong> {question.remark}
                            <br />
                            <strong>Rating:</strong> {question.rating}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <h4 className="text-md font-semibold mt-2 text-orange-900">
                    Domain Expertise:
                  </h4>
                  <p>
                    Overall Rating:{" "}
                    {analysis.analysisResult.result.domain_expertise.overall_rating}
                  </p>
                  <ul className="list-disc pl-6">
                    {analysis.analysisResult.result.domain_expertise.questions.map(
                      (question: any, idx: number) => (
                        <li key={idx}>
                          <strong>Q:</strong> {question.question}
                          <br />
                          <strong>A:</strong> {question.answer}
                          <br />
                          <strong>Correctness:</strong> {question.correctness}
                          <br />
                          <strong>Remark:</strong> {question.remark}
                          <br />
                          <strong>Rating:</strong> {question.rating}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <h3 className="text-lg font-semibold mt-4">Strengths:</h3>
                <ul className="list-disc pl-6">
                  {analysis.analysisResult.result.strengths.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>

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

export default InterviewResult;

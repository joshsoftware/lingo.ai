import Link from "next/link";
import React from "react";
import { FaFileAlt, FaLink, FaStar, FaCheck, FaTimes } from "react-icons/fa";
import SkillDetails from "./SkillDetails";

interface InterviewAnalysisProps {
  candidateName: string;
  interviewerName?: string;
  overview: string;
  interviewLink: string;
  jobDescriptionLink: string;
  overallRating: number;
  ratingScale: Array<number>;
  coreSkills: Array<{
    question: string;
    answer: string;
    correctness: "unknown" | "wrong" | "partially right" | "right";
    rating: number;
    remark: string;
  }>;
  secondarySkills: Array<{
    question: string;
    answer: string;
    correctness: "unknown" | "wrong" | "partially right" | "right";
    rating: number;
    remark: string;
  }>;
  domainSkills: Array<{
    question: string;
    answer: string;
    correctness: "unknown" | "wrong" | "partially right" | "right";
    rating: number;
    remark: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  conversation: string[];
  transcript: string[];
}

const InterviewAnalysis: React.FC<InterviewAnalysisProps> = ({
  candidateName,
  interviewerName,
  overview,
  interviewLink,
  jobDescriptionLink,
  overallRating,
  ratingScale,
  coreSkills,
  secondarySkills,
  domainSkills,
  strengths,
  weaknesses,
  conversation,
  transcript,
}) => {
  console.log(coreSkills);
  const ratingScaleMax = React.useMemo(() => ratingScale[1], [ratingScale]);

  return (
    <div className="container mx-auto p-6 bg-gradient-to-r from-white to-gray-100 shadow-lg rounded-lg">
      {/* Header Section */}
      <header className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaFileAlt className="text-[#668D7E]" /> Interview Analysis Report
        </h1>
        <div className="text-gray-600 mt-4">
          <p>
            Candidate Name:{" "}
            <span className="font-semibold">{candidateName}</span>
          </p>
          {interviewerName && (
            <p>
              Interviewer Name:{" "}
              <span className="font-semibold">{interviewerName}</span>
            </p>
          )}
        </div>
      </header>

      {/* Overview Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700">
          Analysis Overview
        </h2>
        <p className="text-gray-600 mt-2">{overview}</p>
        <div className="bg-gray-100 p-4 mt-4 rounded-md shadow-sm">
          <p className="font-semibold flex items-center gap-2">
            <FaStar className="text-yellow-500" />
            Overall Rating:
            <span className="text-black-600">
              {" "}
              {overallRating}/{ratingScaleMax}
            </span>
          </p>
        </div>
        <div className="mt-6 flex gap-4">
          <Link
            href={interviewLink}
            target="_blank"
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md shadow-md hover:opacity-90 flex items-center gap-2"
          >
            <FaLink /> Interview Recording
          </Link>
          <Link
            href={jobDescriptionLink}
            target="_blank"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md shadow-md hover:opacity-90 flex items-center gap-2"
          >
            <FaLink /> Job Description
          </Link>
        </div>
      </section>

      {/* Results Section */}
      <section className="mb-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-700">Skills Analysis</h2>
        <SkillDetails
          title="Core Skills"
          skills={coreSkills}
          ratingScaleMax={ratingScaleMax}
        />
        <SkillDetails
          title="Secondary Skills"
          skills={secondarySkills}
          ratingScaleMax={ratingScaleMax}
        />
        <SkillDetails
          title="Domain Expertise"
          skills={domainSkills}
          ratingScaleMax={ratingScaleMax}
        />
      </section>

      {/* Strengths & Weaknesses */}
      {[
        { title: "Strengths", items: strengths },
        { title: "Weaknesses", items: weaknesses },
      ].map((section, i) => (
        <section key={i} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700">
            {section.title}
          </h2>
          <div className="bg-gray-50 p-4 mt-4 rounded-md shadow-sm">
            <ul className="list-disc pl-6 text-gray-600">
              {section.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Conversation & Transcript */}
      {[
        { title: "Conversation", items: conversation },
        { title: "Transcript", items: transcript },
      ].map((section, i) => (
        <section key={i} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700">
            {section.title}
          </h2>
          <div className="bg-gray-50 p-4 mt-4 rounded-md shadow-sm overflow-y-auto max-h-60">
            {section.items.map((line, index) => (
              <p key={index} className="text-gray-600">
                {line}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default InterviewAnalysis;

import Link from "next/link";
import React from "react";
import { FaFileAlt, FaLink, FaStar, FaCheck, FaTimes } from "react-icons/fa";
import SkillDetails from "./SkillDetails";
import { Bar, Pie } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  Title,
  Tooltip,
} from "chart.js/auto";
import CustomBarChart from "./CustomBarChart";

interface Skill {
  question: string;
  answer: string;
  correctness: "unknown" | "wrong" | "partially right" | "right";
  rating: number;
  remark: string;
}

interface InterviewAnalysisProps {
  candidateName: string;
  interviewerName?: string;
  overview: string;
  interviewLink: string;
  jobDescriptionLink: string;
  overallRating: number;
  ratingScale: Array<number>;
  coreSkills: Array<Skill>;
  secondarySkills: Array<Skill>;
  domainSkills: Array<Skill>;
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
  const ratingScaleMax = React.useMemo(() => ratingScale[1], [ratingScale]);

  // Register required components
  ChartJS.register(
    CategoryScale, // for category axis
    BarElement, // for bar chart
    Title, // for chart title
    Tooltip, // for tooltips
    Legend // for chart legend
  );

  // Bar chart data for visualization of ratings
  const skillChartMaxY = 10;
  const skillChartData = {
    labels: ["Core Skills", "Secondary Skills", "Domain Expertise"],
    datasets: [
      {
        label: `Average Rating ( out of ${skillChartMaxY} )`,
        data: [
          coreSkills.reduce((sum, skill) => sum + skill.rating, 0) /
            coreSkills.length,
          secondarySkills.reduce((sum, skill) => sum + skill.rating, 0) /
            secondarySkills.length,
          domainSkills.reduce((sum, skill) => sum + skill.rating, 0) /
            domainSkills.length,
        ],
        fill: true,
        backgroundColor: ["#637AEDFF", "#35B496FF", "#B4B235FF"],
        borderColor: ["#38B2AC", "#63B3ED", "#F6AD55"],
      },
    ],
  };

  // Pie chart data for correctness distribution
  const getCorrectnessCounts = (skills: Skill[]) => {
    const counts = { right: 0, partiallyRight: 0, wrong: 0, unknown: 0 };
    skills.forEach((skill) => {
      if (skill.correctness === "right") counts.right++;
      if (skill.correctness === "partially right") counts.partiallyRight++;
      if (skill.correctness === "wrong") counts.wrong++;
      if (skill.correctness === "unknown") counts.unknown++;
    });
    return counts;
  };

  const allSkills = [...coreSkills, ...secondarySkills, ...domainSkills];
  const correctnessCounts = getCorrectnessCounts(allSkills);
  const pieChartData = {
    labels: ["Correct", "Partially Correct", "Incorrect", "Unknown"],
    datasets: [
      {
        data: [
          correctnessCounts.right,
          correctnessCounts.partiallyRight,
          correctnessCounts.wrong,
          correctnessCounts.unknown,
        ],
        backgroundColor: ["#0E965BFF", "#9CC330FF", "#D94139FF", "#B0BEC5"],
      },
    ],
  };

  return (
    <div className="container mx-auto p-8 shadow-xl rounded-lg">
      {/* Header Section */}
      <header className="border-b pb-6 mb-8">
        <h1 className="text-4xl font-semibold text-gray-900">
          Interview Analysis Report
        </h1>
        <div className="text-gray-600 mt-4">
          <p className="text-lg">
            Candidate: <span className="font-semibold">{candidateName}</span>
          </p>
          {interviewerName && (
            <p className="text-lg">
              Interviewer:{" "}
              <span className="font-semibold">{interviewerName}</span>
            </p>
          )}
        </div>
      </header>

      {/* Overview Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-medium text-gray-800">
          Analysis Overview
        </h2>
        <p className="text-gray-600 mt-2">{overview}</p>
        <div className="bg-[#EDF2F7] p-4 mt-4 rounded-md shadow-md">
          <p className="font-semibold flex items-center gap-2">
            <FaStar className="text-yellow-500" />
            Overall Rating:{" "}
            <span className="text-gray-900">
              {overallRating}/{ratingScaleMax}
            </span>
          </p>
        </div>
        <div className="mt-6 flex gap-4">
          <Link
            href={interviewLink}
            target="_blank"
            className="px-5 py-3 bg-indigo-500 text-white rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaLink /> Interview Recording
          </Link>
          <Link
            href={jobDescriptionLink}
            target="_blank"
            className="px-5 py-3 bg-teal-500 text-white rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2"
          >
            <FaLink /> Job Description
          </Link>
        </div>
      </section>

      <section className="mb-8 flex flex-row flex-wrap gap-8 w-full items-center justify-around overflow-hidden">
        {/* Graphical Representation Section */}
        <div className="flex-1 bg-[#EDF2F7] p-4 rounded-lg">
          <h2 className="text-2xl font-medium text-gray-800">
            Skills Performance
          </h2>
          <div className="mt-4 min-h-[300px] mx-auto">
            <CustomBarChart data={skillChartData} maxY={skillChartMaxY} />
          </div>
        </div>
        {/* Pie Chart Section: Correctness Distribution */}
        <div className="flex-1 bg-[#EDF2F7] p-4 rounded-lg">
          <h2 className="text-2xl font-medium text-gray-800">
            Answers Correctness
          </h2>
          <div className="mt-4 max-w-[300px] mx-auto">
            <Pie data={pieChartData} />
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-medium text-gray-800">Skills Analysis</h2>
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
      <section className="mb-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-medium text-gray-800">Strengths</h2>
            <div className="bg-[#F7FAFC] p-4 mt-4 rounded-md shadow-md">
              <ul className="list-disc pl-6 text-gray-600">
                {strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-medium text-gray-800">Weaknesses</h2>
            <div className="bg-[#F7FAFC] p-4 mt-4 rounded-md shadow-md">
              <ul className="list-disc pl-6 text-gray-600">
                {weaknesses.map((weakness, idx) => (
                  <li key={idx}>{weakness}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Conversation & Transcript */}
      <section className="mb-8">
        {[
          { title: "Conversation", items: conversation },
          { title: "Transcript", items: transcript },
        ].map((section, i) => (
          <div key={i} className="mb-6">
            <h2 className="text-2xl font-medium text-gray-800">
              {section.title}
            </h2>
            <div className="bg-[#F7FAFC] p-4 mt-4 rounded-md shadow-md max-h-60 overflow-auto">
              {section.items.map((line, index) => (
                <p key={index} className="text-gray-600">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default InterviewAnalysis;
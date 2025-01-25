import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

interface SkillDetailsProps {
  title: string;
  skills: {
    question: string;
    answer: string;
    correctness: "unknown" | "wrong" | "partially right" | "right";
    rating: number;
    remark: string;
  }[];
  ratingScaleMax: number;
}

const SkillDetails: React.FC<SkillDetailsProps> = ({
  title,
  skills,
  ratingScaleMax,
}) => {
  console.log("Skills ",skills);
  return (
    <div className="mb-8 mt-6">
      <h3 className="text-xl text-gray-900 mb-6">{title}</h3>
      <div className="space-y-6">
        {skills.length > 0 && skills.map((skill, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            { skill.question !== "" &&
              <>
                <div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    Question: {skill.question}
                  </p>
                  <p className="text-lg text-gray-700 mb-4">
                    <strong>Answer:</strong> {skill.answer}
                  </p>
                </div>

                <div className="mt-4 flex flex-row items-end justify-between">
                  <p className="text-gray-700 text-lg">
                    <strong>Remark:</strong>{" "}
                    {skill.remark.length > 0 ? skill.remark : "--"}
                  </p>
                  <div className="flex justify-between items-center">
                    <div></div>
                    <div className="flex items-center">
                      <p className="text-gray-700 text-lg mr-2">
                        <strong>Rating:</strong> {skill.rating}/{ratingScaleMax}
                      </p>
                      <div
                        className={`${
                          skill.correctness === "right"
                            ? "bg-green-100 text-green-600"
                            : skill.correctness === "wrong"
                            ? "bg-red-100 text-red-600"
                            : skill.correctness === "partially right"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-gray-200 text-gray-600"
                        } px-3 py-1 rounded-full text-sm font-medium`}
                      >
                        {skill.correctness === "right"
                          ? "Correct"
                          : skill.correctness === "wrong"
                          ? "Incorrect"
                          : skill.correctness === "partially right"
                          ? "Partially Correct"
                          : "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            }
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillDetails;

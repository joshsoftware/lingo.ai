import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaQuestionCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa"; // For star rating
import "./SkillDetails.css";

interface Skill {
  question: string;
  answer: string;
  correctness: "unknown" | "wrong" | "partially right" | "right";
  rating: number; // Out of 10
  remark: string;
}

interface SkillDetailsProps {
  title: string;
  skills: Skill[];
  ratingScaleMax: number;
}

const SkillDetails: React.FC<SkillDetailsProps> = ({
  title,
  skills,
  ratingScaleMax,
}) => {
  const getCorrectnessIcon = (correctness: Skill["correctness"]) => {
    switch (correctness) {
      case "right":
        return <FaCheckCircle className="icon-success" title="Right" />;
      case "wrong":
        return <FaTimesCircle className="icon-error" title="Wrong" />;
      case "partially right":
        return (
          <FaExclamationTriangle
            className="icon-warning"
            title="Partially Right"
          />
        );
      case "unknown":
        return <FaQuestionCircle className="icon-neutral" title="Unknown" />;
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= ratingScaleMax; i++) {
      if (rating >= i) {
        stars.push(<FaStar key={i} className="star-icon full" />);
      } else if (rating > i - 1 && rating < i) {
        stars.push(<FaStarHalfAlt key={i} className="star-icon half" />);
      } else {
        stars.push(<FaRegStar key={i} className="star-icon empty" />);
      }
    }
    return stars;
  };

  return (
    <div className="skill-details">
      <h2>{title}</h2>
      <div className="skills-grid">
        {skills.map((skill, index) => (
          <div key={index} className="skill-card">
            <div className="skill-section">
              <h4>Question</h4>
              <p>{skill.question}</p>
            </div>
            <div className="skill-section">
              <h4>Answer</h4>
              <p>{skill.answer}</p>
            </div>
            <div className="skill-section correctness">
              <h4>Correctness</h4>
              <div className="correctness-icon">
                {getCorrectnessIcon(skill.correctness)}
                <span>{skill.correctness.replace(/-/g, " ")}</span>
              </div>
            </div>
            <div className="skill-section">
              <h4>Rating</h4>
              <div className="rating-bar">{renderStars(skill.rating)}</div>
            </div>
            <div className="skill-section">
              <h4>Remark</h4>
              <p>{skill.remark}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillDetails;

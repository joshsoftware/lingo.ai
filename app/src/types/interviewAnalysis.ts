interface PageProps {
    params: { analysis_id: string };
  }
  
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

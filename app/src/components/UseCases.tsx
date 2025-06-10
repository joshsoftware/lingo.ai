import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UseCases = () => {
  const useCases = [
    {
      title: "Rural Banking & Microfinance",
      description:
        "Enable sales teams to communicate effectively with farmers and rural customers for loan applications and financial services.",
      industry: "Financial Services",
      benefits: [
        "Increased loan approvals",
        "Better customer understanding",
        "Seamless CRM integration",
      ],
      icon: "🏦",
    },
    {
      title: "Healthcare Consultations",
      description:
        "Help healthcare providers understand patient concerns in their native language and maintain accurate medical records.",
      industry: "Healthcare",
      benefits: [
        "Improved patient care",
        "Accurate documentation",
        "Better diagnosis",
      ],
      icon: "🏥",
    },
    {
      title: "Education & Training",
      description:
        "Make educational content accessible to students and professionals who are more comfortable in Indian languages.",
      industry: "Education",
      benefits: [
        "Inclusive learning",
        "Better comprehension",
        "Skill development",
      ],
      icon: "🎓",
    },
    {
      title: "Customer Support",
      description:
        "Provide multilingual customer support with real-time translation and comprehensive interaction summaries.",
      industry: "Customer Service",
      benefits: [
        "24/7 support",
        "Higher satisfaction",
        "Reduced resolution time",
      ],
      icon: "📞",
    },
    {
      title: "Sales & CRM Integration",
      description:
        "Automatically capture and process sales calls in local languages, integrating insights directly into your CRM system.",
      industry: "Sales",
      benefits: [
        "Better lead qualification",
        "Automated data entry",
        "Enhanced follow-up",
      ],
      icon: "💼",
    },
    {
      title: "Content Creation",
      description:
        "Transform audio content in Indian languages into written material for blogs, documentation, and marketing.",
      industry: "Content & Media",
      benefits: [
        "Faster content creation",
        "Multilingual reach",
        "Cost-effective scaling",
      ],
      icon: "✍️",
    },
  ];

  return (
    <section id="use-cases" className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Transforming Industries Across India
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how Lingo.ai is empowering businesses and organizations to serve
            Indian language speakers better
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-green-50"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{useCase.icon}</div>
                  <Badge variant="secondary" className="text-xs">
                    {useCase.industry}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{useCase.title}</CardTitle>
                <CardDescription>{useCase.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Key Benefits:
                  </h4>
                  {useCase.benefits.map((benefit, idx) => (
                    <div
                      key={idx}
                      className="flex items-center text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;

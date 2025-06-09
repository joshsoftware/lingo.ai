
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      title: "Multi-Language Transcription",
      description: "Convert audio to text in 15+ major Indian languages including Hindi, Bengali, Tamil, Telugu, Marathi, and more.",
      icon: "🎙️",
      details: ["Real-time transcription", "Batch processing", "High accuracy recognition"]
    },
    {
      title: "Smart Translation",
      description: "Translate between Indian languages and English seamlessly, preserving context and cultural nuances.",
      icon: "🌐",
      details: ["Context-aware translation", "Cultural adaptation", "Multiple output formats"]
    },
    {
      title: "AI-Powered Summarization",
      description: "Generate concise summaries of lengthy audio content, extracting key insights and action items.",
      icon: "📝",
      details: ["Key point extraction", "Action item identification", "Custom summary lengths"]
    },
    {
      title: "Automated Meeting Bot",
      description: "Automatically join online meetings, record, transcribe, and provide detailed summaries for your team.",
      icon: "🤖",
      details: ["Auto-join meetings", "Real-time processing", "CRM integration ready"]
    }
  ];

  return (
    <section id="features" className="py-16 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Every Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive AI platform offers everything you need to break down language barriers
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-green-100">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

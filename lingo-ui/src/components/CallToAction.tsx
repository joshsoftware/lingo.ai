
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CallToAction = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-green-50 to-emerald-50">
      <div className="container mx-auto">
        <Card className="max-w-4xl mx-auto p-8 md:p-12 text-center border-green-200 bg-background/80 backdrop-blur-sm">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Bridge Language Barriers?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using TheLingo.ai to communicate effectively 
            with Indian language speakers and unlock new opportunities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
              Start Free 14-Day Trial
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
              Schedule a Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Setup in under 5 minutes</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>24/7 expert support</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;

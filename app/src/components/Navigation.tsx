import { Button } from "@/components/ui/button";

const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50 ">
      <div className="container mx-auto px-4 py-4 flex items-center justify-start ">
        <div className="flex items-center space-x-2 w-2/5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold">Lingo.ai</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 w-3/5">
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#use-cases"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Use Cases
          </a>
          <a
            href="#pricing"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </a>
        </div>

        {/* <div className="flex items-center space-x-4">
          <Button variant="ghost" className="hidden md:inline-flex">
            Sign In
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Get Started
          </Button>
        </div> */}
      </div>
    </nav>
  );
};

export default Navigation;

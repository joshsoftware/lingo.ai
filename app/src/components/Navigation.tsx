import Link from "next/link";
import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  href: string;
  type?: "link" | "anchor"; // default to "anchor"
};

type NavigationProps = {
  navItems: NavItem[];
};

const Navigation = ({ navItems }: NavigationProps) => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50 ">
      <div className="container mx-auto px-4 py-4 flex items-center justify-start">
        <div className="flex items-center space-x-2 w-2/5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold">Lingo.ai</span>
        </div>

        <div className="hidden md:flex items-center space-x-8 w-3/5">
          {navItems.map((item, i) =>
            item.type === "link" ? (
              <Link
                key={i}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={i}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

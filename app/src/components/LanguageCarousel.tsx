import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
const images = [
  {
    src: "https://placehold.co/800x400/000000/FFFFFF?text=English",
    label: "English",
  },
  {
    src: "https://placehold.co/800x400/FF5722/FFFFFF?text=Hindi",
    label: "Hindi",
  },
  {
    src: "https://placehold.co/800x400/263238/FFFFFF?text=Marathi",
    label: "Marathi",
  },
  {
    src: "https://placehold.co/800x400/4CAF50/FFFFFF?text=Gujarati",
    label: "Gujarati",
  },
  {
    src: "https://placehold.co/800x400/3F51B5/FFFFFF?text=Tamil",
    label: "Tamil",
  },
  {
    src: "https://placehold.co/800x400/FFC107/000000?text=Bengali",
    label: "Bengali",
  },
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const length = images.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [length]);

  const nextSlide = () => {
    setCurrent((prev) => (prev === length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl  border bg-card shadow-md">
      {/* Slide Container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((item, index) => (
          <Card
            key={index}
            className="w-full flex-shrink-0 h-64 md:h-96 p-0 m-0"
          >
            <CardContent className="relative w-full h-full p-0">
              <img
                src={item.src}
                alt={item.label}
                className="w-full h-full object-cover rounded-none"
              />
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-md text-sm">
                {item.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prev Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute top-1/2 left-4 -translate-y-1/2 z-20 bg-white/50 hover:bg-white"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute top-1/2 right-4 -translate-y-1/2 z-20 bg-white/50 hover:bg-white"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {images.map((_, index) => (
          <Button
            key={index}
            variant={index === current ? "default" : "outline"}
            size="icon"
            className={cn(
              "w-3 h-3 rounded-full p-0",
              index === current ? "bg-primary" : "bg-muted"
            )}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

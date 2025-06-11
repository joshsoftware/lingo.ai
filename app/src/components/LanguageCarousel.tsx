import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// const slides = [
//   {
//     label: "English",
//     bgLight: "bg-gray-100",
//     textLight: "text-black",
//     bgDark: "bg-gray-800",
//     textDark: "text-white",
//   },
//   {
//     label: "Hindi",
//     bgLight: "bg-orange-200",
//     textLight: "text-black",
//     bgDark: "bg-orange-600",
//     textDark: "text-white",
//   },
//   {
//     label: "Marathi",
//     bgLight: "bg-yellow-200",
//     textLight: "text-black",
//     bgDark: "bg-yellow-700",
//     textDark: "text-white",
//   },
//   {
//     label: "Gujarati",
//     bgLight: "bg-green-200",
//     textLight: "text-black",
//     bgDark: "bg-green-700",
//     textDark: "text-white",
//   },
//   {
//     label: "Tamil",
//     bgLight: "bg-indigo-200",
//     textLight: "text-black",
//     bgDark: "bg-indigo-700",
//     textDark: "text-white",
//   },
//   {
//     label: "Bengali",
//     bgLight: "bg-amber-100",
//     textLight: "text-black",
//     bgDark: "bg-amber-600",
//     textDark: "text-black",
//   },
// ];
const slides = [
  {
    label: "English",
    gradient:
      "bg-gradient-to-r from-sky-200 to-sky-400 dark:from-sky-600 dark:to-sky-800",
    text: "text-black dark:text-white",
  },
  {
    label: "Hindi",
    gradient:
      "bg-gradient-to-r from-orange-200 to-orange-400 dark:from-orange-600 dark:to-orange-800",
    text: "text-black dark:text-white",
  },
  {
    label: "Marathi",
    gradient:
      "bg-gradient-to-r from-yellow-200 to-yellow-400 dark:from-yellow-600 dark:to-yellow-800",
    text: "text-black dark:text-black",
  },
  {
    label: "Gujarati",
    gradient:
      "bg-gradient-to-r from-green-200 to-green-400 dark:from-green-600 dark:to-green-800",
    text: "text-black dark:text-white",
  },
  {
    label: "Tamil",
    gradient:
      "bg-gradient-to-r from-indigo-200 to-indigo-400 dark:from-indigo-600 dark:to-indigo-800",
    text: "text-black dark:text-white",
  },
  {
    label: "Bengali",
    gradient:
      "bg-gradient-to-r from-amber-200 to-amber-300 dark:from-amber-500 dark:to-amber-700",
    text: "text-black dark:text-black",
  },
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const length = slides.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === length - 1 ? 0 : prev + 1));
    }, 1000);
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
    <div className="relative w-full max-w-lg mx-auto h-32 overflow-hidden rounded-xl border bg-card shadow-md">
      {/* Slide Container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((item, index) => (
          <Card key={index} className="min-w-full h-32 p-0 m-0">
            {/* <CardContent
              className="flex items-center justify-center bg-gray-100   w-full h-full p-0"
              style={{ backgroundColor: item.bg, color: item.text }}
            >
              <h2 className="text-2xl   font-bold">{item.label}</h2>
            </CardContent> */}
            <CardContent
              className={cn(
                "flex items-center justify-center w-full h-full p-0",
                // item.bgLight,
                // item.textLight,
                // `dark:${item.bgDark}`,
                // `dark:${item.textDark}`
                item.gradient,
                item.text
              )}
            >
              <h2 className="text-2xl font-bold">{item.label}</h2>
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
        {slides.map((_, index) => (
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

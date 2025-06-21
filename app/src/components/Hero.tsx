import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import Carousel from "./LanguageCarousel";
import { Modal } from "./ui/modal";
import { useState } from "react";

const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <section className="flex w-full pt-24 pb-16 px-4">
      <div className="container mx-auto text-center">
        <Badge variant="secondary" className="mb-6">
          🚀 Empowering Indian Languages with AI
        </Badge>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
          Bridge Language Barriers with
          <br />
          <span className="gradient-primary bg-clip-text text-transparent">
            Lingo.ai
          </span>
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Transcribe, translate, and summarize major Indian language audio.
          Empower millions to share their thoughts with the world through our
          AI-powered platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg"
          >
            <Link href={"/signup"}>Start Free Trial</Link>
          </Button>
          <Button
            onClick={toggleModal}
            size="lg"
            variant="outline"
            className="px-8 py-6 text-lg"
          >
            Watch Demo
          </Button>
        </div>
        {/* <div className="mb-6">
          <Carousel />
        </div> */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">15+</div>
                <div className="text-muted-foreground">Indian Languages</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">99%</div>
                <div className="text-muted-foreground">Accuracy Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">1M+</div>
                <div className="text-muted-foreground">
                  Audio Hours Processed
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 animate-bounce">
          <ArrowDown className="mx-auto h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Meeting Recorder Bot"
      >
        <>
          {/* Trigger Button */}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={() => setIsModalOpen(true)}
          >
            ▶️ Watch Demo
          </button>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg max-w-5xl w-full relative">
                {/* Close Button */}
                <button
                  className="absolute top-2 right-2 text-gray-500"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✖
                </button>

                <h2 className="text-xl font-semibold mb-4">Demo Video</h2>

                <video controls className="w-full rounded-md">
                  <source src="/videos/lingoAI.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}
        </>
      </Modal>
    </section>
  );
};

export default Hero;

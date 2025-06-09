import CallToAction from "@/components/CallToAction";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Landing from "@/components/Landing";
import Navigation from "@/components/Navigation";
import UseCases from "@/components/UseCases";

export default async function Home() {
  return (
    <div className="flex w-full  flex-col ">
      <Landing />
      {/* <Navigation />
      <Hero />
      <Features />
      <UseCases />
      <CallToAction />
      <Footer /> */}
    </div>
  );
}

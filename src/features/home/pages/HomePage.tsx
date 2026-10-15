import { AssistantEntryBanner } from "@/components/ai-assistant/AssistantEntryBanner";
import { SearchSection } from "@/features/home/components/SearchSection";
import { HeroSection } from "@/features/home/components/HeroSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="container pb-8">
        <AssistantEntryBanner />
      </div>
      <SearchSection />
    </>
  );
}

export default HomePage;

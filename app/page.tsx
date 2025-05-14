import { ImageGenerationInterface } from "@/components/image-generation/interface";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-background/95">
      <main className="flex-1 w-full h-full">
        <ImageGenerationInterface />
      </main>
    </div>
  );
}

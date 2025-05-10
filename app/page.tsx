import { ImageGenerationInterface } from "@/components/image-generation/interface";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      <main className="flex-1 w-full h-full">
        <ImageGenerationInterface />
      </main>
    </div>
  );
}

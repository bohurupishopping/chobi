"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { StoryInput } from "../../components/prompt-generation/StoryInput"
import { SceneList } from "../../components/prompt-generation/SceneList"
import { EmptyState } from "../../components/prompt-generation/EmptyState"

export interface Scene {
  id: string
  content: string
  prompt: string
  isEditing: boolean
  isGenerating?: boolean
  sceneNumber: number
}

type ModelProvider = "openai" | "gemini"

export default function StoryToImageGenerator() {
  const [story, setStory] = useState("")
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [sceneCount, setSceneCount] = useState(60)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentlyGenerating, setCurrentlyGenerating] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const [modelProvider, setModelProvider] = useState<ModelProvider>("openai")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setStory(content)
        toast({
          title: "File uploaded successfully",
          description: `Loaded ${content.length} characters from ${file.name}`,
        })
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file",
        variant: "destructive",
      })
    }
  }

  const generateStoryPrompts = async (continueFrom?: number) => {
    if (!story.trim()) {
      toast({
        title: "No story provided",
        description: "Please upload a file or paste your story",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    if (!continueFrom) {
      setScenes([])
      setIsComplete(false)
    }
    setGenerationProgress(continueFrom ? (continueFrom / sceneCount) * 100 : 0)
    setCurrentlyGenerating(
      continueFrom ? `Continuing from scene ${continueFrom + 1}...` : "Analyzing story structure...",
    )

    try {
      const response = await fetch("/api/generate-story-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          story: story.trim(),
          sceneCount,
          continueFrom,
          modelProvider,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate story prompts")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response stream available")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "progress") {
                setGenerationProgress(data.progress)
                setCurrentlyGenerating(data.message)
              } else if (data.type === "scene") {
                const newScene: Scene = {
                  id: `scene-${data.scene.sceneNumber}`,
                  content: data.scene.content,
                  prompt: data.scene.prompt,
                  isEditing: false,
                  sceneNumber: data.scene.sceneNumber,
                }
                setScenes((prev) => {
                  // Remove any existing scene with the same number and add the new one
                  const filtered = prev.filter((s) => s.sceneNumber !== data.scene.sceneNumber)
                  const updated = [...filtered, newScene].sort((a, b) => a.sceneNumber - b.sceneNumber)
                  return updated
                })
              } else if (data.type === "complete") {
                setCurrentlyGenerating(
                  data.isComplete
                    ? "Generation complete!"
                    : `Generated ${data.totalScenes} scenes. You can continue generating more.`,
                )
                setIsComplete(data.isComplete)
                toast({
                  title: data.isComplete ? "Story prompts completed" : "Partial generation complete",
                  description: data.isComplete
                    ? `Successfully created all ${data.totalScenes} cinematic image prompts`
                    : `Generated ${data.totalScenes} scenes. Click "Continue Generation" for more.`,
                })
              } else if (data.type === "error") {
                throw new Error(data.message)
              }
            } catch (parseError) {
              console.error("Error parsing stream data:", parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating story prompts:", error)
      toast({
        title: "Generation failed",
        description: "Failed to generate story prompts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setCurrentlyGenerating("")
    }
  }

  const continueGeneration = () => {
    const lastSceneNumber = Math.max(...scenes.map((s) => s.sceneNumber))
    generateStoryPrompts(lastSceneNumber)
  }

  const restartGeneration = () => {
    setScenes([])
    setIsComplete(false)
    generateStoryPrompts()
  }

  const exportPrompts = () => {
    if (scenes.length === 0) {
      toast({
        title: "No prompts to export",
        description: "Please generate some prompts first",
      });
      return;
    }

    const exportData = scenes.map(scene => ({
      sceneNumber: scene.sceneNumber,
      prompt: scene.prompt,
      content: scene.content
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const regeneratePrompt = async (sceneId: string, sceneContent: string) => {
    try {
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;

      // Set loading state for the specific scene
      setScenes(scenes.map(s => 
        s.id === sceneId 
          ? { ...s, isGenerating: true } 
          : s
      ));

      // Use the generate-story-prompts endpoint with the specific scene content as the story
      const response = await fetch("/api/generate-story-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          story: sceneContent,
          sceneCount: 1, // Only generate one scene
          modelProvider,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate prompt");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let newPrompt = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "scene") {
                newPrompt = data.scene.prompt;
              }
            } catch (parseError) {
              console.error("Error parsing stream data:", parseError);
            }
          }
        }
      }

      if (newPrompt) {
        setScenes(scenes.map(s => 
          s.id === sceneId 
            ? { ...s, prompt: newPrompt, isGenerating: false } 
            : s
        ));

        toast({
          title: "Prompt regenerated",
          description: `New cinematic prompt generated for scene ${scene.sceneNumber}`,
        });
      } else {
        throw new Error("No prompt was generated");
      }
    } catch (error) {
      console.error("Error regenerating prompt:", error);
      setScenes(scenes.map(s => 
        s.id === sceneId 
          ? { ...s, isGenerating: false } 
          : s
      ));
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate prompt. Please try again.",
        variant: "destructive",
      });
    }
  }

  const copyPrompt = (prompt: string, sceneId: string) => {
    navigator.clipboard.writeText(prompt)
    toast({
      title: "Prompt copied",
      description: `Scene ${sceneId.split("-")[1]} prompt copied to clipboard`,
    })
  }

  const copyAllPrompts = () => {
    const allPrompts = scenes
      .sort((a, b) => a.sceneNumber - b.sceneNumber)
      .map((scene) => `Scene ${scene.sceneNumber}:\n${scene.prompt}\n`)
      .join("\n")

    navigator.clipboard.writeText(allPrompts)
    toast({
      title: "All prompts copied",
      description: `${scenes.length} cinematic prompts copied to clipboard`,
    })
  }

  const editPrompt = (sceneId: string, newPrompt: string, newContent?: string) => {
    setScenes(scenes.map((scene) => 
      scene.id === sceneId 
        ? { 
            ...scene, 
            prompt: newPrompt,
            content: newContent !== undefined ? newContent : scene.content,
            isEditing: false 
          }
        : scene
    ))
    toast({
      title: "Scene updated",
      description: `Scene ${scenes.find(s => s.id === sceneId)?.sceneNumber} has been updated`,
    })
  }

  const toggleEdit = (sceneId: string) => {
    setScenes(scenes.map((scene) => 
      scene.id === sceneId 
        ? { ...scene, isEditing: !scene.isEditing }
        : scene
    ))
  }

  const canContinue = scenes.length > 0 && scenes.length < sceneCount && !isComplete && !isGenerating

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <span className="bg-primary/10 p-2 rounded-lg">📖</span>
                <span>Story Input</span>
              </h2>
              <p className="text-muted-foreground mb-6">Upload a .txt file or paste your story directly</p>
              
              <StoryInput
                story={story}
                setStory={setStory}
                sceneCount={sceneCount}
                setSceneCount={setSceneCount}
                modelProvider={modelProvider}
                setModelProvider={setModelProvider}
                isGenerating={isGenerating}
                hasScenes={scenes.length > 0}
                onGenerate={() => generateStoryPrompts()}
                onContinue={continueGeneration}
                onFileUpload={handleFileUpload}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-2">
            <div className="h-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
              
              <p className="text-muted-foreground mb-6">
                {scenes.length > 0 
                  ? `` 
                  : 'No scenes generated yet. Enter your story and click "Generate" to get started.'}
              </p>
              
              <div className="h-[calc(100%-120px)]">
                {scenes.length > 0 ? (
                  <SceneList
                    scenes={scenes}
                    modelProvider={modelProvider}
                    sceneCount={sceneCount}
                    isComplete={isComplete}
                    isGenerating={isGenerating}
                    generationProgress={generationProgress}
                    currentlyGenerating={currentlyGenerating}
                    onToggleEdit={toggleEdit}
                    onEditSave={editPrompt}
                    onRegenerate={regeneratePrompt}
                    onCopy={copyPrompt}
                    onCopyAll={copyAllPrompts}
                    onExport={exportPrompts}
                    onRestart={restartGeneration}
                    canContinue={canContinue}
                  />
                ) : (
                  <EmptyState 
                    onGenerate={() => generateStoryPrompts()} 
                    isGenerating={isGenerating} 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

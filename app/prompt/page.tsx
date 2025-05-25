"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  Copy,
  Edit3,
  Download,
  Loader2,
  RefreshCw,
  CheckCircle,
  Play,
  RotateCcw,
  Bot,
  Sparkles,
  Eye,
  Film,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Scene {
  id: string
  content: string
  prompt: string
  isEditing: boolean
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
      const response = await fetch("/api/regenerate-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sceneContent,
          modelProvider,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to regenerate prompt")
      }

      const data = await response.json()
      setScenes(scenes.map((scene) => (scene.id === sceneId ? { ...scene, prompt: data.prompt } : scene)))

      toast({
        title: "Prompt regenerated",
        description: "New cinematic prompt generated for this scene",
      })
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate prompt. Please try again.",
        variant: "destructive",
      })
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

  const editPrompt = (sceneId: string, newPrompt: string) => {
    setScenes(scenes.map((scene) => (scene.id === sceneId ? { ...scene, prompt: newPrompt, isEditing: false } : scene)))
    toast({
      title: "Prompt updated",
      description: "Scene prompt has been updated",
    })
  }

  const toggleEdit = (sceneId: string) => {
    setScenes(scenes.map((scene) => (scene.id === sceneId ? { ...scene, isEditing: !scene.isEditing } : scene)))
  }

  const canContinue = scenes.length > 0 && scenes.length < sceneCount && !isComplete && !isGenerating

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Story Input Section */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">📖 Story Input</CardTitle>
                <CardDescription>Upload a .txt file or paste your story directly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="paste" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="paste">Paste Story</TabsTrigger>
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                  </TabsList>

                  <TabsContent value="paste" className="space-y-4">
                    <Textarea
                      placeholder="Paste your story here..."
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>Characters: {story.length.toLocaleString()}</span>
                      <span>Words: ~{Math.round(story.length / 5).toLocaleString()}</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm font-medium">Click to upload</span>
                        <span className="text-sm text-muted-foreground"> or drag and drop</span>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Only .txt files are supported</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="scene-count">Number of Scenes</Label>
                    <span className="text-xs text-muted-foreground">
                      {sceneCount} {sceneCount === 1 ? "scene" : "scenes"} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSceneCount((prev) => Math.max(10, prev - 10))}
                      disabled={sceneCount <= 10}
                    >
                      -10
                    </Button>
                    <Input
                      id="scene-count"
                      type="number"
                      min="10"
                      max="100"
                      value={sceneCount}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value)
                        if (!isNaN(value)) {
                          setSceneCount(Math.min(100, Math.max(10, value)))
                        }
                      }}
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSceneCount((prev) => Math.min(100, prev + 10))}
                      disabled={sceneCount >= 100}
                    >
                      +10
                    </Button>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10 (Short)</span>
                    <span>100 (Detailed)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>AI Model</Label>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <Select value={modelProvider} onValueChange={(value: ModelProvider) => setModelProvider(value)}>
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-xs">OpenAI</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gemini">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-xs">Gemini</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => generateStoryPrompts()}
                    disabled={isGenerating || !story.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Cinematic Prompts...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {scenes.length > 0 ? "Restart Generation" : "Generate Cinematic Story Prompts"}
                      </>
                    )}
                  </Button>

                  {canContinue && (
                    <Button
                      onClick={continueGeneration}
                      disabled={isGenerating}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Continue Generation ({scenes.length}/{sceneCount})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Card */}
            {(isGenerating || scenes.length > 0) && (
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Generation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress:</span>
                      <span>{Math.round(generationProgress)}%</span>
                    </div>
                    <Progress value={generationProgress} className="w-full" />
                    {currentlyGenerating && <p className="text-sm text-muted-foreground">{currentlyGenerating}</p>}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>✨ AI is analyzing your story structure</p>
                    <p>🎬 Creating cinematic scene descriptions</p>
                    <p>🖼️ Generating detailed image prompts</p>
                  </div>
                  {scenes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Scenes Generated:</span>
                        <Badge variant={isComplete ? "default" : "secondary"}>
                          {scenes.length}/{sceneCount}
                        </Badge>
                      </div>
                      {!isComplete && scenes.length < sceneCount && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          ⚠️ Generation incomplete. Use "Continue Generation" to create more scenes.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Results Summary */}
            {scenes.length > 0 && !isGenerating && (
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Results Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{scenes.length}</div>
                      <div className="text-xs text-muted-foreground">Scenes Generated</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{Math.round(generationProgress)}%</div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Story Coverage:</span>
                    <Badge variant={isComplete ? "default" : "outline"}>{isComplete ? "Complete" : "Partial"}</Badge>
                  </div>

                  <Button onClick={copyAllPrompts} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Copy All Prompts ({scenes.length})
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section - Revamped */}
          <div className="xl:col-span-2 space-y-6">
            {scenes.length > 0 ? (
              <div className="space-y-6">
                {/* Header Card */}
                <Card className="shadow-lg border-l-4 border-l-primary">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Film className="h-5 w-5" />
                          Cinematic Story Scenes
                        </CardTitle>
                        <CardDescription>
                          {scenes.length} scenes ready for animated movie-style image generation
                          {!isComplete && ` • ${sceneCount - scenes.length} more needed for completion`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isComplete ? "default" : "secondary"} className="text-xs">
                          {scenes.length}/{sceneCount} Scenes
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {modelProvider === "openai" ? "OpenAI GPT-4" : "Google Gemini"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Scenes Grid - Scrollable */}
                <div className="h-[calc(100vh-300px)] overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {scenes
                    .sort((a, b) => a.sceneNumber - b.sceneNumber)
                    .map((scene) => (
                      <Card
                        key={scene.id}
                        className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/30 hover:border-l-primary"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                                {scene.sceneNumber}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">Scene {scene.sceneNumber}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm text-muted-foreground">Generated</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => regeneratePrompt(scene.id, scene.content)}
                                className="h-8 w-8 p-0"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleEdit(scene.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyPrompt(scene.prompt, scene.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                          {/* Scene Content */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium text-sm">Scene Content</h4>
                            </div>
                            <div className="bg-muted/30 border rounded-lg p-4">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{scene.content}</p>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          {/* Cinematic Prompt */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <h4 className="font-medium text-sm">Cinematic Image Prompt</h4>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyPrompt(scene.prompt, scene.id)}
                                className="h-7 text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>

                            {scene.isEditing ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={scene.prompt}
                                  onChange={(e) => {
                                    const newPrompt = e.target.value
                                    setScenes(scenes.map((s) => (s.id === scene.id ? { ...s, prompt: newPrompt } : s)))
                                  }}
                                  className="min-h-[200px] resize-none"
                                  placeholder="Edit your cinematic prompt..."
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => editPrompt(scene.id, scene.prompt)}>
                                    Save Changes
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => toggleEdit(scene.id)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{scene.prompt}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Bottom Actions */}
                {scenes.length > 0 && (
                  <Card className="shadow-lg">
                    <CardContent className="py-6">
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="text-center sm:text-left">
                          <p className="font-medium">Ready to create your animated story?</p>
                          <p className="text-sm text-muted-foreground">
                            Use these prompts in DALL-E, Midjourney, or Stable Diffusion
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {canContinue && (
                            <Button variant="outline" onClick={restartGeneration} disabled={isGenerating}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restart Generation
                          </Button>
                          )}
                          <Button 
                            variant="outline" 
                            onClick={exportPrompts}
                            disabled={scenes.length === 0 || isGenerating}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Prompts
                          </Button>
                          <Button onClick={copyAllPrompts}>
                            <Download className="mr-2 h-4 w-4" />
                            Export All Prompts
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="py-16 text-center">
                  <div className="text-muted-foreground space-y-6">
                    <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <Film className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">Ready to Create Your Cinematic Story</h3>
                      <p className="text-sm max-w-md mx-auto">
                        Upload or paste your story, select your preferred AI model, then click "Generate Cinematic Story
                        Prompts"
                      </p>
                      <p className="text-xs text-muted-foreground/70 max-w-lg mx-auto">
                        AI will analyze your entire story and create detailed prompts for animated movie-style images
                        that tell your story frame by frame
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
import {
  Upload,
  Copy,
  Edit3,
  Download,
  Loader2,
  Moon,
  Sun,
  RefreshCw,
  Scissors,
  Wand2,
  CheckCircle,
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "@/hooks/use-toast"

interface Scene {
  id: string
  content: string
  prompt: string
  isEditing: boolean
  isGenerating: boolean
  hasPrompt: boolean
}

export default function StoryToImageGenerator() {
  const [story, setStory] = useState("")
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isSectioning, setIsSectioning] = useState(false)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [sceneCount, setSceneCount] = useState(60)
  const [generationProgress, setGenerationProgress] = useState(0)
  const { theme, setTheme } = useTheme()

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

  const sectionStory = async () => {
    if (!story.trim()) {
      toast({
        title: "No story provided",
        description: "Please upload a file or paste your story",
        variant: "destructive",
      })
      return
    }

    setIsSectioning(true)
    try {
      // Use the existing process-story API but only for sectioning
      const response = await fetch("/api/process-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          story: story.trim(),
          sceneCount,
          sectionOnly: true, // Add flag to only section, not generate prompts
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to section story")
      }

      const data = await response.json()
      const sectioned: Scene[] = data.scenes.map((scene: any, index: number) => ({
        id: `scene-${index + 1}`,
        content: scene.content,
        prompt: "",
        isEditing: false,
        isGenerating: false,
        hasPrompt: false,
      }))

      setScenes(sectioned)
      toast({
        title: "Story sectioned successfully",
        description: `Created ${sectioned.length} scenes ready for prompt generation`,
      })
    } catch (error) {
      console.error("Error sectioning story:", error)
      toast({
        title: "Sectioning failed",
        description: "Failed to section the story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSectioning(false)
    }
  }

  const generatePrompt = async (sceneId: string, sceneContent: string) => {
    setScenes(scenes.map((scene) => (scene.id === sceneId ? { ...scene, isGenerating: true } : scene)))

    try {
      // Use the existing regenerate-prompt API for individual prompt generation
      const response = await fetch("/api/regenerate-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sceneContent,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate prompt")
      }

      const data = await response.json()
      setScenes(
        scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, prompt: data.prompt, isGenerating: false, hasPrompt: true } : scene,
        ),
      )

      toast({
        title: "Prompt generated",
        description: `Scene ${sceneId.split("-")[1]} prompt ready`,
      })
    } catch (error) {
      setScenes(scenes.map((scene) => (scene.id === sceneId ? { ...scene, isGenerating: false } : scene)))
      toast({
        title: "Generation failed",
        description: "Failed to generate prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateAllPrompts = async () => {
    setIsGeneratingAll(true)
    setGenerationProgress(0)

    const scenesToGenerate = scenes.filter((scene) => !scene.hasPrompt)

    for (let i = 0; i < scenesToGenerate.length; i++) {
      const scene = scenesToGenerate[i]
      await generatePrompt(scene.id, scene.content)
      setGenerationProgress(((i + 1) / scenesToGenerate.length) * 100)
    }

    setIsGeneratingAll(false)
    toast({
      title: "All prompts generated",
      description: `Generated ${scenesToGenerate.length} new prompts`,
    })
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
      .filter((scene) => scene.hasPrompt)
      .map((scene, index) => `Scene ${scenes.indexOf(scene) + 1}:\n${scene.prompt}\n`)
      .join("\n")

    navigator.clipboard.writeText(allPrompts)
    toast({
      title: "All prompts copied",
      description: `${scenes.filter((s) => s.hasPrompt).length} prompts copied to clipboard`,
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

  const regeneratePrompt = async (sceneId: string, sceneContent: string) => {
    await generatePrompt(sceneId, sceneContent)
  }

  const generatedCount = scenes.filter((scene) => scene.hasPrompt).length
  const totalScenes = scenes.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              🔧 AI Story to Prompt Generator
            </h1>
            <p className="text-muted-foreground">Transform stories into cinematic image generation prompts</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
                  <Label htmlFor="scene-count">Number of Scenes (10-100)</Label>
                  <Input
                    id="scene-count"
                    type="number"
                    min="10"
                    max="100"
                    value={sceneCount}
                    onChange={(e) => setSceneCount(Number.parseInt(e.target.value) || 60)}
                    className="w-full"
                  />
                </div>

                <Button onClick={sectionStory} disabled={isSectioning || !story.trim()} className="w-full" size="lg">
                  {isSectioning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sectioning Story...
                    </>
                  ) : (
                    <>
                      <Scissors className="mr-2 h-4 w-4" />
                      Section Story
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Progress Card */}
            {scenes.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">📊 Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Scenes Created:</span>
                    <Badge variant="secondary">{totalScenes}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Prompts Generated:</span>
                    <Badge variant={generatedCount === totalScenes ? "default" : "outline"}>
                      {generatedCount}/{totalScenes}
                    </Badge>
                  </div>

                  {isGeneratingAll && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Generating...</span>
                        <span>{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} className="w-full" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={generateAllPrompts}
                      disabled={isGeneratingAll || scenes.length === 0 || generatedCount === totalScenes}
                      className="w-full"
                      size="lg"
                    >
                      {isGeneratingAll ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating All...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate All Prompts
                        </>
                      )}
                    </Button>

                    {generatedCount > 0 && (
                      <Button onClick={copyAllPrompts} variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Copy All Prompts ({generatedCount})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="xl:col-span-2 space-y-6">
            {scenes.length > 0 ? (
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">🎬 Story Scenes</CardTitle>
                      <CardDescription>{scenes.length} scenes ready for prompt generation</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                    {scenes.map((scene, index) => (
                      <Card
                        key={scene.id}
                        className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Scene {index + 1}</Badge>
                              {scene.hasPrompt && <CheckCircle className="h-4 w-4 text-green-500" />}
                            </div>
                            <div className="flex gap-2">
                              {scene.hasPrompt && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => regeneratePrompt(scene.id, scene.content)}
                                    disabled={scene.isGenerating}
                                  >
                                    <RefreshCw className={`h-3 w-3 ${scene.isGenerating ? "animate-spin" : ""}`} />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => toggleEdit(scene.id)}>
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => copyPrompt(scene.prompt, scene.id)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Story Content:</h4>
                            <p className="text-sm bg-muted/50 p-3 rounded-md border">{scene.content}</p>
                          </div>

                          {!scene.hasPrompt ? (
                            <Button
                              onClick={() => generatePrompt(scene.id, scene.content)}
                              disabled={scene.isGenerating}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              {scene.isGenerating ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="mr-2 h-3 w-3" />
                                  Generate Prompt
                                </>
                              )}
                            </Button>
                          ) : (
                            <>
                              <Separator />
                              <div>
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Image Prompt:</h4>
                                {scene.isEditing ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={scene.prompt}
                                      onChange={(e) => {
                                        const newPrompt = e.target.value
                                        setScenes(
                                          scenes.map((s) => (s.id === scene.id ? { ...s, prompt: newPrompt } : s)),
                                        )
                                      }}
                                      className="min-h-[100px]"
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => editPrompt(scene.id, scene.prompt)}>
                                        Save
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => toggleEdit(scene.id)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm bg-primary/5 p-3 rounded-md border border-primary/20">
                                    {scene.prompt}
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="py-16 text-center">
                  <div className="text-muted-foreground space-y-4">
                    <Upload className="mx-auto h-16 w-16 opacity-50" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Ready to Transform Your Story</h3>
                      <p className="text-sm">Upload or paste your story, then click "Section Story" to get started</p>
                      <p className="text-xs mt-2 text-muted-foreground/70">
                        The AI will automatically break your story into scenes and generate image prompts
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

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, Loader2, Play, RotateCcw, Upload } from "lucide-react"

type ModelProvider = "openai" | "gemini"

interface StoryInputProps {
  story: string
  setStory: (story: string) => void
  sceneCount: number
  setSceneCount: React.Dispatch<React.SetStateAction<number>>
  modelProvider: ModelProvider
  setModelProvider: (provider: ModelProvider) => void
  isGenerating: boolean
  hasScenes: boolean
  onGenerate: () => void
  onContinue: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function StoryInput({
  story,
  setStory,
  sceneCount,
  setSceneCount,
  modelProvider,
  setModelProvider,
  isGenerating,
  hasScenes,
  onGenerate,
  onContinue,
  onFileUpload,
}: StoryInputProps) {
  return (
    <div className="space-y-6">
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
              onChange={onFileUpload}
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
            onClick={() => setSceneCount(prev => Math.max(10, prev - 10))}
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
            onClick={() => setSceneCount(prev => Math.min(100, prev + 10))}
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
          onClick={onGenerate}
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
              {hasScenes ? "Restart Generation" : "Generate Cinematic Story Prompts"}
            </>
          )}
        </Button>

        {hasScenes && (
          <Button
            onClick={onContinue}
            disabled={isGenerating}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Continue Generation
          </Button>
        )}
      </div>
    </div>
  )
}

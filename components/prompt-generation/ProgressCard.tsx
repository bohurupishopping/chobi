import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface ProgressCardProps {
  generationProgress: number
  currentlyGenerating: string
  scenes: { sceneNumber: number }[]
  sceneCount: number
  isComplete: boolean
  isGenerating: boolean
}

export function ProgressCard({
  generationProgress,
  currentlyGenerating,
  scenes,
  sceneCount,
  isComplete,
  isGenerating,
}: ProgressCardProps) {
  return (
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
  )
}

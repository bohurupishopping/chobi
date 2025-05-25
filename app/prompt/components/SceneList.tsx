import { Scene } from "../page"
import { SceneItem } from "./SceneItem"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Download, Copy as CopyIcon, RotateCcw, FileDown } from "lucide-react"

export interface SceneListProps {
  scenes: Scene[]
  modelProvider: 'openai' | 'gemini'
  sceneCount: number
  isComplete: boolean
  isGenerating: boolean
  generationProgress: number
  currentlyGenerating: string
  onToggleEdit: (sceneId: string) => void
  onEditSave: (sceneId: string, newPrompt: string, newContent?: string) => void
  onRegenerate: (sceneId: string, content: string) => void
  onCopy: (prompt: string, sceneId: string) => void
  onCopyAll: () => void
  onExport: () => void
  onRestart: () => void
  canContinue: boolean
}

export function SceneList({
  scenes,
  modelProvider,
  sceneCount,
  isComplete,
  isGenerating,
  generationProgress,
  currentlyGenerating,
  onToggleEdit,
  onEditSave,
  onRegenerate,
  onCopy,
  onCopyAll,
  onExport,
  onRestart,
  canContinue,
}: SceneListProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card shadow-sm border rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="text-lg">🎬</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Cinematic Scenes</h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{scenes.length} scenes ready</span>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span>{Math.round(generationProgress)}% complete</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-muted text-xs rounded-full flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span>{scenes.length}/{sceneCount}</span>
              </div>
              <div className="px-2.5 py-1 border text-xs rounded-full">
                {modelProvider === 'openai' ? 'OpenAI' : 'Gemini'}
              </div>
              {scenes.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onCopyAll}
                    className="h-8 px-2 text-xs gap-1"
                  >
                    <CopyIcon className="h-3.5 w-3.5" />
                    <span>Copy All</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onExport}
                    disabled={scenes.length === 0 || isGenerating}
                    className="h-8 px-2 text-xs gap-1"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </Button>
                  {canContinue && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onRestart}
                      disabled={isGenerating}
                      className="h-8 px-3 text-xs gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Continue</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress Section */}
          {(isGenerating || (!isComplete && scenes.length < sceneCount)) && (
            <div className="mt-3">
              {isGenerating ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Generating scene {scenes.length + 1}...</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-1.5" />
                  {currentlyGenerating && (
                    <p className="text-xs text-muted-foreground truncate">{currentlyGenerating}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Incomplete - Continue generation to add more scenes
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scenes Grid - Scrollable */}
      <div className="h-[calc(100vh-320px)] overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {scenes
          .sort((a, b) => a.sceneNumber - b.sceneNumber)
          .map((scene) => (
            <SceneItem
              key={scene.id}
              scene={scene}
              onToggleEdit={onToggleEdit}
              onEditSave={onEditSave}
              onRegenerate={onRegenerate}
              onCopy={onCopy}
            />
          ))}
      </div>
    </div>
  )
}

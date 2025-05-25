import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Copy, RotateCcw, FileDown } from "lucide-react"

interface ResultsSummaryProps {
  scenes: { sceneNumber: number }[]
  generationProgress: number
  isComplete: boolean
  isGenerating: boolean
  onCopyAll: () => void
  onExport: () => void
  onRestart: () => void
  canContinue: boolean
}

export function ResultsSummary({
  scenes,
  generationProgress,
  isComplete,
  isGenerating,
  onCopyAll,
  onExport,
  onRestart,
  canContinue,
}: ResultsSummaryProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg text-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{scenes.length}</span>
          <span className="text-muted-foreground text-xs">scenes</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-medium">{Math.round(generationProgress)}%</span>
          <span className="text-muted-foreground text-xs">complete</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Status:</span>
          <Badge variant={isComplete ? "default" : "outline"} className="h-5 text-xs">
            {isComplete ? "Complete" : "In Progress"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCopyAll}
          className="h-8 px-2 text-xs gap-1"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
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
            variant="ghost" 
            size="sm" 
            onClick={onRestart} 
            disabled={isGenerating}
            className="h-8 px-2 text-xs gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restart</span>
          </Button>
        )}
      </div>
    </div>
  )
}

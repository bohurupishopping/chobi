import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Film } from "lucide-react"

interface EmptyStateProps {
  onGenerate: () => void
  isGenerating: boolean
}

export function EmptyState({ onGenerate, isGenerating }: EmptyStateProps) {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
      <CardContent className="py-16 text-center">
        <div className="text-muted-foreground space-y-6">
          <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Film className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Create Your Cinematic Story</h3>
            <p className="text-sm max-w-md mx-auto text-muted-foreground">
              Transform your story into a visual masterpiece with AI-generated cinematic prompts
            </p>
            <div className="pt-2">
              <Button 
                onClick={onGenerate} 
                size="lg"
                disabled={isGenerating}
                className="px-8 py-6 text-base font-medium"
              >
                {isGenerating ? 'Creating Your Story...' : 'Get Started'}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-primary text-2xl mb-2">1</div>
              <h4 className="font-medium mb-1">Paste Your Story</h4>
              <p className="text-xs text-muted-foreground">
                Copy and paste your story or upload a text file
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-primary text-2xl mb-2">2</div>
              <h4 className="font-medium mb-1">Generate Scenes</h4>
              <p className="text-xs text-muted-foreground">
                AI analyzes your story and creates cinematic scenes
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-primary text-2xl mb-2">3</div>
              <h4 className="font-medium mb-1">Get Prompts</h4>
              <p className="text-xs text-muted-foreground">
                Use the prompts to generate stunning visuals
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

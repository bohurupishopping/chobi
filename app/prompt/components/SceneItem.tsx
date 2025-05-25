import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CheckCircle, Copy, Edit3, Eye, Loader2, RefreshCw, Sparkles } from "lucide-react"

interface SceneItemProps {
  scene: {
    id: string
    content: string
    prompt: string
    isEditing: boolean
    isGenerating?: boolean
    sceneNumber: number
  }
  onToggleEdit: (sceneId: string) => void
  onEditSave: (sceneId: string, newPrompt: string, newContent?: string) => void
  onRegenerate: (sceneId: string, content: string) => void
  onCopy: (prompt: string, sceneId: string) => void
}

export function SceneItem({
  scene,
  onToggleEdit,
  onEditSave,
  onRegenerate,
  onCopy,
}: SceneItemProps) {
  const [editedContent, setEditedContent] = useState(scene.content)
  const [editedPrompt, setEditedPrompt] = useState(scene.prompt)

  const handleSave = () => {
    onEditSave(scene.id, editedPrompt, editedContent)
  }

  const handleCancel = () => {
    setEditedContent(scene.content)
    setEditedPrompt(scene.prompt)
    onToggleEdit(scene.id)
  }

  return (
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
              onClick={() => !scene.isGenerating && onRegenerate(scene.id, scene.content)}
              className="h-8 w-8 p-0"
              disabled={scene.isGenerating}
            >
              {scene.isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleEdit(scene.id)}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(scene.prompt, scene.id)}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Scene Content</h4>
            </div>
            {!scene.isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleEdit(scene.id)}
                className="h-7 text-xs"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {scene.isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="Edit your scene content..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 border rounded-lg p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{scene.content}</p>
            </div>
          )}
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
              onClick={() => onCopy(scene.prompt, scene.id)}
              className="h-7 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>

          {scene.isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="min-h-[200px] resize-none"
                placeholder="Edit your cinematic prompt..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
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
  )
}

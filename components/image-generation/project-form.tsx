import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Folder, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ProjectFormProps {
  onProjectNameChange: (name: string) => void;
}

export function ProjectForm({ onProjectNameChange }: ProjectFormProps) {
  const [projectName, setProjectName] = useState<string>("");
  const { toast } = useToast();

  // Load project name from localStorage on mount
  useEffect(() => {
    const savedProjectName = localStorage.getItem("current_project_name");
    if (savedProjectName) {
      setProjectName(savedProjectName);
      onProjectNameChange(savedProjectName);
    }
  }, [onProjectNameChange]);

  const handleSaveProject = () => {
    if (!projectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a project name to continue.",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem("current_project_name", projectName);
    onProjectNameChange(projectName);

    toast({
      title: "Project name saved",
      description: "Your project name has been updated.",
    });
  };

  return (
    <Card className="rounded-xl border border-border/50 dark:border-border/50 bg-card/50 dark:bg-card/50 backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Folder className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Project Settings</h3>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="h-9 bg-background/50 dark:bg-background/50 border-border/50"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-background/50 dark:bg-background/50 border-border/50"
            onClick={handleSaveProject}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
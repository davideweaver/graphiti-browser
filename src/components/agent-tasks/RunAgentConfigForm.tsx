import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { agentTasksService } from "@/api/agentTasksService";
import type { ScheduledTask, RunAgentProperties } from "@/types/agentTasks";
import { Pencil, Save, Loader2 } from "lucide-react";

interface RunAgentConfigFormProps {
  task: ScheduledTask;
  onSaved?: () => void;
}

export function RunAgentConfigForm({ task, onSaved }: RunAgentConfigFormProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Parse current properties
  const props = task.properties as RunAgentProperties;
  const currentPermissions = props.permissions;
  const currentPermissionMode =
    typeof currentPermissions === "string" && currentPermissions === "allow_all"
      ? "allow_all"
      : "custom";
  const currentAllowList =
    typeof currentPermissions === "object" && currentPermissions.allowList
      ? currentPermissions.allowList.join(", ")
      : "";

  // Form state
  const [prompt, setPrompt] = useState(props.prompt || "");
  const [cwd, setCwd] = useState(props.cwd || "");
  const [permissionMode, setPermissionMode] = useState<"allow_all" | "custom">(
    currentPermissionMode
  );
  const [allowList, setAllowList] = useState(currentAllowList);
  const [local, setLocal] = useState(props.local || false);

  // Validation
  const [promptError, setPromptError] = useState("");

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Validate
      if (!prompt.trim()) {
        setPromptError("Prompt is required");
        throw new Error("Prompt is required");
      }

      // Parse permissions
      let permissions: "allow_all" | { allowList: string[] };
      if (permissionMode === "allow_all") {
        permissions = "allow_all";
      } else {
        // Parse comma-separated allow list
        const parsedList = allowList
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        permissions = { allowList: parsedList };
      }

      // Build updated properties
      const updatedProperties: RunAgentProperties = {
        prompt: prompt.trim(),
        ...(cwd.trim() && { cwd: cwd.trim() }),
        permissions,
        local,
      };

      return agentTasksService.updateTask(task.id, {
        properties: updatedProperties,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-task", task.id] });
      queryClient.invalidateQueries({ queryKey: ["agent-tasks"] });
      setIsEditing(false);
      onSaved?.();
    },
  });

  const handleSave = () => {
    setPromptError("");
    updateMutation.mutate();
  };

  const handleCancel = () => {
    // Reset form to current values
    setPrompt(props.prompt || "");
    setCwd(props.cwd || "");
    setPermissionMode(currentPermissionMode);
    setAllowList(currentAllowList);
    setLocal(props.local || false);
    setPromptError("");
    setIsEditing(false);
  };

  if (!isEditing) {
    // View Mode
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configuration</CardTitle>
          <ContainerToolButton
            onClick={() => setIsEditing(true)}
            size="icon"
            variant="ghost"
          >
            <Pencil className="h-4 w-4" />
          </ContainerToolButton>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Prompt
            </h3>
            <p className="text-sm whitespace-pre-wrap">{props.prompt}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Working Directory
              </h3>
              <p className="text-sm font-mono">
                {props.cwd || "/Users/dweaver/Projects/ai/xerro-agent"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Permissions
              </h3>
              {typeof currentPermissions === "string" &&
              currentPermissions === "allow_all" ? (
                <p className="text-sm">Allow All</p>
              ) : typeof currentPermissions === "object" &&
                currentPermissions.allowList ? (
                <div className="flex flex-wrap gap-1">
                  {currentPermissions.allowList.map((tool, index) => (
                    <span
                      key={index}
                      className="text-xs bg-muted px-2 py-1 rounded"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not configured</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Use Local LLM
              </h3>
              <p className="text-sm">{props.local ? "Yes" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Configuration</CardTitle>
        <ContainerToolButton
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="icon"
          variant="primary"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </ContainerToolButton>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* Prompt Field */}
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Prompt <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (promptError) setPromptError("");
              }}
              placeholder="Search my documents for..."
              rows={6}
              disabled={updateMutation.isPending}
              className={promptError ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              The task or instruction for the agent to execute
            </p>
            {promptError && (
              <p className="text-xs text-red-500">{promptError}</p>
            )}
          </div>

          {/* Working Directory Field */}
          <div className="space-y-2">
            <Label htmlFor="cwd">Working Directory</Label>
            <Input
              id="cwd"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="/Users/dweaver/Projects/ai/xerro-agent"
              disabled={updateMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Default: /Users/dweaver/Projects/ai/xerro-agent
            </p>
          </div>

          {/* Permissions Field */}
          <div className="space-y-2">
            <Label htmlFor="permissions">Permissions</Label>
            <Select
              value={permissionMode}
              onValueChange={(value: "allow_all" | "custom") =>
                setPermissionMode(value)
              }
              disabled={updateMutation.isPending}
            >
              <SelectTrigger id="permissions">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow_all">Allow All</SelectItem>
                <SelectItem value="custom">Custom Allow List</SelectItem>
              </SelectContent>
            </Select>

            {permissionMode === "custom" && (
              <div className="space-y-2 mt-2">
                <Textarea
                  value={allowList}
                  onChange={(e) => setAllowList(e.target.value)}
                  placeholder="Bash, Read, Write, Grep"
                  rows={3}
                  disabled={updateMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed tools
                </p>
              </div>
            )}
          </div>

          {/* Local LLM Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="local">Use Local LLM</Label>
              <p className="text-xs text-muted-foreground">
                Use local inference server instead of Anthropic API
              </p>
            </div>
            <Switch
              id="local"
              checked={local}
              onCheckedChange={setLocal}
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

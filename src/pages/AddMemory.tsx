import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";

const formSchema = z.object({
  content: z.string().min(1, "Content is required"),
  role_type: z.enum(["user", "assistant", "system"]),
  role: z.string().optional(),
  timestamp: z.string(),
  source_description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddMemory() {
  const { groupId } = useGraphiti();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      role_type: "user",
      role: "",
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      source_description: "",
    },
  });

  const roleType = watch("role_type");

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const message = {
        content: data.content,
        role_type: data.role_type,
        role: data.role || data.role_type,
        timestamp: new Date(data.timestamp).toISOString(),
        source_description: data.source_description || undefined,
      };
      return graphitiService.addMessages([message], groupId);
    },
    onSuccess: () => {
      toast.success("Memory added successfully! Processing in background...");
      reset();
    },
    onError: (error) => {
      toast.error("Failed to add memory: " + (error as Error).message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Container
      title="Add Memory"
      description="Create a new memory episode"
    >
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  Content <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Enter your memory content..."
                  rows={8}
                  {...register("content")}
                  className={errors.content ? "border-destructive" : ""}
                />
                {errors.content && (
                  <p className="text-sm text-destructive">
                    {errors.content.message}
                  </p>
                )}
              </div>

              {/* Role Type */}
              <div className="space-y-2">
                <Label htmlFor="role_type">
                  Role Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={roleType}
                  onValueChange={(value) =>
                    setValue("role_type", value as "user" | "assistant" | "system")
                  }
                >
                  <SelectTrigger id="role_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Name */}
              <div className="space-y-2">
                <Label htmlFor="role">Role Name (Optional)</Label>
                <Input
                  id="role"
                  type="text"
                  placeholder="e.g., Dave, Claude, System"
                  {...register("role")}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use role type as name
                </p>
              </div>

              {/* Timestamp */}
              <div className="space-y-2">
                <Label htmlFor="timestamp">
                  Timestamp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  {...register("timestamp")}
                  className={errors.timestamp ? "border-destructive" : ""}
                />
                {errors.timestamp && (
                  <p className="text-sm text-destructive">
                    {errors.timestamp.message}
                  </p>
                )}
              </div>

              {/* Source Description */}
              <div className="space-y-2">
                <Label htmlFor="source_description">
                  Source Description (Optional)
                </Label>
                <Input
                  id="source_description"
                  type="text"
                  placeholder="e.g., Manual entry, Claude Code, etc."
                  {...register("source_description")}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={mutation.isPending}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Adding..." : "Add Memory"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Note</h3>
          <p className="text-sm text-muted-foreground">
            Memory processing happens asynchronously in the background. Your
            memory will appear in the Episodes page once processed, and related
            entities and facts will be extracted automatically.
          </p>
        </div>
      </div>
    </Container>
  );
}

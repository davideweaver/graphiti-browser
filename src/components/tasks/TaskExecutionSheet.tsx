import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatTimestamp } from "@/lib/cronFormatter";
import type { TaskExecution } from "@/types/agentTasks";

interface TaskExecutionSheetProps {
  execution: TaskExecution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskExecutionSheet({
  execution,
  open,
  onOpenChange,
}: TaskExecutionSheetProps) {
  if (!execution) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Execution Details</SheetTitle>
          <SheetDescription>
            {formatTimestamp(execution.timestamp)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {execution.success ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <Badge variant="default" className="bg-green-600">
                      Success
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="h-5 w-5" />
                    <Badge variant="destructive">Failed</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Duration</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-mono">
                    {execution.durationMs}ms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          {execution.message && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Message</span>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {execution.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {execution.error && (
            <Card className="border-red-200 dark:border-red-900">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Error
                  </span>
                  <pre className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
                    {execution.error}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Data */}
          {execution.data && Object.keys(execution.data).length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Additional Data</span>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(execution.data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamp */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Executed At</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {new Date(execution.timestamp).toLocaleString("en-US", {
                    dateStyle: "full",
                    timeStyle: "long",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

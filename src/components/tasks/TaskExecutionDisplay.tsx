import type { TaskExecution } from "@/types/agentTasks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Hash, Wrench, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TaskExecutionDisplayProps {
  execution: TaskExecution;
}

export function TaskExecutionDisplay({ execution }: TaskExecutionDisplayProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const normalized = execution.normalizedResult;

  // Fallback to old format if no normalized result
  if (!normalized) {
    return <LegacyDataDisplay data={execution.data} />;
  }

  return (
    <div className="space-y-4">
      {/* Primary: Status + Summary Combined */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex items-start">
              {execution.success ? (
                <Badge variant="default" className="bg-green-600">
                  Success
                </Badge>
              ) : (
                <Badge variant="destructive">Failed</Badge>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{normalized.display.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary: Metrics Grid (if available) */}
      {normalized.metrics && Object.keys(normalized.metrics).filter(k => normalized.metrics![k as keyof typeof normalized.metrics] !== undefined).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {normalized.metrics.cost !== undefined && (
            <MetricCard
              icon={DollarSign}
              label="Cost"
              value={formatCost(normalized.metrics.cost)}
            />
          )}
          {normalized.metrics.tokens !== undefined && (
            <MetricCard
              icon={Wrench}
              label="Tools"
              value={`${normalized.metrics.tokens} calls`}
            />
          )}
          {normalized.metrics.duration !== undefined && (
            <MetricCard
              icon={Clock}
              label="Duration"
              value={formatDuration(normalized.metrics.duration)}
            />
          )}
          {normalized.metrics.items !== undefined && (
            <MetricCard
              icon={Hash}
              label="Items"
              value={`${normalized.metrics.items}`}
            />
          )}
        </div>
      )}

      {/* Session ID (if available) */}
      {normalized.metadata?.sessionId && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span className="text-xs">Session ID</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{truncateSessionId(normalized.metadata.sessionId)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(normalized.metadata!.sessionId!, "Session ID")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tertiary: Details (collapsible) */}
      {normalized.display.details && (
        <Card>
          <CardContent className="pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="w-full justify-between"
            >
              <span className="text-sm font-medium">Full Details</span>
              {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {detailsExpanded && (
              <pre className="mt-3 text-xs bg-muted p-3 rounded-md overflow-auto whitespace-pre-wrap">
                {normalized.display.details}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for metric cards
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span className="text-xs">{label}</span>
          </div>
          <span className="text-lg font-semibold">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Fallback for old data format
interface LegacyDataDisplayProps {
  data?: Record<string, unknown>;
}

function LegacyDataDisplay({ data }: LegacyDataDisplayProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No additional data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Task Data</span>
            <Badge variant="secondary" className="text-xs">Legacy</Badge>
          </div>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

// Formatting utilities
function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.001) return "<$0.001";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function truncateSessionId(id: string): string {
  return id.length > 12 ? `${id.substring(0, 12)}...` : id;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied to clipboard`);
  }).catch(() => {
    toast.error(`Failed to copy ${label}`);
  });
}

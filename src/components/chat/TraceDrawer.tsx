import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { AgentTrace } from "@/types/chat";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Brain,
  Wrench,
  MessageSquare,
  ArrowRight,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Props {
  trace: AgentTrace | null;
  userMessage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TraceDrawer({
  trace,
  userMessage,
  open,
  onOpenChange,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [expandedTurns, setExpandedTurns] = useState<Set<number>>(new Set());

  // Expand all turns with tool calls by default
  useEffect(() => {
    if (trace?.llmTurns) {
      const turnsWithTools = trace.llmTurns
        .filter(turn => turn.toolDecisions.length > 0)
        .map(turn => turn.turnNumber);
      if (turnsWithTools.length > 0) {
        setExpandedTurns(new Set(turnsWithTools));
      }
    }
  }, [trace?.llmTurns]);

  if (!trace) return null;

  const toggleTurnExpanded = (turnNumber: number) => {
    setExpandedTurns(prev => {
      const next = new Set(prev);
      if (next.has(turnNumber)) {
        next.delete(turnNumber);
      } else {
        next.add(turnNumber);
      }
      return next;
    });
  };

  const handleCopyTrace = async () => {
    try {
      const traceData = {
        userMessage,
        trace,
      };
      await navigator.clipboard.writeText(JSON.stringify(traceData, null, 2));
      setCopied(true);
      toast.success("Trace copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy trace");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Agent Execution Trace
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyTrace}
              title="Copy trace as JSON"
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          <div className="space-y-4 pr-4">
            {/* User Message */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    USER QUERY
                  </p>
                  <p className="text-sm">{userMessage}</p>
                </div>
              </div>
            </Card>

            {/* Summary Stats */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Badge
                variant={trace.success ? "default" : "destructive"}
                className="gap-1"
              >
                {trace.success ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {trace.success ? "Success" : "Failed"}
              </Badge>
              <Separator orientation="vertical" className="h-4" />
              <span>{trace.steps} steps</span>
              <Separator orientation="vertical" className="h-4" />
              <Clock className="h-3 w-3" />
              <span>{trace.duration?.toFixed(2)}s</span>
              {trace.model && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant="outline" className="text-xs">
                    {trace.model}
                  </Badge>
                </>
              )}
              {trace.agentType && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant="secondary" className="text-xs">
                    {trace.agentType}
                  </Badge>
                </>
              )}
            </div>

            <Separator />

            {/* Pre-Search (if present, shown separately) */}
            {trace.preSearch && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Pre-Search
                </h3>
                <div className="relative pl-6 pb-4">
                  <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Brain className="h-2.5 w-2.5 text-white" />
                  </div>

                  <Card className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold">Memory Search</p>
                      <Badge variant="outline" className="text-xs">
                        {(trace.preSearch.timeMs / 1000).toFixed(2)}s
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Query:</span>
                        <code className="text-xs bg-muted px-1 rounded">
                          {trace.preSearch.query}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Facts retrieved:
                        </span>
                        <span>{trace.preSearch.factsFound}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          High quality:
                        </span>
                        <span className="text-green-600 font-medium">
                          {trace.preSearch.cleanedFacts?.length || 0}
                        </span>
                      </div>
                      {(trace.preSearch.filteredFacts?.length || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Filtered out:
                          </span>
                          <span className="text-orange-600">
                            {trace.preSearch.filteredFacts?.length || 0}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Show cleaned facts inline */}
                    {trace.preSearch.cleanedFacts &&
                      trace.preSearch.cleanedFacts.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Facts used:
                          </p>
                          {trace.preSearch.cleanedFacts.map((fact) => (
                            <div
                              key={fact.uuid}
                              className="text-xs bg-muted/50 p-2 rounded"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] h-4">
                                  {fact.score.toFixed(2)}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">{fact.fact}</p>
                            </div>
                          ))}
                        </div>
                      )}
                  </Card>
                </div>
              </div>
            )}

            {/* LLM Turn-by-Turn Reasoning Trace */}
            {trace.llmTurns && trace.llmTurns.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Agent Steps ({trace.llmTurns.length} {trace.llmTurns.length === 1 ? 'step' : 'steps'})
                  </h3>

                  {trace.llmTurns.map((turn, idx) => {
                    const isExpanded = expandedTurns.has(turn.turnNumber);
                    const estimatedDuration = trace.duration ? (trace.duration / trace.llmTurns!.length).toFixed(1) : null;
                    const hasTool = turn.toolDecisions.length > 0;

                    return (
                      <div key={idx} className="relative pl-6 pb-4">
                        {/* Timeline connector line */}
                        <div
                          className={`absolute left-[7px] top-0 bottom-0 w-[2px] bg-border ${
                            idx === trace.llmTurns!.length - 1 ? "hidden" : ""
                          }`}
                        />

                        {/* Step number indicator */}
                        <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                          {turn.turnNumber}
                        </div>

                        <Card className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold">Step {turn.turnNumber}</p>
                              {turn.toolDecisions.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] h-4">
                                  {turn.toolDecisions.length} tool{turn.toolDecisions.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            {estimatedDuration && (
                              <Badge variant="outline" className="text-[10px]">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                ~{estimatedDuration}s
                              </Badge>
                            )}
                          </div>

                          {/* LLM Reasoning */}
                          {turn.reasoning && (
                            <div className="mb-2">
                              <p className="text-xs bg-purple-50 dark:bg-purple-950/20 p-2 rounded border border-purple-200 dark:border-purple-800 whitespace-pre-wrap">
                                {turn.reasoning}
                              </p>
                            </div>
                          )}

                          {/* Tool Calls Section (Collapsible) */}
                          {turn.toolDecisions.length > 0 && (
                            <div>
                              {/* Collapsible header */}
                              <button
                                onClick={() => toggleTurnExpanded(turn.turnNumber)}
                                className="flex items-center gap-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                                <Wrench className="h-3 w-3" />
                                <span className="font-medium">
                                  {turn.toolDecisions.length} Tool Call{turn.toolDecisions.length !== 1 ? 's' : ''}
                                </span>
                                {!isExpanded && turn.toolResults.some(r => !r.success) && (
                                  <Badge variant="destructive" className="text-[10px] h-4 ml-auto">
                                    {turn.toolResults.filter(r => !r.success).length} failed
                                  </Badge>
                                )}
                              </button>

                              {/* Tool details (shown when expanded) */}
                              {isExpanded && (
                                <div className="mt-2 space-y-2 pl-5 border-l-2 border-purple-200 dark:border-purple-800">
                                  {turn.toolDecisions.map((decision, dIdx) => {
                                    const result = turn.toolResults.find(
                                      r => r.toolCallId === decision.toolCallId
                                    );

                                    return (
                                      <div
                                        key={dIdx}
                                        className="text-xs bg-muted/50 p-2 rounded border"
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <code className="text-xs font-mono font-semibold">
                                            {decision.toolName}
                                          </code>
                                          {result && (
                                            <Badge
                                              variant={result.success ? "default" : "destructive"}
                                              className="text-[10px] h-4"
                                            >
                                              {result.success ? "✓" : "✗"}
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Input arguments */}
                                        <details
                                          className="text-[10px] mb-1"
                                          open={hasTool && dIdx === 0}
                                        >
                                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                            Input
                                          </summary>
                                          <pre className="mt-1 p-2 bg-background rounded overflow-x-auto text-[10px] font-mono">
                                            {JSON.stringify(decision.input, null, 2)}
                                          </pre>
                                        </details>

                                        {/* Output/Result */}
                                        {result && (
                                          <details className="text-[10px]">
                                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                              {result.success ? 'Output' : 'Error'}
                                            </summary>
                                            <pre className="mt-1 p-2 bg-background rounded overflow-x-auto text-[10px] font-mono max-h-[150px]">
                                              {result.error || JSON.stringify(result.output, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Final turn with no tools */}
                          {turn.toolDecisions.length === 0 && !turn.reasoning && (
                            <p className="text-[10px] text-muted-foreground italic">
                              Final step - generating response
                            </p>
                          )}
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <Separator />

            {/* Agent Response */}
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    AGENT RESPONSE
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{trace.response}</p>
                </div>
              </div>
            </Card>

            {/* Error (if any) */}
            {trace.error && (
              <Card className="p-4 bg-destructive/5 border-destructive/20">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 mt-0.5 text-destructive shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      ERROR
                    </p>
                    <p className="text-sm text-destructive">{trace.error}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

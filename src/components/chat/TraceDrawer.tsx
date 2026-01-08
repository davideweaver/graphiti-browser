import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { AgentTrace } from "@/types/chat";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Brain,
  Code,
  Search,
  Filter,
  AlertTriangle,
  CheckCheck,
} from "lucide-react";

interface Props {
  trace: AgentTrace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TraceDrawer({ trace, open, onOpenChange }: Props) {
  if (!trace) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px]">
        <SheetHeader>
          <SheetTitle>Agent Trace Details</SheetTitle>
          <SheetDescription>
            Complete execution trace showing pre-search, tool usage, and fact filtering
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4 pr-4">
            {/* Pre-Search Section */}
            {trace.preSearch && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Pre-Search Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Query</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {trace.preSearch.query}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tool Call</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        graphiti_search(maxFacts={trace.preSearch.maxFacts})
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Facts Found</span>
                      <Badge variant="secondary">{trace.preSearch.factsFound}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Search Time</span>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {(trace.preSearch.timeMs / 1000).toFixed(1)}s
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cleaned Facts (High Quality) */}
            {trace.preSearch?.cleanedFacts && trace.preSearch.cleanedFacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCheck className="h-4 w-4 text-green-600" />
                    Cleaned Facts ({trace.preSearch.cleanedFacts.length})
                    <Badge variant="secondary" className="ml-auto">High Quality</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trace.preSearch.cleanedFacts.map((fact, idx) => (
                      <div key={fact.uuid} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                            {idx + 1}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Progress
                                value={fact.score * 100}
                                className="h-2 flex-1"
                              />
                              <Badge
                                variant={
                                  fact.score >= 0.7
                                    ? "default"
                                    : fact.score >= 0.4
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {fact.score.toFixed(2)}
                              </Badge>
                            </div>
                            <p className="text-sm break-words">{fact.fact}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              UUID: {fact.uuid.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        {idx < (trace.preSearch?.cleanedFacts.length ?? 0) - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filtered Facts (Low Quality) */}
            {trace.preSearch?.filteredFacts && trace.preSearch.filteredFacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4 text-orange-600" />
                    Filtered Facts ({trace.preSearch.filteredFacts.length})
                    <Badge variant="destructive" className="ml-auto">Low Quality</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trace.preSearch.filteredFacts.map((fact, idx) => (
                      <div key={fact.uuid} className="space-y-1 opacity-70">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Progress
                                value={fact.score * 100}
                                className="h-2 flex-1 opacity-50"
                              />
                              <Badge variant="outline" className="text-xs">
                                {fact.score.toFixed(2)}
                              </Badge>
                            </div>
                            <p className="text-sm break-words line-through">
                              {fact.fact}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              UUID: {fact.uuid.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        {idx < (trace.preSearch?.filteredFacts.length ?? 0) - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tool Calls */}
            {trace.toolCalls && trace.toolCalls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Tool Calls ({trace.toolCalls.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trace.toolCalls.map((call, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              call.success === false ? "destructive" : "default"
                            }
                          >
                            {call.tool}
                          </Badge>
                          {call.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {call.timestamp}
                            </span>
                          )}
                          {call.success !== undefined && (
                            <Badge
                              variant={call.success ? "default" : "destructive"}
                              className="gap-1 ml-auto"
                            >
                              {call.success ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Success
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  Failed
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                        <div className="pl-4 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Input:
                            </p>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                              {typeof call.input === "string"
                                ? call.input
                                : JSON.stringify(call.input, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Output:
                            </p>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-[200px]">
                              {typeof call.output === "string"
                                ? call.output
                                : JSON.stringify(call.output, null, 2)}
                            </pre>
                          </div>
                          {call.error && (
                            <div>
                              <p className="text-xs font-medium text-destructive mb-1">
                                Error:
                              </p>
                              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                {call.error}
                              </p>
                            </div>
                          )}
                        </div>
                        {idx < (trace.toolCalls?.length ?? 0) - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Execution Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Execution Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={trace.success ? "default" : "destructive"} className="gap-1">
                    {trace.success ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Success
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Failed
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Steps</span>
                  <Badge variant="secondary">{trace.steps}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {trace.duration?.toFixed(1)}s
                  </Badge>
                </div>

                {trace.finishReason && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Finish Reason</span>
                    <Badge variant="outline">{trace.finishReason}</Badge>
                  </div>
                )}

                {trace.usedTools !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Used Tools</span>
                    <Badge variant={trace.usedTools ? "default" : "secondary"}>
                      {trace.usedTools ? "YES" : "NO"}
                    </Badge>
                  </div>
                )}

                {trace.error && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Error</span>
                    <p className="text-sm text-destructive mt-1">{trace.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Memory Facts Summary */}
            {trace.memoryFacts && trace.memoryFacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Memory Facts Used ({trace.memoryFacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trace.memoryFacts.map((fact, idx) => (
                      <div key={fact.uuid} className="text-sm">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs">
                            {idx + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm">{fact.fact}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              UUID: {fact.uuid.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        {idx < (trace.memoryFacts?.length ?? 0) - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reasoning */}
            {trace.reasoning && trace.reasoning.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Reasoning Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trace.reasoning.map((step, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {idx + 1}
                        </Badge>
                        <p className="text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {trace.metadata && Object.keys(trace.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(trace.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Raw Trace */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Raw Trace (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[400px]">
                  {JSON.stringify(trace, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

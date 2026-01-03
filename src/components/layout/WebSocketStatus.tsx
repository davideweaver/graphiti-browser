import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/types/websocket";

interface Props {
  connectionState: ConnectionState;
  queueSize?: number;
}

interface StateConfig {
  icon: typeof Wifi;
  label: string;
  variant: "default" | "destructive" | "outline";
  className: string;
}

const stateConfig: Record<ConnectionState, StateConfig> = {
  connected: {
    icon: Wifi,
    label: "Live",
    variant: "default",
    className: "bg-green-500 hover:bg-green-600",
  },
  disconnected: {
    icon: WifiOff,
    label: "Offline",
    variant: "destructive",
    className: "",
  },
  reconnecting: {
    icon: RefreshCw,
    label: "Reconnecting...",
    variant: "outline",
    className: "animate-spin",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    variant: "destructive",
    className: "",
  },
};

export default function WebSocketStatus({ connectionState, queueSize = 0 }: Props) {
  const { icon: Icon, label, variant, className } = stateConfig[connectionState];

  // Show queue size when connected and queue is not empty
  const displayLabel =
    connectionState === "connected" && queueSize > 0
      ? `${label} (${queueSize})`
      : label;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className={cn("h-3 w-3", className)} />
      <span className="text-xs">{displayLabel}</span>
    </Badge>
  );
}

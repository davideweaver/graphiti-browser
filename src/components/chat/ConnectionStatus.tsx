import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

interface Props {
  isOnline: boolean;
}

export default function ConnectionStatus({ isOnline }: Props) {
  return (
    <Badge variant={isOnline ? "default" : "destructive"}>
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </>
      )}
    </Badge>
  );
}

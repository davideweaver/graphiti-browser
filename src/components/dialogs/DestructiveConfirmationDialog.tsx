import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  confirmText?: string;
  confirmLoadingText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

const DestructiveConfirmationDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  isLoading = false,
  confirmText = "Delete",
  confirmLoadingText = "Deleting...",
  confirmVariant = "destructive",
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLoading ? confirmLoadingText : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DestructiveConfirmationDialog;

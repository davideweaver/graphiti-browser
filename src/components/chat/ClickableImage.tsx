import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ClickableImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export default function ClickableImage({ src, alt, className }: ClickableImageProps) {
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <img
        src={src}
        alt={alt ?? ""}
        className={className ?? "max-w-full rounded cursor-zoom-in hover:opacity-90 transition-opacity"}
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 flex items-center justify-center bg-black/90 border-0">
          <img
            src={src}
            alt={alt ?? ""}
            className="max-w-full max-h-[85vh] object-contain rounded"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

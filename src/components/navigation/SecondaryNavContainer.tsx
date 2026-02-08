import type { ReactNode } from "react";

interface SecondaryNavContainerProps {
  title: string;
  tools?: ReactNode;
  children: ReactNode;
}

export function SecondaryNavContainer({
  title,
  tools,
  children,
}: SecondaryNavContainerProps) {
  return (
    <nav className="w-full md:w-[380px] bg-card flex flex-col min-w-0">
      {/* Header */}
      <div className="pt-4 md:pt-8 px-6 flex items-center justify-between mb-4">
        <h2 className="font-bold" style={{ fontSize: 28 }}>
          {title}
        </h2>
        {tools && <div className="flex items-center gap-1">{tools}</div>}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </nav>
  );
}

import { useEffect } from "react";
import useScrollToTop from "@/hooks/use-scroll-to-top";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
// import { ScrollArea } from "@radix-ui/react-scroll-area";

const DEFAULT_PADDING = 24;

type Props = {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  tools?: React.ReactNode;
  bodyHorzPadding?: number;
  bodyTopOffset?: number;
  maintainScrollPosition?: boolean;
  loading?: boolean;
  content?: ContentType;
};

export type ContentType = "fixed" | "full" | "fixedWithScroll";

const Container: React.FC<Props> = ({
  children,
  title,
  description,
  tools = null,
  bodyHorzPadding: bodyPadding,
  bodyTopOffset: topOffset = 40,
  maintainScrollPosition = false,
  loading = false,
  content = "full",
}) => {
  useScrollToTop(!maintainScrollPosition);
  const bodyHorzPadding = bodyPadding ?? DEFAULT_PADDING;
  const isMobile = useIsMobile();

  // fixedWithScroll is the same as fixed, but has scrollbars
  const isScrollable = content === "fixedWithScroll";
  const isFixed = content === "fixed" || content === "fixedWithScroll";

  useEffect(() => {
    if (isFixed) {
      document.documentElement.style.overflowY = "hidden";
      return () => {
        document.documentElement.style.overflowY = "auto";
      };
    }
  }, [isFixed]);

  // Container classes and styles based on fullHeight prop
  const containerClasses = isFixed
    ? "h-screen flex flex-col p-0 ml-0 pt-4 md:pt-8 overflow-hidden"
    : "h-screen p-0 ml-0 pt-4 md:pt-8";

  // Header classes and styles based on fullHeight prop
  const headerClasses = isFixed
    ? "flex max-w-screen-lg flex-col lg:flex-row justify-between items-start w-full mb-4 lg:mb-6 lg:flex-shrink-0"
    : "flex max-w-screen-lg flex-col lg:flex-row justify-between items-start w-full mb-4 lg:mb-10";

  const headerStyle = isFixed
    ? {
        paddingLeft: DEFAULT_PADDING,
        paddingRight: DEFAULT_PADDING,
      }
    : {
        paddingLeft: DEFAULT_PADDING,
        paddingRight: DEFAULT_PADDING,
        marginBottom: topOffset,
      };

  const titleClasses = isFixed ? "pb-2 lg:pb-0" : "pb-2 lg:pb-0";
  const titleStyle = isMobile ? { marginLeft: 40, maxWidth: "calc(100% - 40px)" } : {};

  // Content area classes and styles based on fullHeight prop
  const contentClasses = isFixed
    ? "max-w-screen-lg flex-1 min-h-0 overflow-hidden"
    : "max-w-screen-lg";

  const contentStyle = isFixed
    ? {
        paddingLeft: isMobile ? 0 : bodyHorzPadding,
        paddingRight: isMobile ? 0 : bodyHorzPadding,
        paddingBottom: isMobile
          ? isScrollable
            ? 0
            : 80
          : isScrollable
            ? 0
            : 50,
        marginBottom: isMobile ? 64 : 20, // Add bottom margin for mobile navbar (64px)
        overflow: "hidden",
      }
    : {
        paddingLeft: bodyHorzPadding,
        paddingRight: bodyHorzPadding,
        paddingBottom: isMobile ? 64 : 50, // Add bottom padding for mobile navbar (64px + 16px margin)
        width: isMobile ? "100vw" : "100%",
        overflow: "hidden",
      };

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={headerClasses} style={headerStyle}>
        <div className={`${titleClasses} min-w-0 flex-1`} style={titleStyle}>
          <h1
            className="font-bold flex items-center"
            style={{ fontSize: 28, lineHeight: 1.2, marginTop: 6 }}
          >
            {title}{" "}
            {loading && (
              <Loader2 className="h-6 w-6 ml-2 animate-spin text-muted-foreground" />
            )}
          </h1>
          {description && (
            <div className="text-sm text-muted-foreground mb-4 md:mb-0 min-w-0 w-full overflow-hidden">
              {description}
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 h-full items-center flex-shrink-0">
          {tools}
        </div>
      </div>

      {/* Main content area */}
      {!loading && (
        <div className={contentClasses} style={contentStyle}>
          {isFixed && (
            <div
              style={{
                height: "100%",
                width: "100%",
                overflow: isScrollable ? "auto" : "hidden",
              }}
            >
              {children}
            </div>
          )}
          {!isFixed && children}
        </div>
      )}
    </div>
  );
};

export default Container;

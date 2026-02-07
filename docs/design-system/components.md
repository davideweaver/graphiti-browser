# Components

Component usage patterns and guidelines for ShadCN UI components and custom components.

## Button

### Standard Button

```tsx
import { Button } from "@/components/ui/button";

<Button onClick={handleClick}>Click Me</Button>
```

### Variants

```tsx
// Default - solid button
<Button variant="default">Default</Button>

// Destructive - for delete/remove actions
<Button variant="destructive">Delete</Button>

// Outline - secondary actions
<Button variant="outline">Cancel</Button>

// Ghost - subtle actions
<Button variant="ghost">Learn More</Button>

// Link - looks like a link
<Button variant="link">Read More</Button>

// Secondary - less prominent than default
<Button variant="secondary">Secondary</Button>
```

### Sizes

```tsx
<Button size="sm">Small</Button>       // Compact button
<Button size="default">Default</Button> // Standard size
<Button size="lg">Large</Button>       // Prominent button
<Button size="icon">                   // Square icon button
  <Icon className="h-4 w-4" />
</Button>
```

### With Icons

```tsx
import { Plus } from "lucide-react";

// Icon before text
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add New
</Button>

// Icon after text
<Button>
  Continue
  <ChevronRight className="h-4 w-4 ml-2" />
</Button>

// Icon only
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>
```

### Loading State

```tsx
import { Loader2 } from "lucide-react";

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

## ContainerToolButton

Specialized button component for Container toolbar buttons. Uses subdued gray styling that works in both light and dark modes.

### Full Component Code

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerToolButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(220_8%_18%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(220_8%_25%)] dark:bg-[hsl(220_8%_18%)] dark:text-[hsl(210_40%_98%)] dark:hover:bg-[hsl(220_8%_25%)]",
        destructive:
          "bg-[hsl(220_8%_18%)] text-[hsl(210_40%_98%)] hover:bg-destructive hover:text-destructive-foreground dark:bg-[hsl(220_8%_18%)] dark:text-[hsl(210_40%_98%)] dark:hover:bg-destructive dark:hover:text-destructive-foreground",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-9 rounded-md px-3",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

export interface ContainerToolButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof containerToolButtonVariants> {
  asChild?: boolean;
}

const ContainerToolButton = React.forwardRef<
  HTMLButtonElement,
  ContainerToolButtonProps
>(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(containerToolButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
ContainerToolButton.displayName = "ContainerToolButton";

export { ContainerToolButton, containerToolButtonVariants };
```

### Usage

**ONLY use for Container tools** - All other buttons in the app should use the regular `Button` component.

```tsx
import { ContainerToolButton } from "@/components/container/ContainerToolButton";

const tools = (
  <div className="flex gap-2">
    <ContainerToolButton size="sm" onClick={handleClick}>
      <Icon className="h-4 w-4 mr-2" />
      Action
    </ContainerToolButton>
    <ContainerToolButton variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </ContainerToolButton>
  </div>
);
```

### Key Features

- Subdued gray background (`hsl(220 8% 18%)`) in both light and dark modes
- Same styling in light and dark mode (not theme-dependent)
- Default size is `sm` (automatically applied)
- Icons should use `className="h-4 w-4 mr-2"` for consistency
- Supports `default`, `destructive`, `outline`, and `ghost` variants

See [patterns.md](./patterns.md#tool-button-hierarchy) for toolbar button patterns.

## Card

### Basic Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
</Card>
```

### Card Padding

```tsx
// Standard padding (20px)
<CardContent className="p-5">

// More padding for headers (24px)
<CardHeader className="p-6">

// Compact padding (16px)
<CardContent className="p-4">
```

### Interactive Card

```tsx
<Card
  className="cursor-pointer hover:shadow-md transition-shadow"
  onClick={() => navigate(`/item/${item.id}`)}
>
  <CardContent className="p-5">
    {/* Content */}
  </CardContent>
</Card>
```

### Card with Avatar

```tsx
<Card>
  <CardContent className="p-5">
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg font-semibold text-primary">
            {getInitials(name)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg truncate">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

### Card with Badge

```tsx
<Card>
  <CardContent className="p-5">
    <div className="flex items-start justify-between mb-2">
      <h3 className="font-semibold text-lg truncate">{title}</h3>
      <Badge variant="secondary">{type}</Badge>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </CardContent>
</Card>
```

## Badge

### Variants

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### Colored Badges

```tsx
// Entity type colors
<Badge className="bg-blue-500/10 text-blue-500">Person</Badge>
<Badge className="bg-purple-500/10 text-purple-500">Organization</Badge>
<Badge className="bg-green-500/10 text-green-500">Location</Badge>
<Badge className="bg-gray-500/10 text-gray-500">Other</Badge>
```

Uses alpha transparency (`/10`) for subtle colored backgrounds.

## Form Components

### Input

```tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input
    id="name"
    type="text"
    placeholder="Enter name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
</div>
```

### Textarea

```tsx
import { Textarea } from "@/components/ui/textarea";

<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    rows={4}
    placeholder="Enter description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
</div>
```

### Form Field Spacing

```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="field1">Field 1</Label>
    <Input id="field1" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="field2">Field 2</Label>
    <Input id="field2" />
  </div>
</div>
```

**Pattern:**
- Outer container: `space-y-4` (16px between fields)
- Field container: `space-y-2` (8px between label and input)

### Select Dropdown

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

## Dialog

### Basic Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description or instructions go here.
      </DialogDescription>
    </DialogHeader>

    {/* Dialog content */}
    <div className="space-y-4">
      {/* Content */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Dialog with Form

```tsx
<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Item</DialogTitle>
      <DialogDescription>
        Make changes to the item below.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
        />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## DeleteConfirmationDialog

Reusable component for delete confirmations with consistent styling and behavior.

### Full Component Code

```tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onCancel: () => void;
  title: string;
  description: string;
};

const DeleteConfirmationDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onDelete,
  onCancel,
  title,
  description,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
```

### Usage Pattern

See [patterns.md](./patterns.md#delete-confirmation-pattern) for complete usage pattern with state management.

## Sheet (Slide-over)

### Basic Sheet

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const [sheetOpen, setSheetOpen] = useState(false);

<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
      <SheetDescription>
        Sheet description goes here.
      </SheetDescription>
    </SheetHeader>

    {/* Sheet content */}
    <div className="mt-6 space-y-4">
      {/* Content */}
    </div>
  </SheetContent>
</Sheet>
```

### Sheet Sides

```tsx
<SheetContent side="left">   // Slides from left
<SheetContent side="right">  // Slides from right
<SheetContent side="top">    // Slides from top
<SheetContent side="bottom"> // Slides from bottom
```

## Tabs

### Basic Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>

  <TabsContent value="tab1">
    <Card>
      <CardContent className="p-6">
        Content for tab 1
      </CardContent>
    </Card>
  </TabsContent>

  <TabsContent value="tab2">
    <Card>
      <CardContent className="p-6">
        Content for tab 2
      </CardContent>
    </Card>
  </TabsContent>

  <TabsContent value="tab3">
    <Card>
      <CardContent className="p-6">
        Content for tab 3
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

### Controlled Tabs

```tsx
const [activeTab, setActiveTab] = useState("tab1");

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>

  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

## Toggle

### Basic Toggle

```tsx
import { Toggle } from "@/components/ui/toggle";

<Toggle aria-label="Toggle feature">
  <Icon className="h-4 w-4" />
</Toggle>
```

### Toggle with Text

```tsx
<Toggle pressed={isEnabled} onPressedChange={setIsEnabled}>
  {isEnabled ? "Enabled" : "Disabled"}
</Toggle>
```

## Popover

### Basic Popover

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <h4 className="font-semibold">Popover Title</h4>
      <p className="text-sm text-muted-foreground">
        Popover content goes here.
      </p>
    </div>
  </PopoverContent>
</Popover>
```

### Calendar Popover

```tsx
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

const [date, setDate] = useState<Date>();

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <CalendarIcon className="h-4 w-4 mr-2" />
      {date ? format(date, "PPP") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      initialFocus
    />
  </PopoverContent>
</Popover>
```

## Collapsible

### Basic Collapsible

```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const [isOpen, setIsOpen] = useState(false);

<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger className="flex items-center gap-2 font-semibold">
    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    Section Title
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2">
    <div className="space-y-2">
      {/* Collapsible content */}
    </div>
  </CollapsibleContent>
</Collapsible>
```

## Skeleton Loader

### Basic Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-12 w-full" />
```

### Card Skeleton

```tsx
<Card>
  <CardContent className="p-5">
    <div className="flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  </CardContent>
</Card>
```

### List Skeleton

```tsx
<div className="space-y-3">
  {[...Array(5)].map((_, i) => (
    <Card key={i}>
      <CardContent className="p-5">
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  ))}
</div>
```

See [states.md](./states.md#loading-states) for more skeleton patterns.

## Separator

### Horizontal Separator

```tsx
import { Separator } from "@/components/ui/separator";

<div>
  <p>Content above</p>
  <Separator className="my-4" />
  <p>Content below</p>
</div>
```

### Vertical Separator

```tsx
<div className="flex items-center gap-4">
  <span>Item 1</span>
  <Separator orientation="vertical" className="h-6" />
  <span>Item 2</span>
</div>
```

## Utility Functions

### cn() - Class Name Utility

Combines class names with Tailwind merge to prevent conflicts:

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  props.className
)}>
```

**Implementation:**

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Component Composition

### Building Complex Components

Compose simple components to build complex UI:

```tsx
export function EntityCard({ entity }: { entity: Entity }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {getInitials(entity.name)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg truncate">
                {entity.name}
              </h3>
              <Badge className="bg-blue-500/10 text-blue-500">
                {entity.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {entity.summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Extracting Reusable Patterns

When a pattern repeats 3+ times, extract it:

```tsx
// Avatar component
function Avatar({ name }: { name: string }) {
  return (
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
      <span className="text-lg font-semibold text-primary">
        {getInitials(name)}
      </span>
    </div>
  );
}

// Usage
<Avatar name={entity.name} />
```

## Accessibility Notes

All ShadCN components follow accessibility best practices:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility

See [accessibility.md](./accessibility.md) for detailed accessibility guidelines.

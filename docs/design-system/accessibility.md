# Accessibility

Guidelines for building accessible interfaces with proper ARIA patterns, keyboard navigation, and semantic HTML.

## ARIA Patterns

### ARIA Labels

**Button with icon only:**

```tsx
<Button size="icon" aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
</Button>
```

**Toggle button:**

```tsx
<Toggle
  pressed={isEnabled}
  onPressedChange={setIsEnabled}
  aria-label="Toggle feature"
>
  <Icon className="h-4 w-4" />
</Toggle>
```

**Interactive card:**

```tsx
<Card
  role="button"
  tabIndex={0}
  aria-label={`View details for ${entity.name}`}
  onClick={() => navigate(`/entity/${entity.uuid}`)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      navigate(`/entity/${entity.uuid}`);
    }
  }}
>
  <CardContent className="p-5">
    {/* Content */}
  </CardContent>
</Card>
```

**Search input:**

```tsx
<div className="relative">
  <label htmlFor="search" className="sr-only">
    Search items
  </label>
  <Search
    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
    aria-hidden="true"
  />
  <Input
    id="search"
    type="search"
    placeholder="Search..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    className="pl-10"
  />
</div>
```

### ARIA Live Regions

**Loading state announcement:**

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isLoading ? "Loading data..." : "Data loaded"}
</div>
```

**Status update announcement:**

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {mutation.isSuccess && "Item saved successfully"}
  {mutation.isError && "Error saving item"}
</div>
```

**Search results announcement:**

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {searchQuery && `Found ${results.length} results for ${searchQuery}`}
</div>
```

### ARIA Expanded/Collapsed

**Collapsible section:**

```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger
    aria-expanded={isOpen}
    aria-controls="collapsible-content"
  >
    <ChevronDown className={`h-4 w-4 ${isOpen ? "rotate-180" : ""}`} />
    Section Title
  </CollapsibleTrigger>
  <CollapsibleContent id="collapsible-content">
    {/* Content */}
  </CollapsibleContent>
</Collapsible>
```

### ARIA Described By

**Field with helper text:**

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    aria-describedby="email-description"
  />
  <p id="email-description" className="text-xs text-muted-foreground">
    We'll never share your email with anyone else.
  </p>
</div>
```

**Field with error:**

```tsx
<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input
    id="username"
    aria-invalid={!!error}
    aria-describedby={error ? "username-error" : undefined}
  />
  {error && (
    <p id="username-error" className="text-xs text-destructive" role="alert">
      {error.message}
    </p>
  )}
</div>
```

## Form Labeling

### Explicit Label Association

**Standard field:**

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" type="text" />
</div>
```

The `htmlFor` attribute on `<Label>` must match the `id` on `<Input>`.

### Implicit Label Association

```tsx
<label className="flex items-center gap-2">
  <input type="checkbox" />
  <span>Accept terms and conditions</span>
</label>
```

### Group Labeling

**Checkbox group:**

```tsx
<fieldset>
  <legend className="font-medium mb-2">Select options:</legend>
  <div className="space-y-2">
    <label className="flex items-center gap-2">
      <input type="checkbox" value="option1" />
      <span>Option 1</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" value="option2" />
      <span>Option 2</span>
    </label>
  </div>
</fieldset>
```

**Radio group:**

```tsx
<fieldset>
  <legend className="font-medium mb-2">Choose one:</legend>
  <div className="space-y-2">
    <label className="flex items-center gap-2">
      <input type="radio" name="choice" value="a" />
      <span>Choice A</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="radio" name="choice" value="b" />
      <span>Choice B</span>
    </label>
  </div>
</fieldset>
```

### Required Field Indication

```tsx
<Label htmlFor="email">
  Email
  <span className="text-destructive ml-1" aria-label="required">
    *
  </span>
</Label>
<Input id="email" type="email" required aria-required="true" />
```

## Focus Management

### Focus Rings

ShadCN components automatically include focus-visible styles:

```tsx
// Built into Button component
<Button>
  {/* Automatically has: focus-visible:ring-2 focus-visible:ring-ring */}
</Button>
```

### Custom Focus Styles

```tsx
<div
  tabIndex={0}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
  Focusable content
</div>
```

### Focus Trapping in Dialogs

ShadCN Dialog automatically traps focus:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Focus is trapped inside the dialog */}
    {/* Escape key closes the dialog */}
  </DialogContent>
</Dialog>
```

### Managing Focus After Actions

**After deletion:**

```tsx
const handleDelete = async () => {
  await deleteMutation.mutateAsync();
  // Navigate back - focus will move to page content
  navigate("/items");
};
```

**After dialog close:**

```tsx
const buttonRef = useRef<HTMLButtonElement>(null);

const handleDialogClose = () => {
  setOpen(false);
  // Return focus to trigger button
  buttonRef.current?.focus();
};

<Button ref={buttonRef} onClick={() => setOpen(true)}>
  Open Dialog
</Button>
```

## Keyboard Navigation

### Skip Links

Add skip links for keyboard users:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Main content */}
</main>
```

### Interactive Elements

**Card as button:**

```tsx
<Card
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
>
  <CardContent className="p-5">
    {/* Content */}
  </CardContent>
</Card>
```

**List navigation:**

```tsx
<div role="list">
  {items.map((item, index) => (
    <div
      key={item.id}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            // Focus next item
            break;
          case "ArrowUp":
            e.preventDefault();
            // Focus previous item
            break;
          case "Enter":
            // Activate item
            handleSelect(item);
            break;
        }
      }}
    >
      {/* Item content */}
    </div>
  ))}
</div>
```

### Tab Order

Ensure logical tab order:

```tsx
// Good: Natural DOM order
<form>
  <div>
    <Label htmlFor="name">Name</Label>
    <Input id="name" />
  </div>
  <div>
    <Label htmlFor="email">Email</Label>
    <Input id="email" />
  </div>
  <Button type="submit">Submit</Button>
</form>

// Avoid: Using tabIndex to override natural order
// Only use tabIndex={0} to make non-interactive elements focusable
// Avoid tabIndex > 0
```

## Semantic HTML

### Heading Hierarchy

```tsx
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
    <h3>Another Subsection</h3>
  <h2>Another Section</h2>
```

**Important:**
- Only one `<h1>` per page
- Don't skip heading levels
- Use headings for structure, not styling

### Lists

**Unordered list:**

```tsx
<ul className="space-y-2">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

**Ordered list:**

```tsx
<ol className="list-decimal list-inside space-y-2">
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>
```

**Description list:**

```tsx
<dl className="space-y-2">
  <div>
    <dt className="font-semibold">Label</dt>
    <dd className="text-muted-foreground">Value</dd>
  </div>
  <div>
    <dt className="font-semibold">Another Label</dt>
    <dd className="text-muted-foreground">Another Value</dd>
  </div>
</dl>
```

### Buttons vs Links

**Button for actions:**

```tsx
// ✅ Good: Button for action
<Button onClick={handleSave}>Save</Button>

// ❌ Bad: Link for action
<a href="#" onClick={handleSave}>Save</a>
```

**Link for navigation:**

```tsx
// ✅ Good: Link for navigation
<a href="/about" className="text-primary hover:underline">
  Learn more
</a>

// ❌ Bad: Button for navigation
<Button onClick={() => navigate("/about")}>Learn more</Button>
```

**Exception - React Router Link as Button:**

```tsx
import { Link } from "react-router-dom";

<Button asChild>
  <Link to="/about">Learn more</Link>
</Button>
```

### Landmarks

```tsx
<body>
  <header>
    <nav aria-label="Main navigation">
      {/* Navigation */}
    </nav>
  </header>

  <main>
    {/* Main content */}
  </main>

  <aside aria-label="Related content">
    {/* Sidebar */}
  </aside>

  <footer>
    {/* Footer */}
  </footer>
</body>
```

## Screen Reader Support

### Screen Reader Only Text

```tsx
// Utility class for visually hidden but screen reader visible text
<span className="sr-only">Screen reader only text</span>
```

**CSS implementation:**

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus:not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Decorative Images

```tsx
// Decorative icon (hidden from screen readers)
<Icon className="h-4 w-4" aria-hidden="true" />

// Meaningful icon (with label)
<Icon className="h-4 w-4" aria-label="Warning" role="img" />
```

### Alt Text

```tsx
// Image with alt text
<img src="/avatar.jpg" alt="Profile picture of John Doe" />

// Decorative image
<img src="/decorative.jpg" alt="" />
```

### Loading States

```tsx
<div role="status" aria-live="polite">
  {isLoading ? (
    <>
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </>
  ) : (
    "Content loaded"
  )}
</div>
```

## Color and Contrast

### Contrast Ratios

**WCAG AA Requirements:**
- Normal text (< 18pt): 4.5:1 contrast ratio
- Large text (≥ 18pt or ≥ 14pt bold): 3:1 contrast ratio
- UI components and graphics: 3:1 contrast ratio

**Design system compliance:**

```tsx
// High contrast text
<p className="text-foreground">Primary text</p>

// Muted text (still meets AA)
<p className="text-muted-foreground">Secondary text</p>

// Destructive actions (high contrast)
<Button variant="destructive">Delete</Button>
```

### Not Relying on Color Alone

**Good - Color + icon + text:**

```tsx
<div className="flex items-center gap-2 text-green-600">
  <CheckCircle className="h-4 w-4" />
  <span>Success</span>
</div>

<div className="flex items-center gap-2 text-destructive">
  <AlertCircle className="h-4 w-4" />
  <span>Error</span>
</div>
```

**Bad - Color only:**

```tsx
// ❌ Don't rely on color alone
<span className="text-green-600">Success</span>
<span className="text-red-600">Error</span>
```

### Focus Indicators

Ensure focus indicators have sufficient contrast:

```tsx
// Built into ShadCN components
<Button>
  {/* Focus ring with high contrast in both light and dark modes */}
</Button>
```

## Motion and Animation

### Respect Reduced Motion Preference

```tsx
// Conditional animation based on user preference
<div className="transition-transform motion-reduce:transition-none hover:scale-105">
  {/* Only animates if user hasn't set prefers-reduced-motion */}
</div>
```

**Global CSS:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Auto-playing Content

Avoid auto-playing animations, videos, or carousels without user control:

```tsx
// ✅ Good: User-controlled
<Button onClick={() => setIsPlaying(!isPlaying)}>
  {isPlaying ? "Pause" : "Play"}
</Button>

// ❌ Bad: Auto-playing without control
<video autoPlay muted loop />
```

## Testing Checklist

### Keyboard Testing

- [ ] Can you navigate the entire page with keyboard only?
- [ ] Are all interactive elements focusable?
- [ ] Is the tab order logical?
- [ ] Can you activate all buttons/links with Enter/Space?
- [ ] Can you close dialogs with Escape?
- [ ] Are focus indicators visible?

### Screen Reader Testing

- [ ] Are all images labeled with alt text?
- [ ] Do icon-only buttons have aria-label?
- [ ] Are form fields properly labeled?
- [ ] Do error messages announce to screen readers?
- [ ] Is loading state announced?
- [ ] Are landmarks properly defined?

### Visual Testing

- [ ] Is text readable at 200% zoom?
- [ ] Do colors meet contrast requirements?
- [ ] Is information conveyed without color alone?
- [ ] Are focus indicators visible?
- [ ] Does the layout work at mobile sizes?

### Automation Testing

Use automated tools as a first pass:
- axe DevTools
- Lighthouse accessibility audit
- WAVE browser extension
- Pa11y CI for automated testing

**Note:** Automated tools catch ~30% of issues. Manual testing is essential.

## Common Patterns

### Accessible Form

```tsx
<form onSubmit={handleSubmit}>
  <fieldset className="space-y-4">
    <legend className="font-semibold text-lg mb-4">Personal Information</legend>

    <div className="space-y-2">
      <Label htmlFor="name">
        Name
        <span className="text-destructive ml-1" aria-label="required">*</span>
      </Label>
      <Input
        id="name"
        type="text"
        required
        aria-required="true"
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? "name-error" : undefined}
      />
      {errors.name && (
        <p id="name-error" className="text-xs text-destructive" role="alert">
          {errors.name}
        </p>
      )}
    </div>

    <div className="space-y-2">
      <Label htmlFor="email">
        Email
        <span className="text-destructive ml-1" aria-label="required">*</span>
      </Label>
      <Input
        id="email"
        type="email"
        required
        aria-required="true"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? "email-error" : "email-description"}
      />
      <p id="email-description" className="text-xs text-muted-foreground">
        We'll never share your email.
      </p>
      {errors.email && (
        <p id="email-error" className="text-xs text-destructive" role="alert">
          {errors.email}
        </p>
      )}
    </div>

    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {isSubmitting ? "Submitting..." : "Submit"}
    </Button>
  </fieldset>
</form>
```

### Accessible Data Table

```tsx
<Table>
  <caption className="sr-only">List of users</caption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Name</TableHead>
      <TableHead scope="col">Email</TableHead>
      <TableHead scope="col">Role</TableHead>
      <TableHead scope="col">
        <span className="sr-only">Actions</span>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map(user => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.role}</TableCell>
        <TableCell>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Edit ${user.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Accessible Modal

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle>Delete Confirmation</DialogTitle>
      <DialogDescription id="dialog-description">
        Are you sure you want to delete this item? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Resources

### Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Pa11y](https://pa11y.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers

- **macOS:** VoiceOver (built-in, Cmd+F5)
- **Windows:** NVDA (free), JAWS (commercial)
- **Linux:** Orca (free)
- **Mobile:** VoiceOver (iOS), TalkBack (Android)

### Browser Extensions

- [Accessibility Insights](https://accessibilityinsights.io/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/extension/)

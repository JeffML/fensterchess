# CSS Variables Reference

This project uses CSS variables for consistent theming. All variables are defined in `src/App.css`.

## Color Palette

### Background Colors

- `--color-bg-primary`: #2d3748 - Main page background
- `--color-bg-header`: #1a202c - Page header background
- `--color-bg-menu`: #374151 - Menu bar background
- `--color-bg-menu-item`: #4b5563 - Menu item default
- `--color-bg-menu-hover`: #6b7280 - Menu item hover state

### Green Accents (Primary Interactive)

- `--color-accent-green`: #2ea44f - Primary green
- `--color-accent-green-hover`: #2c974b - Hover state
- `--color-accent-green-active`: #298e46 - Active/pressed state
- `--color-accent-green-light`: #25a03e - Light variant

### Links

- `--color-link`: #6ee7a7 - Primary link color
- `--color-link-hover`: #4ade80 - Link hover/secondary

### Text Colors

- `--color-text-primary`: #ffffff - Main text
- `--color-text-secondary`: #e5e7eb - Secondary text
- `--color-text-muted`: #9ca3af - Muted/disabled text

### Status Colors

- `--color-status-success`: #10b981 - Success messages
- `--color-status-error`: #ef4444 - Error messages
- `--color-status-warning`: #fbbf24 - Warning messages
- `--color-status-info`: #3b82f6 - Info messages

### Row Backgrounds

- `--color-row-even`: slategrey
- `--color-row-odd`: darkslategrey

## Spacing Variables

- `--spacing-xs`: 0.25em
- `--spacing-sm`: 0.5em
- `--spacing-md`: 1em
- `--spacing-lg`: 1.5em
- `--spacing-xl`: 2em

## Utility Classes

### Text Utilities

- `.text-left` - Left aligned text
- `.text-center` - Center aligned text
- `.text-white` - White text color
- `.text-error` - Error message color (red)
- `.text-success` - Success message color (green)
- `.text-warning` - Warning message color (yellow)

### Spacing Utilities

- `.margin-left-1` - 1em left margin
- `.margin-left-2` - 2em left margin
- `.margin-top-0` - Remove top margin
- `.margin-bottom-0` - Remove bottom margin
- `.padding-1` - 1em padding all sides

### Display Utilities

- `.inline` - Display inline

### Component-Specific

- `.site-link` - Styled link for sites selector

## Usage Examples

### Using CSS Variables

```css
.my-component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
}
```

### Using Utility Classes

```tsx
<div className="text-white margin-left-1">Content here</div>
```

### Inline Styles (When Needed)

Use inline styles only for:

- Dynamic values (calculated at runtime)
- Component-specific one-off adjustments
- Values that can't be predefined

```tsx
// Good - dynamic value
<div style={{ width: `${percentage}%` }}>

// Avoid - should use CSS variable
<div style={{ color: "#2ea44f" }}>

// Better
<div style={{ color: "var(--color-accent-green)" }}>
```

## Adding New Variables

1. Add to `:root` in `src/App.css`
2. Use descriptive, semantic names
3. Document in this file
4. Consider creating utility class if frequently used inline

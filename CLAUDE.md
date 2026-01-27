# Claude Code Project Guide

## Styling Architecture

This project has two distinct styling contexts:

### Website Styles (Tailwind CSS)
- Located in: `components/sections/*.tsx`
- Uses Tailwind utility classes
- Example: `Experience.tsx`, `Education.tsx`, `Projects.tsx`

### Print/PDF Styles
- Located in: `app/print.css`
- Uses traditional CSS with pt-based font sizes
- Components in: `components/print/*.tsx`
- These use class names like `print-bullets`, `print-entry`, etc.

## Key Differences

| Element | Website | Print |
|---------|---------|-------|
| Bullet points | `text-sm` (14px) | `8pt` |
| Body text | `text-base` (16px) | `10pt` |
| Section titles | `text-2xl` | `12pt` |

## When Making Style Changes

- **Website appearance**: Edit the Tailwind classes in `components/sections/*.tsx`
- **Print/PDF appearance**: Edit `app/print.css` and `components/print/*.tsx`

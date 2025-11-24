# Narrative App UI Design System — Technical Specifications

## Overview
Narrative is a real-time social connection app with a **dark theme**: pure black background with floating eggshell white pill-shaped elements. The design is minimal, premium, and mobile-first.

## Core Design Philosophy
- **Dark theme**: Pure black background with white/eggshell floating elements
- **Pill-shaped UI**: Rounded, pill-style components
- **Mobile-first**: Phone frame on desktop, full-screen on mobile
- **Premium feel**: Subtle shadows, smooth animations, clean typography
- **Inspiration**: Apple, Linear, Notion, Airbnb, Duolingo, Arc Browser

## Color System

### Background Colors
- **Primary Background**: `#0B0B0D` (pure black)
- **App Background**: `#0C0C0E` (slightly lighter black)
- **Surface 1**: `#F8F8F9` (eggshell white)
- **Surface 2**: `#F3F3F4` (lighter eggshell)

### Text Colors
- **Primary Text (on dark)**: `#FFFFFF` (white)
- **Secondary Text**: `rgba(255, 255, 255, 0.60)` (60% white)
- **Text on Pills**: `#000000` (black)
- **Muted Text**: `rgba(0, 0, 0, 0.45)` (45% black)

### Pill Colors
- **Unselected Pill Background**: `#E5E5E7` (eggshell white)
- **Selected Pill Background**: `#D8D8DB` (darker eggshell)
- **Pill Text**: `#000000` (black)

### Accent Colors
- **Blue**: `#4A6CF6`
- **Green**: `#38B57A`
- **Orange**: `#E69A3B`
- **Purple**: `#7B6CF9`
- **Pink**: `#C970A8`

## Typography

### Font Family
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif`
- Font smoothing: antialiased, grayscale
- Letter spacing: `-0.011em` (body), `-0.02em` (titles)

### Type Scale
- **Title**: 22px, 600 weight, 1.25 line-height, `-0.02em` letter-spacing
- **Heading**: 17px, 500 weight, 1.3 line-height, `-0.01em` letter-spacing
- **Body**: 15px, 400 weight, 1.4 line-height, `0` letter-spacing
- **Label**: 13px, 500 weight, 1.4 line-height, `0` letter-spacing

## Border Radius
- **Pills**: `18px`
- **Buttons**: `18px`
- **Inputs**: `18px`
- **Circle**: `50%`

## Shadows
- **Unselected Pill**: `0 2px 10px rgba(0,0,0,0.25)`
- **Selected Pill**: `0 4px 16px rgba(0,0,0,0.28)`
- **Dock/Bottom Nav**: `0 8px 28px rgba(0,0,0,0.45)`

## Spacing System
- **4px, 8px, 10px, 12px, 14px, 16px, 18px, 20px, 22px, 28px, 32px**
- **Section Spacing**: 28px vertical
- **Element Spacing**: 20px
- **Top Title Spacing**: 32px
- **Horizontal Padding**: 20px

## Layout

### Container
- **Max Width**: 430px (centered)
- **Horizontal Padding**: 20px
- **Mobile**: Full width, no padding on sides

### Phone Frame (Desktop)
- **Container**: Max width 420px, centered
- **Frame**: Border radius 32px, light gray background `#F5F5F5`
- **Screen**: Border radius 28px, black background `#0B0B0D`
- **Content**: Border radius 26px, padding bottom 5rem

### Mobile View
- **Full Screen**: 100dvh height
- **No Frame**: Border radius 0, no padding
- **Background**: `#0B0B0D` (black)

## Components

### Buttons
- **Height**: 40px (default), 44px (large), 36px (small), 40px (icon)
- **Padding**: `8px 14px` (default)
- **Border Radius**: 18px
- **Background**: Eggshell white (`#E5E5E7`)
- **Text Color**: Black (`#000000`)
- **Shadow**: `0 2px 10px rgba(0,0,0,0.25)`
- **Animation**: Scale to 0.98 on tap (Framer Motion)
- **Transition**: `transform 140ms ease, background 180ms ease`

### Chips/Pills
- **Height**: 44px
- **Border Radius**: 18px (pill shape)
- **Padding**: `12px 16px`
- **Unselected**: Eggshell background, black text, subtle shadow
- **Selected**: Darker eggshell background, black text, stronger shadow
- **Hover**: Slight lift (`translateY(-1px)`)

### Inputs
- **Height**: 44px (default), 48px (large)
- **Border Radius**: 18px
- **Background**: Eggshell white (`#E5E5E7`)
- **Text Color**: Black
- **Font Size**: 16px (prevents zoom on mobile)
- **Border**: None (rely on background color)

### Cards
- **Border Radius**: 20px
- **Background**: Linear gradient `rgba(255, 255, 255, 0.05)` to `rgba(255, 255, 255, 0.02)`
- **Border**: `2px solid rgba(255, 255, 255, 0.15)`
- **Top Border**: Subtle gradient line `rgba(255, 255, 255, 0.1)`

## Animations

### Motion Library
- **Library**: Framer Motion
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` (custom easing)
- **Duration**: 150ms (fast), 200ms (normal), 300ms (slow)
- **Tap Scale**: 0.98
- **Hover Lift**: `translateY(-1px)`

### Transitions
- **Button Tap**: Scale 0.98, 140ms ease
- **Chip Hover**: Background change, border color change, translateY(-1px), 250ms cubic-bezier
- **Page Transitions**: Fade and slide animations

## Mobile Optimizations

### Touch Targets
- **Minimum Size**: 44px × 44px
- **Tap Highlight**: `rgba(255, 255, 255, 0.1)`
- **Touch Action**: `manipulation`
- **User Select**: `none` (except inputs)

### Viewport
- **Prevent Zoom**: Input font-size 16px minimum
- **Safe Area**: Respects `env(safe-area-inset-top/bottom)`
- **Scroll**: Smooth scrolling, `-webkit-overflow-scrolling: touch`
- **Scrollbar**: Hidden (custom scrollbar)

### Gestures
- **Prevent Double-Tap Zoom**: Touch event handling
- **Prevent Pinch Zoom**: Wheel event handling
- **Prevent Text Selection**: User-select none (except inputs)

## Visual Effects

### Grain Texture
- **Subtle Noise**: SVG fractal noise filter
- **Opacity**: 0.03
- **Base Frequency**: 0.9
- **Octaves**: 4

### Glass Effect
- **Background**: `rgba(255, 255, 255, 0.05)` with blur
- **Border**: `rgba(255, 255, 255, 0.1)`
- **Backdrop Filter**: Blur (where supported)

## Component States

### Buttons
- **Default**: Eggshell white, black text, shadow
- **Hover**: Slightly darker background
- **Active/Tap**: Scale 0.98
- **Disabled**: 50% opacity, not-allowed cursor

### Chips
- **Unselected**: Eggshell white, black text, subtle shadow
- **Selected**: Darker eggshell, black text, stronger shadow
- **Hover**: Background `rgba(255, 255, 255, 0.08)`, border `rgba(255, 255, 255, 0.15)`

## Layout Patterns

### Page Structure
1. **Top Navigation**: Fixed top, safe area inset
2. **Content Area**: Max width 430px, centered, 20px padding
3. **Bottom Navigation**: Fixed bottom, 120px padding bottom on content

### Section Spacing
- **Between Sections**: 28px vertical
- **Between Elements**: 20px vertical
- **Title to Content**: 32px

## Responsive Breakpoints

### Mobile (< 640px)
- Full width, no frame
- No border radius on container
- Full screen height (100dvh)
- Touch-optimized interactions

### Desktop (≥ 640px)
- Phone frame container
- Centered layout
- Max width 420px
- Frame with border radius

## Accessibility

### Contrast
- **Text on Dark**: White (#FFFFFF) on black (#0B0B0D) — WCAG AAA
- **Text on Pills**: Black (#000000) on eggshell (#E5E5E7) — WCAG AAA

### Focus States
- **Focus Ring**: `2px solid rgba(255, 255, 255, 0.2)`
- **Offset**: 2px

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + inline styles
- **Animation**: Framer Motion
- **Font**: Inter (Google Fonts)
- **Icons**: Lucide React

---

## Usage Instructions

**Copy this entire document and paste it into ChatGPT when you need to:**
- Generate UI components matching the Narrative design system
- Create design mockups or wireframes
- Get design feedback or suggestions
- Understand the visual language of the app
- Implement new features with consistent styling

**Example prompts to use with this spec:**
- "Using the Narrative design system above, create a profile card component"
- "Design a settings page following the Narrative UI specifications"
- "Generate a loading state component that matches the Narrative design system"
- "Create a notification badge component using the Narrative color and spacing system"


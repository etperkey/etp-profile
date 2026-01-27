# etp-profile Project Rules

## Blood Smear Morphology Sync Rule

**IMPORTANT**: When making changes to cell morphology styling, ALWAYS update BOTH files to keep them in sync:

1. `src/components/BloodSmearViewer.css` - Peripheral smear floating cells (`.floating-cell.*` classes)
2. `src/components/MorphologyGuide.css` - Morphology guide preview cells (`.preview-cell.*` classes)

### What to sync:
- Border-radius (cell shape irregularity)
- Background gradients (cytoplasm, granules)
- Pseudo-elements (nucleus shape, inclusions)
- Opacity values
- Granule size and distribution

### Sync direction:
- Use the **peripheral smear** as the source of truth for morphology appearance
- The morphology guide should match the smear, with size adjustments for the preview cards

### Cells that commonly need syncing:
- Blast cell
- Smudge cell
- Promyelocyte (auer-rod)
- All WBC morphologies (neutrophil variants, lymphocyte, monocyte, eosinophil, basophil)
- All RBC morphologies

---

## Mobile Optimization Settings

### Device-Specific Breakpoints
Always use these breakpoints for mobile optimization:

| Breakpoint | Target Devices |
|------------|----------------|
| 768px | Tablets, base mobile |
| 430px | iPhone 14/13/12 Pro Max |
| 393px | iPhone 14/13/12, iPhone Pro |
| 375px | iPhone SE 2nd/3rd, iPhone 8, Galaxy S |
| 360px | Small Android phones |
| 320px | iPhone SE 1st gen |

### Safe Area Handling
**ALWAYS** use CSS environment variables for notch/home indicator:
- `env(safe-area-inset-top, 0px)` - for top elements (header, buttons below header)
- `env(safe-area-inset-bottom, 0px)` - for bottom elements (footer, floating buttons)

### Key Mobile Patterns

#### Fixed Elements Positioning
- **Header**: Add `padding-top: env(safe-area-inset-top, 0px)` to header
- **Elements below header**: Use `top: calc(env(safe-area-inset-top, 0px) + 75px)`
- **Bottom floating elements**: Use `bottom: calc(env(safe-area-inset-bottom, 0px) + Xpx)`
- **Keep top position consistent** across breakpoints - only scale padding/size, not position

#### Responsive Scaling Pattern
For elements that need to scale across devices (buttons, text, metrics):
```
768px → base mobile size
430px → 90% of base
393px → 80% of base
375px → 70% of base
360px → 60% of base
320px → 50% of base
```

#### Flex Containers on Mobile
- Add `flex-wrap: wrap` to prevent overflow
- Reduce `gap` progressively on smaller screens
- Consider `flex-direction: column` for 320px screens

### Files with Mobile Styles
- `src/App.css` - Main page, hero, footer, publications, research tools
- `src/components/BloodSmearViewer.css` - Smear viewer page
- `src/components/ThemeSwitcher.css` - Theme toggle button

### Testing
Use Chrome DevTools device emulation (Ctrl+Shift+M) to test:
- iPhone SE (320px) - smallest
- iPhone 12 Pro (390px) - common modern phone
- iPhone 14 Pro Max (430px) - largest phone
- Check landscape mode for phones

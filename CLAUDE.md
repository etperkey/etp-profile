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

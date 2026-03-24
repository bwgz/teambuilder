---
name: mermaid-render
description: |
  This skill should be used when the user asks to "render mermaid diagram",
  "convert mermaid to png", "mermaid to svg", "export mermaid", "mermaid image",
  "use trimble theme", "mermaid with branding", or needs to generate image files
  from Mermaid diagrams with Trimble brand styling.
---

# Mermaid Rendering with Trimble Themes

This skill provides guidance for rendering Mermaid diagrams to image formats (PNG, SVG) with official Trimble branding.

## When to Render vs Inline Theme

| Scenario | Approach |
|----------|----------|
| Diagram in markdown (README, docs, PR) | Use inline theme directive (see `mermaid` skill) |
| Export for presentations | Render to PNG with this skill |
| High-quality image for sharing | Render to SVG with this skill |
| Print materials | Render to PDF with this skill |

**For markdown files**: Use inline `%%{init:...}%%` directives instead of rendering. See `mermaid` skill's `references/inline-themes.md` for copy-paste theme directives.

**For image export**: Continue with this skill.

## Prerequisites

Install mermaid-cli globally:

```bash
npm install -g @mermaid-js/mermaid-cli
```

Verify installation:

```bash
mmdc --version
```

## Theme Location

Trimble themes are located at: `tools/docs/mermaid/themes/`

## Theme Selection

Select the theme based on diagram type:

| Diagram Type | Theme File | Syntax Keyword |
|--------------|------------|----------------|
| Flowchart | `trimble-flowchart.json` | `flowchart` / `graph` |
| Sequence | `trimble-sequence.json` | `sequenceDiagram` |
| Class | `trimble-class.json` | `classDiagram` |
| ER | `trimble-er.json` | `erDiagram` |
| State | `trimble-state.json` | `stateDiagram-v2` |
| Gantt | `trimble-gantt.json` | `gantt` |
| Pie | `trimble-pie.json` | `pie` |
| Git Graph | `trimble-gitgraph.json` | `gitGraph` |
| Mindmap | `trimble-mindmap.json` | `mindmap` |
| Timeline | `trimble-timeline.json` | `timeline` |

## Basic Rendering

### Step 1: Save Diagram to File

```bash
cat > diagram.mmd << 'EOF'
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
EOF
```

### Step 2: Render with Theme

```bash
mmdc -i diagram.mmd -o diagram.png -c tools/docs/mermaid/themes/trimble-flowchart.json
```

### Step 3: Clean Up (Optional)

```bash
rm diagram.mmd
```

## Rendering Options

### Output Formats

```bash
# PNG (default, recommended for documents)
mmdc -i diagram.mmd -o diagram.png -c tools/docs/mermaid/themes/trimble-flowchart.json

# SVG (vector, scalable for web)
mmdc -i diagram.mmd -o diagram.svg -c tools/docs/mermaid/themes/trimble-flowchart.json

# PDF (for printing)
mmdc -i diagram.mmd -o diagram.pdf -c tools/docs/mermaid/themes/trimble-flowchart.json
```

### Custom Width

```bash
mmdc -i diagram.mmd -o diagram.png -c tools/docs/mermaid/themes/trimble-flowchart.json -w 1200
```

### Transparent Background

```bash
mmdc -i diagram.mmd -o diagram.png -c tools/docs/mermaid/themes/trimble-flowchart.json -b transparent
```

### Scale Factor

```bash
mmdc -i diagram.mmd -o diagram.png -c tools/docs/mermaid/themes/trimble-flowchart.json -s 2
```

## Rendering Workflow

To render a Mermaid diagram with Trimble branding:

1. **Identify diagram type** from the first line of the mermaid code
2. **Select appropriate theme** from the table above
3. **Save diagram** to a temporary `.mmd` file
4. **Run mmdc** with the theme configuration
5. **Report output location** to the user
6. **Clean up** temporary files

## Command Reference

```bash
mmdc [options]

Options:
  -i, --input <file>       Input mermaid file
  -o, --output <file>      Output file (png, svg, pdf)
  -c, --configFile <file>  JSON config file (theme)
  -w, --width <width>      Page width in pixels
  -H, --height <height>    Page height in pixels
  -b, --backgroundColor    Background color (transparent, #hex)
  -s, --scale <scale>      Scale factor (default: 1)
  -T, --timeout <ms>       Timeout in milliseconds
  -q, --quiet              Suppress log output
```

## Trimble Brand Colors

The themes use official Trimble 2025 brand colors:

| Purpose | Color | Hex |
|---------|-------|-----|
| Primary | Trimble Blue 10 | #0063A3 |
| Secondary | Trimble Green 10 | #349C44 |
| Accent | Trimble Gold 10 | #FBAD26 |
| Error | Trimble Brown 10 | #B44E2A |
| Text | Hero Gray | #252A2E |
| Background | White | #FFFFFF |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Parse error | Invalid Mermaid syntax | Validate with `mermaid-validator` agent |
| Puppeteer error | Missing browser deps | Install Chromium dependencies |
| Timeout | Complex diagram | Simplify or use `-T` flag |
| Theme not found | Wrong path | Verify path from project root |

## Additional Resources

### Reference Files

For theme customization and advanced options:
- **`references/theme-configuration.md`** - Theme structure and customization guide

### Related Skills

- **`mermaid`** - Core diagram generation and syntax

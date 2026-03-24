# Mermaid Theme Configuration

This document describes the structure of Mermaid theme files and how to customize them.

## Theme File Structure

Mermaid themes are JSON files that configure the mermaid-cli renderer. Example structure:

```json
{
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#DCEDF9",
    "primaryTextColor": "#252A2E",
    "primaryBorderColor": "#0063A3",
    "secondaryColor": "#FFF5E4",
    "secondaryTextColor": "#252A2E",
    "secondaryBorderColor": "#FBAD26",
    "tertiaryColor": "#E0ECCF",
    "tertiaryTextColor": "#252A2E",
    "tertiaryBorderColor": "#349C44",
    "lineColor": "#585C65",
    "textColor": "#252A2E",
    "mainBkg": "#FFFFFF",
    "background": "#FFFFFF",
    "fontFamily": "Arial, sans-serif"
  }
}
```

## Core Theme Variables

### Universal Variables

| Variable | Description | Trimble Value |
|----------|-------------|---------------|
| `primaryColor` | Primary fill color | #DCEDF9 (Blue 1) |
| `primaryTextColor` | Text on primary | #252A2E (Hero Gray) |
| `primaryBorderColor` | Primary borders | #0063A3 (Blue 10) |
| `secondaryColor` | Secondary fill | #FFF5E4 (Yellow 2) |
| `secondaryTextColor` | Text on secondary | #252A2E |
| `secondaryBorderColor` | Secondary borders | #FBAD26 (Gold 10) |
| `tertiaryColor` | Tertiary fill | #E0ECCF (Green 1) |
| `tertiaryTextColor` | Text on tertiary | #252A2E |
| `tertiaryBorderColor` | Tertiary borders | #349C44 (Green 10) |
| `lineColor` | Connection lines | #585C65 (Asphalt Gray) |
| `textColor` | Default text | #252A2E |
| `mainBkg` | Main background | #FFFFFF |
| `background` | Page background | #FFFFFF |
| `fontFamily` | Font stack | Arial, sans-serif |

## Diagram-Specific Variables

### Flowchart

```json
{
  "themeVariables": {
    "nodeBkg": "#DCEDF9",
    "nodeTextColor": "#252A2E",
    "nodeBorder": "#0063A3",
    "clusterBkg": "#F1F1F6",
    "clusterBorder": "#0063A3",
    "defaultLinkColor": "#585C65",
    "edgeLabelBackground": "#FFFFFF"
  },
  "flowchart": {
    "curve": "basis",
    "padding": 20,
    "nodeSpacing": 50,
    "rankSpacing": 50,
    "htmlLabels": true,
    "useMaxWidth": true
  }
}
```

### Sequence Diagram

```json
{
  "themeVariables": {
    "actorBkg": "#DCEDF9",
    "actorBorder": "#0063A3",
    "actorTextColor": "#252A2E",
    "actorLineColor": "#585C65",
    "activationBkgColor": "#C7E2F6",
    "activationBorderColor": "#0063A3",
    "signalColor": "#585C65",
    "signalTextColor": "#252A2E",
    "labelBoxBkgColor": "#FFF5E4",
    "labelBoxBorderColor": "#FBAD26",
    "labelTextColor": "#252A2E",
    "loopTextColor": "#252A2E",
    "noteBkgColor": "#FFF5E4",
    "noteBorderColor": "#FBAD26",
    "noteTextColor": "#252A2E"
  },
  "sequence": {
    "diagramMarginX": 50,
    "diagramMarginY": 10,
    "actorMargin": 50,
    "width": 150,
    "height": 65,
    "boxMargin": 10,
    "boxTextMargin": 5,
    "noteMargin": 10,
    "messageMargin": 35,
    "mirrorActors": false,
    "bottomMarginAdj": 1,
    "useMaxWidth": true
  }
}
```

### Class Diagram

```json
{
  "themeVariables": {
    "classText": "#252A2E",
    "relationLabelColor": "#252A2E"
  }
}
```

### ER Diagram

```json
{
  "themeVariables": {
    "entityBkg": "#DCEDF9",
    "entityBorderColor": "#0063A3",
    "entityTextColor": "#252A2E",
    "relationLabelBkg": "#FFFFFF",
    "relationLabelColor": "#252A2E"
  },
  "er": {
    "diagramPadding": 20,
    "layoutDirection": "TB",
    "minEntityWidth": 100,
    "minEntityHeight": 75,
    "entityPadding": 15,
    "stroke": "#0063A3",
    "fill": "#DCEDF9",
    "fontSize": 12,
    "useMaxWidth": true
  }
}
```

### State Diagram

```json
{
  "themeVariables": {
    "labelColor": "#252A2E",
    "altBackground": "#F1F1F6"
  },
  "state": {
    "titleShift": -15,
    "dividerMargin": 10,
    "sizeUnit": 5,
    "padding": 8,
    "textHeight": 10,
    "fontSize": 14,
    "fontFamily": "Arial, sans-serif",
    "useMaxWidth": true
  }
}
```

### Gantt Chart

```json
{
  "themeVariables": {
    "gridColor": "#E0E1E9",
    "taskBorderColor": "#0063A3",
    "taskBkgColor": "#DCEDF9",
    "taskTextColor": "#252A2E",
    "taskTextOutsideColor": "#252A2E",
    "taskTextDarkColor": "#252A2E",
    "doneTaskBkgColor": "#E0ECCF",
    "doneTaskBorderColor": "#349C44",
    "critTaskBkgColor": "#F6E5D8",
    "critTaskBorderColor": "#B44E2A",
    "activeTaskBkgColor": "#FFF5E4",
    "activeTaskBorderColor": "#FBAD26",
    "todayLineColor": "#B44E2A",
    "sectionBkgColor": "#F1F1F6",
    "sectionBkgColor2": "#E0E1E9"
  },
  "gantt": {
    "titleTopMargin": 25,
    "barHeight": 20,
    "barGap": 4,
    "topPadding": 50,
    "rightPadding": 75,
    "leftPadding": 75,
    "gridLineStartPadding": 35,
    "fontSize": 11,
    "fontFamily": "Arial, sans-serif",
    "useMaxWidth": true
  }
}
```

### Pie Chart

```json
{
  "themeVariables": {
    "pie1": "#0063A3",
    "pie2": "#349C44",
    "pie3": "#FBAD26",
    "pie4": "#B44E2A",
    "pie5": "#0E416C",
    "pie6": "#82BF4A",
    "pie7": "#FFD88C",
    "pie8": "#D57A3F",
    "pieStrokeColor": "#FFFFFF",
    "pieLegendTextSize": 12,
    "pieLegendTextColor": "#252A2E",
    "pieOpacity": 0.85
  }
}
```

### Git Graph

```json
{
  "themeVariables": {
    "git0": "#0063A3",
    "git1": "#349C44",
    "git2": "#FBAD26",
    "git3": "#B44E2A",
    "git4": "#0E416C",
    "git5": "#82BF4A",
    "git6": "#FFD88C",
    "git7": "#D57A3F",
    "gitBranchLabel0": "#FFFFFF",
    "gitBranchLabel1": "#FFFFFF",
    "gitBranchLabel2": "#252A2E",
    "gitBranchLabel3": "#FFFFFF",
    "gitInv0": "#DCEDF9",
    "gitInv1": "#E0ECCF",
    "gitInv2": "#FFF5E4",
    "gitInv3": "#F6E5D8",
    "commitLabelColor": "#252A2E",
    "commitLabelBackground": "#FFFFFF",
    "tagLabelColor": "#FFFFFF",
    "tagLabelBackground": "#0063A3",
    "tagLabelBorder": "#0063A3"
  },
  "gitGraph": {
    "titleTopMargin": 25,
    "diagramPadding": 8,
    "nodeLabel": {
      "width": 75,
      "height": 100,
      "x": -25,
      "y": 0
    },
    "mainBranchName": "main",
    "mainBranchOrder": 0,
    "showCommitLabel": true,
    "showBranches": true,
    "rotateCommitLabel": true,
    "arrowMarkerAbsolute": false,
    "useMaxWidth": true
  }
}
```

## Customization Guide

### Creating a Custom Theme

1. Copy an existing theme file:
   ```bash
   cp tools/docs/mermaid/themes/trimble-flowchart.json tools/docs/mermaid/themes/my-custom.json
   ```

2. Edit the `themeVariables` section with desired colors

3. Use the custom theme:
   ```bash
   mmdc -i diagram.mmd -o diagram.png -c tools/docs/mermaid/themes/my-custom.json
   ```

### Using themeCSS for Advanced Styling

For precise control, add CSS overrides:

```json
{
  "themeCSS": ".node rect { fill: #DCEDF9 !important; stroke: #0063A3 !important; }"
}
```

### Dark Theme Variant

To create a dark theme, adjust:

```json
{
  "themeVariables": {
    "mainBkg": "#252A2E",
    "background": "#252A2E",
    "textColor": "#F1F1F6",
    "primaryTextColor": "#F1F1F6",
    "lineColor": "#A3A6B1"
  }
}
```

## Trimble Brand Color Reference

| Color Name | Hex | Usage |
|------------|-----|-------|
| Trimble Blue 10 | #0063A3 | Primary accent, borders |
| Trimble Blue 1 | #DCEDF9 | Primary backgrounds |
| Trimble Green 10 | #349C44 | Secondary accent |
| Trimble Green 1 | #E0ECCF | Tertiary backgrounds |
| Trimble Gold 10 | #FBAD26 | Accent, highlights |
| Trimble Yellow 2 | #FFF5E4 | Notes, labels |
| Trimble Brown 10 | #B44E2A | Error, critical |
| Trimble Gray 10 (Hero) | #252A2E | Text, dark elements |
| Trimble Gray -1 | #F1F1F6 | Light backgrounds |
| Trimble Gray 7 (Asphalt) | #585C65 | Lines, secondary text |

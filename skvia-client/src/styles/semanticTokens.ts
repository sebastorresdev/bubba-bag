import { tokens } from '@fluentui/react-components';

/** Application roles mapped to Fluent UI semantic tokens. */
export const semanticTokens = {
  navigation: {
    background: tokens.colorBrandBackground,
    foreground: tokens.colorNeutralForegroundOnBrand,
    hoverBackground: tokens.colorBrandBackgroundHover,
    pressedBackground: tokens.colorBrandBackgroundPressed,
  },
  surface: {
    app: tokens.colorNeutralBackground2,
    card: tokens.colorNeutralBackground1,
    subtle: tokens.colorNeutralBackground3,
  },
  text: {
    primary: tokens.colorNeutralForeground1,
    secondary: tokens.colorNeutralForeground3,
    muted: tokens.colorNeutralForeground4,
    onBrand: tokens.colorNeutralForegroundOnBrand,
    danger: tokens.colorStatusDangerForeground1,
  },
  status: {
    success: tokens.colorPaletteGreenForeground1,
    successSubtle: tokens.colorPaletteGreenForeground2,
    successBackground: tokens.colorPaletteGreenBackground2,
    warning: tokens.colorPaletteYellowForeground1,
    danger: tokens.colorStatusDangerForeground1,
    dangerSubtle: tokens.colorPaletteRedForeground1,
    info: tokens.colorBrandForeground1,
  },
  typography: {
    caption: tokens.fontSizeBase100,
    bodySmall: tokens.fontSizeBase200,
    body: tokens.fontSizeBase300,
    title: tokens.fontSizeHero700,
    regular: tokens.fontWeightRegular,
    semibold: tokens.fontWeightSemibold,
    bold: tokens.fontWeightBold,
  },
} as const;

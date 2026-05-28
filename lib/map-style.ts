import type { StyleSpecification } from 'maplibre-gl';

export type EchoMapStyleId = 'bright' | 'positron' | 'liberty' | 'dark';

export const echoMapStyles: Record<
  EchoMapStyleId,
  {
    label: string;
    url: string;
    tone: 'light' | 'dark';
  }
> = {
  bright: {
    label: 'Bright',
    url: 'https://tiles.openfreemap.org/styles/bright',
    tone: 'light',
  },
  positron: {
    label: 'Clean Light',
    url: 'https://tiles.openfreemap.org/styles/positron',
    tone: 'light',
  },
  liberty: {
    label: 'Liberty',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    tone: 'light',
  },
  dark: {
    label: 'Cinematic Dark',
    url: 'https://tiles.openfreemap.org/styles/dark',
    tone: 'dark',
  },
};

export const defaultEchoMapStyle: EchoMapStyleId = 'bright';

export function getEchoMapStyleUrl(styleId: EchoMapStyleId) {
  return echoMapStyles[styleId].url;
}

const openFreeMapGlyphsUrl = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const safeOpenFreeMapFont = ['Noto Sans Regular'];
const englishFriendlyTextField = [
  'coalesce',
  ['get', 'name:en'],
  ['get', 'name_en'],
  ['get', 'name:latin'],
  ['get', 'name'],
  ['get', 'ref'],
];

type MutableMapStyle = StyleSpecification & {
  layers: Array<Record<string, unknown>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expressionIncludes(value: unknown, target: string): boolean {
  if (value === target) {
    return true;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  return value.some((item) => expressionIncludes(item, target));
}

function normalizeOpenFreeMapStyle(style: StyleSpecification): StyleSpecification {
  const normalized = structuredClone(style) as MutableMapStyle;
  normalized.glyphs = openFreeMapGlyphsUrl;

  normalized.layers.forEach((layer) => {
    if (layer.type !== 'symbol' || !isRecord(layer.layout)) {
      return;
    }

    const layout = layer.layout as Record<string, unknown>;

    if ('text-font' in layout) {
      layout['text-font'] = safeOpenFreeMapFont;
    }

    if ('text-field' in layout && !expressionIncludes(layout['text-field'], 'ref')) {
      layout['text-field'] = englishFriendlyTextField;
    }
  });

  return normalized;
}

export async function loadEchoMapStyle(styleId: EchoMapStyleId) {
  const response = await fetch(getEchoMapStyleUrl(styleId));

  if (!response.ok) {
    throw new Error(`Unable to load ${echoMapStyles[styleId].label} map style`);
  }

  const style = (await response.json()) as StyleSpecification;
  return normalizeOpenFreeMapStyle(style);
}

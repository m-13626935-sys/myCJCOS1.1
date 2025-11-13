import type { ThemeColors } from '../types';

// Helper to convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
};

// Helper to calculate color contrast for text readability
const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrastingTextColor = (bgColor: [number, number, number]): string => {
    return getLuminance(bgColor[0], bgColor[1], bgColor[2]) > 0.4 ? '#000000' : '#FFFFFF';
};

// Main color extraction function
export const extractPaletteFromImage = async (imageUrl: string): Promise<[number, number, number][]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 100 / Math.max(img.width, img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Could not get canvas context"));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            
            const colorCounts: { [key: string]: { count: number; original: [number, number, number] } } = {};
            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b] = [data[i], data[i+1], data[i+2]];
                const key = `${r >> 4},${g >> 4},${b >> 4}`; // Quantize colors
                if (!colorCounts[key]) {
                    colorCounts[key] = { count: 0, original: [r,g,b] };
                }
                colorCounts[key].count++;
            }
            
            const sortedColors = Object.values(colorCounts)
                .sort((a, b) => b.count - a.count)
                .map(c => c.original);

            resolve(sortedColors.slice(0, 10)); // Return top 10 dominant colors
        };
        img.onerror = reject;
    });
};

export const generateThemeFromPalette = (palette: [number, number, number][]): ThemeColors => {
    const primaryRGB = palette[0];
    const accentRGB = palette.find(c => {
        const [h1, s1, l1] = rgbToHsl(...primaryRGB);
        const [h2, s2, l2] = rgbToHsl(...c);
        const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
        return s2 > 30 && l2 > 30 && l2 < 80 && hueDiff > 60; // Find a vibrant, distinct color
    }) || palette[1] || [255, 255, 255];

    const [pr, pg, pb] = primaryRGB;
    const [ar, ag, ab] = accentRGB;

    return {
        primaryBG: `rgba(${pr}, ${pg}, ${pb}, 0.3)`,
        highlightBG: `rgba(${ar}, ${ag}, ${ab}, 0.1)`,
        gradientStart: `rgba(${pr}, ${pg}, ${pb}, 0.25)`,
        gradientEnd: `rgba(${pr}, ${pg}, ${pb}, 0.35)`,
        borderColor: `rgba(${ar}, ${ag}, ${ab}, 0.2)`,
        shadowColor: `rgba(0,0,0,0.35)`,
        textOnBG: getContrastingTextColor(primaryRGB),
        textShadowOnBG: getContrastingTextColor(primaryRGB) === '#000000' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
        accentShadow: `rgba(${ar}, ${ag}, ${ab}, 0.5)`
    };
};

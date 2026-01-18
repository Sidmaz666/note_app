// Utility functions for color contrast and readability

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Calculate relative luminance (0-1, where 1 is brightest)
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5; // Default to medium if invalid

  // Normalize RGB values to 0-1
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];

  // Apply gamma correction
  const [rLinear, gLinear, bLinear] = [
    r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4),
    g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4),
    b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4),
  ];

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Determine if text should be dark or light based on background
export function getContrastingTextColor(backgroundColor: string | null, isDarkMode: boolean): string {
  // If no background color, use default based on dark mode
  if (!backgroundColor) {
    return isDarkMode ? '#ffffff' : '#111827';
  }

  // Calculate luminance of background
  const luminance = getLuminance(backgroundColor);

  // If background is light (luminance > 0.5), use dark text
  // If background is dark (luminance <= 0.5), use light text
  return luminance > 0.5 ? '#111827' : '#ffffff';
}

// Get secondary text color (lighter/darker variant)
export function getContrastingSecondaryTextColor(backgroundColor: string | null, isDarkMode: boolean): string {
  // If no background color, use default based on dark mode
  if (!backgroundColor) {
    return isDarkMode ? '#d1d5db' : '#4b5563';
  }

  // Calculate luminance of background
  const luminance = getLuminance(backgroundColor);

  // If background is light, use darker secondary text
  // If background is dark, use lighter secondary text
  return luminance > 0.5 ? '#4b5563' : '#d1d5db';
}

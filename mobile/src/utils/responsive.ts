import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 8 as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 667;

/**
 * Responsive width based on screen size
 * @param widthPercent - Percentage of screen width (0-100)
 */
export const wp = (widthPercent: number): number => {
    const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
    return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * Responsive height based on screen size
 * @param heightPercent - Percentage of screen height (0-100)
 */
export const hp = (heightPercent: number): number => {
    const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
    return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * Responsive font size
 * Scales font size based on screen width
 * @param size - Base font size
 */
export const normalize = (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;

    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    }
};

/**
 * Get device type based on screen width
 */
export const getDeviceType = () => {
    if (SCREEN_WIDTH < 375) return 'small'; // Small phones (iPhone SE, etc.)
    if (SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414) return 'medium'; // Standard phones
    if (SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768) return 'large'; // Large phones
    return 'tablet'; // Tablets and larger
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
    return SCREEN_WIDTH >= 768;
};

/**
 * Check if device is a small phone
 */
export const isSmallDevice = (): boolean => {
    return SCREEN_WIDTH < 375;
};

/**
 * Responsive spacing
 * Returns appropriate spacing based on device size
 */
export const spacing = {
    xs: isSmallDevice() ? 4 : 6,
    sm: isSmallDevice() ? 8 : 12,
    md: isSmallDevice() ? 12 : 16,
    lg: isSmallDevice() ? 16 : 20,
    xl: isSmallDevice() ? 20 : 24,
    xxl: isSmallDevice() ? 24 : 32,
};

/**
 * Responsive dimensions
 */
export const dimensions = {
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    isSmall: SCREEN_WIDTH < 375,
    isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
    isLarge: SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768,
    isTablet: SCREEN_WIDTH >= 768,
};

/**
 * Get responsive value based on device size
 * @param small - Value for small devices
 * @param medium - Value for medium devices
 * @param large - Value for large devices
 * @param tablet - Value for tablets
 */
export const responsiveValue = <T,>(
    small: T,
    medium?: T,
    large?: T,
    tablet?: T
): T => {
    const deviceType = getDeviceType();

    switch (deviceType) {
        case 'small':
            return small;
        case 'medium':
            return medium ?? small;
        case 'large':
            return large ?? medium ?? small;
        case 'tablet':
            return tablet ?? large ?? medium ?? small;
        default:
            return small;
    }
};

export default {
    wp,
    hp,
    normalize,
    getDeviceType,
    isTablet,
    isSmallDevice,
    spacing,
    dimensions,
    responsiveValue,
};

export const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
export const STORAGE_PATH = '/storage/v1/object/public/facilities/';

/**
 * Converts a facility image path (local filename or path) to a Supabase Storage URL.
 * Handles:
 * - Arrays (takes first item)
 * - Comma-separated strings
 * - Local paths starting with /images/facilities/
 * - Plain filenames
 * - Existing absolute URLs (returns as is)
 */
export function getFacilityImageUrl(imageField: string | string[] | null | undefined): string | null {
    if (!imageField) return null;

    let image = '';

    if (Array.isArray(imageField)) {
        if (imageField.length === 0) return null;
        image = imageField[0];
    } else if (typeof imageField === 'string') {
        if (imageField.includes(',')) {
            image = imageField.split(',')[0].trim();
        } else {
            image = imageField;
        }
    }

    if (!image) return null;

    // If already absolute URL, return it
    if (image.startsWith('http') || image.startsWith('blob:') || image.startsWith('data:')) return image;

    // Strip local path prefix if present
    // Matches /images/facilities/ or images/facilities/
    image = image.replace(/^(\/)?images\/facilities\//, '');

    // Strip query params if any
    image = image.split('?')[0];

    // Ensure extension is .webp (Since we uploaded optimized webp images)
    // Replace existing extension with .webp
    const filename = image.replace(/\.[^/.]+$/, "") + ".webp";

    return `${SUPABASE_URL}${STORAGE_PATH}${filename}`;
}

/**
 * Same as above but strictly for a single image string (e.g. inside map loop)
 */
export function getSingleFacilityImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:')) return imagePath;

    let image = imagePath.replace(/^(\/)?images\/facilities\//, '');
    image = image.split('?')[0];
    const filename = image.replace(/\.[^/.]+$/, "") + ".webp";

    return `${SUPABASE_URL}${STORAGE_PATH}${filename}`;
}

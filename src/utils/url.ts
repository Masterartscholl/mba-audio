/**
 * Gets the base URL for the application, taking into account the /muzikbank subpath
 * when running on the muzikburada.net domain (Wix proxy context).
 */
export const getBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const isMuzikBurada = origin.includes('muzikburada.net');
    const basePath = isMuzikBurada ? '/muzikbank' : '';
    return `${origin}${basePath}`;
};

/**
 * Gets an absolute URL for the given path, automatically including the correct origin and base path.
 */
export const getAbsoluteUrl = (path: string) => {
    const baseUrl = getBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
};

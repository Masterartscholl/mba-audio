export const formatPrice = (price: number | string, currency: string = 'TL', locale: string = 'tr-TR') => {
    const numValue = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numValue)) return '-';

    const currencyStyles: { [key: string]: string } = {
        'TL': 'TRY',
        'USD': 'USD',
        'EUR': 'EUR'
    };

    const currencyCode = currencyStyles[currency] || 'TRY';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numValue);
};

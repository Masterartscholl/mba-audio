import createNextIntlPlugin from 'next-intl/plugin';

// next-intl, isteğe bağlı i18n config'ini buradan okuyor
// (getRequestConfig default export eden dosya)
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    // iyzipay Node SDK'si dinamik require kullandığı için
    // server bundle'a dahil etmeyip runtime'da require edilmesini istiyoruz.
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('iyzipay');
    }
    return config;
  },
};

export default withNextIntl(nextConfig);



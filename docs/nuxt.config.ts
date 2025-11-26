export default defineNuxtConfig({
    site: {
        name: 'pb-query',
    },
    image: {
        format: ['webp'],
    },
    app: {
        head: {
            link: [
                {
                    rel: 'icon',
                    type: 'image/x-icon',
                    href: `${process.env.NUXT_APP_BASE_URL}/favicon.ico`,
                },
            ],
        },
    },
})

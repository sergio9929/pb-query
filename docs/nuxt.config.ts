export default defineNuxtConfig({
    site: {
        name: 'pb-query',
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

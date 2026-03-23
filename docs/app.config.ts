export default defineAppConfig({
    seo: {
        // Default to package.json name
        title: 'pb-query',
        // Default to package.json description
        description: '',
    },
    github: {
        rootDir: 'docs',
    },
    ui: {
        prose: {
            a: {
                base: 'prose-a',
            },
        },
    },
})

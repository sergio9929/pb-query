<script setup lang="ts">
const appConfig = useAppConfig()

const link = computed(() =>
    appConfig.github && appConfig.github.url ? appConfig.github.url : '',
)
</script>

<template>
    <UButton v-if="link" color="neutral" icon="simple-icons-github" size="xl" target="_blank" :to="link"
        variant="outline">
        <slot>Star on GitHub</slot>
    </UButton>
</template>
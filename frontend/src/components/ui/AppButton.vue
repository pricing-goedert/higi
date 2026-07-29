<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'secondary'; type?: 'button' | 'submit'; href?: string }>(), {
  variant: 'primary',
  type: 'button',
})
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :type="href ? undefined : type"
    class="flex h-14 w-full items-center justify-center gap-2 rounded-btn font-semibold no-underline disabled:opacity-60"
    :class="variant === 'primary' ? 'bg-primary text-white' : 'bg-icon-soft text-primary'"
  >
    <slot />
  </component>
</template>

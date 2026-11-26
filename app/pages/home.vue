<script setup lang="ts">
definePageMeta({
  middleware: (to) =>
    navigateTo(
      { path: useLocalePath()("/"), query: to.query, hash: to.hash },
      { redirectCode: 301, replace: true },
    ),
});
</script>

<template>
  <div />
</template>

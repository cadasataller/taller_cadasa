<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { X } from "lucide-vue-next";

const props = defineProps<{
  title: string;
  hideHeader?: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const drawerRef = useTemplateRef<HTMLElement>("drawer");
let previousOverflow = "";
let previousFocus: HTMLElement | null = null;

function closeDrawer(): void {
  emit("close");
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  event.preventDefault();
  closeDrawer();
}

onMounted(() => {
  previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", handleKeydown);
  requestAnimationFrame(() => drawerRef.value?.focus());
});

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
  window.removeEventListener("keydown", handleKeydown);
  previousFocus?.focus();
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[70] bg-main-dark/50 lg:hidden"
      @click.self="closeDrawer"
    >
      <section
        ref="drawer"
        class="absolute inset-x-0 bottom-0 flex h-[85dvh] min-h-0 flex-col rounded-t-2xl bg-white shadow-2xl outline-none"
        role="dialog"
        aria-modal="true"
        :aria-label="props.title"
        tabindex="-1"
      >
        <header
          v-if="!props.hideHeader"
          class="flex min-h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4"
        >
          <h2 class="text-sm font-bold text-main">{{ props.title }}</h2>
          <button
            type="button"
            class="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-md hover:bg-gray-100"
            :aria-label="`Cerrar ${props.title.toLocaleLowerCase()}`"
            @click="closeDrawer"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </header>
        <div class="min-h-0 flex-1" :class="props.hideHeader ? 'p-0' : 'p-3'">
          <slot />
        </div>
      </section>
    </div>
  </Teleport>
</template>

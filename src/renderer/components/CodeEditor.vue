<template>
  <MonacoEditor
    v-bind="$attrs"
    :value="currentValue"
    :language="language"
    :theme="monacoTheme"
    :options="mergedOptions"
    :onBeforeMount="onBeforeMount"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MonacoEditor from '@guolao/vue-monaco-editor';
import { useAppearanceStore } from '~/renderer/stores';

interface Props {
  value?: string;
  modelValue?: string;
  language?: string;
  options?: Record<string, any>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'change', value?: string, ev?: unknown): void;
  (e: 'update:value', value?: string): void;
  (e: 'update:modelValue', value?: string): void;
}>();

const appearance = useAppearanceStore();
const monacoTheme = computed(() => (appearance.effectiveTheme === 'dark' ? 'vs-dark' : 'vs-light'));

const mergedOptions = computed(() => ({
  automaticLayout: true,
  fontSize: 14,
  minimap: { enabled: false },
  ...(props.options || {}),
}));

const currentValue = computed(() => props.modelValue ?? props.value ?? '');

function handleChange(val?: string, ev?: unknown) {
  emit('change', val, ev);
  emit('update:value', val);
  emit('update:modelValue', val);
}

function onBeforeMount(monaco: typeof import('monaco-editor')) {
  try {
    // Define GitHub-like themes mapping to Monaco base themes.
    // Later we can replace with actual GitHub theme JSONs if the project adds `monaco-themes`.
    monaco.editor.defineTheme('github-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {},
    });
    monaco.editor.defineTheme('github-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {},
    });
  } catch (e) {
    // no-op
  }
}
</script>

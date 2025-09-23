<template>
  <ul class="flex flex-col gap-1">
    <li v-for="node in nodes" :key="node.key" class="list-none">
      <div
        class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-surface-200/30 dark:hover:bg-surface-700/30"
        :class="{
          'ring-1 ring-[var(--p-content-border-color,rgba(0,0,0,0.12))] ring-offset-2 ring-offset-transparent':
            isSelected(node),
          'font-semibold': !!node.children?.length,
        }"
        @click="onRowClick(node)"
      >
        <div class="flex items-center min-w-0 gap-2">
          <button
            v-if="node.children?.length"
            class="shrink-0 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            @click.stop="toggle(node)"
            aria-label="Toggle"
            :title="isExpanded(node) ? 'Collapse' : 'Expand'"
          >
            <i :class="isExpanded(node) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
          </button>
          <span class="truncate">{{ node.label }}</span>
        </div>
        <i
          v-if="!node.children?.length && node.completed"
          class="text-green-500 pi pi-check-circle"
          :title="'Completed'"
        />
      </div>

      <div v-if="node.children?.length && isExpanded(node)" class="pl-6">
        <!-- recursive -->
        <ExerciseTree
          :nodes="node.children!"
          :selectionKeys="selectionKeys"
          :expandedKeys="expandedKeys"
          @update:selectionKeys="(v) => emit('update:selectionKeys', v)"
          @node-expand="(e) => emit('node-expand', e)"
          @node-collapse="(e) => emit('node-collapse', e)"
        />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { CourseTreeNode } from '~/ipc/contracts.js';

defineOptions({ name: 'ExerciseTree' });

const props = defineProps<{
  nodes: CourseTreeNode[];
  selectionKeys?: Record<string, boolean>;
  expandedKeys?: Record<string, boolean>;
}>();

const emit = defineEmits<{
  (e: 'update:selectionKeys', value: Record<string, boolean>): void;
  (e: 'node-expand', payload: { node: CourseTreeNode }): void;
  (e: 'node-collapse', payload: { node: CourseTreeNode }): void;
}>();

function isLeaf(n: CourseTreeNode) {
  return !n.children || n.children.length === 0;
}

function isSelected(n: CourseTreeNode) {
  return !!props.selectionKeys && !!props.selectionKeys[n.key];
}

function isExpanded(n: CourseTreeNode) {
  return !!props.expandedKeys && !!props.expandedKeys[n.key];
}

function onRowClick(n: CourseTreeNode) {
  // select only leaves as exercises
  if (isLeaf(n)) {
    emit('update:selectionKeys', { [n.key]: true });
  } else {
    // toggle groups on label click
    toggle(n);
  }
}

function toggle(n: CourseTreeNode) {
  if (isExpanded(n)) emit('node-collapse', { node: n });
  else emit('node-expand', { node: n });
}
</script>

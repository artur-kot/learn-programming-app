<template>
  <div class="relative flex h-screen lg:static bg-surface-50 dark:bg-surface-950">
    <!-- Course Sidebar -->
    <aside
      id="course-sidebar"
      class="w-[350px] pl-[30px] dark:bg-surface-950 h-screen hidden lg:block shrink-0 absolute lg:static top-0 z-10 select-none lg:py-8 shadow-lg lg:shadow-none"
    >
      <div class="flex flex-col h-full">
        <div class="flex flex-col flex-1 gap-4 p-2 overflow-y-auto">
          <Button
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            rounded
            aria-label="Back to Home"
            class="self-start"
            @click="goHome"
          />

          <Tree
            :value="nodes"
            selectionMode="single"
            :filter="true"
            filterMode="lenient"
            v-model:selectionKeys="selectedKeys"
            :expandedKeys="expandedKeys"
            :expandOnClick="false"
            :toggleable="false"
            @update:selectionKeys="onSelectionUpdate"
          >
            <template #default="slotProps">
              <span :style="{ fontWeight: slotProps.node.children ? 'bold' : 'normal' }">
                {{ slotProps.node.label }}
              </span>
            </template>
            <template #nodetoggleicon>
              <!-- Hide chevron icon by rendering nothing -->
            </template>
          </Tree>
        </div>
      </div>
    </aside>

    <!-- Content -->
    <div class="flex flex-col flex-auto h-screen bg-surface-50 dark:bg-surface-950 p-7 md:p-8">
      <div
        class="flex flex-col flex-auto p-8 overflow-auto border shadow-md 2xl:p-12 bg-surface-0 dark:bg-surface-900 rounded-xl border-surface-200 dark:border-surface-700"
      >
        <div class="flex items-center justify-between w-full gap-2">
          <div class="flex items-center gap-4 md:gap-8">
            <a
              v-styleclass="{
                selector: '#course-sidebar',
                enterFromClass: 'hidden',
                enterActiveClass: 'animate-fadeinleft',
                leaveToClass: 'hidden',
                leaveActiveClass: 'animate-fadeoutleft',
                hideOnOutsideClick: true,
              }"
              class="block cursor-pointer lg:hidden text-surface-700 dark:text-surface-100"
            >
              <i class="pi pi-bars text-xl! leading-none!" />
            </a>
          </div>
        </div>

        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Tree from 'primevue/tree';

const router = useRouter();
const goHome = () => router.push('/');

const nodes = ref([
  {
    key: '0',
    label: 'Getting Started',
    children: [
      { key: '0-0', label: 'Welcome' },
      { key: '0-1', label: 'Environment Setup' },
    ],
  },
  {
    key: '1',
    label: 'Basics',
    children: [
      { key: '1-0', label: 'Variables' },
      { key: '1-1', label: 'Functions' },
      { key: '1-2', label: 'Control Flow' },
    ],
  },
  {
    key: '2',
    label: 'Advanced',
    children: [
      {
        key: '2-0',
        label: 'Asynchronous',
        children: [
          { key: '2-0-0', label: 'Promises' },
          { key: '2-0-1', label: 'Async/Await' },
        ],
      },
      { key: '2-1', label: 'Performance' },
    ],
  },
]);

// Always-expanded keys map
const expandedKeys = ref({});

// Selected key(s) model (PrimeVue uses v-model:selectionKeys for single as well)
const selectedKeys = ref(null);
// Track last valid selection to prevent unselect
const lastSelectedKey = ref(null);

// Mark folder nodes (with children) as unselectable
const markFoldersUnselectable = (tree) => {
  const visit = (node) => {
    if (!node) return;
    if (node.children && node.children.length) {
      node.selectable = false;
      node.children.forEach(visit);
    }
  };
  tree.forEach(visit);
};

const buildExpandedKeys = (tree) => {
  const keys = {};
  const visit = (node) => {
    if (!node || !node.key) return;
    keys[node.key] = true;
    if (node.children && node.children.length) node.children.forEach(visit);
  };
  tree.forEach(visit);
  return keys;
};

const findNodeByKey = (tree, key) => {
  let found = null;
  const visit = (node) => {
    if (found || !node) return;
    if (node.key === key) {
      found = node;
      return;
    }
    if (node.children && node.children.length) node.children.forEach(visit);
  };
  tree.forEach(visit);
  return found;
};

const isSelectableNodeKey = (key) => {
  const node = findNodeByKey(nodes.value, key);
  return !!node && (!node.children || node.children.length === 0) && node.selectable !== false;
};

const firstSelectableKey = (tree) => {
  let result = null;
  const visit = (node) => {
    if (result) return;
    if (node.children && node.children.length) {
      node.children.forEach(visit);
    } else if (node.key) {
      result = node.key;
    }
  };
  tree.forEach(visit);
  return result;
};

const ensureSingleSelection = (value) => {
  // Normalize to a single key and disallow folder selection
  let resolved = value;

  // Empty or undefined selection -> fallback to first selectable leaf
  if (!resolved || (typeof resolved === 'object' && Object.keys(resolved).length === 0)) {
    const fallbackKey = lastSelectedKey.value ?? firstSelectableKey(nodes.value);
    if (fallbackKey == null) return;
    resolved = typeof value === 'object' ? { [fallbackKey]: true } : fallbackKey;
  }

  // If object with multiple keys, keep only the first
  if (typeof resolved === 'object') {
    const key = Object.keys(resolved)[0];
    resolved = { [key]: true };
  }

  // Validate selectability (disallow folders)
  let key = typeof resolved === 'string' ? resolved : Object.keys(resolved)[0];
  if (!isSelectableNodeKey(key)) {
    const fallbackKey = lastSelectedKey.value ?? firstSelectableKey(nodes.value);
    if (fallbackKey == null) return;
    key = fallbackKey;
  }

  // Apply final shape matching the incoming value type
  const finalValue = typeof value === 'string' ? key : { [key]: true };

  selectedKeys.value = finalValue;
  lastSelectedKey.value = key;
};

const onSelectionUpdate = (value) => {
  ensureSingleSelection(value);
};

onMounted(() => {
  // Make folders unselectable
  markFoldersUnselectable(nodes.value);

  // Expand all nodes on mount (also covers re-entry to the page)
  expandedKeys.value = buildExpandedKeys(nodes.value);

  // If nothing selected, select the first selectable (leaf) node
  ensureSingleSelection(selectedKeys.value);
});
</script>

<style scoped>
/* Subtle rounded border for selected tree item */
:deep(#course-sidebar .p-tree .p-treenode-content) {
  border-radius: 0.5rem; /* rounded-lg */
  padding: 0.35rem 0.5rem; /* increase hit area */
  cursor: pointer;
}

:deep(#course-sidebar .p-tree .p-treenode-content:hover) {
  background: color-mix(in oklab, var(--p-surface-200), transparent 70%);
}

:deep(#course-sidebar .p-tree .p-treenode-content.p-highlight) {
  outline: 1px solid var(--p-content-border-color, rgba(0, 0, 0, 0.12));
  outline-offset: 2px;
}
</style>

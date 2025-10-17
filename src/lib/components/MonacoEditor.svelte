<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import loader from "@monaco-editor/loader";
  import type * as Monaco from "monaco-editor";

  interface Props {
    value: string;
    language?: string;
    onChange?: (value: string) => void;
  }

  let { value = "", language = "javascript", onChange }: Props = $props();

  let editorContainer: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  let monaco: typeof Monaco | null = null;

  onMount(async () => {
    try {
      monaco = await loader.init();

      if (!editorContainer) return;

      editor = monaco.editor.create(editorContainer, {
        value,
        language,
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
      });

      // Listen for content changes
      editor.onDidChangeModelContent(() => {
        if (editor && onChange) {
          onChange(editor.getValue());
        }
      });
    } catch (error) {
      console.error("Failed to initialize Monaco Editor:", error);
    }
  });

  // Update editor when value prop changes externally
  $effect(() => {
    if (editor && value !== editor.getValue()) {
      const position = editor.getPosition();
      editor.setValue(value);
      if (position) {
        editor.setPosition(position);
      }
    }
  });

  // Update language when it changes
  $effect(() => {
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  });

  onDestroy(() => {
    editor?.dispose();
  });
</script>

<div bind:this={editorContainer} class="w-full h-full"></div>

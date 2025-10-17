<script lang="ts">
  import { marked } from "marked";

  interface Props {
    content: string;
    class?: string;
  }

  let { content, class: className = "" }: Props = $props();

  let html = $derived(marked.parse(content, { async: false, gfm: true }) as string);
</script>

<div class="prose prose-slate dark:prose-invert max-w-none {className}">
  {@html html}
</div>

<style>
  :global(.prose) {
    color: hsl(var(--foreground));
  }

  :global(.prose h1) {
    font-size: 1.875rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: hsl(var(--foreground));
  }

  :global(.prose h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.75rem;
    margin-bottom: 0.75rem;
    color: hsl(var(--foreground));
  }

  :global(.prose h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: hsl(var(--foreground));
  }

  :global(.prose p) {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    line-height: 1.75;
  }

  :global(.prose code) {
    background-color: hsl(var(--muted));
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  }

  :global(.prose pre) {
    background-color: hsl(var(--muted));
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  :global(.prose pre code) {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
    font-size: 0.875rem;
  }

  :global(.prose ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }

  :global(.prose ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }

  :global(.prose li) {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }

  :global(.prose a) {
    color: hsl(var(--primary));
    text-decoration: underline;
  }

  :global(.prose a:hover) {
    color: hsl(var(--primary) / 0.8);
  }

  :global(.prose blockquote) {
    border-left: 4px solid hsl(var(--border));
    padding-left: 1rem;
    font-style: italic;
    color: hsl(var(--muted-foreground));
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  :global(.prose table) {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  :global(.prose th) {
    background-color: hsl(var(--muted));
    padding: 0.5rem;
    text-align: left;
    font-weight: 600;
    border: 1px solid hsl(var(--border));
  }

  :global(.prose td) {
    padding: 0.5rem;
    border: 1px solid hsl(var(--border));
  }

  :global(.prose img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  :global(.prose hr) {
    border: 0;
    border-top: 1px solid hsl(var(--border));
    margin-top: 2rem;
    margin-bottom: 2rem;
  }

  :global(.prose strong) {
    font-weight: 600;
  }

  :global(.prose em) {
    font-style: italic;
  }
</style>

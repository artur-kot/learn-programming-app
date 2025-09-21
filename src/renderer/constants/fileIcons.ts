// Centralized file extension icon mapping for the renderer
// Keep lightweight and tree-shakable

export const EXT_ICON_MAP: Record<string, string> = {
  // languages
  ts: 'devicon-typescript-plain',
  tsx: 'devicon-react-original',
  js: 'devicon-javascript-plain',
  jsx: 'devicon-react-original',
  mjs: 'devicon-javascript-plain',
  cjs: 'devicon-javascript-plain',
  json: 'pi pi-list',
  md: 'pi pi-book',
  markdown: 'pi pi-book',
  html: 'devicon-html5-plain',
  htm: 'devicon-html5-plain',
  css: 'devicon-css3-plain',
  scss: 'devicon-sass-plain',
  sass: 'devicon-sass-plain',
  less: 'devicon-less-plain-wordmark',
  vue: 'devicon-vuejs-plain',
  svelte: 'devicon-svelte-plain',
  astro: 'devicon-astro-plain',
  pug: 'pi pi-code',
  ejs: 'pi pi-code',

  // node and config
  yaml: 'pi pi-sliders-h',
  yml: 'pi pi-sliders-h',
  env: 'pi pi-sliders-h',
  lock: 'pi pi-lock',
  toml: 'pi pi-sliders-h',
  ini: 'pi pi-sliders-h',
  conf: 'pi pi-sliders-h',

  // scripts & data
  sh: 'devicon-bash-plain',
  bash: 'devicon-bash-plain',
  ps1: 'pi pi-terminal',
  csv: 'pi pi-table',
  txt: 'pi pi-file',
  log: 'pi pi-align-left',

  // images
  png: 'pi pi-image',
  jpg: 'pi pi-image',
  jpeg: 'pi pi-image',
  gif: 'pi pi-image',
  svg: 'pi pi-image',
  webp: 'pi pi-image',
  ico: 'pi pi-image',

  // archives
  zip: 'pi pi-box',
  tar: 'pi pi-box',
  gz: 'pi pi-box',
  tgz: 'pi pi-box',
  rar: 'pi pi-box',

  // code
  py: 'devicon-python-plain',
  java: 'devicon-java-plain',
  kt: 'devicon-kotlin-plain',
  rs: 'devicon-rust-plain',
  go: 'devicon-go-plain',
  rb: 'devicon-ruby-plain',
  php: 'devicon-php-plain',
  cs: 'devicon-csharp-plain',
  cpp: 'devicon-cplusplus-plain',
  cxx: 'devicon-cplusplus-plain',
  cc: 'devicon-cplusplus-plain',
  c: 'devicon-c-plain',
  swift: 'devicon-swift-plain',
  dart: 'devicon-dart-plain',
  scala: 'devicon-scala-plain',
  r: 'devicon-r-plain',
  hs: 'devicon-haskell-plain',
  lua: 'devicon-lua-plain',
  ml: 'pi pi-code',
  ex: 'devicon-elixir-plain',
  exs: 'devicon-elixir-plain',

  // web frameworks
  nuxt: 'devicon-nuxtjs-plain',
  next: 'devicon-nextjs-original',
  nest: 'devicon-nestjs-plain',
  angular: 'devicon-angularjs-plain',
  react: 'devicon-react-original',
  solid: 'pi pi-code',

  // database
  sql: 'devicon-mysql-plain',
  sqlite: 'devicon-sqlite-plain',
  prisma: 'devicon-prisma-original',
  mongo: 'devicon-mongodb-plain',
  bson: 'devicon-mongodb-plain',
  yml_dist: 'pi pi-copy',

  // docker
  dockerfile: 'devicon-docker-plain',
  docker: 'devicon-docker-plain',

  // other
  pdf: 'pi pi-file-pdf',
};

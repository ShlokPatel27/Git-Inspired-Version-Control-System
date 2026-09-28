const LANGUAGE_COLORS = {
  javascript: "#f1e05a",
  js: "#f1e05a",
  typescript: "#3178c6",
  ts: "#3178c6",
  python: "#3572A5",
  py: "#3572A5",
  java: "#b07219",
  "c++": "#f34b7d",
  cpp: "#f34b7d",
  c: "#555555",
  "c#": "#178600",
  csharp: "#178600",
  cs: "#178600",
  html: "#e34c26",
  css: "#563d7c",
  php: "#4F5D95",
  go: "#00ADD8",
  golang: "#00ADD8",
  rust: "#dea584",
  ruby: "#701516",
  swift: "#F05138",
  kotlin: "#A97BFF",
  kt: "#A97BFF",
  dart: "#00B4AB",
  flutter: "#02569B",
  shell: "#89e051",
  bash: "#89e051",
  sh: "#89e051",
  sql: "#e38c00",
  r: "#198CE7",
  vue: "#41b883",
  react: "#61dafb",
  reactjs: "#61dafb",
  "next.js": "#000000",
  nextjs: "#000000",
  node: "#339933",
  nodejs: "#339933",
  scala: "#c22d40",
  lua: "#000080",
  perl: "#0298c3",
  haskell: "#5e5086",
  elixir: "#6e4a7e",
  clojure: "#db5855",
  solidity: "#AA6746",
  matlab: "#e16737",
  dockerfile: "#384d54",
  docker: "#384d54",
  powershell: "#012456",
  assembly: "#6E4C13",
  svelte: "#ff3e00",
  json: "#292929",
  markdown: "#083fa1",
};

export const getLanguageColor = (lang) => {
  if (!lang) return "#f1e05a";
  const normalized = lang.trim().toLowerCase();
  if (LANGUAGE_COLORS[normalized]) {
    return LANGUAGE_COLORS[normalized];
  }
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return "hsl(" + hue + ", 70%, 55%)";
};


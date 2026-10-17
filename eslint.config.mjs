import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // `components/ui/**` is vendored verbatim from the shadcn registry. We do not
  // patch those files in place, because the next `shadcn add` would overwrite
  // the patch and silently reintroduce the error. `dotted-map` trips
  // `preserve-manual-memoization`: it calls `createMap()` during render and
  // then `addMarkers()`, which the React Compiler cannot prove is safe, so it
  // declines to optimise the component. That is upstream's design, not a
  // defect we introduced.
  {
    files: ["components/ui/**"],
    rules: {
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;

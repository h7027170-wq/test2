import next from "eslint-config-next";

const config = [
  { ignores: [".next/**", "node_modules/**", "design-system/**", "next-env.d.ts"] },
  ...next,
];

export default config;

import type { Plugin } from '@opencode-ai/plugin';

export const AutoLintPlugin: Plugin = async ({ client, $ }) => {
  const checkedFiles = new Set<string>();

  return {
    event: async ({ event }) => {
      if (event.type !== 'tool.execute.after') return;
      if (event.tool !== 'edit' && event.tool !== 'write') return;

      const files = event.args?.filePath
        ? [event.args.filePath]
        : event.args?.filePaths || [];

      for (const file of files) {
        if (typeof file !== 'string') continue;
        if (!file.match(/\.(ts|tsx|js|jsx|json|css|html)$/)) continue;
        if (checkedFiles.has(file)) continue;

        checkedFiles.add(file);

        const result = await $`npx @biomejs/biome check --write --no-errors-on-unmatched ${file}`;

        if (result.exitCode !== 0 && result.stderr) {
          await client.sendMessage(
            `🔧 Biome auto-fix encontró issues en \`${file}\`:\n\`\`\`\n${result.stderr}\n\`\`\`\nPor favor revisa y corrige.`
          );
        }
      }

      // Reset on new session
      if (event.type === 'session.start') checkedFiles.clear();
    },
  };
};

export default AutoLintPlugin;

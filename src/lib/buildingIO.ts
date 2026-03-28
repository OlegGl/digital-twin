import { BuildingConfigSchema, slugify, type BuildingConfig } from './buildingSchema';

/**
 * Export a building config as a downloadable JSON file.
 */
export function exportBuildingJSON(config: BuildingConfig) {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(config.name) || config.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate a JSON string as a BuildingConfig.
 * Returns { success: true, data } or { success: false, error }.
 */
export function parseBuildingJSON(
  jsonStr: string,
): { success: true; data: BuildingConfig } | { success: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { success: false, error: 'Invalid JSON: file is not valid JSON.' };
  }

  const result = BuildingConfigSchema.safeParse(parsed);
  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors
  const issues = result.error.issues
    .slice(0, 5)
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  const more = result.error.issues.length > 5 ? `\n  ...and ${result.error.issues.length - 5} more` : '';
  return { success: false, error: `Invalid building config:\n${issues}${more}` };
}

/**
 * Read a File as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

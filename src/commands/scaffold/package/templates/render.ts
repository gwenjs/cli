export type TemplateKind = "code" | "text";

export interface GeneratedTemplate {
  kind: TemplateKind;
  content: string;
}

function withTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

/**
 * Use code templates for source files that may need code-aware handling later.
 */
export function codeTemplate(content: string): GeneratedTemplate {
  return { kind: "code", content };
}

/**
 * Use text templates for YAML, JSON, markdown, and other plain-text artifacts.
 */
export function textTemplate(content: string): GeneratedTemplate {
  return { kind: "text", content };
}

/**
 * Finalizes a generated template for writing to disk.
 */
export function finalizeTemplate(template: GeneratedTemplate): string {
  return withTrailingNewline(template.content);
}

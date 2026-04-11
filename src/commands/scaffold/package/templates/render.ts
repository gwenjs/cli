export type TemplateKind = "code" | "text";

export interface GeneratedTemplate {
  kind: TemplateKind;
  content: string;
}

function withTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

/**
 * Creates a generated code template.
 */
export function codeTemplate(content: string): GeneratedTemplate {
  return { kind: "code", content };
}

/**
 * Creates a generated text template.
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

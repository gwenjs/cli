import readline from "node:readline";

export interface ScaffoldPackageOptions {
  name: string;
  gwenVersion: string;
  withCi: boolean;
  withDocs: boolean;
}

type RawArgs = {
  name?: string;
  "gwen-version"?: string;
  "with-ci"?: boolean;
  "with-docs"?: boolean;
};

async function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(question);
    rl.once("line", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptBoolean(question: string): Promise<boolean> {
  const answer = await prompt(`${question} (y/N): `);
  return answer.toLowerCase() === "y";
}

export async function resolveOptions(args: RawArgs): Promise<ScaffoldPackageOptions> {
  let name = args.name?.trim() ?? "";
  if (!name) {
    name = await prompt("Package name (e.g. my-plugin): ");
  }

  const gwenVersion = args["gwen-version"]?.trim() || "^0.1.0";

  const withCi =
    args["with-ci"] !== undefined
      ? Boolean(args["with-ci"])
      : await promptBoolean("Include GitHub Actions CI + publish workflows?");

  const withDocs =
    args["with-docs"] !== undefined
      ? Boolean(args["with-docs"])
      : await promptBoolean("Include VitePress documentation?");

  return { name, gwenVersion, withCi, withDocs };
}

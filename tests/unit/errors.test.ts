/**
 * Unit tests for custom error classes and createError helper.
 */

import { describe, it, expect } from "vitest";
import {
  GwenCliError,
  ConfigError,
  BuildError,
  ValidationError,
  DevServerError,
  PrepareError,
  createError,
} from "../../src/core/types/errors.js";

describe("GwenCliError", () => {
  it("sets message, code and name", () => {
    const err = new GwenCliError("something failed", "MY_CODE");
    expect(err.message).toBe("something failed");
    expect(err.code).toBe("MY_CODE");
    expect(err.name).toBe("GwenCliError");
  });

  it("stores optional cause", () => {
    const cause = new Error("original");
    const err = new GwenCliError("wrapped", "CODE", cause);
    expect(err.cause).toBe(cause);
  });

  it("is an instance of Error", () => {
    const err = new GwenCliError("msg", "CODE");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GwenCliError);
  });
});

describe("ConfigError", () => {
  it("has correct code and name", () => {
    const err = new ConfigError("bad config");
    expect(err.code).toBe("CONFIG_ERROR");
    expect(err.name).toBe("ConfigError");
    expect(err).toBeInstanceOf(GwenCliError);
  });

  it("stores cause", () => {
    const cause = new Error("parse failure");
    const err = new ConfigError("bad config", cause);
    expect(err.cause).toBe(cause);
  });
});

describe("BuildError", () => {
  it("has correct code and name", () => {
    const err = new BuildError("build failed");
    expect(err.code).toBe("BUILD_ERROR");
    expect(err.name).toBe("BuildError");
    expect(err).toBeInstanceOf(GwenCliError);
  });
});

describe("ValidationError", () => {
  it("has correct code and name", () => {
    const err = new ValidationError("invalid input");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.name).toBe("ValidationError");
    expect(err).toBeInstanceOf(GwenCliError);
  });
});

describe("DevServerError", () => {
  it("has correct code and name", () => {
    const err = new DevServerError("server crashed");
    expect(err.code).toBe("DEV_SERVER_ERROR");
    expect(err.name).toBe("DevServerError");
    expect(err).toBeInstanceOf(GwenCliError);
  });
});

describe("PrepareError", () => {
  it("has correct code and name", () => {
    const err = new PrepareError("prepare failed");
    expect(err.code).toBe("PREPARE_ERROR");
    expect(err.name).toBe("PrepareError");
    expect(err).toBeInstanceOf(GwenCliError);
  });
});

describe("createError", () => {
  it("returns GwenCliError as-is", () => {
    const original = new GwenCliError("msg", "CODE");
    const result = createError(original, "OTHER");
    expect(result).toBe(original);
  });

  it("wraps a standard Error", () => {
    const original = new Error("standard");
    const result = createError(original, "WRAPPED");
    expect(result).toBeInstanceOf(GwenCliError);
    expect(result.message).toBe("standard");
    expect(result.code).toBe("WRAPPED");
    expect(result.cause).toBe(original);
  });

  it("wraps a string", () => {
    const result = createError("plain string error", "STR_CODE");
    expect(result).toBeInstanceOf(GwenCliError);
    expect(result.message).toBe("plain string error");
    expect(result.code).toBe("STR_CODE");
  });

  it("wraps any unknown value", () => {
    const result = createError(42, "NUM_CODE");
    expect(result).toBeInstanceOf(GwenCliError);
    expect(result.message).toBe("42");
    expect(result.code).toBe("NUM_CODE");
  });
});

/**
 * Unit tests for type guards and error utilities.
 */

import { describe, it, expect } from "vitest";
import { isError, parseError, parseErrorCode } from "../../src/core/types/guards.js";

describe("isError", () => {
  it("returns true for Error instances", () => {
    expect(isError(new Error("oops"))).toBe(true);
    expect(isError(new TypeError("type err"))).toBe(true);
  });

  it("returns false for non-Error values", () => {
    expect(isError("string")).toBe(false);
    expect(isError(42)).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError(undefined)).toBe(false);
    expect(isError({ message: "fake error" })).toBe(false);
  });
});

describe("parseError", () => {
  it("returns error message for Error instances", () => {
    expect(parseError(new Error("something broke"))).toBe("something broke");
  });

  it("converts non-Error values to string", () => {
    expect(parseError("raw string")).toBe("raw string");
    expect(parseError(404)).toBe("404");
    expect(parseError(null)).toBe("null");
    expect(parseError(undefined)).toBe("undefined");
  });
});

describe("parseErrorCode", () => {
  it("returns UNKNOWN_ERROR for plain Error (no code property)", () => {
    expect(parseErrorCode(new Error("no code"))).toBe("UNKNOWN_ERROR");
  });

  it("returns string code when Error has a string code property", () => {
    const err = Object.assign(new Error("coded"), { code: "ENOENT" });
    expect(parseErrorCode(err)).toBe("ENOENT");
  });

  it("stringifies numeric code on Error", () => {
    const err = Object.assign(new Error("coded"), { code: 404 });
    expect(parseErrorCode(err)).toBe("404");
  });

  it("returns UNKNOWN_ERROR for non-Error values", () => {
    expect(parseErrorCode("string")).toBe("UNKNOWN_ERROR");
    expect(parseErrorCode(null)).toBe("UNKNOWN_ERROR");
    expect(parseErrorCode(42)).toBe("UNKNOWN_ERROR");
  });
});

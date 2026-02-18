import { appendClosedIndexParams } from "../esHelpers";

describe("appendClosedIndexParams", () => {
  const EXPECTED_PARAMS =
    "ignore_unavailable=true&allow_no_indices=true&expand_wildcards=open";

  test("appends params to URL without existing query string", () => {
    const url = "/mozart_es/job_status/_count";
    const result = appendClosedIndexParams(url);
    expect(result).toBe(`${url}?${EXPECTED_PARAMS}`);
  });

  test("appends params to URL with existing query string", () => {
    const url = "/mozart_es/job_status/_count?timeout=30s";
    const result = appendClosedIndexParams(url);
    expect(result).toBe(`${url}&${EXPECTED_PARAMS}`);
  });

  test("does not duplicate params if already present", () => {
    const url = `/mozart_es/job_status/_count?ignore_unavailable=true&allow_no_indices=true&expand_wildcards=open`;
    const result = appendClosedIndexParams(url);
    expect(result).toBe(url);
  });

  test("does not duplicate params if partially present (ignore_unavailable)", () => {
    const url = `/mozart_es/job_status/_count?ignore_unavailable=true`;
    const result = appendClosedIndexParams(url);
    expect(result).toBe(url);
  });

  test("handles null input gracefully", () => {
    expect(appendClosedIndexParams(null)).toBeNull();
  });

  test("handles undefined input gracefully", () => {
    expect(appendClosedIndexParams(undefined)).toBeUndefined();
  });

  test("handles empty string input", () => {
    expect(appendClosedIndexParams("")).toBe("");
  });

  test("works with GRQ ES URL pattern", () => {
    const url = "/grq_es/grq/_count";
    const result = appendClosedIndexParams(url);
    expect(result).toBe(`${url}?${EXPECTED_PARAMS}`);
  });

  test("works with full URL including protocol and host", () => {
    const url = "https://example.com/mozart_es/job_status/_count";
    const result = appendClosedIndexParams(url);
    expect(result).toBe(`${url}?${EXPECTED_PARAMS}`);
  });
});

jest.mock("../../../../config", () => ({
  MOZART_ES_URL: "/mozart_es",
  MOZART_ES_INDICES: "job_status",
  MOZART_REST_API_BASE: "/mozart",
  MOZART_REST_API_V1: "/mozart/api/v0.1",
  MOZART_REST_API_V2: "/mozart/api/v0.2",
}));

jest.mock("../../../../utils", () => ({
  editUrlDataCount: jest.fn(),
}));

import { editDataCount } from "../../figaro";

describe("Figaro editDataCount", () => {
  let dispatch;
  let originalFetch;

  beforeEach(() => {
    dispatch = jest.fn();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("_count endpoint URL includes ignore_unavailable parameter", async () => {
    const mockResponse = { count: 42 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const query = '{"match_all": {}}';
    await editDataCount(query)(dispatch);

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain("ignore_unavailable=true");
    expect(calledUrl).toContain("allow_no_indices=true");
    expect(calledUrl).toContain("expand_wildcards=open");
    expect(calledUrl).toContain("/mozart_es/job_status/_count");
  });

  test("dispatches EDIT_DATA_COUNT with correct count on success", async () => {
    const mockResponse = { count: 42 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const query = '{"match_all": {}}';
    await editDataCount(query)(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: "EDIT_DATA_COUNT",
      payload: 42,
    });
  });

  test("dispatches null payload on HTTP error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });

    const query = '{"match_all": {}}';
    try {
      await editDataCount(query)(dispatch);
    } catch (e) {
      // expected
    }

    expect(dispatch).toHaveBeenCalledWith({
      type: "EDIT_DATA_COUNT",
      payload: null,
    });
  });

  test("dispatches null payload for empty query", async () => {
    await editDataCount("")(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: "EDIT_DATA_COUNT",
      payload: null,
    });

    expect(global.fetch).not.toHaveBeenCalled?.();
  });

  test("dispatches null payload for invalid JSON query", async () => {
    try {
      await editDataCount("not-json")(dispatch);
    } catch (e) {
      // expected
    }

    expect(dispatch).toHaveBeenCalledWith({
      type: "EDIT_DATA_COUNT",
      payload: null,
    });
  });
});

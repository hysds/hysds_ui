jest.mock("../../../../config", () => ({
  GRQ_ES_URL: "/grq_es",
  GRQ_ES_INDICES: "grq",
  MOZART_REST_API_V2: "/mozart/api/v0.2",
  GRQ_REST_API_V1: "/grq/api/v0.1",
}));

jest.mock("../../../../utils", () => ({
  editUrlDataCount: jest.fn(),
}));

import { editDataCount } from "../../tosca";

describe("Tosca editDataCount", () => {
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
    const mockResponse = { count: 100 };
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
    expect(calledUrl).toContain("/grq_es/grq/_count");
  });

  test("dispatches EDIT_DATA_COUNT with correct count on success", async () => {
    const mockResponse = { count: 100 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const query = '{"match_all": {}}';
    await editDataCount(query)(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: "EDIT_DATA_COUNT",
      payload: 100,
    });
  });
});

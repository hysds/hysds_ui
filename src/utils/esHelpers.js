/**
 * Appends Elasticsearch query parameters to handle closed indices (HC-600).
 *
 * When ES index lifecycle management (ILM) closes old indices, queries against
 * index patterns that match closed indices will fail unless these parameters
 * are included:
 *   - ignore_unavailable=true  → skip unavailable/closed indices
 *   - allow_no_indices=true    → don't error if no indices match after filtering
 *   - expand_wildcards=open    → only expand wildcard patterns to open indices
 *
 * @param {string} url - The Elasticsearch endpoint URL
 * @returns {string} The URL with closed-index parameters appended
 */
export const appendClosedIndexParams = (url) => {
  if (!url) return url;
  if (url.includes("ignore_unavailable")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ignore_unavailable=true&allow_no_indices=true&expand_wildcards=open`;
};

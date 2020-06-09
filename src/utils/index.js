exports.makeDropdownOptions = (data) =>
  data.map((job) => ({
    label: job.version ? `${job.label} [${job.version}]` : job.label,
    value: job.job_spec,
    jobSpec: job.job_spec,
    hysdsio: job.hysds_io,
  }));

exports.constructUrl = (key, value) => {
  const params = new URLSearchParams(location.search);
  params.set(key, value);
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

exports.sanitizePriority = (level) => {
  level = parseInt(level);
  if (level) {
    if (level > 9) return 9;
    else if (level < 1) return 1;
    else return level;
  } else {
    return 1;
  }
};

const IGNORE_QUERY_PARAMS = [
  "query",
  "job_type",
  "queue",
  "priority",
  "total",
  "tags",
];

exports.extractJobParams = (urlParams) => {
  const params = {};
  urlParams.forEach((value, key) => {
    let isParam = !IGNORE_QUERY_PARAMS.includes(key);
    if (isParam) params[key] = value;
  });
  return params;
};

exports.clearUrlJobParams = () => {
  const params = new URLSearchParams(location.search);
  const toDelete = [];
  for (let pair of params.entries()) {
    const key = pair[0];
    if (!IGNORE_QUERY_PARAMS.includes(key)) toDelete.push(key);
  }
  toDelete.forEach((p) => params.delete(p));
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

exports.editUrlJobParam = (key, value) => {
  const params = new URLSearchParams(location.search);
  try {
    value = JSON.stringify(value);
  } catch (err) {}
  params.set(key, value);
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

exports.validateUrlQueryParam = (query) => {
  const params = new URLSearchParams(location.search);
  let urlQueryParam;
  try {
    let parsedQuery = JSON.parse(query);
    urlQueryParam = JSON.stringify(parsedQuery);
  } catch (err) {
    urlQueryParam = query;
  }
  params.set("query", urlQueryParam);
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

exports.editUrlDataCount = (count) => {
  const params = new URLSearchParams(location.search);
  params.set("total", count);
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

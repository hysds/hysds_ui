exports.constructUrl = (key, value) => {
  const params = new URLSearchParams(location.search);
  params.set(key, value);
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

exports.sanitizePriority = level => {
  level = parseInt(level);
  if (level) {
    if (level > 9) return 9;
    else if (level < 1) return 1;
    else return level;
  } else {
    return 1;
  }
};

exports.validateUrlJob = (jobType, jobList) => {
  for (let i = 0; i < jobList.length; i++) {
    const jobData = jobList[i];
    if (jobType === jobData.value) return true;
  }
  return false;
};

exports.extractJobParams = urlParams => {
  const IGNORE_QUERY_PARAMS = [
    "query",
    "job_type",
    "queue",
    "priority",
    "total"
  ];
  const params = {};
  urlParams.forEach((value, key) => {
    let isParam = !IGNORE_QUERY_PARAMS.includes(key);
    if (isParam) params[key] = value;
  });
  return params;
};

exports.clearUrlJobParams = () => {
  const IGNORE_QUERY_PARAMS = [
    "query",
    "job_type",
    "queue",
    "priority",
    "total"
  ];
  const params = new URLSearchParams(location.search);
  const toDelete = [];
  for (let pair of params.entries()) {
    const key = pair[0];
    if (!IGNORE_QUERY_PARAMS.includes(key)) toDelete.push(key);
  }
  toDelete.forEach(p => params.delete(p));
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

exports.editUrlJobParam = (key, value) => {
  const params = new URLSearchParams(location.search);
  params.set(key, value);
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

exports.validateUrlQueryParam = query => {
  const params = new URLSearchParams(location.search);
  let urlQueryParam;
  try {
    let parsedQuery = JSON.parse(query);
    urlQueryParam = JSON.stringify(parsedQuery);
  } catch (err) {
    urlQueryParam = JSON.stringify({ match_all: {} });
  }
  params.set("query", urlQueryParam);
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

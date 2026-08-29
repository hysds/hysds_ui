exports.makeDropdownOptions = (data) =>
  data.map((job) => ({
    label: job.version ? `${job.label} [${job.version}]` : job.label,
    value: job.job_spec,
    jobSpec: job.job_spec,
    hysdsio: job.hysds_io,
  }));

exports.constructUrl = (key, value) => {
  const params = new URLSearchParams(location.search);
  if (value) params.set(key, value);
  else params.delete(key);
  const newUrl = `${location.origin}${location.pathname}?${params.toString()}`;
  history.pushState({}, "", newUrl);
};

exports.sanitizePriority = (level) => {
  level = parseInt(level);
  if (level) {
    if (level > 9) return 9;
    else if (level < 0) return 0;
    else return level;
  } else {
    return 0;
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

exports.buildParams = (paramsList, inputParams) => {
  /**
   * @paramsList {Array} array of job parameters from hysds-ios
   * @params {Object} JSON object of parameters
   * @return {Object}
   */
  let jobParams = {};
  for (let i = 0; i < paramsList.length; i++) {
    let p = paramsList[i];
    let { name, type, optional } = p;
    let inputValue = inputParams[name];

    if (inputValue === "" || inputValue === undefined || inputValue === null) {
      if (optional === true) continue;
      else {
        throw `param: ${name} is required`;
      }
    }

    switch (type) {
      case "number": {
        const val =
          typeof inputValue === "number" ? inputValue.toString() : inputValue;
        jobParams[name] = val;
        break;
      }
      case "object": {
        if (typeof inputValue === "string")
          try {
            let val = JSON.parse(inputValue);
            jobParams[name] = val;
          } catch (err) {
            throw `param ${name}: ${err}`;
          }
        else jobParams[name] = inputValue;
        break;
      }
      case "boolean": {
        if (typeof inputValue === "boolean") {
          let val = inputValue === true ? "true" : "false";
          jobParams[name] = val;
        } else {
          jobParams[name] = inputValue;
        }
        break;
      }
      default: {
        jobParams[name] = inputValue;
      }
    }
  }
  return jobParams;
};

exports.validateSubmission = (props) => {
  let { tags, jobSpec, queue, priority } = props;
  if (!tags || !jobSpec || priority === "" || priority === undefined || !queue)
    return false;
  return true;
};

exports.validateUserRule = (props) => {
  let { validQuery, jobSpec, ruleName, queue, priority } = props;
  if (
    !validQuery ||
    !ruleName ||
    !jobSpec ||
    priority === "" ||
    priority === undefined ||
    !queue
  )
    return false;
  return true;
};

/**
 *
 * @param {String} body - the _msearch query body
 * @param {Stirng} componentId - corresponding component-id for the reactivesearch component
 * @returns {String} - the corresponding ES query for the displayed results
 */
exports.parseFacetQuery = (body, componentId) => {
  const splitBody = body.split("\n");
  const idx = splitBody.findIndex(
    (d) => d === `{"preference":"${componentId}"}`
  );
  if (idx === -1) return null;
  let query = splitBody[idx + 1];
  query = JSON.parse(query);

  // main query ran to get the data
  return JSON.stringify(query.query);
};

/**
 * Render a UI-generated timestamp in UTC, labelled.
 *
 * Every timestamp that comes from Elasticsearch is displayed raw, and those are UTC
 * (`2026-08-29T12:01:17.133420Z`). Times the UI produces itself must therefore be UTC too,
 * otherwise a "last updated" line sits next to a job's queued/started times in a different
 * zone and you cannot read an elapsed time off the screen without converting (HC-551).
 *
 * @param {number|Date} t epoch milliseconds, or a Date
 * @param {boolean} timeOnly omit the date portion
 */
exports.formatUtc = (t, timeOnly = false) => {
  if (t === null || t === undefined) return null;
  const iso = new Date(t).toISOString(); // YYYY-MM-DDTHH:MM:SS.sssZ
  const time = `${iso.slice(11, 19)} UTC`;
  return timeOnly ? time : `${iso.slice(0, 10)} ${time}`;
};

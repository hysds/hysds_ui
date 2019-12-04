exports.constructUrl = searchParams => {
  return `${location.origin}${location.pathname}?${searchParams.toString()}`;
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

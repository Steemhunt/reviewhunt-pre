function prependZero(num) {
  if (num < 10) {
    return `0${num}`;
  }

  return `${num}`;
}

function timeUntil(toDateString) {
  const now = new Date();
  const toDate = new Date(toDateString);
  const secondsTillMidnight = Math.floor((toDate.getTime() - now.getTime()) / 1000);

  if (secondsTillMidnight < 0) {
    return `LIVE NOW`;
  }

  const hours   = Math.floor(secondsTillMidnight / 3600);
  const minutes = Math.floor((secondsTillMidnight - (hours * 3600)) / 60);
  const seconds = Math.floor(secondsTillMidnight - (hours * 3600) - (minutes * 60));

  return `${prependZero(hours)}:${prependZero(minutes)}:${prependZero(seconds)}`;
}
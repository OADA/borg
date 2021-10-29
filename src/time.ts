import moment from 'moment';
import { toUnixMS } from 'gps-time';

import config from './config.js';

const years = config.get('input.years');

/**
 * Look for group of 4 digits to mean a year?
 */
const yearRegex = /(?<!\d)\d\d\d\d(?!\d)/;

/**
 * Guess the year corresponding to a dataset
 *
 * @param filename Name of the file
 * @param topcomment Top comment text from the file
 */
export function guessYear({
  filename,
  topcomment,
}: {
  filename: string;
  topcomment?: string;
}): number | undefined {
  // Look for year in filename
  const fileyear = +(yearRegex.exec(filename)?.[0] ?? NaN);
  if (fileyear >= years.min && fileyear <= years.max) {
    return fileyear;
  }
  if (topcomment) {
    // Look for year in top comment
    const commentyear = +(yearRegex.exec(topcomment)?.[0] ?? NaN);
    if (commentyear >= years.min && commentyear <= years.max) {
      return commentyear;
    }
  }
  return undefined;
}

export type Timeish = string | number | Date;

/**
 * Get function to normalize times to Unix time in seconds
 *
 * @param time Sample time to normalize
 * @param year Year the time is from (if known)
 */
export function timeNormalizer<Time extends Timeish>(
  time: Time,
  year?: number
): (time: Time) => number {
  function isYear(val: unknown): val is number {
    if (year) {
      return year === val;
    }
    if (typeof val === 'number' && val >= years.min && val <= years.max) {
      return true;
    }
    return false;
  }

  try {
    const m = moment(time);
    if (isYear(m.year())) {
      // Moment seems to have figured it out
      return (time) => +moment(time);
    }
  } catch {}

  // Coerce time to a number
  const t = +time;
  try {
    const mp = moment(t);
    if (isYear(mp.year())) {
      // Moment seems to have figured it out as number
      return (time) => +moment(+time);
    }
  } catch {}
  if (!isNaN(t)) {
    try {
      const ms = moment(t * 1000);
      if (isYear(ms.year())) {
        // Times are in unix seconds
        return (time) => +moment(+time * 1000);
      }
    } catch {}

    try {
      const mgps = moment(toUnixMS(t));
      if (isYear(mgps.year())) {
        // Times are in gps ms
        return (time) => +moment(toUnixMS(+time));
      }
    } catch {}

    try {
      const mgpss = moment(toUnixMS(t * 1000));
      if (isYear(mgpss.year())) {
        // Times are in gps seconds?
        return (time) => +moment(toUnixMS(+time * 1000));
      }
    } catch {}
  }
  throw new Error(`Could not normalize time ${time}`);
}

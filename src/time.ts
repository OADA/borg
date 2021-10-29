/**
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import moment from 'moment';
import { toUnixMS } from 'gps-time';

import config from './config.js';

const years = config.get('input.years');

/**
 * Look for group of 4 digits to mean a year?
 */
const yearRegex = /(?<!\d)\d{4}(?!\d)/;

/**
 * Guess the year corresponding to a dataset
 *
 * @param filename.filename
 * @param filename Name of the file
 * @param topcomment Top comment text from the file
 * @param filename.topcomment
 */
export function guessYear({
  filename,
  topcomment,
}: {
  filename: string;
  topcomment?: string;
}): number | undefined {
  // Look for year in filename
  const fileyear = Number(yearRegex.exec(filename)?.[0] ?? Number.NaN);
  if (fileyear >= years.min && fileyear <= years.max) {
    return fileyear;
  }

  if (topcomment) {
    // Look for year in top comment
    const commentyear = Number(yearRegex.exec(topcomment)?.[0] ?? Number.NaN);
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
  /**
   * @param value
   */
  function isYear(value: unknown): value is number {
    if (year) {
      return year === value;
    }

    if (typeof value === 'number' && value >= years.min && value <= years.max) {
      return true;
    }

    return false;
  }

  try {
    const m = moment(time);
    if (isYear(m.year())) {
      // Moment seems to have figured it out
      return (t) => Number(moment(t));
    }
  } catch {}

  // Coerce time to a number
  const timeNumber = Number(time);
  try {
    const mp = moment(timeNumber);
    if (isYear(mp.year())) {
      // Moment seems to have figured it out as number
      return (t) => Number(moment(Number(t)));
    }
  } catch {}

  if (!Number.isNaN(timeNumber)) {
    try {
      const ms = moment(timeNumber * 1000);
      if (isYear(ms.year())) {
        // Times are in unix seconds
        return (t) => Number(moment(Number(t) * 1000));
      }
    } catch {}

    try {
      const mgps = moment(toUnixMS(timeNumber));
      if (isYear(mgps.year())) {
        // Times are in gps ms
        return (t) => Number(moment(toUnixMS(Number(t))));
      }
    } catch {}

    try {
      const mgpss = moment(toUnixMS(timeNumber * 1000));
      if (isYear(mgpss.year())) {
        // Times are in gps seconds?
        return (t) => Number(moment(toUnixMS(Number(t) * 1000)));
      }
    } catch {}
  }

  throw new Error(`Could not normalize time ${time}`);
}

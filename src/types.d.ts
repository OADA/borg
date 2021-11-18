/**
 * @license
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

declare module 'guess-file-type' {
  export type MimeType = `${string}/${string}`;

  /**
   * Automatically guess the file type
   */
  function guess(filename: string): Promise<MimeType>;
  /**
   * Guess file type using the file signature (magic numbers)
   */
  function guessByFileSignature(filename: string): Promise<MimeType>;
  /**
   * Guess file type using the file extension
   */
  function guessByExtension(filename: string): Promise<MimeType>;

  /**
   * Get the file extension from a mime type
   */
  function guessByExtension(type: MimeType): string;
}

declare module 'gps-time' {
  /**
   * Convert from Unix time to GPS time
   */
  function toGPSMS(unixMS: number): number;
  /**
   * Convert from GPS time to Unix time
   */
  function toUnixMS(gpsMS: number): number;
}

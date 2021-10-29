/**
 * Copyright (c) 2021 Open Ag Data Alliance
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

export interface FileInfo {
  filename: string;
}

/**
 * Representation of an input file?
 */
export default abstract class File<
  Info extends FileInfo = FileInfo,
  Datum = unknown
> {
  /**
   * Get info about the file as a whole (e.g., csv header row, filename)
   */
  abstract info(): Promise<Info>;
  /**
   * Get the data points of the file (e.g., rows of a csv file)
   */
  abstract data(): AsyncIterable<Datum>;
  /**
   * Get files within the file (e.g., for a zip archive)
   */
  abstract files(): AsyncIterable<string>;
}

import { File, Paths } from "expo-file-system";

// Small JSON documents kept on the device: the last habit list, habit details
// and check-ins waiting to sync. Reads are synchronous so the first render
// can show cached data. Web uses localStorage (local-store.web.ts).

const fileFor = (key: string) => new File(Paths.document, `${key}.json`);

export const readJSON = <T>(key: string): T | null => {
  try {
    const file = fileFor(key);
    return file.exists ? (JSON.parse(file.textSync()) as T) : null;
  } catch {
    return null;
  }
};

export const writeJSON = (key: string, value: unknown) => {
  try {
    fileFor(key).writeSync(JSON.stringify(value));
  } catch {
    // A cache write failing only costs a slower next launch.
  }
};

export const removeJSON = (key: string) => {
  try {
    const file = fileFor(key);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Nothing to remove.
  }
};

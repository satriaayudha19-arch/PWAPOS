/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// --- Web NFC API type declarations (Chrome Android) ---
interface NDEFMessage {
  records: readonly NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: DataView;
  encoding?: string;
  lang?: string;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

interface NDEFScanOptions {
  signal?: AbortSignal;
}

declare class NDEFReader extends EventTarget {
  constructor();
  scan(options?: NDEFScanOptions): Promise<void>;
  write(message: unknown, options?: unknown): Promise<void>;
  onreading: ((this: NDEFReader, event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((this: NDEFReader, event: Event) => void) | null;
  addEventListener(
    type: 'reading',
    listener: (event: NDEFReadingEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: 'readingerror',
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface Window {
  NDEFReader?: typeof NDEFReader;
}

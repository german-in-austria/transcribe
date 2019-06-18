
declare interface process {
  env : {
    [key: string]: string
  }
}

type RequestIdleCallbackHandle = any
type RequestIdleCallbackOptions = {
  timeout: number;
}
type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean
  timeRemaining: (() => number)
}

interface Window {
  requestIdleCallback: ((
    callback: ((deadline: RequestIdleCallbackDeadline) => void),
    opts?: RequestIdleCallbackOptions,
  ) => RequestIdleCallbackHandle);
  cancelIdleCallback: ((handle: RequestIdleCallbackHandle) => void);
}

declare module "*.wasm" {
  const value: ArrayBuffer
  export default value;
}

declare module "file-loader?name=[name].js!*" {
  const value: string;
  export = value;
}
declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker
}

declare module 'vue-input-autowidth'
declare module 'vue-scrollto' {
  const x: any
  export default x
}

declare module 'vue-virtual-scroller' {
  export const RecycleScroller: any
}

declare module 'tiny-csv' {
  const csv: (data: string, delimiter?: string) => {[key: string]: string}[]
  export default csv
}

declare module 'human-size'
declare module 'vue-full-screen-file-drop'
declare module 'promise-worker-transferable'
declare module '@rgrove/parse-xml'
declare module 'audiobuffer-slice'
declare module 'simple-promise-queue'
declare module 'vue-scroll'
declare module 'array-buffer-concat'
declare module 'audiobuffer-to-wav'
declare module 'vue-color'
declare module 'list-diff2'

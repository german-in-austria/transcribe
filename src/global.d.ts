
declare interface process {
  env : {
    [key: string]: string
  }
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

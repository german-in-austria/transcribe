declare interface process {
  env : {
    [key: string]: string
  }
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
declare module 'peaks.js'
declare module 'draw-wave'
declare module '@rgrove/parse-xml'
declare module 'audiobuffer-slice'
declare module 'simple-promise-queue'
declare module 'vue-scroll'
declare module 'array-buffer-concat'

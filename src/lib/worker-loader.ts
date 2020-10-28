import * as PromiseWorkerTransferable from 'promise-worker-transferable'

export default class MultiWorker {
  workers: any[] = []
  scheduledWorker = -1
  defaultWorkers = 1
  constructor(w: any) {
    this.defaultWorkers = navigator.hardwareConcurrency
    for (let i = 0; i < this.defaultWorkers; i++) {
      this.workers.push(new PromiseWorkerTransferable(w))
    }
    console.log(this.workers)
  }

  async run(msg: any, transferable: any[]) {
    if (this.scheduledWorker < this.workers.length + 1) {
      this.scheduledWorker = this.scheduledWorker + 1
    } else {
      this.scheduledWorker = 0
    }
    console.log(this.scheduledWorker)
    return await this.workers[this.scheduledWorker].postMessage(msg, transferable)
  }
}

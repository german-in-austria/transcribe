import { playBuffer, sumChannels } from "../audio"
import trackedDownload from './utils/downloadModel'
import SoxrResampler, {SoxrResamplerTransform, SoxrDatatype} from 'wasm-audio-resampler'
import AsrHandler from './workerWrappers/asrHandler'
import ResamplerHandler from './workerWrappers/resamplerHandler'

const models: {[url: string]: ArrayBuffer} = {}

const asrHandler = new AsrHandler()
const resampleHandler = new ResamplerHandler()
type KaldiServiceStatus = 'DOWNLOADING_MODEL'|'INITIALIZING_MODEL'

export default {
  async transcribeAudio(modelUrl: string, buffer: AudioBuffer, cb: (status: KaldiServiceStatus) => any): Promise<string> {
    if (models[modelUrl] === undefined) {
      console.log('downloading model…')
      models[modelUrl] = await trackedDownload(modelUrl, console.log)
      console.log('downloaded.')
      console.log('initializing model…', modelUrl)
      await asrHandler.init('german', models[modelUrl])
      console.log('initialized.')
    }
    const targetSampleRate = await asrHandler.getSampleRate()
    const sampleRate = buffer.sampleRate
    console.log({ targetSampleRate, sampleRate })
    // convert the PCM format from Float 32 to Int 16
    const audioData = sumChannels(buffer.getChannelData(0), buffer.getChannelData(1))
    const y = await resampleHandler.resample(audioData)
    const x = await asrHandler.process(y)
    await asrHandler.reset()
    return x.text
    // asrHandler.
    // const resampledAudio = resampleAudio(audioData, 4096)
  }
}

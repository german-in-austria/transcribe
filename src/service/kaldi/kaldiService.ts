
import TranscriptAudio from '../transcript-audio.class'
import trackedDownload from './utils/downloadModel.js'
import AsrHandler from './workerWrappers/asrHandler.js'
import ResamplerHandler from './workerWrappers/resamplerHandler.js'

const models: {[url: string]: ArrayBuffer} = {}

const asrHandler = new AsrHandler()
const resampleHandler = new ResamplerHandler()
type KaldiServiceStatus = 'DOWNLOADING_MODEL'|'INITIALIZING_MODEL'|'PROCESSING_AUDIO'|'DONE'

export default {
  async transcribeAudio(modelUrl: string, buffer: AudioBuffer, onUpdate: (status: KaldiServiceStatus, payload?: number) => any): Promise<string> {
    if (models[modelUrl] === undefined) {
      onUpdate('DOWNLOADING_MODEL')
      models[modelUrl] = await trackedDownload(modelUrl, console.log)
      onUpdate('INITIALIZING_MODEL')
      await asrHandler.init('german', models[modelUrl])
    }
    onUpdate('PROCESSING_AUDIO')
    const targetSampleRate = await asrHandler.getSampleRate()
    const sampleRate = buffer.sampleRate
    console.log({ targetSampleRate, sampleRate })
    // convert the PCM format from Stereo Float 32 to Mono Int 16
    const audioData = TranscriptAudio.sumChannels(buffer.getChannelData(0), buffer.getChannelData(1))
    const y = await resampleHandler.resample(audioData)
    await asrHandler.process(y)
    const x = await asrHandler.reset()
    onUpdate('DONE')
    console.log('x.text', x.text)
    return x.text
    // asrHandler.
    // const resampledAudio = resampleAudio(audioData, 4096)
  }
}

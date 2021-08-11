<template>
  <drop-file @update="onSelectAudioFile">
    <div v-if="loadingFFMpeg">
      <div v-if="duration === 0 && time === 0">
        <div class="caption text-xs-center">Loading Transcoder…</div>
        <v-progress-linear class="loader" indeterminate />
      </div>
      <div v-else>
        <div class="caption text-xs-center">Converting File to OGG/Vorbis …</div>
        <v-progress-linear class="loader" :value="time / duration * 100" />
        <div class="caption text-xs-center">{{ toTime((duration - time) / speed) }} left <span class="grey--text">(&times;{{ speed }})</span></div>
      </div>
    </div>
  </drop-file>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import DropFile from './DropFile.vue'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import store from '@/store'
import { timeToSeconds, timeFromSeconds } from '@/util'
import TranscriptAudio from '@/classes/transcript-audio.class'

@Component({
  components: {
    DropFile
  }
})
export default class DropAudioFile extends Vue {
  @Prop({ default: 'ogg' }) format!: string

  duration = 0
  time = 0
  speed = 0
  loadingFFMpeg = false
  toTime = timeFromSeconds
  transcript = store.transcript!

  processLog(arg: { message: string, type: string }) {
    const durationLog = /(?:Duration: )([0-9|:|.]+)(,)/.exec(arg.message)
    const timeLog = /(?:time=)([0-9|:|.]+)(\s)/.exec(arg.message)
    const speedLog = /(?:speed=)([0-9|.]+)(x)/.exec(arg.message)
    if (durationLog !== null) {
      this.duration = timeToSeconds(durationLog[1])
    }
    if (timeLog !== null) {
      this.time = timeToSeconds(timeLog[1])
    }
    if (speedLog !== null) {
      this.speed = parseFloat(speedLog[1])
    }
    if (arg.message === 'FFMPEG_END') {
      // loadAudioFromFile(data)
    }
    console.log(arg.type, arg.message)
  }

  async onSelectAudioFile(f: File) {
    console.log({ f })
    if (f.type === 'audio/ogg') {
      this.transcript.audio = new TranscriptAudio(f)
    } else {
      const ffmpeg = createFFmpeg({ logger: this.processLog, corePath: 'ffmpeg/ffmpeg-core.js' })
      const { name } = f
      this.loadingFFMpeg = true
      await ffmpeg.load()
      ffmpeg.FS('writeFile', name, await fetchFile(f))
      await ffmpeg.run('-i', name, 'output.ogg')
      const data = ffmpeg.FS('readFile', 'output.ogg') as Uint8Array
      this.transcript.audio = new TranscriptAudio(data)
    }
  }
}
</script>
<style lang="stylus" scoped>
.loader{
  width 400px
  border-radius: 7px
}
</style>

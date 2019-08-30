import Vue from 'vue'

import { LocalTranscriptEvent } from '../store/transcript'
import { requestFrameAsync } from '../util'

export async function getScrollLeftAudio(): Promise<number> {
  await requestFrameAsync()
  const e = document.querySelector('.wave-form')
  if (e instanceof HTMLElement) {
    return e.scrollLeft
  } else {
    throw new Error('can’t find element with class "wave-form"')
  }
}

export async function focusSelectedEventElement(e: LocalTranscriptEvent) {
  await Vue.nextTick()
  setTimeout(() => {
    const el = (
      // either the previously selected one, or the first.
      document.querySelector('.segment.selected') ||
      document.querySelector('.segment')
    )
    if (el instanceof HTMLElement) {
      el.focus()
    }
  }, 0)
}

export async function isWaveformEventVisible(e: LocalTranscriptEvent): Promise<boolean> {
  await Vue.nextTick()
  await requestFrameAsync()
  const el = document.querySelector(`.segment-box-container .segment[data-event-id="${e.eventId}"]`)
  if (el instanceof HTMLElement) {
    console.log({el})
    const b = el.getBoundingClientRect()
    return b.left > 0 && b.left + b.width <= window.innerWidth
  } else {
    return false
  }
}

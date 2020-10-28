# Transcribe

A browser based audio transcription tool.

## Goals

- frictionless and ergonomic transcription workflow with lots of discoverable keyboard shortcuts.
- smooth, native-class user experience
- independence from back end, can be used stand-alone.
- no native modules, everything must work in-browser.
- included phonetic analysis tools.
- compatibility with [exmaralda](https://exmaralda.org/) file formats.

## Setup

clone the repo and run
`npm i && npm run dev`

or

`npm i && npm run build && npm run start`

or

`docker build -t transcribe . && docker run transcribe -p 8080:80`

If you want to connect to a remote backend 

## Spin-Offs (Work-In-Progress)

### JavaScript Ogg Bitstream Parser

Parses Ogg Headers and Ogg Pages in JS. Useful for working with large OGG files that are impractical to decode all at once. More Info here: <https://www.xiph.org/ogg/doc/framing.html>

### AudioBuffer to SVG Waveform conversion library

A fast and flexible waveform renderer.

### Threaded Spectrogram Renderer

A spectrogram renderer for js, conveniently wrapped in a WebWorker.

### V-Contenteditable

A ready-made `<v-contenteditable>` Vue component, that works just like regular `contenteditable` elements, but remembers the caret position between updates

### V-Phonetic

A Vue component that helps type IPA Symbols (International Phonetic Alphabet). Supports `<textarea>`, `<input>` and `contenteditable` elements.

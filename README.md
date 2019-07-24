# Transcribe

A browser based audio transcription tool.

## Goals

- frictionless and ergonomic transcription workflow
- smooth, native-class user experience
- independence from back end, can be used stand-alone.
- no native modules, everything must work in-browser.
- basic phonetic analysis tools.
- compatibility with [exmaralda](https://exmaralda.org/) file formats.

## Setup

clone the repo and run
`npm i && npm run dev`

or

`npm i && npm run build && npm run start`

or

`docker build -t transcribe . && docker run transcribe -p 8080:80`

## Spin-Offs (planned)

### JavaScript Ogg Bitstream Parser

Parses Ogg Headers and Ogg Pages in JS. Useful for working with large OGG files that are impractical to decode all at once. More Info here: <https://www.xiph.org/ogg/doc/framing.html>

### AudioBuffer to SVG Waveform conversion library

A fast and flexible waveform renderer.

### Threaded Spectrogram Renderer

A spectrogram renderer for js, conveniently wrapped in a WebWorker.

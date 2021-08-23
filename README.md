# Transcribe

A browser based audio transcription tool.

## Goals

- frictionless and ergonomic transcription workflow with lots of discoverable keyboard shortcuts.
- smooth, native-class user experience
- independence from back end, can be used stand-alone.
- no native modules, everything must work in-browser.
- included phonetic analysis tools.
- compatibility with [exmaralda](https://exmaralda.org/) file formats.

## Limitations

- Transcribe will (for the forseeable future) only work in evergreen, Chromium-based browsers. This is because it uses APIs currently only provided by those, like the File System Access API.

## Setup

clone the repo and run
`npm i && npm run dev`

or

`npm i && npm run build && npm run start`

or

`docker build -t transcribe . && docker run transcribe -p 8080:80`

## Development

- The `dev` command starts a HTTPS server with a self-signed certificate. That means you must instruct your browser to accept that certificate. In Chrome 92, this can be done by typing `thisisunsafe`, when the browser displays the warning.

- The main application state is primarily stored and manipulated in class instances, such as `transcript.class.ts` and `transcript-audio.class.ts`. Most methods are static, and implemented as quasi-reducers.

- The application includes a small static web server, which serves double-duty as a WebSocket-based event bus for distributing transactions. This is used to enable real time synching between the clients.

- For Visual Studio Code, the [Vetur plugin](https://github.com/vuejs/vetur) is highly recommended.

- The the code base does not have many automatic (unit) tests, but heavily emphasizes type safety and static integrity. Running `npm run vue-type-check` periodically, to check templates for type errors is recommended. However it is probably not reliable enough to integrate in the CI/CD pipeline.

## Testing

- The app only includes e2e tests. They can be run in headless mode with `npm run test` and in interactive mode with `npm run test:interactive`

## Spin-Offs (Work-In-Progress)

### JavaScript Ogg Bitstream Parser

Parses Ogg Headers and Ogg Pages in JS. Useful for working with large OGG files that are impractical to decode all at once. More Info here: <https://www.xiph.org/ogg/doc/framing.html>.

### AudioBuffer to SVG Waveform conversion library

A fast and flexible waveform renderer.

### Threaded Spectrogram Renderer

A spectrogram renderer for js, conveniently wrapped in a WebWorker.

### V-Contenteditable

A ready-made `<v-contenteditable>` Vue component, that works just like regular `contenteditable` elements, but remembers the caret position between updates

### V-Phonetic

A Vue component that helps type IPA Symbols (International Phonetic Alphabet). Supports `<textarea>`, `<input>` and `contenteditable` elements.

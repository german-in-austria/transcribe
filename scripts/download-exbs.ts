
declare var require: any

const { createClient } = require("webdav")
const fs = require('fs')
const credentials = require('./credentials')

const client = createClient(
    "https://dioecloud.trans.univie.ac.at/remote.php/webdav/",
    {
        username: credentials.usernameDioeCloud,
        password: credentials.passwordDioeCloud
    }
)

interface WebDavFile {
  filename: string
  basename: string
  lastmod: string
  size: number
  type: 'file'|'directory'

}

async function getFilesRecursive(path: string, test: (f: WebDavFile) => boolean, prev: any[] = []): Promise<WebDavFile[]> {
  const files = await client.getDirectoryContents(path) as WebDavFile[]
  for (const f of files) {
    if (f.type === 'directory') {
      // console.log(f)
      await getFilesRecursive(f.filename, test, prev)
    } else {
      if (test(f) === true) {
        prev.push(f)
        client.getFileContents(f.filename, { format: 'text' }).then((cs: string) => {
          fs.writeFileSync('../data/exbs/' + f.basename, cs)
        })
        console.log(prev.length)
      }
    }
  }
  return prev
}

(async () => {
  // Get directory contents
  const transcripts = await getFilesRecursive('/03_Daten', (f: WebDavFile) => {
    return f.filename.endsWith('.exb') &&
      !f.filename.includes('/alt/')
      // && !f.filename.includes('Vers')
      // && !f.filename.includes('_alt_')
  })
  console.log(transcripts)
  const csv =  'File Name;\n' + transcripts.reduce((m, e, i, l) => {
    m = m + e.basename + '\n';
    return m
  }, '')

  fs.writeFileSync('../data/exbs.csv', csv)

  // Outputs a structure like:
  // [{
  //     filename: "/my-file.txt",
  //     basename: "my-file.txt",
  //     lastmod: "Mon, 10 Oct 2018 23:24:11 GMT",
  //     size: 371,
  //     type: "file"
  // }]
})()

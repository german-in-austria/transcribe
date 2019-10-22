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

interface webdavFile {
  filename: string
  basename: string
  lastmod: string
  size: number
  type: 'file'|'directory'

}

async function getFilesRecursive(path: string, test: (f: webdavFile) => boolean, prev: any[] = []): Promise<webdavFile[]> {
  const files = await client.getDirectoryContents(path) as webdavFile[]
  for (let f of files) {
    if (f.type === 'directory') {
      // console.log(f)
      await getFilesRecursive(f.filename, test, prev)
    } else {
      if (test(f) === true) {
        prev.push(f)
        client.getFileContents(f.filename, { format: 'text' }).then((cs: string) => {
          fs.writeFileSync('./data/exbs/' + f.basename, cs)
        })
        console.log(prev.length)
      }
    }
  }
  return prev
}
 
(async () => {
  // Get directory contents
  const transcripts = await getFilesRecursive('/03_Daten', (f: webdavFile) => {
    return f.filename.endsWith('.exb') &&
      !f.filename.includes('/alt/') 
      // && !f.filename.includes('Vers')
      // && !f.filename.includes('_alt_')
  })
  console.log(transcripts)
  // Outputs a structure like:
  // [{
  //     filename: "/my-file.txt",
  //     basename: "my-file.txt",
  //     lastmod: "Mon, 10 Oct 2018 23:24:11 GMT",
  //     size: 371,
  //     type: "file"
  // }]
})()

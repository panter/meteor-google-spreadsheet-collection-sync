import { google } from 'googleapis'
import { createAuth } from 'meteor/panter:google-api-auth'

export default async ({ spreadsheetId, webhook }) => {
  const auth = createAuth(['https://www.googleapis.com/auth/script.projects'])
  const scripts = google.script({ version: 'v1', auth })
  try {
    const result = await scripts.projects.create({
      requestBody: {
        title: 'Sync Spreadsheet',
        parentId: spreadsheetId,
      },
    })
    console.log('scriptId', result.data.scriptId)
    scripts.projects.updateContent({
      scriptId: result.data.scriptId,
      auth,
      resource: {
        files: [
          {
            name: 'hello',
            type: 'SERVER_JS',
            source: `function helloWorld() {\n  console.log("Hello, ${webhook}!");\n}`,
          },
        ],
      },
    })
  } catch (e) {
    console.log(e)
  }
}

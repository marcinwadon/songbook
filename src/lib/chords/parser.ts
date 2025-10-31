import ChordSheetJS from 'chordsheetjs'

export function parseChordPro(content: string) {
  const parser = new ChordSheetJS.ChordProParser()
  const song = parser.parse(content)
  return song
}

export function formatSongAsHtml(content: string) {
  const parser = new ChordSheetJS.ChordProParser()
  const song = parser.parse(content)
  const formatter = new ChordSheetJS.HtmlDivFormatter()
  const html = formatter.format(song)
  return html
}

export function formatSongAsText(content: string) {
  const parser = new ChordSheetJS.ChordProParser()
  const song = parser.parse(content)
  const formatter = new ChordSheetJS.TextFormatter()
  const text = formatter.format(song)
  return text
}
import { Note, Interval, transpose as tonalTranspose } from 'tonal'
import ChordSheetJS from 'chordsheetjs'

export function transposeChordPro(content: string, semitones: number): string {
  const parser = new ChordSheetJS.ChordProParser()
  const song = parser.parse(content)

  // Transpose the song
  const transposedSong = song.transpose(semitones)

  // Format back to ChordPro
  const formatter = new ChordSheetJS.ChordProFormatter()
  return formatter.format(transposedSong)
}

export function getTransposeInterval(fromKey: string, toKey: string): number {
  const interval = Interval.distance(fromKey, toKey)
  return Interval.semitones(interval) || 0
}

export function transposeChord(chord: string, semitones: number): string {
  try {
    const result = tonalTranspose(chord, Interval.fromSemitones(semitones))
    return result || chord
  } catch {
    return chord
  }
}

export const KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
]

export function detectKey(content: string): string | null {
  const parser = new ChordSheetJS.ChordProParser()
  const song = parser.parse(content)
  const key = song.metadata.key
  return key || null
}
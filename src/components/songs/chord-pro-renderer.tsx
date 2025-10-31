'use client'

import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'

interface ChordProRendererProps {
  content: string
  transpose?: number
  className?: string
}

export function ChordProRenderer({ content, transpose = 0, className = '' }: ChordProRendererProps) {
  const formattedContent = useMemo(() => {
    const parser = new ChordSheetJS.ChordProParser()
    let song = parser.parse(content)

    // Apply transposition if needed
    if (transpose !== 0) {
      song = song.transpose(transpose)
    }

    // Use HtmlTableFormatter for better chord positioning
    const formatter = new ChordSheetJS.HtmlTableFormatter({
      // This ensures chords appear above lyrics
      renderBlankLines: false
    })

    return formatter.format(song)
  }, [content, transpose])

  return (
    <div className={`chord-pro-output ${className}`}>
      <div
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  )
}
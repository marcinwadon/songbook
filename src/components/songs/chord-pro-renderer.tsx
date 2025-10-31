'use client'

import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'

interface ChordProRendererProps {
  content: string
  transpose?: number
  className?: string
}

export function ChordProRenderer({ content, transpose = 0, className = '' }: ChordProRendererProps) {
  const { formattedContent, error } = useMemo(() => {
    try {
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

      return { formattedContent: formatter.format(song), error: null }
    } catch (err) {
      return { formattedContent: null, error: err instanceof Error ? err.message : 'Błąd parsowania' }
    }
  }, [content, transpose])

  if (error) {
    return (
      <div className={`chord-pro-output ${className}`}>
        <div className="text-muted-foreground text-sm">
          <p className="font-semibold mb-1">Podgląd niedostępny</p>
          <p className="text-xs">Trwa edycja... Podgląd zostanie zaktualizowany po poprawieniu składni ChordPro.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`chord-pro-output ${className}`}>
      <div
        dangerouslySetInnerHTML={{ __html: formattedContent || '' }}
      />
    </div>
  )
}
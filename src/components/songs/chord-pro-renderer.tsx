'use client'

import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'

export type ChordDisplay = 'above' | 'right' | 'hidden'

interface ChordProRendererProps {
  content: string
  transpose?: number
  chordDisplay?: ChordDisplay
  className?: string
}

export function ChordProRenderer({
  content,
  transpose = 0,
  chordDisplay = 'above',
  className = ''
}: ChordProRendererProps) {
  const { formattedContent, error } = useMemo(() => {
    try {
      const parser = new ChordSheetJS.ChordProParser()
      let song = parser.parse(content)

      // Apply transposition if needed
      if (transpose !== 0) {
        song = song.transpose(transpose)
      }

      let html = ''

      if (chordDisplay === 'above') {
        // Use HtmlTableFormatter for chords above lyrics
        const formatter = new ChordSheetJS.HtmlTableFormatter({
          renderBlankLines: false
        })
        html = formatter.format(song)
      } else if (chordDisplay === 'right' || chordDisplay === 'hidden') {
        // Custom rendering for chords on right or hidden
        html = renderCustomFormat(song, chordDisplay)
      }

      return { formattedContent: html, error: null }
    } catch (err) {
      return { formattedContent: null, error: err instanceof Error ? err.message : 'Błąd parsowania' }
    }
  }, [content, transpose, chordDisplay])

  if (error) {
    return (
      <div className={`chord-pro-output chords-${chordDisplay} ${className}`}>
        <div className="text-muted-foreground text-sm">
          <p className="font-semibold mb-1">Podgląd niedostępny</p>
          <p className="text-xs">Trwa edycja... Podgląd zostanie zaktualizowany po poprawieniu składni ChordPro.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`chord-pro-output chords-${chordDisplay} ${className}`}>
      <div
        dangerouslySetInnerHTML={{ __html: formattedContent || '' }}
      />
    </div>
  )
}

function renderCustomFormat(song: any, mode: 'right' | 'hidden'): string {
  let html = ''

  for (const line of song.lines) {
    if (line.type === 'comment') {
      html += `<div class="comment">${escapeHtml(line.comment || '')}</div>`
      continue
    }

    if (!line.items || line.items.length === 0) {
      html += '<div class="line"><div class="lyrics"> </div></div>'
      continue
    }

    // Extract chords and lyrics
    let lyrics = ''
    let chords: string[] = []

    for (const item of line.items) {
      if (item.chords) {
        chords.push(item.chords)
      }
      if (item.lyrics !== undefined && item.lyrics !== null) {
        lyrics += item.lyrics
      }
    }

    const chordsText = chords.join(' ')
    const displayLyrics = lyrics.trim() === '' ? ' ' : escapeHtml(lyrics)

    if (mode === 'right') {
      html += `<div class="line">
        <div class="lyrics">${displayLyrics}</div>
        ${chordsText ? `<div class="chords">${escapeHtml(chordsText)}</div>` : ''}
      </div>`
    } else {
      // hidden mode - only show lyrics
      html += `<div class="line"><div class="lyrics">${displayLyrics}</div></div>`
    }
  }

  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
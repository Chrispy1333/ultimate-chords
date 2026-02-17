import { useState, useMemo } from 'react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getNoteIndex(note: string) {
    let index = NOTES.indexOf(note);
    if (index === -1) index = NOTES_FLAT.indexOf(note);
    return index;
}

function transposeNote(note: string, semitones: number) {
    const isFlat = note.includes('b');
    const index = getNoteIndex(note);
    if (index === -1) return note;

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    // Preserve scale preference roughly
    return isFlat ? NOTES_FLAT[newIndex] : NOTES[newIndex];
}

function transposeChord(chord: string, semitones: number) {
    if (semitones === 0) return chord;

    // Regex to find root note (e.g., C, F#) at start of chord string
    return chord.replace(/^([A-G][#b]?)(.*)$/, (_, root, suffix) => {
        return transposeNote(root, semitones) + suffix;
    });
}

export function useTranspose(content: string) {
    const [semitones, setSemitones] = useState(0);

    const transposedContent = useMemo(() => {
        if (!content) return '';
        if (semitones === 0) return content;

        // Replace [ch]...[/ch] contents
        return content.replace(/\[ch\](.*?)\[\/ch\]/g, (_, chord) => {
            const transposed = transposeChord(chord, semitones);
            return `[ch]${transposed}[/ch]`;
        });
    }, [content, semitones]);

    return {
        semitones,
        setSemitones,
        transposedContent
    };
}

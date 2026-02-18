import { useState, useMemo } from 'react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getNoteIndex(note: string) {
    // Handle flats/sharps consistently
    let index = NOTES.indexOf(note);
    if (index === -1) index = NOTES_FLAT.indexOf(note);
    return index;
}

function transposeNote(note: string, semitones: number, useFlats: boolean) {
    const index = getNoteIndex(note);
    if (index === -1) return note;

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    // Force flats if requested, otherwise default behavior
    if (useFlats) {
        return NOTES_FLAT[newIndex];
    }

    // Determine target scale preference based on the note itself or just default
    // If the original note was flat, try to return flat.
    const isFlat = note.includes('b');
    return isFlat ? NOTES_FLAT[newIndex] : NOTES[newIndex];
}

function transposeChord(chord: string, semitones: number, useFlats: boolean) {
    // Even if semitones is 0, we might need to convert to flats if useFlats is true
    // so we can't just return chord if semitones === 0

    // Split by '/' to handle slash chords (e.g. D/F#)
    return chord.split('/').map(part => {
        // Regex to find root note (e.g., C, F#) at start of chord string
        return part.replace(/^([A-G][#b]?)(.*)$/, (_, root, suffix) => {
            return transposeNote(root, semitones, useFlats) + suffix;
        });
    }).join('/');
}

export function useTranspose(content: string, useFlats: boolean = false) {
    const [semitones, setSemitones] = useState(0);

    const transposedContent = useMemo(() => {
        if (!content) return '';

        // Replace [ch]...[/ch] contents
        return content.replace(/\[ch\](.*?)\[\/ch\]/g, (_, chord) => {
            const transposed = transposeChord(chord, semitones, useFlats);
            return `[ch]${transposed}[/ch]`;
        });
    }, [content, semitones, useFlats]);

    return {
        semitones,
        setSemitones,
        transposedContent
    };
}

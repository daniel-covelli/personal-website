import type { Article } from '@/lib/types';
import FieldNoteCard from '@/components/articles/FieldNoteCard';

interface ExperienceFieldNotesProps {
  notes: Article[];
}

/** A compact grid of field-note cards shown under a work experience. */
export default function ExperienceFieldNotes({
  notes,
}: ExperienceFieldNotesProps) {
  if (!notes.length) return null;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {notes.map((note) => (
        <FieldNoteCard key={note.id} article={note} />
      ))}
    </div>
  );
}

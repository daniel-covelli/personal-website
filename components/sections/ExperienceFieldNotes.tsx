import type { Article } from '@/lib/types';
import FieldNoteCard from '@/components/articles/FieldNoteCard';

interface ExperienceFieldNotesProps {
  notes: Article[];
}

/**
 * The "Field notes" block that hangs under a work experience — a labelled
 * hairline divider (the "Field Notes" name carried over from the old ticker),
 * then a compact grid of note cards.
 */
export default function ExperienceFieldNotes({
  notes,
}: ExperienceFieldNotesProps) {
  if (!notes.length) return null;

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="h-[7px] w-[7px] rotate-45 rounded-[1.5px] bg-brand/75"
        />
        <h4 className="text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-brand">
          Field notes
        </h4>
        <span aria-hidden className="h-px flex-1 bg-hair" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {notes.map((note) => (
          <FieldNoteCard key={note.id} article={note} />
        ))}
      </div>
    </div>
  );
}

import Image from 'next/image';
import { Header as HeaderType } from '@/lib/types';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

interface HeaderProps {
  data: HeaderType;
}

// Full-field placement: dots cover the hero with a soft center vignette that
// fades them out at the edges.
const dotMask =
  'radial-gradient(120% 125% at 50% 38%, #000 42%, transparent 88%)';

export default function Header({ data }: HeaderProps) {
  return (
    <header className="relative overflow-hidden px-4 py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ maskImage: dotMask, WebkitMaskImage: dotMask }}
      >
        <DottedGlowBackground
          color="rgba(79,111,143,0.9)"
          darkColor="rgba(126,163,201,0.9)"
          glowColor="rgba(79,111,143,0.5)"
          darkGlowColor="rgba(126,163,201,0.65)"
          gap={16}
          radius={1.5}
          opacity={0.36}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          {data.imageUrl && (
            <Image
              src={data.imageUrl}
              alt={data.name}
              width={140}
              height={140}
              className="shrink-0 rounded-full object-cover shadow-md ring-2 ring-hair"
            />
          )}
          <div className="text-center md:text-left">
            <h1 className="mb-2 text-3xl font-bold text-ink md:text-4xl">
              {data.name}
            </h1>
            <p className="mb-3 text-lg font-medium text-body md:text-xl">
              {data.title}
            </p>
            <p className="max-w-xl leading-relaxed text-subtle">{data.bio}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

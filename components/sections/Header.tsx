import Image from 'next/image';
import { Header as HeaderType } from '@/lib/types';

interface HeaderProps {
  data: HeaderType;
}

export default function Header({ data }: HeaderProps) {
  return (
    <header className="px-4 pb-16 pt-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          {data.imageUrl && (
            <Image
              src={data.imageUrl}
              alt={data.name}
              width={140}
              height={140}
              className="shrink-0 rounded-full object-cover shadow-md ring-2 ring-gray-100"
            />
          )}
          <div className="text-center md:text-left">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
              {data.name}
            </h1>
            <p className="mb-3 text-lg font-medium text-gray-600 md:text-xl">
              {data.title}
            </p>
            <p className="max-w-xl leading-relaxed text-gray-500">{data.bio}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

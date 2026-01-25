import Image from 'next/image';
import { Header as HeaderType } from '@/lib/types';

interface HeaderProps {
  data: HeaderType;
}

export default function Header({ data }: HeaderProps) {
  return (
    <header className="px-6 pt-24 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {data.imageUrl && (
            <Image
              src={data.imageUrl}
              alt={data.name}
              width={140}
              height={140}
              className="rounded-full object-cover shrink-0 shadow-md ring-2 ring-gray-100"
            />
          )}
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {data.name}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-3 font-medium">
              {data.title}
            </p>
            <p className="text-gray-500 leading-relaxed max-w-xl">
              {data.bio}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

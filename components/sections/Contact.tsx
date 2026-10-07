import { Contact as ContactType } from '@/lib/types';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import CopyEmailButton from './CopyEmailButton';
import ExternalIcon from './ExternalIcon';
import FooterResumeLink from './FooterResumeLink';

interface ContactProps {
  data: ContactType;
  name: string;
  isAdmin: boolean;
}

// Same vignette as the hero so the page opens and closes on the same field.
const dotMask =
  'radial-gradient(120% 140% at 50% 46%, #000 50%, transparent 96%)';

const columnHeading = 'mb-3 text-[13px] font-medium text-subtle';
const columnLink =
  'inline-flex items-center gap-1 text-[15px] text-ink transition-colors hover:text-brand';

/**
 * Site footer: Contact / Profiles / Site columns over the hero's dotted glow
 * field, then a plain © row on the page background. The Website contact link
 * is left out since visitors are already on it.
 */
export default function Contact({ data, name, isAdmin }: ContactProps) {
  const elsewhere = [
    { label: 'LinkedIn', href: data.linkedin },
    { label: 'GitHub', href: data.github },
    { label: 'Twitter', href: data.twitter },
  ].filter((link) => link.href);

  return (
    <footer className="mt-12">
      <div className="relative overflow-hidden border-t border-hair px-4">
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
        <div className="relative z-10 mx-auto grid max-w-3xl grid-cols-2 gap-8 py-20 md:grid-cols-[1.4fr_1fr_1fr]">
          {data.email && (
            <div className="col-span-2 min-w-0 md:col-span-1">
              <h3 className={columnHeading}>Contact</h3>
              <div className="flex flex-wrap items-center gap-1">
                <a href={`mailto:${data.email}`} className={columnLink}>
                  {data.email}
                </a>
                <CopyEmailButton email={data.email} />
              </div>
            </div>
          )}
          {elsewhere.length > 0 && (
            <div>
              <h3 className={columnHeading}>Profiles</h3>
              <ul className="grid gap-2">
                {elsewhere.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={columnLink}
                    >
                      {link.label}
                      <ExternalIcon className="h-2.5 w-2.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className={columnHeading}>Site</h3>
            <ul className="grid justify-items-start gap-2">
              <li>
                <a href="/articles" className={columnLink}>
                  Writing
                </a>
              </li>
              <li>
                <FooterResumeLink />
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-hair bg-surface px-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between py-6 text-[13px] text-subtle">
          <p>
            &copy; {new Date().getFullYear()} {name}
          </p>
          <a
            href={isAdmin ? '/admin' : '/login'}
            className="transition-colors hover:text-ink"
          >
            {isAdmin ? 'Admin' : 'Login'}
          </a>
        </div>
      </div>
    </footer>
  );
}

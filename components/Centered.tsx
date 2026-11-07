import Brand from "./Brand";
import { LegalFooter } from "./Legal";

/** Página sencilla centrada (login, confirmaciones, bajas). */
export default function Centered({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <div className="mb-10">
        <Brand />
      </div>
      <div className="card anim-fade-up p-6 sm:p-8">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      <LegalFooter className="mt-auto pt-10" />
    </main>
  );
}

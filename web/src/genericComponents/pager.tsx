import type { JSX } from "react";

const pagerButtonClass =
  "rounded-full border border-border bg-secondary/60 px-5 py-2 font-display text-xs tracking-widest text-secondary-foreground uppercase transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-secondary/60";

type PagerProps = Readonly<{
  label: string;
  page: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}>;

export const Pager = ({ label, page, hasNextPage, onPageChange }: PagerProps): JSX.Element => (
  <nav aria-label={label} className="flex items-center justify-center gap-4">
    <button
      type="button"
      className={pagerButtonClass}
      disabled={page <= 1}
      onClick={() => {
        onPageChange(page - 1);
      }}
    >
      Previous
    </button>
    <p className="font-display text-sm tracking-widest text-muted-foreground">Page {page}</p>
    <button
      type="button"
      className={pagerButtonClass}
      disabled={!hasNextPage}
      onClick={() => {
        onPageChange(page + 1);
      }}
    >
      Next
    </button>
  </nav>
);

import { Link, useLocation, useSearchParams } from "@remix-run/react";

import {
  EXPERIENCE_NAV,
  EXPERIENCE_NAV_SECTIONS,
  experienceNavIsActive,
} from "~/lib/experience-nav";
import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

function DirectoryLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  return (
    <div className="space-y-space-16 p-space-16">
      {EXPERIENCE_NAV_SECTIONS.map((section) => {
        const entries = EXPERIENCE_NAV.filter(
          (entry) => entry.section === section.id
        );
        if (entries.length === 0) return null;
        return (
          <div key={section.id}>
            <p className="mb-2 text-type-12 font-medium text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-1">
              {entries.map((entry) => {
                const active = experienceNavIsActive(
                  entry,
                  pathname,
                  searchParams
                );
                return (
                  <li key={entry.href}>
                    <Link
                      to={entry.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-lg px-2 py-1 text-type-14",
                        active
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {entry.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

type OverviewDirectoryProps = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

/** Overview directory. Mobile overlay from topbar icon; md+ sticky sidebar. */
export function OverviewDirectory({
  mobileOpen = false,
  onNavigate,
}: OverviewDirectoryProps) {
  const { t } = useI18n();
  const directoryLabel = t("nav.directory");

  return (
    <>
      {mobileOpen ? (
        <div
          id="overview-directory"
          className="border-b border-border md:hidden"
        >
          <nav aria-label={directoryLabel}>
            <DirectoryLinks onNavigate={onNavigate} />
          </nav>
        </div>
      ) : null}
      <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-border md:block md:max-h-full">
        <nav aria-label={directoryLabel} id="overview-directory-desktop">
          <DirectoryLinks />
        </nav>
      </aside>
    </>
  );
}

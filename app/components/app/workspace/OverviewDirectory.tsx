import { Link, useLocation, useSearchParams } from "@remix-run/react";

import { SideNav, SideNavItem, SideNavSection } from "~/components/ui/SideNav";
import {
  EXPERIENCE_NAV,
  EXPERIENCE_NAV_SECTIONS,
  experienceNavIsActive,
  type ExperienceNavSectionId,
} from "~/lib/experience-nav";
import { useI18n } from "~/shared/i18n/context";

const COLLAPSIBLE_SECTIONS = new Set<ExperienceNavSectionId>([
  "catalogs",
  "support",
]);

function DirectorySections({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  return (
    <div className="eds-surface-enter">
      {EXPERIENCE_NAV_SECTIONS.map((section) => {
        const entries = EXPERIENCE_NAV.filter(
          (entry) => entry.section === section.id
        );
        if (entries.length === 0) return null;
        const hasCurrent = entries.some((entry) =>
          experienceNavIsActive(entry, pathname, searchParams)
        );
        const collapsible = COLLAPSIBLE_SECTIONS.has(section.id);
        return (
          <SideNavSection
            key={section.id}
            title={t(section.titleKey)}
            collapsible={collapsible}
            defaultOpen={!collapsible || hasCurrent}
          >
            {entries.map((entry) => {
              const active = experienceNavIsActive(
                entry,
                pathname,
                searchParams
              );
              return (
                <SideNavItem key={entry.href} asChild current={active}>
                  <Link to={entry.href} onClick={onNavigate}>
                    {t(entry.labelKey)}
                  </Link>
                </SideNavItem>
              );
            })}
          </SideNavSection>
        );
      })}
    </div>
  );
}

type OverviewDirectoryProps = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

/**
 * Overview directory. Mobile left Sheet overlay; md+ sticky SideNav rail.
 * Surface: product — Quiet directory, not a second marketing column.
 */
export function OverviewDirectory({
  mobileOpen = false,
  onNavigate,
}: OverviewDirectoryProps) {
  const { t } = useI18n();
  const directoryLabel = t("nav.directory");

  return (
    <>
      {mobileOpen ? (
        <SideNav
          variant="overlay"
          title={directoryLabel}
          aria-label={directoryLabel}
          id="overview-directory"
          onDismiss={onNavigate}
        >
          <DirectorySections onNavigate={onNavigate} />
        </SideNav>
      ) : null}
      <SideNav
        variant="rail"
        aria-label={directoryLabel}
        id="overview-directory-desktop"
        className="hidden md:flex"
      >
        <DirectorySections />
      </SideNav>
    </>
  );
}

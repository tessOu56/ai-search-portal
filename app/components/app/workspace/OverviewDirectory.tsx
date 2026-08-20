import { Link, useLocation, useSearchParams } from "@remix-run/react";

import { SideNav, SideNavItem, SideNavSection } from "~/components/ui/SideNav";
import {
  EXPERIENCE_NAV,
  EXPERIENCE_NAV_SECTIONS,
  experienceNavIsActive,
} from "~/lib/experience-nav";
import { useI18n } from "~/shared/i18n/context";

function DirectorySections({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  return (
    <>
      {EXPERIENCE_NAV_SECTIONS.map((section) => {
        const entries = EXPERIENCE_NAV.filter(
          (entry) => entry.section === section.id
        );
        if (entries.length === 0) return null;
        return (
          <SideNavSection key={section.id} title={t(section.titleKey)}>
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
    </>
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
        <div id="overview-directory" className="md:hidden">
          <SideNav
            variant="overlay"
            aria-label={directoryLabel}
            id="overview-directory-mobile"
          >
            <DirectorySections onNavigate={onNavigate} />
          </SideNav>
        </div>
      ) : null}
      <SideNav
        variant="rail"
        aria-label={directoryLabel}
        id="overview-directory-desktop"
        className="hidden md:block"
      >
        <DirectorySections />
      </SideNav>
    </>
  );
}

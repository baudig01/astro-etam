// src/components/react/Header.tsx
import "../../styles/header.scss";

interface NavLink {
  title: string;
  href: string;
}

interface Logo {
  url?: string;
}

interface HeaderProps {
  data?: {
    logo?: Logo;
    cta_label?: string;
    cta_url?: string;
    navigation_links?: NavLink[] | { link?: NavLink[] };
  } | null;
}

export function Header({ data }: HeaderProps) {
  const { logo, cta_label, cta_url } = data || {};
  const navigation_links: NavLink[] = Array.isArray(data?.navigation_links)
    ? data.navigation_links
    : Array.isArray(data?.navigation_links?.link)
    ? data.navigation_links.link
    : [];

  return (
    <header className="flex items-center justify-between p-4 border-b">
      {logo?.url && (
        <a href="/">
          <img src={logo.url} alt="Logo" className="h-10" />
        </a>
      )}
      <nav className="flex gap-4">
        {navigation_links.map((link, index) => (
          <a key={`${link.title}--${index}`} href={link.href}>
            {link.title}
          </a>
        ))}
      </nav>
      {cta_label && (
        <a href={cta_url} className="btn-primary">
          {cta_label}
        </a>
      )}
    </header>
  );
}
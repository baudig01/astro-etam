import "../../styles/footer.scss";

interface NavLink {
    title: string | number;
    href: string;
}

interface FooterProps {
    data: any;
}
export function Footer({ data }: FooterProps) {
    const {copyright, title, information_section, navigation_links } = data || {};

    return (
        <footer>
            {title && <h2 className="title-01">{title}</h2>}
            {navigation_links && <nav className="flex gap-4">
                <h3 className="title-02">{navigation_links.title}</h3>
                {navigation_links.link.map((link: NavLink, index: number) => (
                    <a key={`${link.title}--${index}`} href={link.href}>
                        {link.title}
                    </a>
                ))}
            </nav>}
            {information_section && (
                <div>
                    {information_section.description && <h3 className="title-02">{information_section.description}</h3>}
                    {information_section.holiday && <p className="body-01">{information_section.holiday}</p>}
                    {information_section.logo && <img src={information_section.logo.url} alt={information_section.logo.title} />}
                    {information_section.timings && <p className="body-01">{information_section.timings}</p>}
                </div>
            )}
            {copyright && (
                <p className="body-01">{copyright}</p>
            )}
        </footer>
    )
}

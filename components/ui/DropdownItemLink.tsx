import Link from "next/link";

type DropdownItemProps = {
    href?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
};

export default function DropdownItemLink({
    href,
    icon,
    children,
    onClick,
}: DropdownItemProps) {
    return (
        <Link
            href={href || "#"}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
        >
            <span className="text-muted-foreground group-hover:text-primary">
                {icon}
            </span>
            {children}
        </Link>
    );
}

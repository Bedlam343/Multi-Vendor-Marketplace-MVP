import EditorNavbar from "@/components/items/EditorNavbar";

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <EditorNavbar />
            <main>{children}</main>
        </div>
    );
}

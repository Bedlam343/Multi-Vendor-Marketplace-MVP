import Navbar from "@/components/layout/Navbar";

export default function MainLayout({
    children,
    modal,
}: {
    children: React.ReactNode;
    modal: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            {children}
            {modal}
        </>
    );
}

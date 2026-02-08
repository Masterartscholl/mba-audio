export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
            {children}
        </div>
    );
}

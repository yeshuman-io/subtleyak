type FormLayoutProps = {
  children: React.ReactNode;
  columns?: number;
};

export function FormLayout({ children, columns = 2 }: FormLayoutProps) {
  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
        <div className={`grid grid-cols-${columns} gap-4`}>
          {children}
        </div>
      </div>
    </div>
  );
} 
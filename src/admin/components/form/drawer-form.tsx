import { Drawer, Button } from "@medusajs/ui";

type DrawerFormProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  onClose: () => void;
};

export function DrawerForm({ 
  title, 
  description, 
  children, 
  onSubmit, 
  onClose 
}: DrawerFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
      <Drawer.Header>
        <Drawer.Title>{title}</Drawer.Title>
        <span className="sr-only">
          {description}
        </span>
      </Drawer.Header>
      <Drawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto">
        {children}
      </Drawer.Body>
      <Drawer.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <Drawer.Close asChild>
            <Button size="small" variant="secondary">
              Cancel
            </Button>
          </Drawer.Close>
          <Button size="small" type="submit">
            Save
          </Button>
        </div>
      </Drawer.Footer>
    </form>
  );
} 
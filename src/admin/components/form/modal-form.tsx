import { FocusModal, Button } from "@medusajs/ui";

type ModalFormProps = {
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  onClose: () => void;
};

export function ModalForm({ title, children, onSubmit, onClose }: ModalFormProps) {
  return (
    <FocusModal.Content>
      <form onSubmit={onSubmit} className="flex h-full flex-col overflow-hidden">
        <FocusModal.Header>
          <FocusModal.Title>{title}</FocusModal.Title>
          <div className="flex items-center justify-end gap-x-2">
            <FocusModal.Close asChild>
              <Button size="small" variant="secondary">
                Cancel
              </Button>
            </FocusModal.Close>
            <Button type="submit" size="small">
              Save
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body>
          {children}
        </FocusModal.Body>
      </form>
    </FocusModal.Content>
  );
} 
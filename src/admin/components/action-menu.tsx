import { DropdownMenu } from "@medusajs/ui";
import { ReactNode } from "react";

type ActionProps = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "danger" | "normal";
};

type ActionGroupProps = {
  actions: ActionProps[];
};

type ActionMenuProps = {
  groups: ActionGroupProps[];
};

export const ActionMenu = ({ groups }: ActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <button className="text-ui-fg-subtle hover:bg-ui-bg-base-hover focus-visible:bg-ui-bg-base-hover active:bg-ui-bg-base-pressed disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled p-1.5 rounded-md">
          <span className="sr-only">Actions</span>
          <div className="h-5 w-5 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-current mx-[1px]" />
            <span className="w-1 h-1 rounded-full bg-current mx-[1px]" />
            <span className="w-1 h-1 rounded-full bg-current mx-[1px]" />
          </div>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {groups.map((group, index) => (
          <div key={index}>
            {group.actions.map((action, actionIndex) => (
              <DropdownMenu.Item
                key={actionIndex}
                className={action.variant === "danger" ? "text-ui-fg-error" : ""}
                onClick={action.onClick}
              >
                {action.icon && (
                  <span className="text-ui-fg-subtle mr-2">{action.icon}</span>
                )}
                {action.label}
              </DropdownMenu.Item>
            ))}
            {index < groups.length - 1 && <DropdownMenu.Separator />}
          </div>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}; 
import { createContext, useContext, useState } from "react";
import { Drawer as MedusaDrawer } from "@medusajs/ui";

type DrawerContextType = {
  open: (Component: React.ComponentType<any>) => void;
  close: () => void;
  isOpen: boolean;
  Component: React.ComponentType<any> | null;
};

const DrawerContext = createContext<DrawerContextType>({
  open: () => {},
  close: () => {},
  isOpen: false,
  Component: null,
});

export const useDrawer = () => useContext(DrawerContext);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  const open = (Component: React.ComponentType<any>) => {
    setComponent(() => Component);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setComponent(null);
  };

  return (
    <DrawerContext.Provider value={{ open, close, isOpen, Component }}>
      {children}
      {Component && (
        <MedusaDrawer open={isOpen} onOpenChange={setIsOpen}>
          <Component onClose={close} />
        </MedusaDrawer>
      )}
    </DrawerContext.Provider>
  );
} 
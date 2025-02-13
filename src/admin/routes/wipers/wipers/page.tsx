import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { Wiper } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { WiperCreate } from "./create/wiper-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { WiperEdit } from "./edit/wiper-edit";

const columnHelper = createDataTableColumnHelper<Wiper>();

const WipersPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingWiper, setEditingWiper] = useState<Wiper | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("name", {
      header: "Name",
      enableSorting: true,
    }),
    columnHelper.accessor("code", {
      header: "Code",
      enableSorting: true,
    }),
    columnHelper.accessor("kits", {
      header: "Kits",
      enableSorting: true,
    }),
    columnHelper.accessor("actions", {
      header: "",
      cell: ({ row }) => {
        const model = row.original;
        return (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Edit",
                    icon: <Pencil />,
                    onClick: () => setEditingWiper(model),
                  },
                ],
              },
            ]}
          />
        );
      },
    }),
  ];

  return (
    <>
      <DataTablePage<Wiper>
        title="Wipers"
        subtitle="Manage your wipers"
        endpoint="/admin/wipers/wipers"
        columns={columns}
        queryKey="wipers"
        dataKey="wipers"
        actions={[
          {
            type: "button",
            props: {
              variant: "secondary",
              size: "small",
              children: "Export",
              disabled: true,
            },
          },
          {
            type: "button",
            props: {
              variant: "secondary",
              size: "small",
              children: "Import",
              disabled: true,
            },
          },
          {
            type: "button",
            props: {
              variant: "secondary",
              size: "small",
              children: "Create",
              onClick: () => setShowCreate(true),
            },
          },
        ]}
      />
      {showCreate && (
        <FocusModal open={showCreate} onOpenChange={setShowCreate}>
          <WiperCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editingWiper && (
        <Drawer open onOpenChange={() => setEditingWiper(null)}>
          <WiperEdit 
            model={editing}
            onClose={() => setEditingWiper(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Wipers",
});

export default WipersPage; 
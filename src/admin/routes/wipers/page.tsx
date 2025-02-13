import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import {  } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { Create } from "./create/-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { Edit } from "./edit/-edit";

const columnHelper = createDataTableColumnHelper<>();

const WipersPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState< | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
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
                    onClick: () => setEditing(model),
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
      <DataTablePage<>
        title="Wipers"
        subtitle="Manage your wipers"
        endpoint="/admin/wipers"
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
          <Create onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editing && (
        <Drawer open onOpenChange={() => setEditing(null)}>
          <Edit 
            model={editing}
            onClose={() => setEditing(null)}
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
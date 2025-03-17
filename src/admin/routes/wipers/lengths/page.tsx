import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { WiperLength } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { WiperLengthCreate } from "./create/wiper-length-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { WiperLengthEdit } from "./edit/wiper-length-edit";
//asdf
const columnHelper = createDataTableColumnHelper<WiperLength>();

const LengthsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingWiperLength, setEditingWiperLength] = useState<WiperLength | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("unit", {
      header: "Unit",
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
                    onClick: () => setEditingWiperLength(model),
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
      <DataTablePage<WiperLength>
        title="Lengths"
        subtitle="Manage your lengths"
        endpoint="/admin/wipers/lengths"
        columns={columns}
        queryKey="lengths"
        dataKey="lengths"
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
          <WiperLengthCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editingWiperLength && (
        <Drawer open onOpenChange={() => setEditingWiperLength(null)}>
          <WiperLengthEdit 
            model={editing}
            onClose={() => setEditingWiperLength(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Lengths",
});

export default LengthsPage; 
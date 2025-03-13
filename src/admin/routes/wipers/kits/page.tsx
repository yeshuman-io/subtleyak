import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { WiperKit } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { WiperKitCreate } from "./create/wiper-kit-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { WiperKitEdit } from "./edit/wiper-kit-edit";
//asdf
const columnHelper = createDataTableColumnHelper<WiperKit>();

const KitsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingWiperKit, setEditingWiperKit] = useState<WiperKit | null>(null);

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
    columnHelper.accessor("wiper", {
      header: "Wiper",
      enableSorting: true,
    }),
    columnHelper.accessor("wiper.name", {
      header: "Wiper",
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
                    onClick: () => setEditingWiperKit(model),
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
      <DataTablePage<WiperKit>
        title="Kits"
        subtitle="Manage your kits"
        endpoint="/admin/wipers/kits"
        columns={columns}
        queryKey="kits"
        dataKey="kits"
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
          <WiperKitCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editingWiperKit && (
        <Drawer open onOpenChange={() => setEditingWiperKit(null)}>
          <WiperKitEdit 
            model={editing}
            onClose={() => setEditingWiperKit(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Kits",
});

export default KitsPage; 
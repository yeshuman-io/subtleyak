import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { WiperArm } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { WiperArmCreate } from "./create/wiper-arm-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { WiperArmEdit } from "./edit/wiper-arm-edit";
//asdf
const columnHelper = createDataTableColumnHelper<WiperArm>();

const ArmsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingWiperArm, setEditingWiperArm] = useState<WiperArm | null>(null);

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
    columnHelper.accessor("connector", {
      header: "Connector",
      enableSorting: true,
    }),
    columnHelper.accessor("connector.name", {
      header: "Connector",
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
                    onClick: () => setEditingWiperArm(model),
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
      <DataTablePage<WiperArm>
        title="Arms"
        subtitle="Manage your arms"
        endpoint="/admin/wipers/arms"
        columns={columns}
        queryKey="arms"
        dataKey="arms"
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
          <WiperArmCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editingWiperArm && (
        <Drawer open onOpenChange={() => setEditingWiperArm(null)}>
          <WiperArmEdit 
            model={editing}
            onClose={() => setEditingWiperArm(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Arms",
});

export default ArmsPage; 
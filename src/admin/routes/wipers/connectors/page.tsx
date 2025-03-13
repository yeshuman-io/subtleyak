import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { WiperConnector } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { WiperConnectorCreate } from "./create/wiper-connector-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { WiperConnectorEdit } from "./edit/wiper-connector-edit";
//asdf
const columnHelper = createDataTableColumnHelper<WiperConnector>();

const ConnectorsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingWiperConnector, setEditingWiperConnector] = useState<WiperConnector | null>(null);

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
    columnHelper.accessor("type", {
      header: "Type",
      enableSorting: true,
    }),
    columnHelper.accessor("media_url", {
      header: "Media Url",
      enableSorting: true,
    }),
    columnHelper.accessor("arms", {
      header: "Arms",
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
                    onClick: () => setEditingWiperConnector(model),
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
      <DataTablePage<WiperConnector>
        title="Connectors"
        subtitle="Manage your connectors"
        endpoint="/admin/wipers/connectors"
        columns={columns}
        queryKey="connectors"
        dataKey="connectors"
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
          <WiperConnectorCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editingWiperConnector && (
        <Drawer open onOpenChange={() => setEditingWiperConnector(null)}>
          <WiperConnectorEdit 
            model={editing}
            onClose={() => setEditingWiperConnector(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Connectors",
});

export default ConnectorsPage; 
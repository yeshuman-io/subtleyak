import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { VehicleBody } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { VehicleBodyCreate } from "./create/vehicle-body-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { VehicleBodyEdit } from "./edit/vehicle-body-edit";
//asdf
const columnHelper = createDataTableColumnHelper<VehicleBody>();

const BodiesPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingVehicleBody, setEditingVehicleBody] = useState<VehicleBody | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("name", {
      header: "Name",
      enableSorting: true,
    }),
    columnHelper.accessor("models", {
      header: "Models",
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
                    onClick: () => setEditingVehicleBody(model),
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
      <DataTablePage<VehicleBody>
        title="Bodies"
        subtitle="Manage your bodies"
        endpoint="/admin/vehicles/bodies"
        columns={columns}
        queryKey="bodies"
        dataKey="bodies"
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
          <VehicleBodyCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editingVehicleBody && (
        <Drawer open onOpenChange={() => setEditingVehicleBody(null)}>
          <VehicleBodyEdit 
            model={editing}
            onClose={() => setEditingVehicleBody(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Bodies",
});

export default BodiesPage; 
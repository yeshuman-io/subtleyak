import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { VehicleMake } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { VehicleMakeCreate } from "./create/vehicle-make-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { VehicleMakeEdit } from "./edit/vehicle-make-edit";

const columnHelper = createDataTableColumnHelper<VehicleMake>();

const MakesPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingVehicleMake, setEditingVehicleMake] = useState<VehicleMake | null>(null);

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
    columnHelper.accessor("vehicles", {
      header: "Vehicles",
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
                    onClick: () => setEditingVehicleMake(model),
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
      <DataTablePage<VehicleMake>
        title="Makes"
        subtitle="Manage your makes"
        endpoint="/admin/vehicles/makes"
        columns={columns}
        queryKey="makes"
        dataKey="makes"
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
          <VehicleMakeCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editingVehicleMake && (
        <Drawer open onOpenChange={() => setEditingVehicleMake(null)}>
          <VehicleMakeEdit 
            model={editing}
            onClose={() => setEditingVehicleMake(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Makes",
});

export default MakesPage; 
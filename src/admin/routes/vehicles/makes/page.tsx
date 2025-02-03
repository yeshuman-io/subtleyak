import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal } from "@medusajs/ui";
import { VehicleMake } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { VehicleMakeCreate } from "./create/vehicle-make-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { Drawer } from "@medusajs/ui";
import { VehicleMakeEdit } from "./edit/vehicle-make-edit";

const columnHelper = createDataTableColumnHelper<VehicleMake>();

const VehicleMakesPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingMake, setEditingMake] = useState<VehicleMake | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("name", {
      header: "Make",
      enableSorting: true,
    }),
    columnHelper.accessor("models", {
      header: "Models",
      enableSorting: true,
    }),
    columnHelper.accessor("actions", {
      header: "",
      cell: ({ row }) => {
        const make = row.original;
        return (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Edit",
                    icon: <Pencil />,
                    onClick: () => setEditingMake(make),
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
        title="Vehicle Makes"
        subtitle="Manage your vehicle makes"
        endpoint="/admin/vehicles/makes"
        columns={columns}
        queryKey="vehicle_makes"
        dataKey="vehicle_makes"
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
      {editingMake && (
        <Drawer open onOpenChange={() => setEditingMake(null)}>
          <VehicleMakeEdit 
            make={editingMake} 
            onClose={() => setEditingMake(null)} 
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Vehicle Makes",
});

export default VehicleMakesPage;

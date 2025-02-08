import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Pencil, RocketLaunch } from "@medusajs/icons";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { Vehicle } from "../../types";
import { DataTablePage } from "../../components/data-table-page";
import { ActionMenu } from "../../components/action-menu";
import { VehicleCreate } from "./create/vehicle-create";
import { VehicleEdit } from "./edit/vehicle-edit";
import { useState } from "react";

const columnHelper = createDataTableColumnHelper<Vehicle>();

const VehiclesPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("make.name", {
      cell: ({ row }) => row.original.make?.name || "-",
      header: "Make",
      enableSorting: true,
    }),
    columnHelper.accessor("model.name", {
      cell: ({ row }) => row.original.model?.name || "-",
      header: "Model",
      enableSorting: true,
    }),
    columnHelper.accessor("series", {
      cell: ({ row }) => row.original.series?.length || 0,
      header: "Series",
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
                    onClick: () => setEditingVehicle(model),
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
      <DataTablePage<Vehicle>
        title="Vehicles"
        subtitle="Manage your vehicles"
        endpoint="/admin/vehicles"
        columns={columns}
        queryKey="vehicles"
        dataKey="vehicles"
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
          <VehicleCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      {editingVehicle && (
        <Drawer open onOpenChange={() => setEditingVehicle(null)}>
          <VehicleEdit 
            vehicle={editingVehicle}
            onClose={() => setEditingVehicle(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Vehicles",
  icon: RocketLaunch
});//asdf

export default VehiclesPage; 
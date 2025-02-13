import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { VehicleSeries } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { VehicleSeriesCreate } from "./create/vehicle-series-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { VehicleSeriesEdit } from "./edit/vehicle-series-edit";

const columnHelper = createDataTableColumnHelper<VehicleSeries>();

const SeriesPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingVehicleSeries, setEditingVehicleSeries] = useState<VehicleSeries | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("vehicle", {
      header: "Vehicle",
      enableSorting: true,
    }),
    columnHelper.accessor("vehicle.name", {
      header: "Vehicle",
      enableSorting: true,
    }),
    columnHelper.accessor("model", {
      header: "Model",
      enableSorting: true,
    }),
    columnHelper.accessor("model.name", {
      header: "Model",
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
                    onClick: () => setEditingVehicleSeries(model),
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
      <DataTablePage<VehicleSeries>
        title="Series"
        subtitle="Manage your series"
        endpoint="/admin/vehicles/series"
        columns={columns}
        queryKey="series"
        dataKey="series"
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
          <VehicleSeriesCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      
      {editingVehicleSeries && (
        <Drawer open onOpenChange={() => setEditingVehicleSeries(null)}>
          <VehicleSeriesEdit 
            model={editing}
            onClose={() => setEditingVehicleSeries(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Series",
});

export default SeriesPage; 
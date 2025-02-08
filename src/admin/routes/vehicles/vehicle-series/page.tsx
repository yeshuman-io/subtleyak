import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { VehicleSeries } from "../../../../types";
import { DataTablePage } from "../../../../components/data-table-page";
import { VehicleSeriesCreate } from "./create/vehicle-vehicle-series-create";
import { VehicleSeriesEdit } from "./edit/vehicle-vehicle-series-edit";
import { useState } from "react";
import { ActionMenu } from "../../../../components/action-menu";
import { Pencil } from "@medusajs/icons";

const columnHelper = createDataTableColumnHelper<VehicleSeries>();

const VehicleSeriesPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<VehicleSeries | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("start_year", {
      header: "Start Year",
      enableSorting: true,
    }),
    columnHelper.accessor("end_year", {
      header: "End Year",
      enableSorting: true,
    }),
    columnHelper.accessor("actions", {
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Edit",
                    icon: <Pencil />,
                    onClick: () => setEditing(item),
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
        title="VehicleSeriess"
        subtitle="Manage your vehicle-seriess"
        endpoint="/admin/vehicles/vehicle-series"
        columns={columns}
        queryKey="vehicle-series"
        dataKey="vehicle-seriess"
        actions={[
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
      {editing && (
        <Drawer open onOpenChange={() => setEditing(null)}>
          <VehicleSeriesEdit item={editing} onClose={() => setEditing(null)} />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "VehicleSeriess",
});

export default VehicleSeriesPage;

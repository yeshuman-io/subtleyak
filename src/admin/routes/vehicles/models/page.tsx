import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { VehicleModel } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { VehicleModelCreate } from "./create/vehicle-model-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { VehicleModelEdit } from "./edit/vehicle-model-edit";

const columnHelper = createDataTableColumnHelper<VehicleModel>();

const VehicleModelsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("name", {
      header: "Model",
      enableSorting: true,
    }),
    columnHelper.accessor("make.name", {
      header: "Make",
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
                    onClick: () => setEditingModel(model),
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
      <DataTablePage<VehicleModel>
        title="Vehicle Models"
        subtitle="Manage your vehicle models"
        endpoint="/admin/vehicles/models"
        columns={columns}
        queryKey="vehicle_models"
        dataKey="vehicle_models"
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
          <VehicleModelCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      {editingModel && (
        <Drawer open onOpenChange={() => setEditingModel(null)}>
          <VehicleModelEdit 
            model={editingModel} 
            onClose={() => setEditingModel(null)} 
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Vehicle Models",
});

export default VehicleModelsPage;

import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { VehicleModel } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";
import { VehicleModelCreate } from "./create/vehicle-model-create";
import { useState } from "react";
import { ActionMenu } from "../../../components/action-menu";
import { Pencil } from "@medusajs/icons";
import { VehicleModelEdit } from "./edit/vehicle-model-edit";
//asdf
const columnHelper = createDataTableColumnHelper<VehicleModel>();

const ModelsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingVehicleModel, setEditingVehicleModel] = useState<VehicleModel | null>(null);

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("name", {
      header: "Name",
      enableSorting: true,
    }),
    columnHelper.accessor("make", {
      header: "Make",
      enableSorting: true,
    }),
    columnHelper.accessor("make.name", {
      header: "Make",
      enableSorting: true,
    }),
    columnHelper.accessor("vehicles", {
      header: "Vehicles",
      enableSorting: true,
    }),
    columnHelper.accessor("bodies", {
      header: "Bodies",
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
                    onClick: () => setEditingVehicleModel(model),
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
        title="Models"
        subtitle="Manage your models"
        endpoint="/admin/vehicles/models"
        columns={columns}
        queryKey="models"
        dataKey="models"
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
      
      {editingVehicleModel && (
        <Drawer open onOpenChange={() => setEditingVehicleModel(null)}>
          <VehicleModelEdit 
            model={editing}
            onClose={() => setEditingVehicleModel(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Models",
});

export default ModelsPage; 
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { createDataTableColumnHelper } from "@medusajs/ui";
import { VehicleModel } from "../../../types";
import { DataTablePage } from "../../../components/data-table-page";

const columnHelper = createDataTableColumnHelper<VehicleModel>();

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
];

const VehicleModelsPage = () => {
  return (
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
          },
          link: {
            to: "create",
          },
        },
      ]}
    />
  );
};

export const config = defineRouteConfig({
  label: "Vehicle Models",
});

export default VehicleModelsPage;

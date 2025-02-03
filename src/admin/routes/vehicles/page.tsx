import { defineRouteConfig } from "@medusajs/admin-sdk";
import { RocketLaunch } from "@medusajs/icons";
import { createDataTableColumnHelper } from "@medusajs/ui";
import { Vehicle } from "../../types";
import { DataTablePage } from "../../components/data-table-page";

const columnHelper = createDataTableColumnHelper<Vehicle>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("make.name", {
    header: "Make",
    enableSorting: true,
  }),
  columnHelper.accessor("model.name", {
    header: "Model",
    enableSorting: true,
  }),
  columnHelper.accessor("start_year", {
    header: "Start Year",
    enableSorting: true,
  }),
  columnHelper.accessor("end_year", {
    header: "End Year",
    enableSorting: true,
  }),
];

const VehiclesPage = () => {
  return (
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
  label: "Vehicles",
  icon: RocketLaunch,
});

export default VehiclesPage;

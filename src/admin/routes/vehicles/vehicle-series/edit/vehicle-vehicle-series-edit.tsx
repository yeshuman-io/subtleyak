import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Form, Input, Select } from "@medusajs/ui";
import { useAdminUpdateVehicleVehicleSeries } from "../../../../hooks/vehicles/vehicle-series";
import { PostAdminUpdateVehicleSeries } from "../../../../types";
import { useToast } from "../../../../hooks/use-toast";
import { useEffect } from "react";
import { useAdminListVehicle } from "../../../../hooks/vehicles/vehicle";
import { useAdminListVehicleModel } from "../../../../hooks/vehicles/vehiclemodel";

type Props = {
  item: any;
  onClose: () => void;
};

export const VehicleSeriesEdit = ({ item, onClose }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutateAsync: updateVehicleSeries, isLoading } =
    useAdminUpdateVehicleVehicleSeries();
  const { data: vehicles } = useAdminListVehicle();
  const { data: vehiclemodels } = useAdminListVehicleModel();

  const form = useForm<PostAdminUpdateVehicleSeries>({
    resolver: zodResolver(PostAdminUpdateVehicleSeries),
    defaultValues: {
      start_year: item.start_year,
      end_year: item.end_year,
      vehicle: item.vehicle,
      model: item.model,
    },
  });

  const onSubmit = async (data: PostAdminUpdateVehicleSeries) => {
    try {
      await updateVehicleSeries({
        id: item.id,
        ...data,
      });
      toast({
        title: "Success",
        description: "VehicleSeries updated successfully",
        variant: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update VehicleSeries",
        variant: "error",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 p-4"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Edit VehicleSeries</h1>
          <p className="text-sm text-gray-500">
            Update the details below to modify this vehicle-series
          </p>
        </div>

        <Form.Field
          control={form.control}
          name="start_year"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Start Year</Form.Label>
              <Form.Control>
                <Input {...field} type="number" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="end_year"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>End Year</Form.Label>
              <Form.Control>
                <Input {...field} type="number" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="vehicle"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Vehicle</Form.Label>
              <Form.Control>
                <Select
                  {...field}
                  options={
                    vehicles?.items?.map((item) => ({
                      label: item.name || item.id,
                      value: item.id,
                    })) || []
                  }
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="model"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Model</Form.Label>
              <Form.Control>
                <Select
                  {...field}
                  options={
                    vehiclemodels?.items?.map((item) => ({
                      label: item.name || item.id,
                      value: item.id,
                    })) || []
                  }
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Form>
  );
};

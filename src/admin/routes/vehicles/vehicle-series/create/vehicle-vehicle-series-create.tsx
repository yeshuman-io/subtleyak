import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Form, Input, Select } from "@medusajs/ui";
import { useAdminCreateVehicleVehicleSeries } from "../../../../hooks/vehicles/vehicle-series";
import { PostAdminCreateVehicleSeries } from "../../../../types";
import { useToast } from "../../../../hooks/use-toast";
import { useEffect } from "react";
import { useAdminListVehicle } from "../../../../hooks/vehicles/vehicle";
import { useAdminListVehicleModel } from "../../../../hooks/vehicles/vehiclemodel";

type Props = {
  onClose: () => void;
};

export const VehicleSeriesCreate = ({ onClose }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutateAsync: createVehicleSeries, isLoading } =
    useAdminCreateVehicleVehicleSeries();
  const { data: vehicles } = useAdminListVehicle();
  const { data: vehiclemodels } = useAdminListVehicleModel();

  const form = useForm<PostAdminCreateVehicleSeries>({
    resolver: zodResolver(PostAdminCreateVehicleSeries),
    defaultValues: {
      start_year: 0,
      end_year: 0,
      vehicle: "",
      model: "",
    },
  });

  const onSubmit = async (data: PostAdminCreateVehicleSeries) => {
    try {
      await createVehicleSeries(data);
      toast({
        title: "Success",
        description: "VehicleSeries created successfully",
        variant: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create VehicleSeries",
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
          <h1 className="text-2xl font-bold">Create VehicleSeries</h1>
          <p className="text-sm text-gray-500">
            Fill in the details below to create a new vehicle-series
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
            Create
          </button>
        </div>
      </form>
    </Form>
  );
};

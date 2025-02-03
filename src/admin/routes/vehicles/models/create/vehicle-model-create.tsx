import * as zod from "zod";
import { FocusModal, Label, Input, Button, Select } from "@medusajs/ui";
import { FormProvider, Controller, useForm } from "react-hook-form";
import { PostAdminCreateVehicleModel } from "../../../../../api/admin/vehicles/models/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const schema = PostAdminCreateVehicleModel;

export const VehicleModelCreate = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();

  // Fetch makes for the select
  const { data: makesData } = useQuery({
    queryKey: ["vehicle_makes"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/makes"),
  });

  const makes = makesData?.vehicle_makes || [];

  const form = useForm<zod.infer<typeof schema>>({
    defaultValues: {
      name: "",
      make_id: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/vehicles/models", {
        method: "POST",
        body: data,
      });

      onClose();
      navigate("/vehicles/models");
    } catch (error) {
      console.error("Failed to create model:", error);
    }
  });

  return (
    <FocusModal.Content>
      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col overflow-hidden"
        >
          <FocusModal.Header>
            <FocusModal.Title>Create Vehicle Model</FocusModal.Title>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  Cancel
                </Button>
              </FocusModal.Close>
              <Button type="submit" size="small">
                Save
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body>
            <div className="flex flex-1 flex-col items-center overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="make_id"
                    render={({ field: { value, onChange } }) => (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-x-1">
                          <Label size="small" weight="plus">
                            Make
                          </Label>
                        </div>
                        <Select value={value} onValueChange={onChange}>
                          <Select.Trigger>
                            <Select.Value placeholder="Select a make..." />
                          </Select.Trigger>
                          <Select.Content>
                            {makes.map((make) => (
                              <Select.Item key={make.id} value={make.id}>
                                {make.name}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-x-1">
                          <Label size="small" weight="plus">
                            Model Name
                          </Label>
                        </div>
                        <Input {...field} />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </FocusModal.Body>
        </form>
      </FormProvider>
    </FocusModal.Content>
  );
};

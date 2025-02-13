import { useAdminCreateMutation } from "@medusajs/admin";
import { Form } from "@medusajs/admin-ui";

export const VehicleSeriesCreate = () => {
  const { mutate, isLoading } = useAdminCreateMutation(
    "vehicles/series"
  );

  const handleSubmit = (data: any) => {
    mutate(data);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Field
        label="Start Year"
        name="start_year"
        type="number"
        required=
      />
      <Form.Field
        label="End Year"
        name="end_year"
        type="number"
        required=
      />
      <Form.Field
        label="Vehicle"
        name="vehicle_id"
        type="select"
        required=
      />
      <Form.Field
        label="Model"
        name="model_id"
        type="select"
        required=
      />
      <Form.Submit isLoading={isLoading}>Create</Form.Submit>
    </Form>
  );
}; 
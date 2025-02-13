import { useAdminCreateMutation } from "@medusajs/admin";
import { Form } from "@medusajs/admin-ui";

export const VehicleModelCreate = () => {
  const { mutate, isLoading } = useAdminCreateMutation(
    "vehicles/models"
  );

  const handleSubmit = (data: any) => {
    mutate(data);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Field
        label="Make"
        name="make_id"
        type="select"
        required=
      />
      <Form.Field
        label="Vehicles"
        name="vehicles_ids"
        type="multiselect"
        required=
      />
      <Form.Field
        label="Bodies"
        name="bodies_ids"
        type="multiselect"
        required=
      />
      <Form.Submit isLoading={isLoading}>Create</Form.Submit>
    </Form>
  );
}; 
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateVehicleBodyWorkflow } from "../../../../../workflows/vehicles/update-vehicle-body";
import { PostAdminUpdateVehicleBody } from "../validators";

type PostAdminUpdateVehicleBodyType = z.infer<
  typeof PostAdminUpdateVehicleBody
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateVehicleBodyType>,
  res: MedusaResponse
) => {
  const { result } = await updateVehicleBodyWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ vehicle_body: result });
};
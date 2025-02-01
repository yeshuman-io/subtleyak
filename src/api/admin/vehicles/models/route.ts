import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleModelWorkflow } from "../../../../workflows/create-vehicle-model";
import { PostAdminCreateVehicleModel } from "./validators";

type PostAdminCreateVehicleModelType = z.infer<typeof PostAdminCreateVehicleModel>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleModelType>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleModelWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleModel: result });
};
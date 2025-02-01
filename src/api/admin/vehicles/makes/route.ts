import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createVehicleMakeWorkflow } from "../../../../workflows/create-vehicle-make";
import { z } from "zod";
import { PostAdminCreateVehicleMake } from "./validators";

type PostAdminCreateVehicleMakeType = z.infer<typeof PostAdminCreateVehicleMake>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateVehicleMakeType>,
  res: MedusaResponse
) => {
  const { result } = await createVehicleMakeWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ vehicleMake: result });
};
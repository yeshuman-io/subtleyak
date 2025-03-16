import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateWiperArmWorkflow } from "../../../../../workflows/wipers/update-wiper-arm";
import { PostAdminUpdateWiperArm } from "../validators";

type PostAdminUpdateWiperArmType = z.infer<
  typeof PostAdminUpdateWiperArm
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateWiperArmType>,
  res: MedusaResponse
) => {
  const { result } = await updateWiperArmWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ wiper_arm: result });
};
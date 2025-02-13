import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateWiperKitWorkflow } from "../../../../../workflows/update-wiper-kit";
import { PostAdminUpdateWiperKit } from "../validators";

type PostAdminUpdateWiperKitType = z.infer<
  typeof PostAdminUpdateWiperKit
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateWiperKitType>,
  res: MedusaResponse
) => {
  const { result } = await updateWiperKitWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ wiper_kit: result });
};
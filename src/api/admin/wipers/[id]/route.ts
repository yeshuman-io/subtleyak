import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateWipersWorkflow } from "../../../../../workflows/update-wipers";
import { PostAdminUpdateWipers } from "../validators";

type PostAdminUpdateWipersType = z.infer<
  typeof PostAdminUpdateWipers
>;
//fasdfsdfasdfsdfadasdflkj;jlkasdf
export const POST = async (
  req: MedusaRequest<PostAdminUpdateWipersType>,
  res: MedusaResponse
) => {
  const { result } = await updateWipersWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  // asdfasdfasdf

  res.json({ wipers: result });
}; 
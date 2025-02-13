import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createWiperKitWorkflow } from "../../../../workflows/create-wiper-kit";
import { PostAdminCreateWiperKit } from "./validators";


//asdfsadfs
type QueryResponse = {
  data: any[];
  metadata: {
    count: number;
    take: number;
    skip: number;
  };//asdf
};
//asdfasdfasdfd
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  const queryOptions = {
    entity: "wiper_kit",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
      ...(req.query.wiper_id ? { wiper_id: req.query.wiper_id } : {}),
    },
  };

  const { data: kits, metadata } = (await query.graph(
    queryOptions
  )) as QueryResponse;

  res.json({
    kits,
    count: metadata.count,
    limit: metadata.take,
    offset: metadata.skip,
  });
};

type PostAdminCreateWiperKitType = z.infer<
  typeof PostAdminCreateWiperKit
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateWiperKitType>,
  res: MedusaResponse
) => {
  const { result } = await createWiperKitWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ wiperKit: result });
}; 
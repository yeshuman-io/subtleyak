import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createWiperWorkflow } from "../../../../workflows/create-wiper";
import { PostAdminCreateWiper } from "./validators";


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
    entity: "wiper",
    ...req.queryConfig,
    filters: {
      ...req.queryConfig?.filters,
    },
  };

  const { data: wipers, metadata } = (await query.graph(
    queryOptions
  )) as QueryResponse;

  res.json({
    wipers,
    count: metadata.count,
    limit: metadata.take,
    offset: metadata.skip,
  });
};

type PostAdminCreateWiperType = z.infer<
  typeof PostAdminCreateWiper
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateWiperType>,
  res: MedusaResponse
) => {
  const { result } = await createWiperWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ wiper: result });
}; 
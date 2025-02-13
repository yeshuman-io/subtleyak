import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createWorkflow } from "../../../../workflows/create-";
import { PostAdminCreate } from "./validators";

type QueryResponse = {
  data: any[];
  metadata: {
    count: number;
    take: number;
    skip: number;
  };
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  const queryOptions = {
    entity: "",
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

type PostAdminCreateType = z.infer<
  typeof PostAdminCreate
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateType>,
  res: MedusaResponse
) => {
  const { result } = await createWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ : result });
}; 
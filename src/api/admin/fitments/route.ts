import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createFitmentWorkflow } from "../../../workflows/fitments/create-fitment";
import { PostAdminCreateFitment } from "./validators";

type QueryResponse = {
  data: any[];
  metadata: {
    count: number;
    take: number;
    skip: number;
  };
}; //asdfsdfg

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

    const queryOptions = {
      entity: "fitment",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: fitments, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

  res.json({
    fitments,
    count: metadata.count,
    limit: metadata.take,
    offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Fitments:", error);
    res.status(500).json({ error: "An error occurred while fetching Fitments" });
  }
};

type PostAdminCreateFitmentType = z.infer<
  typeof PostAdminCreateFitment
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateFitmentType>,
  res: MedusaResponse
) => {
  const { result } = await createFitmentWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ fitments: result });
}; 
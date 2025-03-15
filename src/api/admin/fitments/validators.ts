import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
//asdf
export const GetSchema = createFindParams();

export const PostAdminCreateFitment = z.object({
  code: z.string().min(1),
});

export const PostAdminUpdateFitment = z.object({
  code: z.string().optional(),
});

export type FitmentAdminListRes = {
  fitments: any[];
  count: number;
  limit: number;
  offset: number;
};

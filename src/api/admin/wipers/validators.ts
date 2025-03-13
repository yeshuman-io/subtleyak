import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
//asdf
export const GetSchema = createFindParams();

export const PostAdminCreateWiper = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

export const PostAdminUpdateWiper = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
});

export type WiperAdminListRes = {
  wipers: any[];
  count: number;
  limit: number;
  offset: number;
};

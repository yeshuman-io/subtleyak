import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const GetSchema = createFindParams();

export const PostAdminCreate = z.object({
});

export const PostAdminUpdate = z.object({
});

export type AdminCreateReq = z.infer<typeof PostAdminCreate>;
export type AdminUpdateReq = z.infer<typeof PostAdminUpdate>;

export type AdminListRes = {
  wipers: any[];
  count: number;
  limit: number;
  offset: number;
}; 
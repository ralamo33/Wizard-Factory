import { TRPCError } from "@trpc/server";

type ServiceResult<T> = Readonly<{ type: "Success"; value: T }> | Readonly<{ type: "Failure"; error: unknown }>;

export const orInternalError = async <T>(result: ServiceResult<T>): Promise<T> =>
  result.type === "Success" ? result.value : Promise.reject(new TRPCError({ code: "INTERNAL_SERVER_ERROR" }));

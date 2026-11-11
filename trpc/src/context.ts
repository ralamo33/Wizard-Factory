import { verifyToken } from "@clerk/backend";
import { type Viewer, viewerSchema } from "@wizard/domain";

export type Context = Readonly<{ viewer: Viewer | undefined }>;

type VerifyToken = (token: string) => Promise<unknown>;

type ContextRequest = Readonly<{ req: Readonly<{ headers: Readonly<{ authorization?: string | undefined }> }> }>;

const bearerToken = (authorization: string | undefined): string | undefined => /^Bearer (?<token>\S+)$/u.exec(authorization ?? "")?.groups?.["token"];

const viewerFrom = (claims: unknown): Viewer | undefined => {
  const parsed = viewerSchema.safeParse(
    typeof claims === "object" && claims !== null
      ? { userId: "sub" in claims ? claims.sub : undefined, permissions: "app_permissions" in claims ? claims.app_permissions : [] }
      : undefined,
  );

  return parsed.success ? parsed.data : undefined;
};

const verifyWithClerk: VerifyToken = async (token) =>
  verifyToken(token, {
    jwtKey: process.env["CLERK_JWT_KEY"],
    authorizedParties: [process.env["WEB_ORIGIN"]].filter((origin) => origin !== undefined),
  });

export const createContextWith =
  (verify: VerifyToken) =>
  async ({ req }: ContextRequest): Promise<Context> => {
    const token = bearerToken(req.headers.authorization);

    return { viewer: token === undefined ? undefined : await verify(token).then(viewerFrom, () => undefined) };
  };

export const createContext = createContextWith(verifyWithClerk);

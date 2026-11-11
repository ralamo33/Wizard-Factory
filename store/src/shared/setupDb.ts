import postgres from "postgres";

const password = process.env["DATABASE_PASSWORD"] ?? "";
const appUrl = process.env["DATABASE_URL"] ?? "";

const passwordInUrl = (url: string): string => (URL.canParse(url) ? decodeURIComponent(new URL(url).password) : "");

const report = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const setAppUserPassword = async (): Promise<void> => {
  const admin = postgres(process.env["ADMIN_DATABASE_URL"] ?? "", { prepare: false, max: 1 });
  const [row] = await admin<{ statement: string }[]>`select format('alter role app_user with password %L', ${password}::text) as statement`;

  await admin.unsafe(row?.statement ?? "select 1");
  await admin.end();
  report("app_user password set from DATABASE_PASSWORD.");
};

if (password === "") {
  report("Set DATABASE_PASSWORD in store/.env first.");
  process.exitCode = 1;
} else if (passwordInUrl(appUrl) === password) {
  await setAppUserPassword();
} else {
  report("The password in DATABASE_URL does not match DATABASE_PASSWORD; app_user was left unchanged.");
  process.exitCode = 1;
}

import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders, createAdminUser } from "../helpers/create-admin-user";

async function getAdminToken(api) {
  const response = await api.post("/auth/users/emailpass", {
    email: "admin@medusa.js",
    password: "somepassword",
  });
  return response.data.access_token;
}

medusaIntegrationTestRunner({
  testSuite: ({ dbConnection, api, getContainer }) => {
    describe("Vehicles endpoints", () => {
      beforeAll(async () => {
        await createAdminUser(dbConnection, adminHeaders, getContainer()); // Create an admin user in the test DB
      });

      describe("GET /admin/vehicles", () => {
        it("returns 200 and vehicles", async () => {
          const response = await api.get(`/admin/vehicles`, {
            adminHeaders,
          });

          expect(response.status).toEqual(200);
          expect(response.data).toHaveProperty("vehicles");
        });
      });
    });
  },
});

jest.setTimeout(60 * 1000);

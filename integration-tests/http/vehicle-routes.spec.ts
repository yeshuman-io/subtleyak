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
    describe("Vehicle endpoints", () => {
      let token;
      let container;

      beforeAll(async () => {
        container = getContainer();
        await createAdminUser(dbConnection, adminHeaders, container); // Create an admin user in the test DB
        token = await getAdminToken(api);
      });

      describe("GET /admin/vehicles", () => {
        it("returns 200 and vehicles", async () => {
          const response = await api.get(`/admin/vehicles`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(response);

          expect(response.status).toEqual(200);
          expect(response.data).toHaveProperty("vehicles");
        });
      });
    });
  },
});

jest.setTimeout(60 * 1000);

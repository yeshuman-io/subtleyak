import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { createVehicleMakeWorkflow } from "../../src/workflows/create-vehicle-make";

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Vehicle Make workflow", () => {
      it("creates a vehicle make", async () => {
        const { result } = await createVehicleMakeWorkflow(getContainer()).run({
          input: {
            name: "Test Make",
          },
        });
        expect(result).toEqual({
          id: expect.any(String),
          name: "Test Make",
        });
      });
    });
  },
});

jest.setTimeout(60 * 1000);
import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type DeleteWiperConnectorStepInput = {
  id: string;
};

export const deleteWiperConnectorStep = createStep(
  "delete-wiper-connector-step",
  async (input: DeleteWiperConnectorStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const original = await wipersModuleService.retrieveWiperConnector(input.id);
    await wipersModuleService.deleteWiperConnectors(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.createWiperConnectors(context.original);
  }
);

type DeleteWiperConnectorWorkflowInput = DeleteWiperConnectorStepInput;

export const deleteWiperConnectorWorkflow = createWorkflow(
  "delete-wiper-connector-workflow",
  (input: DeleteWiperConnectorWorkflowInput) => {
    const result = deleteWiperConnectorStep(input);

    return new WorkflowResponse(result);
  }
);